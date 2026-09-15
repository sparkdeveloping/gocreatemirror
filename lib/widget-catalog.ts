import { CANVAS_HEIGHT, CANVAS_WIDTH, makeId, type ScreenWidget, type WidgetType } from "./screen-types";

export type WidgetCatalogItem = {
  type: WidgetType;
  name: string;
  description: string;
  group: "Essentials" | "Content" | "Brand & Media" | "Utility";
  glyph: string;
};

export const WIDGET_CATALOG: WidgetCatalogItem[] = [
  { type: "clock", name: "Clock", description: "Digital time with 12/24-hour variants.", group: "Essentials", glyph: "12:45" },
  { type: "date", name: "Date", description: "Short or long live date.", group: "Essentials", glyph: "SEP 15" },
  { type: "weather", name: "Weather", description: "Temperature, condition, highs and lows.", group: "Essentials", glyph: "72°" },
  { type: "temperature", name: "Temperature", description: "Large standalone current temperature.", group: "Essentials", glyph: "°F" },
  { type: "facilityStatus", name: "Open / Closed", description: "Live GoCreate facility status and hours.", group: "Essentials", glyph: "OPEN" },
  { type: "greeting", name: "Greeting", description: "Time-aware greeting or custom welcome line.", group: "Essentials", glyph: "HELLO" },
  { type: "text", name: "Text", description: "Fully editable headline, label, or body copy.", group: "Content", glyph: "Aa" },
  { type: "quote", name: "Quote", description: "Statement block with subtle quote treatment.", group: "Content", glyph: "“ ”" },
  { type: "calendar", name: "Calendar", description: "Manual events or a public iCal feed.", group: "Content", glyph: "CAL" },
  { type: "teamNow", name: "Who’s In Now", description: "Live roster of team members currently on shift.", group: "Content", glyph: "IN" },
  { type: "teamNext", name: "Coming Up", description: "Next team members scheduled to arrive today.", group: "Content", glyph: "NEXT" },
  { type: "teamToday", name: "Today’s Team", description: "Complete staff schedule for the current day.", group: "Content", glyph: "TODAY" },
  { type: "teamWeek", name: "Weekly Team Schedule", description: "Full Monday–Sunday schedule, grouped for mirror readability.", group: "Content", glyph: "WEEK" },
  { type: "countdown", name: "Countdown", description: "Live days/hours/minutes to a date.", group: "Content", glyph: "T−" },
  { type: "marquee", name: "Ticker", description: "Animated scrolling announcements.", group: "Content", glyph: "→→" },
  { type: "studios", name: "Studios", description: "GoCreate studio names in a clean grid.", group: "Content", glyph: "6×" },
  { type: "logo", name: "GoCreate Logo", description: "Icon, color wordmark, or white wordmark.", group: "Brand & Media", glyph: "GC" },
  { type: "image", name: "Photo / Image", description: "Upload a photo or paste an image URL.", group: "Brand & Media", glyph: "IMG" },
  { type: "iframe", name: "Web Frame", description: "Embed an external dashboard or webpage.", group: "Brand & Media", glyph: "WEB" },
  { type: "network", name: "Connection", description: "Online/offline mirror connection status.", group: "Utility", glyph: "NET" },
  { type: "metric", name: "Metric", description: "Any custom value, label and suffix.", group: "Utility", glyph: "42" },
  { type: "badge", name: "Badge", description: "Compact pill for labels and statuses.", group: "Utility", glyph: "TAG" },
  { type: "wind", name: "Wind", description: "Live wind speed from the weather feed.", group: "Essentials", glyph: "WIND" },
  { type: "feelsLike", name: "Feels Like", description: "Current apparent temperature.", group: "Essentials", glyph: "FEEL" },
  { type: "dayProgress", name: "Day Progress", description: "Animated progress through the current day.", group: "Utility", glyph: "DAY" },
  { type: "weekNumber", name: "Week Number", description: "Current ISO week number.", group: "Utility", glyph: "W#" },
  { type: "video", name: "Video", description: "Autoplay a muted looping MP4/WebM URL.", group: "Brand & Media", glyph: "VID" },
  { type: "list", name: "List", description: "Editable stack of items, tasks or announcements.", group: "Content", glyph: "LIST" },
  { type: "progress", name: "Progress", description: "Custom labeled progress bar from 0–100.", group: "Utility", glyph: "%" },
  { type: "divider", name: "Divider", description: "Fine horizontal or vertical line.", group: "Utility", glyph: "—" },
  { type: "shape", name: "Shape", description: "Rectangle, circle, pill or line accent.", group: "Utility", glyph: "◯" },
  { type: "distance", name: "Distance Sensor", description: "Live HC-SR04 distance from the Pi companion.", group: "Utility", glyph: "CM" },
  { type: "presence", name: "Presence", description: "Shows whether someone is currently near the mirror.", group: "Utility", glyph: "YOU" },
  { type: "assistantStatus", name: "Go AI Status", description: "Idle, listening, thinking or speaking state.", group: "Utility", glyph: "AI" },
  { type: "cameraStatus", name: "Camera Status", description: "Pi Camera readiness/privacy indicator.", group: "Utility", glyph: "CAM" },
];

const base = (type: WidgetType, name: string): ScreenWidget => ({
  id: makeId(type),
  type,
  name,
  x: 80,
  y: 180,
  w: 420,
  h: 150,
  rotation: 0,
  scale: 1,
  opacity: 1,
  z: 10,
  animation: "none",
  style: {
    color: "#f7fbff",
    background: "transparent",
    borderColor: "rgba(105,198,255,.32)",
    borderWidth: 0,
    borderRadius: 18,
    fontSize: 52,
    fontWeight: 500,
    letterSpacing: 0,
    lineHeight: 1.05,
    textAlign: "left",
    padding: 0,
    glow: 0,
    backdropBlur: 0,
  },
  config: {},
});

export function createWidget(type: WidgetType): ScreenWidget {
  const widget = base(type, WIDGET_CATALOG.find((item) => item.type === type)?.name || type);

  switch (type) {
    case "clock":
      return { ...widget, w: 500, h: 170, style: { ...widget.style, fontSize: 120, fontWeight: 300, letterSpacing: -4 }, config: { format: "12h", variant: "digital" } };
    case "date":
      return { ...widget, w: 500, h: 75, style: { ...widget.style, fontSize: 30, letterSpacing: 6 }, config: { format: "long" } };
    case "weather":
      return { ...widget, w: 430, h: 210, style: { ...widget.style, fontSize: 62 }, config: { variant: "full", showHighLow: true, showCondition: true, showLocation: true } };
    case "temperature":
      return { ...widget, w: 280, h: 160, style: { ...widget.style, fontSize: 112, fontWeight: 300 }, config: { variant: "temperature" } };
    case "facilityStatus":
      return { ...widget, w: 350, h: 125, style: { ...widget.style, fontSize: 42, letterSpacing: 3 }, config: { variant: "full" } };
    case "greeting":
      return { ...widget, w: 560, h: 120, style: { ...widget.style, fontSize: 54, fontWeight: 400 }, config: { text: "" } };
    case "text":
      return { ...widget, w: 560, h: 150, config: { text: "Your text here" } };
    case "quote":
      return { ...widget, w: 760, h: 180, style: { ...widget.style, fontSize: 46, fontWeight: 300, lineHeight: 1.2 }, config: { text: "The idea is only the start." } };
    case "calendar":
      return { ...widget, w: 720, h: 360, style: { ...widget.style, fontSize: 28, background: "rgba(5,13,21,.56)", borderWidth: 1, padding: 26, backdropBlur: 14 }, config: { calendarTitle: "TODAY", maxItems: 4, calendarEvents: [
        { title: "Open Studio", start: new Date(Date.now() + 60 * 60 * 1000).toISOString(), location: "GoCreate" },
        { title: "Team Meeting", start: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), location: "Design Studio" },
      ] } };
    case "countdown":
      return { ...widget, w: 520, h: 170, style: { ...widget.style, fontSize: 46 }, config: { countdownLabel: "NEXT EVENT", countdownTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() } };
    case "marquee":
      return { ...widget, x: 0, y: CANVAS_HEIGHT - 115, w: CANVAS_WIDTH, h: 80, style: { ...widget.style, fontSize: 25, letterSpacing: 4, background: "rgba(0,0,0,.64)", borderWidth: 1 }, config: { tickerItems: ["MAKE HERE", "LEARN HERE", "BUILD HERE", "GOCREATE"] } };
    case "studios":
      return { ...widget, w: 760, h: 260, style: { ...widget.style, fontSize: 26, letterSpacing: 3 }, config: { variant: "grid" } };
    case "logo":
      return { ...widget, w: 370, h: 120, style: { ...widget.style, glow: 0 }, config: { logoVariant: "color" } };
    case "image":
      return { ...widget, w: 500, h: 320, style: { ...widget.style, borderRadius: 22 }, config: { imageSrc: "", objectFit: "cover" } };
    case "iframe":
      return { ...widget, w: 760, h: 520, style: { ...widget.style, borderRadius: 22, background: "#050505" }, config: { url: "https://example.com" } };
    case "network":
      return { ...widget, w: 280, h: 60, style: { ...widget.style, fontSize: 22, letterSpacing: 3 }, config: {} };
    case "metric":
      return { ...widget, w: 320, h: 160, style: { ...widget.style, fontSize: 76, fontWeight: 300 }, config: { metricLabel: "MEMBERS", metricValue: "128", metricSuffix: "" } };
    case "badge":
      return { ...widget, w: 230, h: 62, style: { ...widget.style, fontSize: 21, textAlign: "center", background: "rgba(0,183,255,.11)", borderWidth: 1, borderRadius: 99, padding: 14, letterSpacing: 3 }, config: { text: "GOCREATE" } };
    case "wind":
      return { ...widget, w: 300, h: 120, style: { ...widget.style, fontSize: 54, fontWeight: 300 }, config: { text: "WIND" } };
    case "feelsLike":
      return { ...widget, w: 300, h: 120, style: { ...widget.style, fontSize: 54, fontWeight: 300 }, config: { text: "FEELS LIKE" } };
    case "dayProgress":
      return { ...widget, w: 480, h: 90, style: { ...widget.style, fontSize: 20 }, config: { text: "DAY" } };
    case "weekNumber":
      return { ...widget, w: 260, h: 120, style: { ...widget.style, fontSize: 52, fontWeight: 300 }, config: {} };
    case "video":
      return { ...widget, w: 650, h: 420, style: { ...widget.style, borderRadius: 22, background: "#050505" }, config: { url: "" } };
    case "list":
      return { ...widget, w: 520, h: 320, style: { ...widget.style, fontSize: 28, lineHeight: 1.35 }, config: { tickerItems: ["First item", "Second item", "Third item"] } };
    case "progress":
      return { ...widget, w: 500, h: 100, style: { ...widget.style, fontSize: 22 }, config: { metricLabel: "PROGRESS", metricValue: "68", metricSuffix: "%" } };
    case "divider":
      return { ...widget, w: 500, h: 4, style: { ...widget.style, background: "rgba(98,204,255,.46)", borderRadius: 8 }, config: { variant: "horizontal" } };
    case "shape":
      return { ...widget, w: 260, h: 260, opacity: 0.28, style: { ...widget.style, background: "#00aef3", borderRadius: 999, glow: 20 }, config: { shape: "circle" } };
    case "distance":
      return { ...widget, w: 320, h: 125, style: { ...widget.style, fontSize: 52, fontWeight: 300 }, config: { text: "DISTANCE" } };
    case "presence":
      return { ...widget, w: 340, h: 90, style: { ...widget.style, fontSize: 24, letterSpacing: 3 }, config: { text: "PRESENCE" } };
    case "assistantStatus":
      return { ...widget, w: 340, h: 90, style: { ...widget.style, fontSize: 24, letterSpacing: 3 }, config: { text: "GO AI" } };
    case "cameraStatus":
      return { ...widget, w: 340, h: 90, style: { ...widget.style, fontSize: 24, letterSpacing: 3 }, config: { text: "CAMERA" } };
    case "teamNow":
      return { ...widget, w: 920, h: 330, style: { ...widget.style, fontSize: 30, background: "rgba(4,12,18,.46)", borderColor: "rgba(92,201,255,.18)", borderWidth: 1, borderRadius: 22, padding: 26 }, config: { scheduleTitle: "WHO’S IN NOW", scheduleMaxItems: 8, scheduleShowTimes: true, scheduleShowLabels: true } };
    case "teamNext":
      return { ...widget, w: 920, h: 250, style: { ...widget.style, fontSize: 27, background: "rgba(4,12,18,.40)", borderColor: "rgba(92,201,255,.14)", borderWidth: 1, borderRadius: 22, padding: 24 }, config: { scheduleTitle: "COMING UP", scheduleMaxItems: 6, scheduleShowTimes: true, scheduleShowLabels: true } };
    case "teamToday":
      return { ...widget, w: 920, h: 560, style: { ...widget.style, fontSize: 26, background: "rgba(4,12,18,.40)", borderColor: "rgba(92,201,255,.14)", borderWidth: 1, borderRadius: 22, padding: 24 }, config: { scheduleTitle: "TODAY’S TEAM", scheduleMaxItems: 16, scheduleShowTimes: true, scheduleShowLabels: true } };
    case "teamWeek":
      return { ...widget, w: 960, h: 1500, style: { ...widget.style, fontSize: 22, background: "rgba(3,9,14,.50)", borderColor: "rgba(92,201,255,.14)", borderWidth: 1, borderRadius: 24, padding: 24 }, config: { scheduleTitle: "WEEKLY TEAM SCHEDULE", scheduleShowTimes: true, scheduleShowLabels: true } };
    default:
      return widget;
  }
}
