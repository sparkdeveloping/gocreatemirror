"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { ScreenRenderer } from "@/components/ScreenRenderer";
import { CANVAS_HEIGHT, CANVAS_WIDTH, cloneScreen, makeId, type ScreenDefinition, type ScreenWidget, type WidgetAnimation } from "@/lib/screen-types";
import { WIDGET_CATALOG, createWidget } from "@/lib/widget-catalog";

const ANIMATIONS: WidgetAnimation[] = ["none", "fade", "float", "pulse", "glow", "breathe", "slideUp", "slideLeft", "shimmer", "drift"];

export type EditorMode = "live" | "custom" | "new";

type Props = {
  initial: ScreenDefinition;
  mode: EditorMode;
  onClose: () => void;
  onPublishLive: (screen: ScreenDefinition) => Promise<void>;
  onSaveCustom: (screen: ScreenDefinition) => Promise<ScreenDefinition | null>;
};

function sampleRuntime() {
  return {
    now: new Date(),
    online: true,
    weather: { temperature: 72, apparent: 71, wind: 8, high: 78, low: 58, code: 1, label: "Mostly clear" },
  };
}

async function compressImage(file: File) {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = data;
  });
  const max = 1600;
  const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) return data;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", .82);
}

function NumberField({ label, value, onChange, min, max, step = 1 }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number }) {
  return <label className="inspector-field"><span>{label}</span><input type="number" min={min} max={max} step={step} value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value))}/></label>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="inspector-toggle"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)}/></label>;
}

export function ScreenEditor({ initial, mode, onClose, onPublishLive, onSaveCustom }: Props) {
  const [screen, setScreen] = useState(() => cloneScreen(initial));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const selected = useMemo(() => screen.widgets.find((widget) => widget.id === selectedId) || null, [screen, selectedId]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName === "INPUT" || (event.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        setScreen((current) => ({ ...current, widgets: current.widgets.filter((widget) => widget.id !== selectedId) }));
        setSelectedId(null);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d" && selected) {
        event.preventDefault();
        duplicateSelected();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  function updateWidget(id: string, patch: Partial<ScreenWidget>) {
    setScreen((current) => ({ ...current, widgets: current.widgets.map((widget) => widget.id === id ? { ...widget, ...patch } : widget) }));
  }

  function updateSelected(patch: Partial<ScreenWidget>) {
    if (selected) updateWidget(selected.id, patch);
  }

  function updateStyle(patch: Partial<ScreenWidget["style"]>) {
    if (selected) updateSelected({ style: { ...selected.style, ...patch } });
  }

  function updateConfig(patch: Partial<ScreenWidget["config"]>) {
    if (selected) updateSelected({ config: { ...selected.config, ...patch } });
  }

  function addWidget(type: Parameters<typeof createWidget>[0]) {
    const widget = createWidget(type);
    widget.x = Math.round((CANVAS_WIDTH - widget.w) / 2);
    widget.y = Math.round((CANVAS_HEIGHT - widget.h) / 2);
    widget.z = Math.max(10, ...screen.widgets.map((item) => item.z)) + 1;
    setScreen((current) => ({ ...current, widgets: [...current.widgets, widget] }));
    setSelectedId(widget.id);
  }

  function duplicateSelected() {
    if (!selected) return;
    const copy = cloneScreen({ ...screen, widgets: [selected] }).widgets[0];
    copy.id = makeId(selected.type);
    copy.name = `${selected.name} copy`;
    copy.x += 24; copy.y += 24; copy.z += 1;
    setScreen((current) => ({ ...current, widgets: [...current.widgets, copy] }));
    setSelectedId(copy.id);
  }

  function deleteSelected() {
    if (!selected) return;
    setScreen((current) => ({ ...current, widgets: current.widgets.filter((widget) => widget.id !== selected.id) }));
    setSelectedId(null);
  }

  async function publish() {
    setBusy("Publishing…"); setNotice("");
    try { await onPublishLive(screen); setNotice("Live mirror updated."); } catch (error) { setNotice(error instanceof Error ? error.message : "Could not publish."); }
    finally { setBusy(""); }
  }

  async function save() {
    setBusy("Saving…"); setNotice("");
    const next = mode === "live" || mode === "new" ? { ...screen, id: screen.id === "live" || screen.id.startsWith("template-") ? makeId("screen") : screen.id } : screen;
    try {
      const saved = await onSaveCustom(next);
      if (saved) { setScreen(saved); setNotice("Custom screen saved."); }
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save."); }
    finally { setBusy(""); }
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy("Optimizing image…");
    try { updateConfig({ imageSrc: await compressImage(file) }); } finally { setBusy(""); event.target.value = ""; }
  }

  const groups = ["Essentials", "Content", "Brand & Media", "Utility"] as const;

  return <div className="screen-editor-shell">
    <header className="editor-topbar">
      <button className="editor-close" onClick={onClose}>← Back</button>
      <div className="editor-title"><span>{mode === "live" ? "EDIT LIVE VIEW" : mode === "new" ? "NEW CUSTOM SCREEN" : "CUSTOM SCREEN"}</span><input value={screen.name} onChange={(event) => setScreen((current) => ({ ...current, name: event.target.value }))}/></div>
      <div className="editor-actions">{notice && <small>{notice}</small>}<button onClick={save} disabled={Boolean(busy)}>Save custom</button><button className="primary" onClick={publish} disabled={Boolean(busy)}>{busy || "Publish live"}</button></div>
    </header>

    <div className="editor-workspace">
      <aside className="widget-palette">
        <div className="palette-head"><b>WIDGETS</b><span>Click to add</span></div>
        {groups.map((group) => <section key={group}><h3>{group}</h3><div className="palette-grid">{WIDGET_CATALOG.filter((item) => item.group === group).map((item) => <button key={item.type} title={item.description} onClick={() => addWidget(item.type)}><span>{item.glyph}</span><b>{item.name}</b></button>)}</div></section>)}
      </aside>

      <main className="editor-stage-area">
        <div className="editor-stage-toolbar"><span>1080 × 1920 PORTRAIT</span><span>{screen.widgets.length} WIDGETS</span><button onClick={() => setSelectedId(null)}>Screen settings</button></div>
        <div className="editor-stage"><ScreenRenderer screen={screen} runtime={sampleRuntime()} editable selectedId={selectedId} onSelect={setSelectedId} onMove={(id, patch) => updateWidget(id, patch)}/></div>
        <div className="editor-stage-tip">Drag widgets to move · drag blue corner to resize · rotation/scale/layer controls are in the inspector · Delete removes selected widget</div>
      </main>

      <aside className="editor-inspector">
        {selected ? <>
          <div className="inspector-head"><div><span>SELECTED</span><b>{selected.name}</b></div><div><button onClick={duplicateSelected}>Duplicate</button><button className="danger" onClick={deleteSelected}>Delete</button></div></div>
          <section><h3>Transform</h3><div className="field-grid"><NumberField label="X" value={selected.x} onChange={(x) => updateSelected({ x })}/><NumberField label="Y" value={selected.y} onChange={(y) => updateSelected({ y })}/><NumberField label="Width" value={selected.w} min={20} onChange={(w) => updateSelected({ w })}/><NumberField label="Height" value={selected.h} min={20} onChange={(h) => updateSelected({ h })}/><NumberField label="Rotate°" value={selected.rotation} step={1} onChange={(rotation) => updateSelected({ rotation })}/><NumberField label="Scale" value={selected.scale} min={.1} max={4} step={.05} onChange={(scale) => updateSelected({ scale })}/><NumberField label="Opacity" value={selected.opacity} min={0} max={1} step={.05} onChange={(opacity) => updateSelected({ opacity })}/><NumberField label="Layer" value={selected.z} onChange={(z) => updateSelected({ z })}/></div><Toggle label="Lock widget" checked={Boolean(selected.locked)} onChange={(locked) => updateSelected({ locked })}/></section>
          <section><h3>Animation</h3><label className="inspector-field wide"><span>Motion</span><select value={selected.animation || "none"} onChange={(event) => updateSelected({ animation: event.target.value as WidgetAnimation })}>{ANIMATIONS.map((animation) => <option key={animation}>{animation}</option>)}</select></label></section>
          <section><h3>Appearance</h3><div className="field-grid"><label className="inspector-field"><span>Text</span><input type="color" value={selected.style.color || "#ffffff"} onChange={(event) => updateStyle({ color: event.target.value })}/></label><label className="inspector-field"><span>Background</span><input type="color" value={(selected.style.background || "#000000").startsWith("#") ? selected.style.background || "#000000" : "#000000"} onChange={(event) => updateStyle({ background: event.target.value })}/></label><NumberField label="Font px" value={selected.style.fontSize || 32} min={8} max={260} onChange={(fontSize) => updateStyle({ fontSize })}/><NumberField label="Weight" value={selected.style.fontWeight || 400} min={100} max={900} step={50} onChange={(fontWeight) => updateStyle({ fontWeight })}/><NumberField label="Spacing" value={selected.style.letterSpacing || 0} min={-10} max={40} step={.5} onChange={(letterSpacing) => updateStyle({ letterSpacing })}/><NumberField label="Radius" value={selected.style.borderRadius || 0} min={0} max={999} onChange={(borderRadius) => updateStyle({ borderRadius })}/><NumberField label="Border" value={selected.style.borderWidth || 0} min={0} max={12} onChange={(borderWidth) => updateStyle({ borderWidth })}/><NumberField label="Padding" value={selected.style.padding || 0} min={0} max={100} onChange={(padding) => updateStyle({ padding })}/><NumberField label="Glow" value={selected.style.glow || 0} min={0} max={80} onChange={(glow) => updateStyle({ glow })}/><NumberField label="Blur" value={selected.style.backdropBlur || 0} min={0} max={60} onChange={(backdropBlur) => updateStyle({ backdropBlur })}/></div><label className="inspector-field wide"><span>Align</span><select value={selected.style.textAlign || "left"} onChange={(event) => updateStyle({ textAlign: event.target.value as "left" | "center" | "right" })}><option>left</option><option>center</option><option>right</option></select></label></section>
          <WidgetInspector widget={selected} updateConfig={updateConfig} uploadPhoto={uploadPhoto}/>
        </> : <ScreenInspector screen={screen} setScreen={setScreen}/>} 
      </aside>
    </div>
  </div>;
}

function ScreenInspector({ screen, setScreen }: { screen: ScreenDefinition; setScreen: Dispatch<SetStateAction<ScreenDefinition>> }) {
  return <><div className="inspector-head"><div><span>SCREEN</span><b>Canvas settings</b></div></div><section><h3>Background</h3><label className="inspector-field wide"><span>Base color</span><input type="color" value={screen.background.color} onChange={(event) => setScreen((current) => ({ ...current, background: { ...current.background, color: event.target.value } }))}/></label><label className="inspector-field wide"><span>CSS gradient</span><textarea value={screen.background.gradient || ""} placeholder="radial-gradient(...)" onChange={(event) => setScreen((current) => ({ ...current, background: { ...current.background, gradient: event.target.value } }))}/></label><label className="inspector-field wide"><span>Background image URL</span><input value={screen.background.imageSrc || ""} onChange={(event) => setScreen((current) => ({ ...current, background: { ...current.background, imageSrc: event.target.value } }))}/></label><Toggle label="Ambient GoCreate glow" checked={Boolean(screen.background.ambientGlow)} onChange={(ambientGlow) => setScreen((current) => ({ ...current, background: { ...current.background, ambientGlow } }))}/><Toggle label="Subtle texture" checked={Boolean(screen.background.noise)} onChange={(noise) => setScreen((current) => ({ ...current, background: { ...current.background, noise } }))}/></section><section><h3>Screen metadata</h3><label className="inspector-field wide"><span>Description</span><textarea value={screen.description} onChange={(event) => setScreen((current) => ({ ...current, description: event.target.value }))}/></label><label className="inspector-field wide"><span>Category</span><input value={screen.category} onChange={(event) => setScreen((current) => ({ ...current, category: event.target.value }))}/></label></section></>;
}

function WidgetInspector({ widget, updateConfig, uploadPhoto }: { widget: ScreenWidget; updateConfig: (patch: Partial<ScreenWidget["config"]>) => void; uploadPhoto: (event: ChangeEvent<HTMLInputElement>) => Promise<void> }) {
  const field = (label: string, key: keyof ScreenWidget["config"], value = "") => <label className="inspector-field wide"><span>{label}</span><input value={String(widget.config[key] ?? value)} onChange={(event) => updateConfig({ [key]: event.target.value })}/></label>;
  if (["text", "quote", "greeting", "badge"].includes(widget.type)) return <section><h3>Content</h3><label className="inspector-field wide"><span>Text</span><textarea rows={5} value={widget.config.text || ""} onChange={(event) => updateConfig({ text: event.target.value })}/></label></section>;
  if (widget.type === "clock") return <section><h3>Clock</h3><label className="inspector-field wide"><span>Format</span><select value={widget.config.format || "12h"} onChange={(event) => updateConfig({ format: event.target.value as "12h" | "24h" })}><option value="12h">12-hour</option><option value="24h">24-hour</option></select></label></section>;
  if (widget.type === "date") return <section><h3>Date</h3><label className="inspector-field wide"><span>Format</span><select value={widget.config.format || "long"} onChange={(event) => updateConfig({ format: event.target.value as "short" | "long" })}><option value="long">Long</option><option value="short">Short</option></select></label></section>;
  if (widget.type === "logo") return <section><h3>Logo</h3><label className="inspector-field wide"><span>Variant</span><select value={widget.config.logoVariant || "color"} onChange={(event) => updateConfig({ logoVariant: event.target.value as "icon" | "color" | "white" })}><option value="color">Color wordmark</option><option value="white">White wordmark</option><option value="icon">Icon only</option></select></label></section>;
  if (widget.type === "image") return <section><h3>Photo / image</h3>{field("Image URL", "imageSrc")}<label className="upload-button">Upload from computer<input type="file" accept="image/*" onChange={uploadPhoto}/></label><label className="inspector-field wide"><span>Fit</span><select value={widget.config.objectFit || "cover"} onChange={(event) => updateConfig({ objectFit: event.target.value as "cover" | "contain" | "fill" })}><option>cover</option><option>contain</option><option>fill</option></select></label><small className="inspector-note">Uploaded photos are resized and embedded in the screen definition. For very large galleries, use hosted image URLs instead.</small></section>;
  if (widget.type === "calendar") return <section><h3>Calendar</h3>{field("Title", "calendarTitle")}{field("Public iCal URL", "calendarUrl")}<label className="inspector-field wide"><span>Maximum events</span><input type="number" min="1" max="10" value={widget.config.maxItems || 4} onChange={(event) => updateConfig({ maxItems: Number(event.target.value) })}/></label><small className="inspector-note">Paste a public Google Calendar / Outlook iCal URL. Leave blank to use manual placeholder events.</small></section>;
  if (widget.type === "countdown") return <section><h3>Countdown</h3>{field("Label", "countdownLabel")}<label className="inspector-field wide"><span>Target</span><input type="datetime-local" value={widget.config.countdownTo ? new Date(widget.config.countdownTo).toISOString().slice(0,16) : ""} onChange={(event) => updateConfig({ countdownTo: event.target.value ? new Date(event.target.value).toISOString() : "" })}/></label></section>;
  if (widget.type === "marquee") return <section><h3>Ticker</h3><label className="inspector-field wide"><span>Items · one per line</span><textarea rows={6} value={(widget.config.tickerItems || []).join("\n")} onChange={(event) => updateConfig({ tickerItems: event.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })}/></label></section>;
  if (widget.type === "iframe") return <section><h3>Web frame</h3>{field("HTTPS URL", "url")}<small className="inspector-note">Some websites block iframe embedding. Dashboards you control work best.</small></section>;
  if (widget.type === "metric") return <section><h3>Metric</h3>{field("Label", "metricLabel")}{field("Value", "metricValue")}{field("Suffix", "metricSuffix")}</section>;
  if (widget.type === "wind" || widget.type === "feelsLike") return <section><h3>Weather metric</h3>{field("Label", "text")}</section>;
  if (widget.type === "dayProgress") return <section><h3>Day progress</h3>{field("Label", "text")}</section>;
  if (widget.type === "video") return <section><h3>Video</h3>{field("MP4 / WebM URL", "url")}<small className="inspector-note">The mirror autoplays videos muted and loops them continuously.</small></section>;
  if (widget.type === "list") return <section><h3>List</h3><label className="inspector-field wide"><span>Items · one per line</span><textarea rows={7} value={(widget.config.tickerItems || []).join("\n")} onChange={(event) => updateConfig({ tickerItems: event.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })}/></label></section>;
  if (widget.type === "progress") return <section><h3>Progress</h3>{field("Label", "metricLabel")}<label className="inspector-field wide"><span>Value 0–100</span><input type="number" min="0" max="100" value={widget.config.metricValue || "0"} onChange={(event) => updateConfig({ metricValue: event.target.value })}/></label>{field("Suffix", "metricSuffix")}</section>;
  if (widget.type === "weather") return <section><h3>Weather</h3><Toggle label="Condition" checked={widget.config.showCondition !== false} onChange={(showCondition) => updateConfig({ showCondition })}/><Toggle label="High / low" checked={widget.config.showHighLow !== false} onChange={(showHighLow) => updateConfig({ showHighLow })}/><Toggle label="Location" checked={widget.config.showLocation !== false} onChange={(showLocation) => updateConfig({ showLocation })}/></section>;
  if (widget.type === "shape") return <section><h3>Shape</h3><label className="inspector-field wide"><span>Shape</span><select value={widget.config.shape || "circle"} onChange={(event) => updateConfig({ shape: event.target.value as "circle" | "rect" | "pill" | "line" })}><option>circle</option><option>rect</option><option>pill</option><option>line</option></select></label></section>;
  if (widget.type === "studios") return <section><h3>Studios</h3><label className="inspector-field wide"><span>Layout</span><select value={widget.config.variant || "grid"} onChange={(event) => updateConfig({ variant: event.target.value })}><option value="grid">Grid</option><option value="stack">Stack</option></select></label></section>;
  return null;
}
