"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenRenderer } from "@/components/ScreenRenderer";
import { cloneScreen, makeId, type MirrorState, type ScreenDefinition } from "@/lib/screen-types";
import { TEMPLATE_LIBRARY } from "@/lib/templates";
import { ScreenEditor, type EditorMode } from "./ScreenEditor";
import { SystemPanel } from "./SystemPanel";
import { TeamSchedulePanel } from "./TeamSchedulePanel";
import { DEFAULT_TEAM_SCHEDULE } from "@/lib/team-schedule";

type Bootstrap = {
  state: MirrorState;
  screens: ScreenDefinition[];
  persistent: boolean;
  store: string;
  error?: string;
};

type EditorState = { screen: ScreenDefinition; mode: EditorMode } | null;

const sampleRuntime = {
  now: new Date(),
  online: true,
  weather: { temperature: 72, apparent: 71, wind: 8, high: 78, low: 58, code: 1, label: "Mostly clear" },
  teamSchedule: DEFAULT_TEAM_SCHEDULE,
};

function blankScreen(): ScreenDefinition {
  return {
    id: makeId("screen"),
    name: "Untitled screen",
    description: "Custom GoCreateMirror screen",
    category: "Custom",
    width: 1080,
    height: 1920,
    background: { color: "#000000", ambientGlow: true, noise: true },
    widgets: [],
  };
}

export function AdminStudio() {
  const router = useRouter();
  const [tab, setTab] = useState<"live" | "library" | "custom" | "team" | "system">("live");
  const [state, setState] = useState<MirrorState | null>(null);
  const [screens, setScreens] = useState<ScreenDefinition[]>([]);
  const [persistent, setPersistent] = useState<boolean | null>(null);
  const [status, setStatus] = useState("Loading Mirror Studio…");
  const [busy, setBusy] = useState("");
  const [editor, setEditor] = useState<EditorState>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  async function bootstrap() {
    try {
      const response = await fetch(`/api/admin/bootstrap?t=${Date.now()}`, { cache: "no-store" });
      if (response.status === 401) { router.replace("/admin/login"); return; }
      const data = await response.json() as Bootstrap;
      if (!response.ok) throw new Error(data.error || "Could not load admin state.");
      setState(data.state);
      setScreens(data.screens || []);
      setPersistent(data.persistent);
      setStatus(data.persistent ? "Firebase realtime control connected" : "Memory fallback — add Firebase Admin credentials for persistence");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load Mirror Studio.");
    }
  }

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    bootstrap();
    import("@/lib/firebase-client").then(({ subscribeToMirrorState }) => {
      if (!active) return;
      unsubscribe = subscribeToMirrorState((next) => active && setState(next));
    }).catch(() => undefined);
    return () => { active = false; unsubscribe?.(); };
  }, []);

  async function api(path: string, body?: unknown) {
    const response = await fetch(path, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    if (response.status === 401) { router.replace("/admin/login"); throw new Error("Admin session expired."); }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  async function goLive(kind: "template" | "custom", id: string) {
    setBusy(id);
    try {
      const data = await api("/api/admin/select", { kind, id }) as { state: MirrorState };
      setState(data.state);
      setStatus(`${data.state.selected.name} is now live.`);
      setTab("live");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not publish."); }
    finally { setBusy(""); }
  }

  async function publishLive(screen: ScreenDefinition) {
    const data = await api("/api/admin/live", { screen }) as { state: MirrorState };
    setState(data.state);
    setStatus("Manual Live View published. Selecting any library/custom screen will override it.");
  }

  async function saveCustom(screen: ScreenDefinition) {
    const data = await api("/api/admin/screens", { action: "save", screen }) as { screen: ScreenDefinition; screens: ScreenDefinition[] };
    setScreens(data.screens);
    setStatus(`${data.screen.name} saved to Custom Screens.`);
    return data.screen;
  }

  async function deleteCustom(id: string) {
    if (!window.confirm("Delete this custom screen?")) return;
    try {
      const data = await api("/api/admin/screens", { action: "delete", id }) as { screens: ScreenDefinition[] };
      setScreens(data.screens);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not delete."); }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const categories = useMemo(() => ["All", ...Array.from(new Set(TEMPLATE_LIBRARY.map((item) => item.category)))], []);
  const filtered = useMemo(() => TEMPLATE_LIBRARY.filter((template) => {
    const q = search.trim().toLowerCase();
    return (category === "All" || template.category === category) && (!q || `${template.name} ${template.description} ${template.tags.join(" ")}`.toLowerCase().includes(q));
  }), [category, search]);

  if (editor) {
    return <ScreenEditor initial={editor.screen} mode={editor.mode} onClose={() => setEditor(null)} onPublishLive={publishLive} onSaveCustom={saveCustom}/>;
  }

  return <main className="admin-studio">
    <header className="admin-studio-header">
      <div className="admin-brand"><Image src="/brand/gocreate-icon.png" alt="" width={42} height={40}/><div><b>GoCreateMirror</b><span>SCREEN STUDIO</span></div></div>
      <nav><button className={tab === "live" ? "active" : ""} onClick={() => setTab("live")}>Live View</button><button className={tab === "library" ? "active" : ""} onClick={() => setTab("library")}>Screen Library <em>{TEMPLATE_LIBRARY.length}</em></button><button className={tab === "custom" ? "active" : ""} onClick={() => setTab("custom")}>Custom Screens <em>{screens.length}</em></button><button className={tab === "team" ? "active" : ""} onClick={() => setTab("team")}>Team Schedule</button><button className={tab === "system" ? "active" : ""} onClick={() => setTab("system")}>AI + Hardware</button></nav>
      <div className="admin-head-actions"><span className={persistent ? "store-ok" : "store-warn"}><i/>{persistent ? "FIREBASE LIVE" : "LOCAL FALLBACK"}</span><button onClick={logout}>Lock admin</button></div>
    </header>

    <div className="admin-statusbar"><span>{status}</span>{state && <span>REV {state.revision} · {state.selected.kind.toUpperCase()} · {new Date(state.updatedAt).toLocaleTimeString()}</span>}</div>

    {tab === "live" && state && <section className="live-dashboard">
      <div className="live-copy"><span className="admin-kicker">WHAT THE MIRROR IS SHOWING NOW</span><h1>{state.selected.name}</h1><p>The Live View is the single resolved screen sent to the Raspberry Pi. Open it for unrestricted manual editing. Any later selection from the library or Custom Screens intentionally overrides those manual edits.</p><div className="live-actions"><button className="primary" onClick={() => setEditor({ screen: { ...cloneScreen(state.screen), id: "live", name: `${state.selected.name} — Live Edit` }, mode: "live" })}>Edit Live View</button><button onClick={() => { setTab("library"); }}>Choose another screen</button></div><div className="live-meta"><div><span>SOURCE</span><b>{state.selected.kind}</b></div><div><span>SCREEN ID</span><b>{state.selected.id}</b></div><div><span>UPDATES</span><b>Realtime</b></div><div><span>DEPLOYS</span><b>Auto-detected</b></div></div></div>
      <div className="live-preview-wrap"><div className="live-beacon"><i/>LIVE ON MIRROR</div><div className="live-preview"><ScreenRenderer screen={state.screen} runtime={sampleRuntime}/></div></div>
    </section>}

    {tab === "library" && <section className="library-page">
      <div className="library-hero"><div><span className="admin-kicker">SCREEN LIBRARY</span><h1>Designed modes, ready to go live.</h1><p>Choose a polished screen instantly or open any design as a fully editable copy. Animated options are marked.</p></div><button className="primary" onClick={() => setEditor({ screen: blankScreen(), mode: "new" })}>+ Build from blank</button></div>
      <div className="library-controls"><input placeholder="Search layouts, tags, use cases…" value={search} onChange={(event) => setSearch(event.target.value)}/><div>{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div></div>
      <div className="template-grid">{filtered.map((template) => <article className={`template-card ${state?.selected.kind === "template" && state.selected.id === template.id ? "is-live" : ""}`} key={template.id}><div className="template-preview"><ScreenRenderer screen={template.screen} runtime={sampleRuntime}/>{template.animated && <span className="animated-pill">MOTION</span>}{state?.selected.kind === "template" && state.selected.id === template.id && <span className="live-pill">LIVE</span>}</div><div className="template-copy"><div><span>{template.category}</span><h2>{template.name}</h2><p>{template.description}</p></div><div className="tag-row">{template.tags.slice(0,3).map((tag) => <i key={tag}>{tag}</i>)}</div><div className="template-actions"><button className="primary" disabled={busy === template.id} onClick={() => goLive("template", template.id)}>{busy === template.id ? "Publishing…" : "Go Live"}</button><button onClick={() => { const copy = cloneScreen(template.screen); copy.id = makeId("screen"); copy.name = `${template.name} — Custom`; copy.category = "Custom"; setEditor({ screen: copy, mode: "new" }); }}>Edit copy</button></div></div></article>)}</div>
    </section>}

    {tab === "custom" && <section className="library-page">
      <div className="library-hero"><div><span className="admin-kicker">CUSTOM SCREENS</span><h1>Your saved designs.</h1><p>Build as many screens as you want. Edit, duplicate, publish, or start from any library template.</p></div><button className="primary" onClick={() => setEditor({ screen: blankScreen(), mode: "new" })}>+ New screen</button></div>
      {!screens.length ? <div className="empty-custom"><Image src="/brand/gocreate-icon.png" alt="" width={90} height={86}/><h2>No custom screens yet.</h2><p>Start blank, or open any design from the Screen Library and choose “Edit copy”.</p><button onClick={() => setTab("library")}>Browse library</button></div> : <div className="template-grid custom-grid">{screens.map((screen) => <article className={`template-card ${state?.selected.kind === "custom" && state.selected.id === screen.id ? "is-live" : ""}`} key={screen.id}><div className="template-preview"><ScreenRenderer screen={screen} runtime={sampleRuntime}/>{state?.selected.kind === "custom" && state.selected.id === screen.id && <span className="live-pill">LIVE</span>}</div><div className="template-copy"><div><span>{screen.category || "Custom"}</span><h2>{screen.name}</h2><p>{screen.description || "Custom GoCreateMirror screen"}</p></div><div className="template-actions"><button className="primary" onClick={() => goLive("custom", screen.id)}>Go Live</button><button onClick={() => setEditor({ screen: cloneScreen(screen), mode: "custom" })}>Edit</button><button className="icon-danger" onClick={() => deleteCustom(screen.id)}>Delete</button></div></div></article>)}</div>}
    </section>}

    {tab === "team" && <TeamSchedulePanel onSessionExpired={() => { router.replace("/admin/login"); router.refresh(); }}/>}

    {tab === "system" && <SystemPanel onSessionExpired={() => { router.replace("/admin/login"); router.refresh(); }}/>}
  </main>;
}
