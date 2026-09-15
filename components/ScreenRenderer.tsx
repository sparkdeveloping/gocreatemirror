"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { getFacilityStatus } from "@/lib/facility-hours";
import { MIRROR_CONFIG } from "@/lib/mirror-config";
import { CANVAS_HEIGHT, CANVAS_WIDTH, clamp, type CalendarEvent, type ScreenDefinition, type ScreenWidget } from "@/lib/screen-types";
import type { WeatherData } from "@/lib/weather";
import { DEFAULT_ASSISTANT_STATE, DEFAULT_DEVICE_STATUS, type AssistantState, type DeviceStatus } from "@/lib/device-types";
import { DEFAULT_TEAM_SCHEDULE, TEAM_DAYS, dayForDate, formatShift, formatTime12, peopleInNow, scheduledToday, upcomingToday, type TeamDay, type TeamSchedule } from "@/lib/team-schedule";
import { WeatherGlyph } from "./WeatherGlyph";

export type RuntimeData = {
  now: Date;
  weather: WeatherData | null;
  weatherError?: boolean;
  online: boolean;
  device?: DeviceStatus;
  assistant?: AssistantState;
  teamSchedule?: TeamSchedule;
};

type RendererProps = {
  screen: ScreenDefinition;
  runtime?: RuntimeData;
  className?: string;
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onMove?: (id: string, patch: Partial<ScreenWidget>, commit?: boolean) => void;
  onScaleChange?: (scale: number) => void;
};

function formatTime(now: Date, mode = "12h") {
  const is24 = mode === "24h";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MIRROR_CONFIG.timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: !is24,
  }).formatToParts(now);
  return {
    time: parts.filter((p) => p.type === "hour" || p.type === "literal" || p.type === "minute").map((p) => p.value).join("").trim(),
    period: is24 ? "" : parts.find((p) => p.type === "dayPeriod")?.value || "",
  };
}

function formatDate(now: Date, mode = "long") {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: MIRROR_CONFIG.timezone,
    weekday: mode === "short" ? "short" : "long",
    month: mode === "short" ? "short" : "long",
    day: "numeric",
    year: mode === "short" ? undefined : "numeric",
  }).format(now);
}

function greeting(now: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: MIRROR_CONFIG.timezone, hour: "numeric", hourCycle: "h23" }).format(now));
  if (hour < 12) return "Good morning.";
  if (hour < 17) return "Good afternoon.";
  return "Good evening.";
}


function isoWeek(now: Date) {
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - start.getTime()) / 86400000) + 1) / 7);
}

function dayProgress(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: MIRROR_CONFIG.timezone, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  return ((get("hour") * 3600 + get("minute") * 60 + get("second")) / 86400) * 100;
}

function widgetStyle(widget: ScreenWidget): CSSProperties {
  const style = widget.style || {};
  const shapeRadius = widget.type === "shape"
    ? widget.config.shape === "circle" ? 999 : widget.config.shape === "pill" ? 999 : widget.config.shape === "line" ? 2 : style.borderRadius
    : style.borderRadius;
  return {
    left: widget.x,
    top: widget.y,
    width: widget.w,
    height: widget.h,
    zIndex: widget.z,
    opacity: widget.opacity,
    transform: `rotate(${widget.rotation}deg) scale(${widget.scale})`,
    color: style.color,
    background: style.background,
    borderColor: style.borderColor,
    borderWidth: style.borderWidth,
    borderStyle: style.borderWidth ? "solid" : undefined,
    borderRadius: shapeRadius,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    lineHeight: style.lineHeight,
    textAlign: style.textAlign,
    padding: style.padding,
    boxShadow: style.shadow || (!["logo", "image", "video"].includes(widget.type) && style.glow ? `0 0 ${style.glow * 2}px currentColor` : undefined),
    backdropFilter: style.backdropBlur ? `blur(${style.backdropBlur}px)` : undefined,
  };
}

function CalendarWidget({ widget, now }: { widget: ScreenWidget; now: Date }) {
  const [events, setEvents] = useState<CalendarEvent[]>(widget.config.calendarEvents || []);
  useEffect(() => {
    if (!widget.config.calendarUrl) {
      setEvents(widget.config.calendarEvents || []);
      return;
    }
    let live = true;
    const load = async () => {
      try {
        const response = await fetch(`/api/calendar?url=${encodeURIComponent(widget.config.calendarUrl || "")}`, { cache: "no-store" });
        const data = await response.json() as { events?: CalendarEvent[] };
        if (live && Array.isArray(data.events)) setEvents(data.events);
      } catch {}
    };
    load();
    const timer = window.setInterval(load, 5 * 60 * 1000);
    return () => { live = false; window.clearInterval(timer); };
  }, [widget.config.calendarUrl, widget.config.calendarEvents]);

  const upcoming = events.filter((event) => new Date(event.start).getTime() >= now.getTime() - 3_600_000).slice(0, widget.config.maxItems || 4);
  return <div className="widget-calendar"><div className="widget-eyebrow">{widget.config.calendarTitle || "UP NEXT"}</div>{upcoming.length ? upcoming.map((event, index) => <div className="calendar-row" key={`${event.start}-${index}`}><time>{new Intl.DateTimeFormat("en-US", { timeZone: MIRROR_CONFIG.timezone, hour: "numeric", minute: "2-digit" }).format(new Date(event.start))}</time><div><b>{event.title}</b>{event.location && <small>{event.location}</small>}</div></div>) : <div className="calendar-empty">No upcoming events</div>}</div>;
}

function Countdown({ widget, now }: { widget: ScreenWidget; now: Date }) {
  const target = new Date(widget.config.countdownTo || now.toISOString()).getTime();
  const diff = Math.max(0, target - now.getTime());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return <div className="widget-countdown"><div className="widget-eyebrow">{widget.config.countdownLabel || "COUNTDOWN"}</div><strong>{days}<small>D</small> {hours}<small>H</small> {minutes}<small>M</small></strong></div>;
}


function TeamScheduleWidget({ widget, runtime }: { widget: ScreenWidget; runtime: RuntimeData }) {
  const schedule = runtime.teamSchedule || DEFAULT_TEAM_SCHEDULE;
  const now = runtime.now;
  const title = widget.config.scheduleTitle;
  const max = widget.config.scheduleMaxItems || (widget.type === "teamNow" ? 8 : widget.type === "teamNext" ? 6 : 20);
  const showTimes = widget.config.scheduleShowTimes !== false;
  const showLabels = widget.config.scheduleShowLabels !== false;
  const suffix = (label?: string) => showLabels && label ? <em>{label}</em> : null;

  if (widget.type === "teamNow") {
    const active = peopleInNow(schedule, now).slice(0, max);
    return <div className="team-widget team-now">
      <div className="team-widget-head"><span>{title || "WHO’S IN NOW"}</span><b>{active.length}</b></div>
      {active.length ? <div className="team-now-grid">{active.map(({ member, segment }) => <div className="team-person" key={`${member.id}-${segment.start}`}><i/><div><strong>{member.name}</strong>{showTimes && <small>until {formatTime12(segment.end)}</small>}</div>{suffix(segment.label)}</div>)}</div> : <div className="team-empty">No one is scheduled in right now.</div>}
    </div>;
  }

  if (widget.type === "teamNext") {
    const next = upcomingToday(schedule, now).slice(0, max);
    return <div className="team-widget team-next">
      <div className="team-widget-head"><span>{title || "COMING UP"}</span><b>{dayForDate(now, schedule.timezone).toUpperCase()}</b></div>
      {next.length ? <div className="team-next-list">{next.map(({ member, segment }) => <div key={`${member.id}-${segment.start}`}><time>{formatTime12(segment.start)}</time><strong>{member.name}</strong>{suffix(segment.label)}</div>)}</div> : <div className="team-empty">No more scheduled arrivals today.</div>}
    </div>;
  }

  if (widget.type === "teamToday") {
    const today = scheduledToday(schedule, now).slice(0, max);
    return <div className="team-widget team-today">
      <div className="team-widget-head"><span>{title || "TODAY’S TEAM"}</span><b>{today.length} PEOPLE</b></div>
      {today.length ? <div className="team-today-list">{today.map(({ member, segments }) => <div className="team-today-row" key={member.id}><strong>{member.name}</strong><div>{segments.map((segment, index) => <span key={`${segment.start}-${index}`}>{showTimes ? formatShift(segment, true) : segment.label || "Scheduled"}</span>)}</div></div>)}</div> : <div className="team-empty">No team shifts scheduled today.</div>}
    </div>;
  }

  const currentDay = dayForDate(now, schedule.timezone);
  return <div className="team-widget team-week">
    <div className="team-widget-head"><span>{title || "WEEKLY TEAM SCHEDULE"}</span><b>{schedule.members.filter((member) => member.active !== false).length} TEAM</b></div>
    <div className="team-week-days">{TEAM_DAYS.map((day) => {
      const entries = schedule.members.filter((member) => member.active !== false && member.shifts[day].length).map((member) => ({ member, segments: member.shifts[day] }));
      return <section className={day === currentDay ? "is-today" : ""} key={day}><header><strong>{day.slice(0, 3).toUpperCase()}</strong><small>{entries.length} scheduled</small></header><div>{entries.length ? entries.map(({ member, segments }) => <article key={member.id}><b>{member.name}</b><span>{showTimes ? segments.map((segment) => formatShift(segment, true)).join(" / ") : "Scheduled"}</span></article>) : <p>OFF / no shifts</p>}</div></section>;
    })}</div>
  </div>;
}

function WidgetContent({ widget, runtime }: { widget: ScreenWidget; runtime: RuntimeData }) {
  const now = runtime.now;
  const facility = getFacilityStatus(now, MIRROR_CONFIG.timezone);
  const weather = runtime.weather;
  switch (widget.type) {
    case "clock": {
      const bits = formatTime(now, widget.config.format);
      return <div className="widget-clock"><span>{bits.time}</span>{bits.period && <small>{bits.period}</small>}</div>;
    }
    case "date": return <div className="widget-date">{formatDate(now, widget.config.format)}</div>;
    case "weather": return <div className="widget-weather"><WeatherGlyph code={weather?.code} className="widget-weather-icon"/><div><strong>{weather ? `${weather.temperature}°` : "—°"}</strong>{widget.config.showCondition !== false && <span>{weather?.label || "Weather offline"}</span>}{widget.config.showHighLow !== false && weather && <small>H {weather.high}° · L {weather.low}°</small>}{widget.config.showLocation !== false && <em>{MIRROR_CONFIG.location}</em>}</div></div>;
    case "temperature": return <div className="widget-temperature">{weather ? `${weather.temperature}°` : "—°"}</div>;
    case "facilityStatus": return <div className={`widget-status ${facility.isOpen ? "is-open" : "is-closed"}`}><strong>{facility.label}</strong><small>{facility.detail}</small></div>;
    case "greeting": return <div className="widget-greeting">{widget.config.text || greeting(now)}</div>;
    case "text": return <div className="widget-text">{widget.config.text || "Text"}</div>;
    case "quote": return <div className="widget-quote">{widget.config.text || "Make something."}</div>;
    case "logo": {
      const variant = widget.config.logoVariant || "color";
      const src = variant === "icon" ? "/brand/gocreate-icon.png" : variant === "white" ? "/brand/gocreate-white.svg" : "/brand/gocreate-color.svg";
      return <div className="widget-logo"><Image src={src} alt="GoCreate" fill sizes="800px" priority style={{ objectFit: "contain" }}/></div>;
    }
    case "image": return widget.config.imageSrc ? <div className="widget-image" style={{ backgroundImage: `url(${JSON.stringify(widget.config.imageSrc).slice(1,-1)})`, backgroundSize: widget.config.objectFit || "cover" }} /> : <div className="widget-image-placeholder"><span>+</span><small>ADD PHOTO</small></div>;
    case "calendar": return <CalendarWidget widget={widget} now={now}/>;
    case "countdown": return <Countdown widget={widget} now={now}/>;
    case "studios": return <div className={`widget-studios studios-${widget.config.variant || "grid"}`}>{MIRROR_CONFIG.studios.map((studio, index) => <div key={studio.short}><span>0{index + 1}</span><b>{studio.short}</b><small>{studio.name}</small></div>)}</div>;
    case "marquee": return <div className="widget-marquee"><div>{[...(widget.config.tickerItems || ["GOCREATE"]), ...(widget.config.tickerItems || ["GOCREATE"])].map((item, i) => <span key={`${item}-${i}`}>{item}<i>◆</i></span>)}</div></div>;
    case "network": return <div className={`widget-network ${runtime.online ? "online" : "offline"}`}><i />{runtime.online ? "CONNECTED" : "OFFLINE"}</div>;
    case "metric": return <div className="widget-metric"><small>{widget.config.metricLabel || "METRIC"}</small><strong>{widget.config.metricValue || "0"}<em>{widget.config.metricSuffix || ""}</em></strong></div>;
    case "badge": return <div className="widget-badge">{widget.config.text || "BADGE"}</div>;
    case "wind": return <div className="widget-mini-metric"><small>{widget.config.text || "WIND"}</small><strong>{weather ? `${weather.wind}` : "—"}<em> MPH</em></strong></div>;
    case "feelsLike": return <div className="widget-mini-metric"><small>{widget.config.text || "FEELS LIKE"}</small><strong>{weather ? `${weather.apparent}°` : "—°"}</strong></div>;
    case "dayProgress": { const progress = dayProgress(now); return <div className="widget-progress"><div><span>{widget.config.text || "DAY"}</span><b>{Math.round(progress)}%</b></div><i><em style={{ width: `${progress}%` }}/></i></div>; }
    case "weekNumber": return <div className="widget-mini-metric"><small>WEEK</small><strong>{isoWeek(now)}</strong></div>;
    case "video": return widget.config.url ? <video className="widget-video" src={widget.config.url} autoPlay muted loop playsInline /> : <div className="widget-image-placeholder"><span>▶</span><small>ADD VIDEO URL</small></div>;
    case "list": return <div className="widget-list">{(widget.config.tickerItems || []).map((item, index) => <div key={`${item}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><b>{item}</b></div>)}</div>;
    case "progress": { const value = clamp(Number(widget.config.metricValue || 0), 0, 100); return <div className="widget-progress"><div><span>{widget.config.metricLabel || "PROGRESS"}</span><b>{value}{widget.config.metricSuffix || "%"}</b></div><i><em style={{ width: `${value}%` }}/></i></div>; }
    case "distance": { const device = runtime.device || DEFAULT_DEVICE_STATUS; return <div className="widget-mini-metric"><small>{widget.config.text || "DISTANCE"}</small><strong>{device.distanceCm == null ? "—" : Math.round(device.distanceCm)}<em> CM</em></strong></div>; }
    case "presence": { const device = runtime.device || DEFAULT_DEVICE_STATUS; return <div className={`widget-network ${device.presence ? "online" : "offline"}`}><i />{device.presence ? (device.proximity === "near" ? "PERSON NEAR" : "PRESENCE DETECTED") : "AREA CLEAR"}</div>; }
    case "assistantStatus": { const ai = runtime.assistant || DEFAULT_ASSISTANT_STATE; return <div className={`widget-network ${ai.phase !== "error" ? "online" : "offline"}`}><i />{(widget.config.text || "GO AI")} · {ai.phase.toUpperCase()}</div>; }
    case "cameraStatus": { const device = runtime.device || DEFAULT_DEVICE_STATUS; return <div className={`widget-network ${device.cameraReady ? "online" : "offline"}`}><i />{device.cameraReady ? "CAMERA READY" : "CAMERA OFFLINE"}</div>; }
    case "teamNow":
    case "teamNext":
    case "teamToday":
    case "teamWeek": return <TeamScheduleWidget widget={widget} runtime={runtime}/>;
    case "divider": return <div className="widget-divider"/>;
    case "shape": return <div className="widget-shape"/>;
    case "iframe": return <iframe className="widget-frame" src={widget.config.url || "about:blank"} title={widget.name} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />;
    default: return null;
  }
}

function EditableWidget({ widget, runtime, scale, selected, onSelect, onMove }: { widget: ScreenWidget; runtime: RuntimeData; scale: number; selected: boolean; onSelect?: (id: string) => void; onMove?: RendererProps["onMove"] }) {
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const resize = useRef<{ x: number; y: number; ow: number; oh: number } | null>(null);
  const movePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current && onMove) {
      onMove(widget.id, { x: clamp(drag.current.ox + (event.clientX - drag.current.x) / scale, -widget.w + 30, CANVAS_WIDTH - 30), y: clamp(drag.current.oy + (event.clientY - drag.current.y) / scale, -widget.h + 30, CANVAS_HEIGHT - 30) });
    }
    if (resize.current && onMove) {
      onMove(widget.id, { w: clamp(resize.current.ow + (event.clientX - resize.current.x) / scale, 30, CANVAS_WIDTH), h: clamp(resize.current.oh + (event.clientY - resize.current.y) / scale, 20, CANVAS_HEIGHT) });
    }
  };
  const end = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((drag.current || resize.current) && onMove) onMove(widget.id, {}, true);
    drag.current = null; resize.current = null;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
  };
  return <div className={`screen-widget type-${widget.type} editor-widget ${selected ? "is-selected" : ""} anim-${widget.animation || "none"}`} style={widgetStyle(widget)} onPointerDown={(event) => { event.stopPropagation(); onSelect?.(widget.id); if (widget.locked) return; drag.current = { x: event.clientX, y: event.clientY, ox: widget.x, oy: widget.y }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={movePointer} onPointerUp={end} onPointerCancel={end}><WidgetContent widget={widget} runtime={runtime}/>{selected && !widget.locked && <button className="resize-handle" aria-label="Resize" onPointerDown={(event) => { event.stopPropagation(); resize.current = { x: event.clientX, y: event.clientY, ow: widget.w, oh: widget.h }; event.currentTarget.parentElement?.setPointerCapture(event.pointerId); }} />}</div>;
}

export function ScreenRenderer({ screen, runtime, className = "", editable = false, selectedId, onSelect, onMove, onScaleChange }: RendererProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const data = runtime || { now: new Date(), weather: null, online: true };
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const update = () => {
      const next = Math.min(element.clientWidth / CANVAS_WIDTH, element.clientHeight / CANVAS_HEIGHT);
      setScale(next); onScaleChange?.(next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [onScaleChange]);
  const sorted = useMemo(() => [...screen.widgets].sort((a, b) => a.z - b.z), [screen.widgets]);
  const bg: CSSProperties = { backgroundColor: screen.background.color, backgroundImage: screen.background.gradient || undefined };
  return <div ref={viewportRef} className={`screen-viewport ${className}`} onPointerDown={() => editable && onSelect?.(null)}><div className="screen-canvas" style={{ ...bg, left: "50%", top: "50%", transform: `translate(-50%, -50%) scale(${scale})` }}>
    {screen.background.imageSrc && <div className="screen-bg-image" style={{ backgroundImage: `url(${screen.background.imageSrc})`, opacity: screen.background.imageOpacity ?? .35 }}/>} 
    {screen.background.ambientGlow && <div className="screen-ambient"/>}
    {screen.background.noise && <div className="screen-noise"/>}
    {sorted.map((widget) => editable ? <EditableWidget key={widget.id} widget={widget} runtime={data} scale={scale} selected={selectedId === widget.id} onSelect={(id) => onSelect?.(id)} onMove={onMove}/> : <div key={widget.id} className={`screen-widget type-${widget.type} anim-${widget.animation || "none"}`} style={widgetStyle(widget)}><WidgetContent widget={widget} runtime={data}/></div>)}
  </div></div>;
}
