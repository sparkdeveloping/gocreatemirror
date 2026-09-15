"use client";

import { useEffect, useRef, useState } from "react";
import { MIRROR_CONFIG } from "@/lib/mirror-config";
import { type MirrorState } from "@/lib/screen-types";
import { DEFAULT_TEMPLATE_ID, getDefaultScreen } from "@/lib/templates";
import type { WeatherData } from "@/lib/weather";
import { ScreenRenderer } from "./ScreenRenderer";

const INITIAL_STATE: MirrorState = {
  selected: { kind: "template", id: DEFAULT_TEMPLATE_ID, name: getDefaultScreen().name },
  screen: getDefaultScreen(),
  updatedAt: new Date(0).toISOString(),
  revision: 1,
};

export function MirrorDashboard() {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState(false);
  const [online, setOnline] = useState(true);
  const [state, setState] = useState<MirrorState>(INITIAL_STATE);
  const [updating, setUpdating] = useState(false);
  const versionRef = useRef<string | null>(null);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    const fallbackReload = window.setInterval(() => window.location.reload(), Math.max(MIRROR_CONFIG.fallbackReloadMinutes, 15) * 60 * 1000);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    setOnline(window.navigator.onLine);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((items) => items.forEach((registration) => registration.unregister())).catch(() => undefined);
    }
    return () => {
      window.clearInterval(clock);
      window.clearInterval(fallbackReload);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadWeather() {
      try {
        const response = await fetch(`/api/weather?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("weather");
        const next = await response.json() as WeatherData;
        if (!active) return;
        setWeather(next);
        setWeatherError(false);
        try { localStorage.setItem("gocreate:last-weather", JSON.stringify(next)); } catch {}
      } catch {
        if (!active) return;
        setWeatherError(true);
        try {
          const cached = localStorage.getItem("gocreate:last-weather");
          if (cached) setWeather(JSON.parse(cached));
        } catch {}
      }
    }
    loadWeather();
    const timer = window.setInterval(loadWeather, 8 * 60 * 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    let fallbackTimer: number | undefined;
    async function fallbackRead() {
      try {
        const response = await fetch(`/api/mirror-state?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) return;
        const next = await response.json() as MirrorState;
        if (active && next.screen) setState(next);
      } catch {}
    }
    const startFallback = () => {
      if (fallbackTimer) return;
      fallbackRead();
      fallbackTimer = window.setInterval(fallbackRead, Math.max(MIRROR_CONFIG.statePollSeconds, 5) * 1000);
    };
    fallbackRead();
    import("@/lib/firebase-client").then(({ subscribeToMirrorState }) => {
      if (!active) return;
      unsubscribe = subscribeToMirrorState((next) => active && setState(next), startFallback);
    }).catch(startFallback);
    return () => { active = false; unsubscribe?.(); if (fallbackTimer) window.clearInterval(fallbackTimer); };
  }, []);

  useEffect(() => {
    let active = true;
    let reloadTimer: number | undefined;
    async function checkVersion() {
      try {
        const response = await fetch(`/api/version?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) return;
        const { version } = await response.json() as { version: string };
        if (!active) return;
        if (!versionRef.current) { versionRef.current = version; return; }
        if (version !== "local" && versionRef.current !== "local" && version !== versionRef.current) {
          setUpdating(true);
          reloadTimer = window.setTimeout(() => {
            const url = new URL(window.location.href);
            url.searchParams.set("build", Date.now().toString());
            window.location.replace(url.toString());
          }, 1200);
        }
      } catch {}
    }
    checkVersion();
    const timer = window.setInterval(checkVersion, Math.max(MIRROR_CONFIG.deployPollSeconds, 10) * 1000);
    return () => { active = false; window.clearInterval(timer); if (reloadTimer) window.clearTimeout(reloadTimer); };
  }, []);

  return <main className="mirror-root">
    <ScreenRenderer screen={state.screen} runtime={{ now, weather, weatherError, online }} />
    {updating && <div className="deploy-toast"><span>NEW BUILD</span><strong>Updating mirror…</strong><i /></div>}
  </main>;
}
