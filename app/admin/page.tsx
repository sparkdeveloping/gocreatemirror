"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent } from "react";
import { LAYOUT_OPTIONS, type LayoutId } from "@/lib/layouts";

type StateResponse = {
  layout: LayoutId;
  updatedAt: string;
  persistent: boolean;
  error?: string;
};

function Preview({ id }: { id: LayoutId }) {
  if (id === "icon") {
    return (
      <div className="admin-preview admin-preview--icon">
        <Image src="/brand/gocreate-icon.png" alt="" width={162} height={156} />
      </div>
    );
  }

  if (id === "split") {
    return (
      <div className="admin-preview admin-preview--split">
        <div className="preview-rail"><span className="preview-logo">GC</span><b>8:30</b><i /><small>72°</small></div>
        <div className="preview-empty" />
        <div className="preview-rail preview-rail--right"><strong>OPEN</strong><i /><small>3D</small><small>TECH</small><small>WOOD</small></div>
      </div>
    );
  }

  if (id === "halo") {
    return (
      <div className="admin-preview admin-preview--halo">
        <div className="preview-topline"><b>8:30</b><strong>OPEN</strong></div>
        <div className="preview-halo"><Image src="/brand/gocreate-icon.png" alt="" width={100} height={96} /></div>
        <div className="preview-bottomline"><span>72°</span><span>THE IDEA IS ONLY THE START.</span></div>
      </div>
    );
  }

  if (id === "studio") {
    return (
      <div className="admin-preview admin-preview--studio">
        <div className="preview-topline"><span>GOCREATE</span><b>8:30</b></div>
        <div className="preview-empty" />
        <div className="preview-studio-grid">{["3D", "DSGN", "TECH", "TEXT", "METAL", "WOOD"].map((x) => <span key={x}>{x}</span>)}</div>
      </div>
    );
  }

  return (
    <div className="admin-preview admin-preview--signature">
      <div className="preview-brand">GOCREATE</div>
      <b className="preview-clock">8:30</b>
      <div className="preview-info"><span>72°</span><strong>OPEN</strong></div>
      <div className="preview-empty" />
      <div className="preview-quote">THE IDEA IS ONLY THE START.</div>
      <div className="preview-dots"><i /><i /><i /><i /><i /><i /></div>
    </div>
  );
}

export default function AdminPage() {
  const [current, setCurrent] = useState<LayoutId>("signature");
  const [pin, setPin] = useState("");
  const [persistent, setPersistent] = useState<boolean | null>(null);
  const [saving, setSaving] = useState<LayoutId | null>(null);
  const [message, setMessage] = useState("Connecting to mirror…");

  async function refresh() {
    try {
      const response = await fetch(`/api/mirror-state?t=${Date.now()}`, { cache: "no-store" });
      const data = (await response.json()) as StateResponse;
      if (!response.ok) throw new Error(data.error || "Could not read mirror state.");
      setCurrent(data.layout);
      setPersistent(data.persistent);
      setMessage(`Mirror is using ${LAYOUT_OPTIONS.find((item) => item.id === data.layout)?.name || data.layout}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reach mirror state API.");
    }
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, []);

  async function selectLayout(layout: LayoutId) {
    setSaving(layout);
    setMessage("Sending layout to mirror…");
    try {
      const response = await fetch("/api/mirror-state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(pin ? { "x-admin-pin": pin } : {}),
        },
        body: JSON.stringify({ layout }),
      });
      const data = (await response.json()) as StateResponse;
      if (!response.ok) throw new Error(data.error || "Could not change layout.");
      setCurrent(data.layout);
      setPersistent(data.persistent);
      setMessage(`${LAYOUT_OPTIONS.find((item) => item.id === data.layout)?.name || data.layout} is live. The mirror polls for changes every few seconds.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not change layout.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <div className="admin-kicker">GOCREATE / MIRROR CONTROL</div>
          <h1>Choose what the glass shows.</h1>
          <p>Pick a layout here and the Pi changes automatically. No SSH, reboot, or browser refresh required.</p>
        </div>
        <a className="admin-open-mirror" href="/" target="_blank" rel="noreferrer">OPEN MIRROR ↗</a>
      </header>

      <section className="admin-statusbar">
        <div className={`admin-live ${persistent ? "admin-live--ok" : "admin-live--warn"}`}><i /><span>{persistent ? "PERSISTENT REMOTE CONTROL" : "DEMO STATE ONLY"}</span></div>
        <div className="admin-message">{message}</div>
        <label className="admin-pin">PIN <input type="password" inputMode="numeric" value={pin} onChange={(event: ChangeEvent<HTMLInputElement>) => setPin(event.target.value)} placeholder="optional" /></label>
      </section>

      {persistent === false && (
        <div className="admin-warning">
          <strong>Remote switching needs one small persistent store.</strong>
          <span>Connect Upstash Redis to this Vercel project and redeploy. The code already detects the environment variables automatically. Until then, state is only held in a server instance and is not reliable across requests.</span>
        </div>
      )}

      <section className="admin-grid">
        {LAYOUT_OPTIONS.map((option) => {
          const active = current === option.id;
          return (
            <article className={`admin-card ${active ? "admin-card--active" : ""}`} key={option.id}>
              <div className="admin-card-preview"><Preview id={option.id} />{active && <div className="admin-active-badge">LIVE</div>}</div>
              <div className="admin-card-copy">
                <div className="admin-card-kicker">{option.kicker}</div>
                <h2>{option.name}</h2>
                <p>{option.description}</p>
              </div>
              <button disabled={saving !== null || active} onClick={() => selectLayout(option.id)}>
                {active ? "CURRENT LAYOUT" : saving === option.id ? "SENDING…" : "USE THIS LAYOUT"}
              </button>
            </article>
          );
        })}
      </section>

      <footer className="admin-footer">
        <span>Auto deploy detection polls every 15 seconds by default.</span>
        <span>/admin only controls layout; your mirror data continues running normally.</span>
      </footer>
    </main>
  );
}
