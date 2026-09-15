"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { getFacilityStatus } from "@/lib/facility-hours";
import { type LayoutId } from "@/lib/layouts";
import { MIRROR_CONFIG } from "@/lib/mirror-config";
import type { WeatherData } from "@/lib/weather";
import { WeatherGlyph } from "./WeatherGlyph";

function formatClock(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: MIRROR_CONFIG.timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
}

function formatDate(date: Date, short = false) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: MIRROR_CONFIG.timezone,
    weekday: short ? "short" : "long",
    month: short ? "short" : "long",
    day: "numeric",
  }).format(date);
}

function greeting(date: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: MIRROR_CONFIG.timezone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
  );
  if (hour < 12) return "GOOD MORNING";
  if (hour < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

function SignalIcon({ online }: { online: boolean }) {
  return (
    <span className={`signal ${online ? "signal--online" : "signal--offline"}`} aria-label={online ? "Online" : "Offline"}>
      <i />
      <i />
      <i />
    </span>
  );
}

type LayoutProps = {
  now: Date | null;
  weather: WeatherData | null;
  weatherError: boolean;
  online: boolean;
  promptIndex: number;
  lastSync: Date | null;
};

function useClockBits(now: Date | null) {
  const parts = now ? formatClock(now) : [];
  return {
    hour: parts.find((part) => part.type === "hour")?.value || "--",
    minute: parts.find((part) => part.type === "minute")?.value || "--",
    period: parts.find((part) => part.type === "dayPeriod")?.value || "",
  };
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-lockup ${compact ? "brand-lockup--compact" : ""}`}>
      <Image src="/brand/gocreate-color.svg" alt="GoCreate" width={570} height={156} priority />
    </div>
  );
}

function WeatherBlock({ weather, error, compact = false }: { weather: WeatherData | null; error: boolean; compact?: boolean }) {
  return (
    <div className={`weather-block ${compact ? "weather-block--compact" : ""}`}>
      <div className="weather-icon-wrap"><WeatherGlyph code={weather?.code} className="weather-glyph" /></div>
      <div className="weather-number">{weather ? `${weather.temperature}°` : error ? "—" : "···"}</div>
      <div className="weather-detail">
        <strong>{weather?.label || (error ? "WEATHER OFFLINE" : "CHECKING")}</strong>
        <span>{weather ? `H ${weather.high}° · L ${weather.low}° · FEELS ${weather.apparent}°` : "WICHITA CONDITIONS"}</span>
      </div>
    </div>
  );
}

function StatusBlock({ now, compact = false }: { now: Date | null; compact?: boolean }) {
  const facility = useMemo(
    () => now ? getFacilityStatus(now, MIRROR_CONFIG.timezone) : { isOpen: false, label: "—", detail: "CHECKING HOURS", hoursToday: "GOCREATE · WICHITA" },
    [now],
  );
  return (
    <div className={`status-block ${facility.isOpen ? "status-block--open" : ""} ${compact ? "status-block--compact" : ""}`}>
      <div className="status-head"><span className="status-orb" /><strong>{facility.label}</strong></div>
      <div className="status-detail">{facility.detail}</div>
      <div className="status-hours">{facility.hoursToday}</div>
    </div>
  );
}

function ClockBlock({ now, giant = false, stacked = false }: { now: Date | null; giant?: boolean; stacked?: boolean }) {
  const { hour, minute, period } = useClockBits(now);
  return (
    <div className={`clock-block ${giant ? "clock-block--giant" : ""} ${stacked ? "clock-block--stacked" : ""}`}>
      <div className="clock-time"><span>{hour}</span><b>:</b><span>{minute}</span><small>{period}</small></div>
      <div className="clock-date">{now ? formatDate(now).toUpperCase() : "GOCREATE SMART MIRROR"}</div>
    </div>
  );
}

function SignatureLayout(props: LayoutProps) {
  const facility = useMemo(
    () => props.now ? getFacilityStatus(props.now, MIRROR_CONFIG.timezone) : null,
    [props.now],
  );

  return (
    <section className="layout layout-signature">
      <header className="sig-top">
        <Brand />
        <div className="sig-label">{MIRROR_CONFIG.name.toUpperCase()} <i /> {MIRROR_CONFIG.location.toUpperCase()}</div>
      </header>

      <div className="sig-time">
        <div className="micro-kicker">{props.now ? greeting(props.now) : "GOCREATE"} <span /> {props.now ? formatDate(props.now).toUpperCase() : "SMART MIRROR"}</div>
        <ClockBlock now={props.now} giant />
      </div>

      <div className="sig-info">
        <div className="sig-panel"><div className="panel-label">OUTSIDE · WICHITA</div><WeatherBlock weather={props.weather} error={props.weatherError} /></div>
        <div className="sig-panel sig-panel--status"><div className="panel-label">GOCREATE TODAY</div><StatusBlock now={props.now} /></div>
      </div>

      <div className="sig-reflection" aria-label="Open reflection area">
        <span className="reflection-tick reflection-tick--left" />
        <span className="reflection-tick reflection-tick--right" />
      </div>

      <div className="sig-quote">
        <div className="quote-meta"><span>MAKE / TEST / LEARN</span><span>0{props.promptIndex + 1}</span></div>
        <div className="quote-copy">{MIRROR_CONFIG.prompts[props.promptIndex]}</div>
        <div className="quote-line"><i key={props.promptIndex} /></div>
      </div>

      <div className="sig-studios">
        <div className="studio-heading"><span>STUDIOS</span><span>MAKE SOMETHING REAL</span></div>
        <div className="studio-row">
          {MIRROR_CONFIG.studios.map((studio) => <div className="studio-chip" key={studio.short}><b>{studio.short}</b><span>{studio.name}</span></div>)}
        </div>
      </div>

      <footer className="mirror-footer">
        <Image src="/brand/wsu-white.svg" alt="Wichita State University" width={300} height={75} />
        <div className="footer-live"><span>{facility?.isOpen ? "OPEN NOW" : "GOCREATE"}</span><i /><SignalIcon online={props.online} /><span>{props.online ? "LIVE" : "OFFLINE"}</span></div>
      </footer>
    </section>
  );
}

function SplitLayout(props: LayoutProps) {
  return (
    <section className="layout layout-split">
      <aside className="split-rail split-rail--left">
        <Brand compact />
        <ClockBlock now={props.now} stacked />
        <div className="split-rule" />
        <WeatherBlock weather={props.weather} error={props.weatherError} compact />
      </aside>
      <div className="split-center" aria-label="Open reflection area">
        <div className="split-center-mark"><span>GOCREATE</span><i /></div>
      </div>
      <aside className="split-rail split-rail--right">
        <StatusBlock now={props.now} compact />
        <div className="split-studios">
          <div className="panel-label">STUDIO ACCESS</div>
          {MIRROR_CONFIG.studios.map((studio, i) => <div className="split-studio" key={studio.short}><span>0{i + 1}</span><b>{studio.short}</b></div>)}
        </div>
        <div className="split-quote">{MIRROR_CONFIG.prompts[props.promptIndex]}</div>
      </aside>
      <div className="split-bottom"><SignalIcon online={props.online} /><span>{props.online ? "CONNECTED" : "OFFLINE"}</span><i /><span>{props.now ? formatDate(props.now, true).toUpperCase() : "GOCREATE"}</span></div>
    </section>
  );
}

function HaloLayout(props: LayoutProps) {
  return (
    <section className="layout layout-halo">
      <div className="halo-top"><ClockBlock now={props.now} /><StatusBlock now={props.now} compact /></div>
      <div className="halo-center">
        <div className="halo-rings" aria-hidden="true"><i /><i /><i /></div>
        <Image src="/brand/gocreate-icon.png" alt="GoCreate" width={324} height={312} priority className="halo-icon" />
        <div className="halo-word">GOCREATE</div>
        <div className="halo-sub">A KOCH COLLABORATIVE</div>
      </div>
      <div className="halo-bottom">
        <WeatherBlock weather={props.weather} error={props.weatherError} compact />
        <div className="halo-quote">{MIRROR_CONFIG.prompts[props.promptIndex]}</div>
      </div>
    </section>
  );
}

function StudioLayout(props: LayoutProps) {
  const { hour, minute, period } = useClockBits(props.now);
  return (
    <section className="layout layout-studio">
      <div className="studio-topline"><Brand compact /><span>{props.now ? formatDate(props.now, true).toUpperCase() : "WICHITA"}</span></div>
      <div className="studio-hero">
        <div className="studio-clock"><span>{hour}:{minute}</span><small>{period}</small></div>
        <StatusBlock now={props.now} compact />
      </div>
      <div className="studio-reflection" />
      <div className="studio-panel">
        <div className="studio-panel-title"><span>MAKE HERE</span><WeatherBlock weather={props.weather} error={props.weatherError} compact /></div>
        <div className="studio-cards">
          {MIRROR_CONFIG.studios.map((studio, index) => (
            <div className="studio-card" key={studio.short}><span>0{index + 1}</span><b>{studio.short}</b><small>{studio.name}</small></div>
          ))}
        </div>
        <div className="studio-manifesto">{MIRROR_CONFIG.prompts[props.promptIndex]}</div>
      </div>
    </section>
  );
}

function IconLayout() {
  return (
    <section className="layout layout-icon" aria-label="GoCreate icon only">
      <div className="icon-aura" aria-hidden="true" />
      <Image src="/brand/gocreate-icon.png" alt="GoCreate" width={324} height={312} priority className="icon-only-mark" />
    </section>
  );
}

export function MirrorDashboard() {
  const [now, setNow] = useState<Date | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState(false);
  const [online, setOnline] = useState(true);
  const [promptIndex, setPromptIndex] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [layout, setLayout] = useState<LayoutId>("signature");
  const [updating, setUpdating] = useState(false);
  const versionRef = useRef<string | null>(null);

  useEffect(() => {
    setNow(new Date());
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    const prompt = window.setInterval(() => setPromptIndex((current) => (current + 1) % MIRROR_CONFIG.prompts.length), 20000);
    const fallbackReload = window.setInterval(() => window.location.reload(), Math.max(MIRROR_CONFIG.fallbackReloadMinutes, 15) * 60 * 1000);

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    setOnline(window.navigator.onLine);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // v1 used a service worker. Remove old registrations so a new Vercel build
    // cannot be held back by a stale cached shell.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => registrations.forEach((registration) => registration.unregister())).catch(() => undefined);
    }

    return () => {
      window.clearInterval(clock);
      window.clearInterval(prompt);
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
        const next = (await response.json()) as WeatherData;
        if (!active) return;
        setWeather(next);
        setWeatherError(false);
        setLastSync(new Date());
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
        const data = (await response.json()) as { layout?: LayoutId };
        if (active && data.layout) setLayout(data.layout);
      } catch {}
    }

    function startFallbackPolling() {
      if (fallbackTimer) return;
      fallbackRead();
      fallbackTimer = window.setInterval(
        fallbackRead,
        Math.max(MIRROR_CONFIG.statePollSeconds, 5) * 1000,
      );
    }

    import("@/lib/firebase-client")
      .then(({ subscribeToMirrorState }) => {
        if (!active) return;
        unsubscribe = subscribeToMirrorState(
          (state) => {
            if (active) setLayout(state.layout);
          },
          () => startFallbackPolling(),
        );
      })
      .catch(() => startFallbackPolling());

    return () => {
      active = false;
      unsubscribe?.();
      if (fallbackTimer) window.clearInterval(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    let active = true;
    let reloadTimer: number | undefined;
    async function checkVersion() {
      try {
        const response = await fetch(`/api/version?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) return;
        const { version } = (await response.json()) as { version: string };
        if (!active) return;
        if (!versionRef.current) {
          versionRef.current = version;
          return;
        }
        if (version !== "local" && versionRef.current !== "local" && version !== versionRef.current) {
          setUpdating(true);
          reloadTimer = window.setTimeout(() => {
            const url = new URL(window.location.href);
            url.searchParams.set("build", Date.now().toString());
            window.location.replace(url.toString());
          }, 1400);
        }
      } catch {}
    }
    checkVersion();
    const timer = window.setInterval(checkVersion, Math.max(MIRROR_CONFIG.deployPollSeconds, 10) * 1000);
    return () => { active = false; window.clearInterval(timer); if (reloadTimer) window.clearTimeout(reloadTimer); };
  }, []);

  const props: LayoutProps = { now, weather, weatherError, online, promptIndex, lastSync };

  return (
    <main className={`mirror mirror--${layout}`} data-layout={layout}>
      <div className="mirror-noise" aria-hidden="true" />
      {layout === "signature" && <SignatureLayout {...props} />}
      {layout === "split" && <SplitLayout {...props} />}
      {layout === "halo" && <HaloLayout {...props} />}
      {layout === "studio" && <StudioLayout {...props} />}
      {layout === "icon" && <IconLayout />}
      {updating && <div className="deploy-toast"><span>NEW BUILD</span><strong>Updating mirror…</strong><i /></div>}
      {layout !== "icon" && <div className="mirror-build-dot" title={lastSync ? `Weather synced ${lastSync.toLocaleTimeString()}` : "Syncing"} />}
    </main>
  );
}
