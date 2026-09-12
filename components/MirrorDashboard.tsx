"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getFacilityStatus } from "@/lib/facility-hours";
import { MIRROR_CONFIG } from "@/lib/mirror-config";
import { fetchWeather, type WeatherData } from "@/lib/weather";
import { WeatherGlyph } from "./WeatherGlyph";

function formatClock(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: MIRROR_CONFIG.timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: MIRROR_CONFIG.timezone,
    weekday: "long",
    month: "long",
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

export function MirrorDashboard() {
  const [now, setNow] = useState<Date | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState(false);
  const [online, setOnline] = useState(true);
  const [promptIndex, setPromptIndex] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    const prompt = window.setInterval(
      () => setPromptIndex((current) => (current + 1) % MIRROR_CONFIG.prompts.length),
      20000,
    );
    const reload = window.setInterval(
      () => window.location.reload(),
      Math.max(MIRROR_CONFIG.autoReloadMinutes, 1) * 60 * 1000,
    );

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    setOnline(window.navigator.onLine);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    return () => {
      window.clearInterval(clock);
      window.clearInterval(prompt);
      window.clearInterval(reload);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadWeather() {
      try {
        const next = await fetchWeather(MIRROR_CONFIG.latitude, MIRROR_CONFIG.longitude, MIRROR_CONFIG.timezone);
        if (!active) return;
        setWeather(next);
        setWeatherError(false);
        setLastSync(new Date());
      } catch {
        if (active) setWeatherError(true);
      }
    }

    loadWeather();
    const timer = window.setInterval(loadWeather, 10 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const clockParts = now ? formatClock(now) : [];
  const hour = clockParts.find((part) => part.type === "hour")?.value || "--";
  const minute = clockParts.find((part) => part.type === "minute")?.value || "--";
  const dayPeriod = clockParts.find((part) => part.type === "dayPeriod")?.value || "";
  const facility = useMemo(
    () =>
      now
        ? getFacilityStatus(now, MIRROR_CONFIG.timezone)
        : { isOpen: false, label: "—", detail: "CHECKING HOURS", hoursToday: "GOCREATE · WICHITA" },
    [now],
  );

  return (
    <main className="mirror" aria-label="GoCreate smart mirror dashboard">
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />
      <div className="edge-line" />

      <header className="brandbar">
        <div className="brand-logo-wrap">
          <Image
            src="/brand/gocreate-color.svg"
            alt="GoCreate"
            width={570}
            height={156}
            priority
            className="brand-logo brand-logo--color"
          />
          <Image
            src="/brand/gocreate-white.svg"
            alt=""
            width={573}
            height={164}
            priority
            className="brand-logo brand-logo--ghost"
            aria-hidden="true"
          />
        </div>
        <div className="brand-meta">
          <span>{MIRROR_CONFIG.name}</span>
          <span className="brand-dot" />
          <span>{MIRROR_CONFIG.location.toUpperCase()}</span>
        </div>
      </header>

      <section className="hero" aria-label="Time and date">
        <div className="greeting-row">
          <span>{now ? greeting(now) : "GOCREATE"}</span>
          <span className="micro-rule" />
          <span>{now ? formatDate(now).toUpperCase() : "SMART MIRROR"}</span>
        </div>

        <div className="clock" aria-label={`${hour}:${minute} ${dayPeriod}`}>
          <span className="clock-hour">{hour}</span>
          <span className="clock-colon">:</span>
          <span className="clock-minute">{minute}</span>
          <span className="clock-period">{dayPeriod}</span>
        </div>
      </section>

      <section className="info-grid">
        <article className="weather-panel panel-line">
          <div className="eyebrow">OUTSIDE · {MIRROR_CONFIG.location.toUpperCase()}</div>
          <div className="weather-main">
            <WeatherGlyph code={weather?.code} className="weather-glyph" />
            <div className="temperature">{weather ? `${weather.temperature}°` : weatherError ? "—" : "···"}</div>
          </div>
          <div className="weather-copy">
            <strong>{weather?.label || (weatherError ? "WEATHER OFFLINE" : "CHECKING CONDITIONS")}</strong>
            <span>
              {weather ? `H ${weather.high}°  ·  L ${weather.low}°  ·  FEELS ${weather.apparent}°` : "LIVE WEATHER · NO API KEY REQUIRED"}
            </span>
            {weather && <span>WIND {weather.wind} MPH</span>}
          </div>
        </article>

        <article className={`facility-panel panel-line ${facility.isOpen ? "facility-panel--open" : ""}`}>
          <div className="eyebrow">GOCREATE TODAY</div>
          <div className="facility-status">
            <span className="status-orb" />
            <strong>{facility.label}</strong>
          </div>
          <div className="facility-detail">{facility.detail}</div>
          <div className="facility-hours">{facility.hoursToday}</div>
        </article>
      </section>

      <section className="reflection-zone" aria-label="Open mirror area">
        <div className="reflection-crosshair" aria-hidden="true">
          <span />
          <span />
        </div>
      </section>

      <section className="maker-callout">
        <div className="maker-kicker">
          <span>MAKE / TEST / LEARN</span>
          <span className="maker-index">0{promptIndex + 1}</span>
        </div>
        <div className="maker-prompt" key={promptIndex}>{MIRROR_CONFIG.prompts[promptIndex]}</div>
        <div className="maker-progress" aria-hidden="true"><span key={`p-${promptIndex}`} /></div>
      </section>

      <section className="studios" aria-label="GoCreate studios">
        <div className="studios-title">
          <span>STUDIO GRID</span>
          <span>6 SPACES · ONE PLACE TO MAKE</span>
        </div>
        <div className="studio-list">
          {MIRROR_CONFIG.studios.map((studio, index) => (
            <div className="studio" key={studio.name}>
              <span className="studio-number">0{index + 1}</span>
              <span className="studio-short">{studio.short}</span>
              <span className="studio-name">{studio.name}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="footerbar">
        <div className="wsu-mark">
          <Image src="/brand/wsu-white.svg" alt="Wichita State University" width={300} height={75} className="wsu-logo" />
        </div>
        <div className="footer-status">
          <span className="sync-label">{lastSync ? `SYNC ${lastSync.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: MIRROR_CONFIG.timezone })}` : "SYNCING"}</span>
          <span className="footer-divider" />
          <SignalIcon online={online} />
          <span>{online ? "ONLINE" : "OFFLINE MODE"}</span>
        </div>
      </footer>
    </main>
  );
}
