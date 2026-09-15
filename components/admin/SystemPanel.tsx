"use client";

import { useEffect, useState } from "react";
import type { AssistantState, DeviceStatus, SystemSettings } from "@/lib/device-types";
import { DEFAULT_ASSISTANT_STATE, DEFAULT_DEVICE_STATUS, DEFAULT_SYSTEM_SETTINGS } from "@/lib/device-types";

type SystemPayload = {
  settings: SystemSettings;
  device: DeviceStatus;
  assistant: AssistantState;
  deviceTokenConfigured: boolean;
  groqConfigured: boolean;
  geminiConfigured: boolean;
  aiProvider: string;
};

export function SystemPanel({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [payload, setPayload] = useState<SystemPayload>({
    settings: DEFAULT_SYSTEM_SETTINGS,
    device: DEFAULT_DEVICE_STATUS,
    assistant: DEFAULT_ASSISTANT_STATE,
    deviceTokenConfigured: false,
    groqConfigured: false,
    geminiConfigured: false,
    aiProvider: "groq",
  });
  const [status, setStatus] = useState("Loading AI + hardware status…");
  const [busy, setBusy] = useState(false);
  const [askText, setAskText] = useState("What can I make today?");

  async function request(path: string, options?: RequestInit) {
    const response = await fetch(path, { cache: "no-store", ...options });
    if (response.status === 401) {
      onSessionExpired();
      throw new Error("Admin session expired.");
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  async function load() {
    try {
      const data = await request(`/api/admin/system?t=${Date.now()}`) as SystemPayload;
      setPayload(data);
      setStatus("System state loaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load system state.");
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, []);

  function patch<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) {
    setPayload((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
  }

  async function save() {
    setBusy(true);
    try {
      const data = await request("/api/admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.settings),
      }) as { settings: SystemSettings };
      setPayload((current) => ({ ...current, settings: data.settings }));
      setStatus("AI + hardware settings saved to Firebase.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setBusy(false);
    }
  }

  async function test(mode: "speak" | "listen") {
    try {
      await request("/api/admin/assistant-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "listen" ? { mode } : { mode, text: "Hey. GoCreateMirror voice output is working." }),
      });
      setStatus(mode === "listen" ? "Listening overlay sent to the mirror." : "Speech test sent to the mirror.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Test failed.");
    }
  }


  async function askGo() {
    if (!askText.trim()) return;
    setStatus("Asking Go…");
    try {
      const data = await request("/api/admin/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: askText }) }) as { reply?: string };
      setStatus(data.reply || "Go answered on the mirror.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Assistant request failed.");
    }
  }

  const deviceAge = Date.now() - new Date(payload.device.lastSeen || 0).getTime();
  const deviceOnline = payload.device.online && deviceAge < 20000;

  return <section className="system-page">
    <div className="system-hero">
      <div><span className="admin-kicker">GO AI + HARDWARE</span><h1>Presence, camera and voice assistant.</h1><p>The Raspberry Pi companion service handles the HC-SR04, Pi Camera, microphone and “Hey Go” wake phrase. This page controls how those signals change the mirror.</p></div>
      <div className="system-actions"><button className="primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save settings"}</button><button onClick={() => test("listen")}>Test listening UI</button><button onClick={() => test("speak")}>Test speech</button></div>
    </div>

    <div className="system-grid">
      <div className="system-card">
        <h2>Behavior</h2>
        <div className="system-form">
          <div className="toggle-row"><span>AI assistant</span><input type="checkbox" checked={payload.settings.assistantEnabled} onChange={(e) => patch("assistantEnabled", e.target.checked)}/></div>
          <div className="toggle-row"><span>Speak responses</span><input type="checkbox" checked={payload.settings.speakResponses} onChange={(e) => patch("speakResponses", e.target.checked)}/></div>
          <div className="toggle-row"><span>Show transcript</span><input type="checkbox" checked={payload.settings.showTranscript} onChange={(e) => patch("showTranscript", e.target.checked)}/></div>
          <div className="toggle-row"><span>Allow AI screen control</span><input type="checkbox" checked={payload.settings.allowScreenControl} onChange={(e) => patch("allowScreenControl", e.target.checked)}/></div>
          <div className="toggle-row"><span>Camera vision on request</span><input type="checkbox" checked={payload.settings.visionEnabled} onChange={(e) => patch("visionEnabled", e.target.checked)}/></div>
          <div className="toggle-row"><span>Presence sleep/wake</span><input type="checkbox" checked={payload.settings.presenceEnabled} onChange={(e) => patch("presenceEnabled", e.target.checked)}/></div>
          <label>WAKE PHRASE<input value={payload.settings.wakePhrase} onChange={(e) => patch("wakePhrase", e.target.value)}/></label>
          <label>SLEEP AFTER (SECONDS)<input type="number" min={5} max={3600} value={payload.settings.sleepAfterSeconds} onChange={(e) => patch("sleepAfterSeconds", Number(e.target.value))}/></label>
          <label>NEAR DISTANCE (CM)<input type="number" min={20} max={600} value={payload.settings.nearDistanceCm} onChange={(e) => patch("nearDistanceCm", Number(e.target.value))}/></label>
          <label>FAR/PRESENCE LIMIT (CM)<input type="number" min={30} max={800} value={payload.settings.farDistanceCm} onChange={(e) => patch("farDistanceCm", Number(e.target.value))}/></label>
          <label>SLEEP LOOK<select value={payload.settings.sleepStyle} onChange={(e) => patch("sleepStyle", e.target.value as SystemSettings["sleepStyle"])}><option value="icon">Tiny GoCreate icon</option><option value="black">Pure black</option><option value="dim">Dim current screen</option></select></label>
          <label className="wide">CAMERA INTENT PHRASES<textarea rows={4} value={payload.settings.visualIntentWords.join("\n")} onChange={(e) => patch("visualIntentWords", e.target.value.split("\n").map((v) => v.trim()).filter(Boolean))}/></label>
        </div>
        <div className="system-note">Privacy model: the distance sensor may run continuously, but the camera is only captured after a wake interaction containing one of the visual-intent phrases above. The browser displays “CAMERA USED ON REQUEST” when an image was sent for vision analysis.</div>
      </div>

      <div className="system-card">
        <h2>Live hardware</h2>
        <div className="system-status-grid">
          <div className="system-stat"><span>PI AGENT</span><b className={deviceOnline ? "ok" : "warn"}>{deviceOnline ? "ONLINE" : "OFFLINE"}</b></div>
          <div className="system-stat"><span>PRESENCE</span><b>{payload.device.presence ? (payload.device.proximity === "near" ? "NEAR" : "IN RANGE") : "CLEAR"}</b></div>
          <div className="system-stat"><span>DISTANCE</span><b>{payload.device.distanceCm == null ? "—" : `${Math.round(payload.device.distanceCm)} cm`}</b></div>
          <div className="system-stat"><span>WAKE ENGINE</span><b>{payload.device.wakeReady ? (payload.device.wakeEngine || "READY") : "NOT READY"}</b></div>
          <div className="system-stat"><span>MICROPHONE</span><b className={payload.device.microphoneReady ? "ok" : "warn"}>{payload.device.microphoneReady ? "READY" : "MISSING"}</b></div>
          <div className="system-stat"><span>PI CAMERA</span><b className={payload.device.cameraReady ? "ok" : "warn"}>{payload.device.cameraReady ? "READY" : "MISSING"}</b></div>
          <div className="system-stat"><span>TEXT/STT</span><b className={payload.groqConfigured ? "ok" : "warn"}>{payload.groqConfigured ? "GROQ READY" : "NO KEY"}</b></div>
          <div className="system-stat"><span>VISION</span><b className={payload.geminiConfigured ? "ok" : "warn"}>{payload.geminiConfigured ? "GEMINI READY" : "NO KEY"}</b></div>
        </div>
        <h3>ASK GO FROM ADMIN</h3><div className="system-form"><label className="wide">TEXT QUESTION<input value={askText} onChange={(e) => setAskText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") askGo(); }}/></label></div><div className="system-actions"><button onClick={askGo}>Ask Go on mirror</button></div>
        <h3>ASSISTANT NOW</h3>
        <div className="system-log">phase: {payload.assistant.phase}\nwake phrase: {payload.device.wakePhrase || payload.settings.wakePhrase}\nagent: {payload.device.agentVersion || "—"}\nlast seen: {payload.device.lastSeen || "—"}\ntranscript: {payload.assistant.transcript || "—"}\nreply: {payload.assistant.reply || "—"}</div>
        <h3>SECURITY</h3>
        <div className="system-status-grid">
          <div className="system-stat"><span>DEVICE TOKEN</span><b className={payload.deviceTokenConfigured ? "ok" : "warn"}>{payload.deviceTokenConfigured ? "CONFIGURED" : "MISSING"}</b></div>
          <div className="system-stat"><span>AI PROVIDER</span><b>{payload.aiProvider.toUpperCase()}</b></div>
        </div>
        <div className="system-note">For production, set the same <code>MIRROR_DEVICE_TOKEN</code> in Vercel and on the Pi. It prevents someone on the internet from using your speech/LLM endpoints.</div>
      </div>
    </div>
    <div className="system-log">{status}</div>
  </section>;
}
