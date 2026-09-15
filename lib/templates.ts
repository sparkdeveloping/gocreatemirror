import { CANVAS_HEIGHT, CANVAS_WIDTH, type ScreenDefinition, type ScreenWidget, type WidgetAnimation, type WidgetType } from "./screen-types";

export type TemplateMeta = {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  animated?: boolean;
  screen: ScreenDefinition;
};

type WidgetArgs = Partial<ScreenWidget> & {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
};

function w(args: WidgetArgs): ScreenWidget {
  return {
    id: args.id,
    type: args.type,
    name: args.name || args.type,
    x: args.x,
    y: args.y,
    w: args.w,
    h: args.h,
    rotation: args.rotation ?? 0,
    scale: args.scale ?? 1,
    opacity: args.opacity ?? 1,
    z: args.z ?? 10,
    locked: args.locked,
    animation: args.animation || "none",
    style: {
      color: "#f7fbff",
      background: "transparent",
      borderColor: "rgba(92,201,255,.28)",
      borderWidth: 0,
      borderRadius: 18,
      fontSize: 34,
      fontWeight: 400,
      letterSpacing: 0,
      lineHeight: 1.08,
      textAlign: "left",
      padding: 0,
      glow: 0,
      backdropBlur: 0,
      ...args.style,
    },
    config: { ...args.config },
  };
}

function screen(
  id: string,
  name: string,
  category: string,
  description: string,
  widgets: ScreenWidget[],
  background: ScreenDefinition["background"] = { color: "#000000", ambientGlow: false, noise: false },
): ScreenDefinition {
  return { id, name, category, description, width: CANVAS_WIDTH, height: CANVAS_HEIGHT, background, widgets };
}

const clock = (id: string, x: number, y: number, size = 126, animation: WidgetAnimation = "none") =>
  w({ id, type: "clock", x, y, w: 510, h: 155, animation, style: { fontSize: size, fontWeight: 300, letterSpacing: -5 }, config: { format: "12h", variant: "digital" } });
const date = (id: string, x: number, y: number, width = 510) =>
  w({ id, type: "date", x, y, w: width, h: 62, style: { fontSize: 27, letterSpacing: 5, color: "#b9d3e4" }, config: { format: "long" } });
const logo = (id: string, x: number, y: number, width = 360, variant: "icon" | "color" | "white" = "color", animation: WidgetAnimation = "none") =>
  w({ id, type: "logo", x, y, w: width, h: variant === "icon" ? width : Math.round(width * .29), animation, style: { glow: 0 }, config: { logoVariant: variant } });
const weather = (id: string, x: number, y: number, width = 390, compact = false) =>
  w({ id, type: "weather", x, y, w: width, h: compact ? 145 : 205, style: { fontSize: compact ? 50 : 62 }, config: { variant: compact ? "compact" : "full", showHighLow: true, showCondition: true, showLocation: !compact } });
const status = (id: string, x: number, y: number, width = 310) =>
  w({ id, type: "facilityStatus", x, y, w: width, h: 120, style: { fontSize: 39, letterSpacing: 3 }, config: { variant: "full" } });
const quote = (id: string, x: number, y: number, width: number, text: string, animation: WidgetAnimation = "none") =>
  w({ id, type: "quote", x, y, w: width, h: 160, animation, style: { fontSize: 42, fontWeight: 300, lineHeight: 1.22, color: "#f5fbff" }, config: { text } });
const studios = (id: string, x: number, y: number, width = 720) =>
  w({ id, type: "studios", x, y, w: width, h: 250, style: { fontSize: 24, letterSpacing: 3, color: "#c9deeb" }, config: { variant: "grid" } });
const badge = (id: string, x: number, y: number, text: string, color = "#00b7ff") =>
  w({ id, type: "badge", x, y, w: 225, h: 56, style: { fontSize: 19, color: "#eaf8ff", background: `${color}18`, borderColor: `${color}66`, borderWidth: 1, borderRadius: 99, textAlign: "center", padding: 13, letterSpacing: 3 }, config: { text } });
const line = (id: string, x: number, y: number, width: number, color = "rgba(84,196,255,.42)") =>
  w({ id, type: "divider", x, y, w: width, h: 3, style: { background: color, borderRadius: 8 }, config: { variant: "horizontal" } });

export const TEMPLATE_LIBRARY: TemplateMeta[] = [
  {
    id: "team-pulse",
    name: "Team Pulse / Default",
    category: "Team",
    description: "The new default mirror: current team on shift, upcoming arrivals, today’s full roster, time, weather and open status while preserving a reflection band.",
    tags: ["recommended", "team", "schedule", "live"],
    screen: screen("team-pulse", "Team Pulse / Default", "Team", "Live staffing-aware default mirror", [
      logo("brand", 60, 68, 320, "color"),
      clock("clock", 55, 220, 132),
      date("date", 62, 365, 560),
      status("status", 720, 225, 300),
      weather("weather", 715, 380, 300, true),
      w({ id: "in-now", type: "teamNow", x: 60, y: 555, w: 960, h: 335, style: { fontSize: 31, background: "rgba(3,10,15,.48)", borderColor: "rgba(82,198,247,.22)", borderWidth: 1, borderRadius: 22, padding: 27 }, config: { scheduleTitle: "WHO’S IN NOW", scheduleMaxItems: 10, scheduleShowTimes: true, scheduleShowLabels: true } }),
      w({ id: "coming", type: "teamNext", x: 60, y: 1190, w: 960, h: 235, style: { fontSize: 26, background: "rgba(3,10,15,.40)", borderColor: "rgba(82,198,247,.14)", borderWidth: 1, borderRadius: 22, padding: 24 }, config: { scheduleTitle: "COMING UP", scheduleMaxItems: 6, scheduleShowTimes: true, scheduleShowLabels: true } }),
      w({ id: "today", type: "teamToday", x: 60, y: 1460, w: 960, h: 385, style: { fontSize: 24, background: "rgba(3,10,15,.40)", borderColor: "rgba(82,198,247,.14)", borderWidth: 1, borderRadius: 22, padding: 24 }, config: { scheduleTitle: "TODAY’S TEAM", scheduleMaxItems: 20, scheduleShowTimes: true, scheduleShowLabels: true } }),
    ], { color: "#000000", ambientGlow: false, noise: false }),
  },
  {
    id: "team-week",
    name: "Full Team Week",
    category: "Team",
    description: "A readable seven-day staff board built from the weekly schedule, with today highlighted automatically.",
    tags: ["team", "full schedule", "week"],
    screen: screen("team-week", "Full Team Week", "Team", "Complete Monday–Sunday staffing board", [
      logo("brand", 60, 55, 280, "color"),
      w({ id: "title", type: "text", x: 380, y: 60, w: 640, h: 80, style: { fontSize: 34, fontWeight: 450, letterSpacing: 3, textAlign: "right" }, config: { text: "WEEKLY TEAM SCHEDULE" } }),
      date("date", 60, 155, 560),
      clock("clock", 690, 145, 82),
      w({ id: "week", type: "teamWeek", x: 60, y: 285, w: 960, h: 1545, style: { fontSize: 21, background: "rgba(3,9,14,.44)", borderColor: "rgba(82,198,247,.16)", borderWidth: 1, borderRadius: 22, padding: 24 }, config: { scheduleTitle: "THE WEEK", scheduleShowTimes: true, scheduleShowLabels: true } }),
    ], { color: "#000000", ambientGlow: false, noise: false }),
  },
  {
    id: "signature-v3",
    name: "Signature / Field Tuned",
    category: "Signature",
    description: "Built for the physical GoCreate mirror: strong upper-left hierarchy, open reflection field, readable from several feet away.",
    tags: ["recommended", "reflection", "daily"],
    screen: screen("signature-v3", "Signature / Field Tuned", "Signature", "Photo-tuned daily mirror", [
      logo("brand", 58, 72, 360),
      date("date", 62, 235, 540),
      clock("clock", 55, 300, 140),
      weather("weather", 60, 530, 390, true),
      status("status", 650, 515, 345),
      quote("quote", 60, 1425, 700, "The idea is only the start.", "fade"),
      line("line", 60, 1602, 950),
      studios("studios", 60, 1640, 950),
      w({ id: "net", type: "network", x: 750, y: 1815, w: 260, h: 48, style: { fontSize: 18, letterSpacing: 3, textAlign: "right", color: "#80a7be" } }),
    ], { color: "#000000", ambientGlow: true, noise: true }),
  },
  {
    id: "edge-rails",
    name: "Edge Rails",
    category: "Minimal",
    description: "Maximum reflection. Information hugs the left and right edges, leaving the center almost untouched.",
    tags: ["reflection", "minimal"],
    screen: screen("edge-rails", "Edge Rails", "Minimal", "Maximum reflection rails", [
      logo("logo", 48, 70, 270, "white"),
      clock("clock", 45, 250, 112),
      date("date", 50, 390, 420),
      weather("weather", 45, 560, 320, true),
      status("status", 730, 250, 300),
      w({ id: "studio", type: "studios", x: 720, y: 1240, w: 315, h: 420, style: { fontSize: 21, textAlign: "right", letterSpacing: 4 }, config: { variant: "stack" } }),
      quote("quote", 45, 1610, 475, "Make something that didn't exist yesterday.", "slideUp"),
      line("rail-l", 35, 70, 3, "rgba(0,183,255,.55)"),
      w({ id: "rail-r", type: "divider", x: 1042, y: 70, w: 3, h: 1760, style: { background: "rgba(255,212,0,.52)" }, config: { variant: "vertical" } }),
    ]),
  },
  {
    id: "halo-motion",
    name: "Halo Motion",
    category: "Brand",
    description: "A quiet animated GoCreate icon floats in the center with time, weather and status around the perimeter.",
    tags: ["animated", "brand", "center"], animated: true,
    screen: screen("halo-motion", "Halo Motion", "Brand", "Animated centered brand", [
      clock("clock", 60, 80, 86),
      status("status", 720, 95, 300),
      logo("icon", 388, 735, 305, "icon", "float"),
      w({ id: "ring-a", type: "shape", x: 300, y: 645, w: 480, h: 480, opacity: .18, animation: "breathe", style: { background: "transparent", borderColor: "#00b7ff", borderWidth: 2, borderRadius: 999, glow: 25 }, config: { shape: "circle" } }),
      w({ id: "ring-b", type: "shape", x: 350, y: 695, w: 380, h: 380, opacity: .16, animation: "pulse", style: { background: "transparent", borderColor: "#ffd400", borderWidth: 1, borderRadius: 999 }, config: { shape: "circle" } }),
      weather("weather", 60, 1630, 350, true),
      quote("quote", 470, 1640, 550, "YOU CAN MAKE IT HERE", "fade"),
    ], { color: "#000000", gradient: "radial-gradient(circle at 50% 48%, rgba(0,174,243,.075), transparent 35%)", ambientGlow: true }),
  },
  {
    id: "icon-pure",
    name: "Icon / Pure Mirror",
    category: "Minimal",
    description: "Only the GoCreate icon, perfectly centered on true black with no halo or image glow.",
    tags: ["icon", "minimal", "animated"], animated: true,
    screen: screen("icon-pure", "Icon / Pure Mirror", "Minimal", "Centered icon only", [
      logo("icon", 405, 825, 270, "icon", "breathe"),
    ]),
  },
  {
    id: "studio-board",
    name: "Studio Board",
    category: "Information",
    description: "Makes all six studio areas visible and readable while keeping a large center reflection zone.",
    tags: ["studios", "information"],
    screen: screen("studio-board", "Studio Board", "Information", "Studio-forward screen", [
      logo("logo", 60, 65, 320),
      clock("clock", 570, 65, 102),
      date("date", 570, 185, 450),
      w({ id: "title", type: "text", x: 60, y: 1330, w: 520, h: 90, style: { fontSize: 50, fontWeight: 300, letterSpacing: 5 }, config: { text: "MAKE HERE" } }),
      studios("studios", 60, 1435, 960),
      status("status", 60, 1740, 320),
      weather("weather", 670, 1730, 350, true),
    ]),
  },
  {
    id: "daily-brief",
    name: "Daily Brief",
    category: "Productivity",
    description: "Calendar-first morning view with weather, time and an agenda panel at the bottom.",
    tags: ["calendar", "agenda", "daily"],
    screen: screen("daily-brief", "Daily Brief", "Productivity", "Agenda-focused daily view", [
      badge("badge", 60, 60, "DAILY BRIEF"),
      clock("clock", 55, 150, 136),
      date("date", 60, 300, 520),
      weather("weather", 660, 145, 355, false),
      w({ id: "calendar", type: "calendar", x: 60, y: 1270, w: 960, h: 500, style: { fontSize: 28, background: "rgba(5,14,22,.58)", borderColor: "rgba(70,183,239,.35)", borderWidth: 1, borderRadius: 25, padding: 30, backdropBlur: 16 }, config: { calendarTitle: "TODAY AT GOCREATE", maxItems: 5, calendarEvents: [] } }),
      w({ id: "greeting", type: "greeting", x: 60, y: 1065, w: 740, h: 120, style: { fontSize: 53, fontWeight: 300 }, config: {} }),
    ], { color: "#000", ambientGlow: true, noise: true }),
  },
  {
    id: "weather-glass",
    name: "Weather Glass",
    category: "Information",
    description: "A bold weather panel balanced by oversized time, designed for quick glanceability.",
    tags: ["weather", "glance"],
    screen: screen("weather-glass", "Weather Glass", "Information", "Weather-focused view", [
      logo("logo", 60, 65, 290, "white"),
      clock("clock", 50, 275, 145),
      date("date", 60, 435, 530),
      w({ id: "weather", type: "weather", x: 580, y: 280, w: 440, h: 300, style: { fontSize: 78, background: "rgba(0,174,243,.075)", borderColor: "rgba(0,174,243,.35)", borderWidth: 1, borderRadius: 28, padding: 28, backdropBlur: 16 }, config: { variant: "full", showHighLow: true, showCondition: true, showLocation: true } }),
      quote("quote", 60, 1510, 760, "Conditions change. Keep making.", "fade"),
      status("status", 690, 1680, 330),
    ]),
  },
  {
    id: "kinetic-maker",
    name: "Kinetic Maker",
    category: "Animated",
    description: "Motion-forward brand treatment with drifting accents and a marquee for announcements.",
    tags: ["animated", "energetic", "announcements"], animated: true,
    screen: screen("kinetic-maker", "Kinetic Maker", "Animated", "Animated maker screen", [
      logo("logo", 60, 70, 330, "color", "slideLeft"),
      clock("clock", 580, 75, 100, "fade"),
      w({ id: "circle", type: "shape", x: 740, y: 590, w: 380, h: 380, opacity: .13, animation: "drift", rotation: -14, style: { background: "#00aef3", borderRadius: 999, glow: 18 }, config: { shape: "circle" } }),
      w({ id: "bar", type: "shape", x: -90, y: 850, w: 700, h: 55, opacity: .18, animation: "drift", rotation: -18, style: { background: "#ffd400", borderRadius: 999, glow: 12 }, config: { shape: "pill" } }),
      quote("quote", 80, 1220, 850, "IDEA → PROTOTYPE → REALITY", "slideUp"),
      status("status", 80, 1430, 320),
      weather("weather", 650, 1420, 350, true),
      w({ id: "ticker", type: "marquee", x: 0, y: 1800, w: 1080, h: 80, animation: "none", style: { fontSize: 22, letterSpacing: 6, background: "rgba(0,0,0,.72)", borderColor: "rgba(255,212,0,.3)", borderWidth: 1 }, config: { tickerItems: ["CREATE", "LEARN", "SHARE", "BELONG", "MAKE IT HERE"] } }),
    ], { color: "#000", gradient: "linear-gradient(160deg, rgba(0,174,243,.04), transparent 45%, rgba(255,212,0,.025))", noise: true }),
  },
  {
    id: "quiet-type",
    name: "Quiet Type",
    category: "Minimal",
    description: "Typography-only design with no panels and almost no visual chrome.",
    tags: ["minimal", "type"],
    screen: screen("quiet-type", "Quiet Type", "Minimal", "Typography only", [
      date("date", 70, 100, 760),
      clock("clock", 60, 215, 150),
      w({ id: "place", type: "text", x: 70, y: 430, w: 500, h: 70, style: { fontSize: 23, color: "#83a9bf", letterSpacing: 7 }, config: { text: "WICHITA, KANSAS" } }),
      quote("quote", 70, 1420, 850, "Same people. Brighter ideas. Bigger tomorrows.", "fade"),
      status("status", 70, 1660, 310),
      w({ id: "temp", type: "temperature", x: 770, y: 1650, w: 260, h: 130, style: { fontSize: 90, fontWeight: 200, textAlign: "right" }, config: {} }),
    ]),
  },
  {
    id: "welcome-wall",
    name: "Welcome Wall",
    category: "Events",
    description: "A hospitality mode for tours, open houses and visitors with a large editable welcome message.",
    tags: ["welcome", "events", "visitors"],
    screen: screen("welcome-wall", "Welcome Wall", "Events", "Visitor welcome screen", [
      logo("logo", 340, 120, 400, "color", "fade"),
      w({ id: "welcome", type: "text", x: 100, y: 650, w: 880, h: 290, style: { fontSize: 94, fontWeight: 250, textAlign: "center", lineHeight: 1.02 }, config: { text: "WELCOME\nTO GOCREATE" } }),
      w({ id: "sub", type: "text", x: 160, y: 985, w: 760, h: 120, style: { fontSize: 28, textAlign: "center", color: "#a9c7d9", letterSpacing: 5 }, config: { text: "CREATE • LEARN • SHARE • BELONG" } }),
      clock("clock", 325, 1360, 95),
      status("status", 375, 1535, 330),
    ], { color: "#000", gradient: "radial-gradient(circle at 50% 48%, rgba(0,174,243,.08), transparent 40%)", ambientGlow: true }),
  },
  {
    id: "event-countdown",
    name: "Event Countdown",
    category: "Events",
    description: "Countdown-centered screen for launches, classes, showcases and special events.",
    tags: ["countdown", "events"],
    screen: screen("event-countdown", "Event Countdown", "Events", "Countdown screen", [
      logo("logo", 60, 65, 300, "white"),
      date("date", 610, 75, 410),
      w({ id: "label", type: "text", x: 100, y: 550, w: 880, h: 95, style: { fontSize: 32, textAlign: "center", color: "#9cc4db", letterSpacing: 8 }, config: { text: "NEXT BIG THING" } }),
      w({ id: "countdown", type: "countdown", x: 90, y: 680, w: 900, h: 300, animation: "pulse", style: { fontSize: 72, textAlign: "center", fontWeight: 250 }, config: { countdownLabel: "MAKER SHOWCASE", countdownTo: "2026-12-01T18:00:00-06:00" } }),
      quote("quote", 160, 1160, 760, "Build anticipation. Then build the thing.", "fade"),
      weather("weather", 365, 1600, 350, true),
    ]),
  },
  {
    id: "calendar-column",
    name: "Calendar Column",
    category: "Productivity",
    description: "Tall agenda column on the left with a generous full-height reflection area on the right.",
    tags: ["calendar", "reflection"],
    screen: screen("calendar-column", "Calendar Column", "Productivity", "Agenda rail", [
      logo("logo", 50, 55, 300, "white"),
      clock("clock", 45, 230, 104),
      date("date", 50, 350, 440),
      w({ id: "calendar", type: "calendar", x: 45, y: 520, w: 470, h: 880, style: { fontSize: 26, background: "rgba(4,11,17,.54)", borderWidth: 1, borderRadius: 24, padding: 25, backdropBlur: 12 }, config: { calendarTitle: "UP NEXT", maxItems: 6, calendarEvents: [] } }),
      weather("weather", 50, 1510, 340, true),
      status("status", 50, 1690, 300),
    ]),
  },
  {
    id: "brand-stack",
    name: "Brand Stack",
    category: "Brand",
    description: "A vertical GoCreate brand composition with spacious typography and subtle motion.",
    tags: ["brand", "animated"], animated: true,
    screen: screen("brand-stack", "Brand Stack", "Brand", "Vertical brand composition", [
      logo("icon", 70, 95, 190, "icon", "float"),
      w({ id: "go", type: "text", x: 70, y: 380, w: 780, h: 190, style: { fontSize: 120, fontWeight: 650, letterSpacing: -4 }, config: { text: "GO" } }),
      w({ id: "create", type: "text", x: 70, y: 535, w: 900, h: 190, style: { fontSize: 120, fontWeight: 250, letterSpacing: -4 }, config: { text: "CREATE" } }),
      w({ id: "words", type: "text", x: 75, y: 765, w: 500, h: 260, style: { fontSize: 24, color: "#9cc3d8", letterSpacing: 7, lineHeight: 1.8 }, config: { text: "PEOPLE\nIDEAS\nTOOLS\nPOSSIBILITIES" } }),
      quote("quote", 70, 1350, 800, "A brighter tomorrow starts with making today.", "fade"),
      status("status", 70, 1600, 300),
      weather("weather", 650, 1590, 350, true),
    ], { color: "#000", gradient: "linear-gradient(180deg, rgba(0,174,243,.03), transparent 55%)" }),
  },
  {
    id: "blueprint",
    name: "Blueprint",
    category: "Graphic",
    description: "Technical-grid aesthetic inspired by plans and prototypes, with animated scanning accents.",
    tags: ["graphic", "animated", "maker"], animated: true,
    screen: screen("blueprint", "Blueprint", "Graphic", "Technical maker aesthetic", [
      badge("badge", 60, 60, "GOCREATE / 001"),
      clock("clock", 55, 180, 118),
      date("date", 60, 315, 510),
      status("status", 690, 190, 330),
      w({ id: "grid-label", type: "text", x: 60, y: 650, w: 650, h: 80, style: { fontSize: 23, color: "#79b8d8", letterSpacing: 7 }, config: { text: "PROTOTYPE FIELD / LIVE" } }),
      w({ id: "cross", type: "shape", x: 490, y: 815, w: 100, h: 100, opacity: .45, animation: "pulse", style: { background: "transparent", borderColor: "#00b7ff", borderWidth: 2, borderRadius: 999 }, config: { shape: "circle" } }),
      quote("quote", 60, 1330, 900, "MEASURE. MAKE. TEST. REPEAT.", "slideUp"),
      studios("studios", 60, 1510, 960),
    ], { color: "#00060a", gradient: "linear-gradient(rgba(0,174,243,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,174,243,.035) 1px, transparent 1px)", ambientGlow: true, noise: true }),
  },
  {
    id: "photo-feature",
    name: "Photo Feature",
    category: "Media",
    description: "A large photo window for member work, classes or event imagery, balanced by live mirror data.",
    tags: ["photo", "gallery", "media"],
    screen: screen("photo-feature", "Photo Feature", "Media", "Photo-forward screen", [
      logo("logo", 60, 55, 310, "white"),
      clock("clock", 590, 60, 100),
      w({ id: "photo", type: "image", x: 60, y: 340, w: 960, h: 670, style: { borderRadius: 30, borderColor: "rgba(255,255,255,.13)", borderWidth: 1 }, config: { imageSrc: "", objectFit: "cover" } }),
      w({ id: "caption", type: "text", x: 60, y: 1050, w: 800, h: 100, style: { fontSize: 31, color: "#bdd2df", letterSpacing: 2 }, config: { text: "FEATURED MAKER / ADD YOUR PHOTO" } }),
      quote("quote", 60, 1370, 760, "Put the work on the wall.", "fade"),
      weather("weather", 60, 1635, 350, true),
      status("status", 690, 1635, 330),
    ]),
  },
  {
    id: "metric-wall",
    name: "Metric Wall",
    category: "Information",
    description: "A flexible stats screen for member counts, hours, projects, events, fundraising or any custom metric.",
    tags: ["metrics", "stats"],
    screen: screen("metric-wall", "Metric Wall", "Information", "Metric screen", [
      logo("logo", 60, 60, 320),
      clock("clock", 600, 60, 100),
      w({ id: "m1", type: "metric", x: 70, y: 480, w: 410, h: 250, style: { fontSize: 104, fontWeight: 200 }, config: { metricLabel: "MEMBERS", metricValue: "128", metricSuffix: "" } }),
      w({ id: "m2", type: "metric", x: 600, y: 480, w: 410, h: 250, style: { fontSize: 104, fontWeight: 200 }, config: { metricLabel: "PROJECTS", metricValue: "42", metricSuffix: "" } }),
      w({ id: "m3", type: "metric", x: 70, y: 820, w: 410, h: 250, style: { fontSize: 104, fontWeight: 200 }, config: { metricLabel: "HOURS MADE", metricValue: "1,240", metricSuffix: "" } }),
      w({ id: "m4", type: "metric", x: 600, y: 820, w: 410, h: 250, style: { fontSize: 104, fontWeight: 200 }, config: { metricLabel: "EVENTS", metricValue: "16", metricSuffix: "" } }),
      quote("quote", 70, 1450, 850, "What gets measured gets made visible.", "fade"),
    ]),
  },
  {
    id: "co-brand",
    name: "GoCreate + WSU",
    category: "Brand",
    description: "A clean co-branded institutional layout for tours, partners and public-facing moments.",
    tags: ["wsu", "brand", "partners"],
    screen: screen("co-brand", "GoCreate + WSU", "Brand", "Co-branded institutional screen", [
      logo("logo", 60, 70, 350, "color"),
      w({ id: "wsu", type: "image", x: 650, y: 68, w: 360, h: 120, style: {}, config: { imageSrc: "/brand/wsu-white.svg", objectFit: "contain" } }),
      line("line", 60, 250, 950),
      clock("clock", 55, 330, 132),
      date("date", 60, 480, 540),
      status("status", 690, 365, 330),
      quote("quote", 60, 1420, 820, "A Koch Collaborative at Wichita State University.", "fade"),
      studios("studios", 60, 1620, 950),
    ]),
  },
  {
    id: "night-shift",
    name: "Night Shift",
    category: "Graphic",
    description: "Low-light cyan/yellow treatment with compact widgets and animated glow for evening use.",
    tags: ["night", "animated", "glow"], animated: true,
    screen: screen("night-shift", "Night Shift", "Graphic", "Low-light neon view", [
      logo("icon", 70, 75, 150, "icon", "glow"),
      clock("clock", 60, 300, 155),
      date("date", 70, 470, 520),
      w({ id: "weather", type: "temperature", x: 760, y: 325, w: 260, h: 150, animation: "fade", style: { fontSize: 100, color: "#b8eeff", textAlign: "right", glow: 12 }, config: {} }),
      w({ id: "open", type: "facilityStatus", x: 690, y: 500, w: 330, h: 120, style: { fontSize: 38, textAlign: "right", glow: 10 }, config: { variant: "compact" } }),
      quote("quote", 70, 1450, 800, "LATE IDEAS ARE STILL GOOD IDEAS.", "slideUp"),
      w({ id: "ticker", type: "marquee", x: 0, y: 1795, w: 1080, h: 75, style: { fontSize: 20, letterSpacing: 7, background: "rgba(0,174,243,.035)", borderColor: "rgba(0,174,243,.25)", borderWidth: 1 }, config: { tickerItems: ["GOCREATE", "OPEN STUDIO", "KEEP MAKING", "WICHITA"] } }),
    ], { color: "#000203", gradient: "radial-gradient(circle at 15% 20%, rgba(0,174,243,.08), transparent 32%), radial-gradient(circle at 85% 78%, rgba(255,212,0,.035), transparent 30%)", ambientGlow: true, noise: true }),
  },
  {
    id: "focus-clock",
    name: "Focus Clock",
    category: "Minimal",
    description: "A single huge clock with tiny supporting information for a nearly invisible interface.",
    tags: ["clock", "minimal", "reflection"],
    screen: screen("focus-clock", "Focus Clock", "Minimal", "Clock-centric minimal screen", [
      clock("clock", 95, 675, 205, "fade"),
      date("date", 270, 905, 540),
      weather("weather", 70, 1650, 320, true),
      status("status", 710, 1650, 300),
    ]),
  },
  {
    id: "morning-glow",
    name: "Morning Glow",
    category: "Daily",
    description: "A calm opening-hours dashboard with a warm sunrise accent, greeting, weather and a large readable clock.",
    tags: ["morning", "daily", "animated"], animated: true,
    screen: screen("morning-glow", "Morning Glow", "Daily", "Soft morning dashboard", [
      logo("logo", 58, 62, 320, "color", "fade"),
      w({ id: "greeting", type: "greeting", x: 58, y: 310, w: 760, h: 120, animation: "slideUp", style: { fontSize: 58, fontWeight: 280 }, config: {} }),
      clock("clock", 50, 465, 145),
      date("date", 60, 625, 560),
      weather("weather", 60, 1485, 410, false),
      status("status", 680, 1500, 340),
      quote("quote", 60, 1740, 900, "Start with an idea. Leave with something real.", "fade"),
      w({ id: "sun", type: "shape", x: 790, y: 245, w: 240, h: 240, opacity: .10, animation: "breathe", style: { background: "#ffd400", borderRadius: 999, glow: 35 }, config: { shape: "circle" } }),
    ], { color: "#000", gradient: "radial-gradient(circle at 88% 14%, rgba(255,212,0,.055), transparent 26%), radial-gradient(circle at 10% 78%, rgba(0,174,243,.045), transparent 28%)", ambientGlow: true }),
  },
  {
    id: "maker-zen",
    name: "Maker Zen",
    category: "Minimal",
    description: "Nearly invisible interface: breathing center icon, tiny time, weather and status anchored to the edges.",
    tags: ["minimal", "reflection", "animated"], animated: true,
    screen: screen("maker-zen", "Maker Zen", "Minimal", "Maximum-reflection ambient mode", [
      logo("icon", 430, 840, 220, "icon", "breathe"),
      clock("clock", 50, 80, 72),
      w({ id: "temp", type: "temperature", x: 830, y: 92, w: 190, h: 90, style: { fontSize: 66, fontWeight: 250, textAlign: "right", color: "#caeaff" }, config: {} }),
      w({ id: "net", type: "network", x: 60, y: 1790, w: 250, h: 48, style: { fontSize: 17, letterSpacing: 3, color: "#688da0" } }),
      w({ id: "state", type: "facilityStatus", x: 760, y: 1768, w: 260, h: 78, style: { fontSize: 26, textAlign: "right", letterSpacing: 3 }, config: { variant: "compact" } }),
    ]),
  },
  {
    id: "info-quadrants",
    name: "Info Quadrants",
    category: "Information",
    description: "Four clean information zones for time, weather, studios and upcoming events with a clear reflective center seam.",
    tags: ["information", "calendar", "studios"],
    screen: screen("info-quadrants", "Info Quadrants", "Information", "Four-zone information view", [
      logo("logo", 58, 55, 300, "white"),
      clock("clock", 55, 250, 112),
      date("date", 60, 375, 450),
      weather("weather", 625, 255, 395, false),
      w({ id: "agenda", type: "calendar", x: 60, y: 1260, w: 470, h: 470, style: { fontSize: 25, background: "rgba(4,12,18,.48)", borderColor: "rgba(0,174,243,.22)", borderWidth: 1, borderRadius: 24, padding: 24, backdropBlur: 12 }, config: { calendarTitle: "UP NEXT", maxItems: 4, calendarEvents: [] } }),
      w({ id: "studios", type: "studios", x: 585, y: 1270, w: 435, h: 440, style: { fontSize: 22, letterSpacing: 3 }, config: { variant: "stack" } }),
      line("midline", 540, 1225, 2, "rgba(89,189,236,.20)"),
      status("status", 60, 1765, 330),
    ]),
  },
  {
    id: "weather-ribbon",
    name: "Weather Ribbon",
    category: "Information",
    description: "A wide weather-and-time ribbon up top, leaving the rest of the glass almost completely reflective.",
    tags: ["weather", "reflection", "minimal"],
    screen: screen("weather-ribbon", "Weather Ribbon", "Information", "Top ribbon glance view", [
      w({ id: "bar", type: "shape", x: 25, y: 35, w: 1030, h: 300, opacity: .72, style: { background: "rgba(2,12,18,.78)", borderColor: "rgba(65,186,239,.20)", borderWidth: 1, borderRadius: 32, backdropBlur: 20 }, config: { shape: "rect" } }),
      clock("clock", 70, 95, 100),
      date("date", 75, 215, 430),
      weather("weather", 610, 90, 395, false),
      logo("icon", 455, 1660, 170, "icon", "float"),
      quote("quote", 190, 1840, 700, "MAKE HERE.", "fade"),
    ]),
  },
  {
    id: "workshop-schedule",
    name: "Workshop Schedule",
    category: "Productivity",
    description: "An agenda-heavy layout for class days, tours, workshops and public programming.",
    tags: ["calendar", "classes", "schedule"],
    screen: screen("workshop-schedule", "Workshop Schedule", "Productivity", "Schedule-first screen", [
      logo("logo", 55, 60, 310, "color"),
      clock("clock", 575, 60, 100),
      date("date", 580, 180, 440),
      w({ id: "title", type: "text", x: 60, y: 390, w: 900, h: 100, style: { fontSize: 47, fontWeight: 300, letterSpacing: 4 }, config: { text: "TODAY AT GOCREATE" } }),
      w({ id: "calendar", type: "calendar", x: 60, y: 520, w: 960, h: 850, style: { fontSize: 32, background: "rgba(5,14,22,.54)", borderColor: "rgba(70,183,239,.30)", borderWidth: 1, borderRadius: 28, padding: 34, backdropBlur: 16 }, config: { calendarTitle: "SCHEDULE", maxItems: 8, calendarEvents: [] } }),
      status("status", 60, 1540, 320),
      weather("weather", 655, 1535, 365, true),
      w({ id: "ticker", type: "marquee", x: 0, y: 1810, w: 1080, h: 72, style: { fontSize: 19, letterSpacing: 6, background: "rgba(0,174,243,.025)", borderColor: "rgba(0,174,243,.18)", borderWidth: 1 }, config: { tickerItems: ["CHECK IN", "MAKE SAFELY", "ASK QUESTIONS", "HAVE FUN"] } }),
    ]),
  },
  {
    id: "celebration-mode",
    name: "Celebration Mode",
    category: "Events",
    description: "Bold animated screen for launches, wins, open houses and showcase nights.",
    tags: ["animated", "events", "celebration"], animated: true,
    screen: screen("celebration-mode", "Celebration Mode", "Events", "Celebration animation mode", [
      logo("icon", 420, 205, 240, "icon", "pulse"),
      w({ id: "headline", type: "text", x: 90, y: 620, w: 900, h: 310, animation: "slideUp", style: { fontSize: 96, fontWeight: 280, textAlign: "center", lineHeight: 1.0, glow: 14 }, config: { text: "WE MADE\nSOMETHING" } }),
      w({ id: "sub", type: "text", x: 150, y: 985, w: 780, h: 100, animation: "fade", style: { fontSize: 27, textAlign: "center", color: "#b5d8ea", letterSpacing: 6 }, config: { text: "CELEBRATE THE WORK" } }),
      w({ id: "orb1", type: "shape", x: 30, y: 460, w: 170, h: 170, opacity: .16, animation: "drift", style: { background: "#00aef3", borderRadius: 999, glow: 25 }, config: { shape: "circle" } }),
      w({ id: "orb2", type: "shape", x: 860, y: 1080, w: 150, h: 150, opacity: .14, animation: "drift", style: { background: "#ffd400", borderRadius: 999, glow: 25 }, config: { shape: "circle" } }),
      clock("clock", 330, 1330, 88),
      w({ id: "ticker", type: "marquee", x: 0, y: 1790, w: 1080, h: 82, style: { fontSize: 22, letterSpacing: 7, background: "rgba(255,212,0,.035)", borderColor: "rgba(255,212,0,.24)", borderWidth: 1 }, config: { tickerItems: ["BUILD", "SHIP", "SHOW", "CELEBRATE", "REPEAT"] } }),
    ], { color: "#000", gradient: "radial-gradient(circle at 20% 28%, rgba(0,174,243,.08), transparent 25%), radial-gradient(circle at 80% 62%, rgba(255,212,0,.055), transparent 24%)", ambientGlow: true }),
  },
  {
    id: "blackout-icon",
    name: "Blackout Icon",
    category: "Minimal",
    description: "A pure-black mirror with only a tiny centered GoCreate icon and discreet time — ideal when reflection is the priority.",
    tags: ["reflection", "icon", "ultra-minimal"],
    screen: screen("blackout-icon", "Blackout Icon", "Minimal", "Ultra-minimal icon view", [
      logo("icon", 460, 870, 160, "icon", "fade"),
      clock("clock", 440, 1060, 54),
      w({ id: "status", type: "facilityStatus", x: 390, y: 1780, w: 300, h: 70, opacity: .65, style: { fontSize: 24, textAlign: "center", letterSpacing: 4 }, config: { variant: "compact" } }),
    ]),
  },
  {
    id: "cyber-grid",
    name: "Cyber Grid",
    category: "Graphic",
    description: "A futuristic animated grid for demos, tech nights and high-energy maker events.",
    tags: ["graphic", "animated", "tech"], animated: true,
    screen: screen("cyber-grid", "Cyber Grid", "Graphic", "Futuristic grid mode", [
      badge("mode", 60, 55, "SYSTEM / ONLINE"),
      clock("clock", 50, 180, 128, "shimmer"),
      date("date", 60, 325, 500),
      w({ id: "temp", type: "temperature", x: 760, y: 190, w: 260, h: 130, style: { fontSize: 92, color: "#75ddff", textAlign: "right", glow: 10 }, config: {} }),
      w({ id: "meter", type: "dayProgress", x: 60, y: 520, w: 520, h: 90, animation: "fade", style: { fontSize: 20 }, config: { text: "DAY CYCLE" } }),
      w({ id: "week", type: "weekNumber", x: 760, y: 520, w: 260, h: 100, style: { fontSize: 48, textAlign: "right" }, config: {} }),
      logo("icon", 405, 800, 270, "icon", "float"),
      quote("quote", 80, 1280, 900, "DESIGN // FABRICATE // ITERATE", "slideUp"),
      studios("studios", 60, 1490, 960),
    ], { color: "#000408", gradient: "linear-gradient(rgba(0,174,243,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,174,243,.035) 1px, transparent 1px)", ambientGlow: true, noise: true }),
  },
  {
    id: "gallery-duo",
    name: "Gallery Duo",
    category: "Media",
    description: "Two photo windows for before/after work, paired projects, event highlights or member spotlights.",
    tags: ["photo", "gallery", "media"],
    screen: screen("gallery-duo", "Gallery Duo", "Media", "Two-image gallery screen", [
      logo("logo", 55, 55, 300, "white"),
      clock("clock", 595, 55, 98),
      w({ id: "photo-a", type: "image", x: 60, y: 330, w: 460, h: 680, style: { borderRadius: 26, borderColor: "rgba(255,255,255,.12)", borderWidth: 1 }, config: { imageSrc: "", objectFit: "cover" } }),
      w({ id: "photo-b", type: "image", x: 560, y: 330, w: 460, h: 680, style: { borderRadius: 26, borderColor: "rgba(255,255,255,.12)", borderWidth: 1 }, config: { imageSrc: "", objectFit: "cover" } }),
      w({ id: "caption-a", type: "text", x: 60, y: 1040, w: 460, h: 75, style: { fontSize: 23, color: "#9fc2d5", letterSpacing: 4 }, config: { text: "PROJECT A" } }),
      w({ id: "caption-b", type: "text", x: 560, y: 1040, w: 460, h: 75, style: { fontSize: 23, color: "#9fc2d5", letterSpacing: 4 }, config: { text: "PROJECT B" } }),
      quote("quote", 60, 1400, 760, "Show the process. Show the result.", "fade"),
      status("status", 60, 1650, 330),
      weather("weather", 650, 1640, 370, true),
    ]),
  },
  {
    id: "safety-notice",
    name: "Safety Notice",
    category: "Events",
    description: "A high-contrast editable notice screen for closures, safety reminders, maintenance or important directions.",
    tags: ["notice", "safety", "announcement"],
    screen: screen("safety-notice", "Safety Notice", "Events", "High-priority notice mode", [
      badge("badge", 400, 90, "IMPORTANT NOTICE", "#ffd400"),
      w({ id: "headline", type: "text", x: 90, y: 500, w: 900, h: 350, style: { fontSize: 88, fontWeight: 320, textAlign: "center", color: "#fff6c9", lineHeight: 1.03 }, config: { text: "PLEASE READ\nBEFORE ENTERING" } }),
      w({ id: "body", type: "text", x: 160, y: 930, w: 760, h: 280, style: { fontSize: 31, textAlign: "center", color: "#c8d9e2", lineHeight: 1.45 }, config: { text: "Edit this screen with today's safety message, closure information, maintenance notice, or visitor directions." } }),
      line("line", 240, 1280, 600, "rgba(255,212,0,.55)"),
      clock("clock", 325, 1410, 92),
      logo("logo", 360, 1660, 360, "white"),
    ], { color: "#030300", gradient: "radial-gradient(circle at 50% 48%, rgba(255,212,0,.04), transparent 36%)" }),
  },
  {
    id: "workshop-timer",
    name: "Workshop Timer",
    category: "Productivity",
    description: "A large event countdown paired with the current time for timed workshops, demos and build sessions.",
    tags: ["countdown", "timer", "workshop"],
    screen: screen("workshop-timer", "Workshop Timer", "Productivity", "Workshop countdown mode", [
      logo("logo", 60, 60, 300, "white"),
      status("status", 710, 72, 310),
      w({ id: "label", type: "text", x: 100, y: 455, w: 880, h: 100, style: { fontSize: 28, textAlign: "center", letterSpacing: 8, color: "#81b7d0" }, config: { text: "SESSION ENDS IN" } }),
      w({ id: "countdown", type: "countdown", x: 90, y: 600, w: 900, h: 300, animation: "pulse", style: { fontSize: 82, textAlign: "center", fontWeight: 250 }, config: { countdownLabel: "BUILD SESSION", countdownTo: "2026-12-01T18:00:00-06:00" } }),
      clock("clock", 295, 1150, 118),
      date("date", 270, 1295, 540),
      quote("quote", 170, 1600, 740, "Use the time. Make the thing.", "fade"),
    ]),
  },
  {
    id: "left-stack",
    name: "Left Stack",
    category: "Reflection",
    description: "All useful information lives in one narrow left column, preserving the entire right side as uninterrupted mirror.",
    tags: ["reflection", "minimal", "rail"],
    screen: screen("left-stack", "Left Stack", "Reflection", "Single-edge information rail", [
      logo("logo", 42, 55, 290, "color"),
      clock("clock", 38, 245, 105),
      date("date", 45, 365, 440),
      weather("weather", 42, 560, 360, true),
      status("status", 42, 760, 300),
      line("line", 42, 930, 410),
      w({ id: "calendar", type: "calendar", x: 42, y: 1000, w: 440, h: 520, style: { fontSize: 24, background: "rgba(0,0,0,.18)", padding: 0 }, config: { calendarTitle: "UP NEXT", maxItems: 4, calendarEvents: [] } }),
      quote("quote", 42, 1615, 480, "Keep making.", "fade"),
    ]),
  },
  {
    id: "announcement",
    name: "Announcement",
    category: "Events",
    description: "Big editable message and ticker for closures, announcements, classes or event directions.",
    tags: ["announcement", "events", "text"],
    screen: screen("announcement", "Announcement", "Events", "Large announcement screen", [
      logo("logo", 60, 70, 320, "white"),
      badge("badge", 760, 82, "ANNOUNCEMENT", "#ffd400"),
      w({ id: "headline", type: "text", x: 85, y: 560, w: 910, h: 390, animation: "slideUp", style: { fontSize: 92, fontWeight: 250, textAlign: "center", lineHeight: 1.02 }, config: { text: "MAKE SOMETHING\nREMARKABLE" } }),
      w({ id: "body", type: "text", x: 160, y: 1030, w: 760, h: 220, style: { fontSize: 30, color: "#a9c7d8", textAlign: "center", lineHeight: 1.45 }, config: { text: "Use the editor to replace this with an event notice, class direction, closure message, welcome note, or anything else." } }),
      w({ id: "ticker", type: "marquee", x: 0, y: 1790, w: 1080, h: 80, style: { fontSize: 21, letterSpacing: 6, background: "rgba(255,212,0,.04)", borderColor: "rgba(255,212,0,.28)", borderWidth: 1 }, config: { tickerItems: ["GOCREATE", "A KOCH COLLABORATIVE", "YOU CAN MAKE IT HERE"] } }),
    ]),
  },
  {
    id: "ai-halo",
    name: "Go AI Halo",
    category: "AI + Hardware",
    description: "A voice-first mirror screen with a quiet central brand halo and live assistant/camera readiness.",
    tags: ["ai", "voice", "animated", "minimal"],
    animated: true,
    screen: screen("ai-halo", "Go AI Halo", "AI + Hardware", "Voice-first maker assistant", [
      logo("icon", 402, 630, 276, "icon", "breathe"),
      clock("clock", 60, 72, 116),
      date("date", 65, 205, 500),
      w({ id: "ai", type: "assistantStatus", x: 70, y: 1660, w: 380, h: 70, style: { fontSize: 22, letterSpacing: 3, color: "#8edcff" }, config: { text: "HEY GO" } }),
      w({ id: "presence", type: "presence", x: 625, y: 1660, w: 380, h: 70, style: { fontSize: 22, textAlign: "right", letterSpacing: 3, color: "#9fb6c5" } }),
      w({ id: "camera", type: "cameraStatus", x: 625, y: 1740, w: 380, h: 70, style: { fontSize: 18, textAlign: "right", letterSpacing: 3, color: "#758f9f" } }),
      quote("prompt", 180, 1080, 720, "Say “Hey Go” and ask me anything.", "fade"),
    ], { color: "#000000", ambientGlow: true, noise: true }),
  },
  {
    id: "sensor-lab",
    name: "Sensor Lab",
    category: "AI + Hardware",
    description: "A diagnostic-style screen for testing the distance sensor, Pi Camera, connectivity and AI service.",
    tags: ["sensor", "camera", "diagnostic", "hardware"],
    screen: screen("sensor-lab", "Sensor Lab", "AI + Hardware", "Live hardware diagnostics", [
      logo("logo", 60, 70, 330),
      w({ id: "title", type: "text", x: 60, y: 250, w: 800, h: 100, style: { fontSize: 55, fontWeight: 300, letterSpacing: 2 }, config: { text: "MIRROR SENSOR LAB" } }),
      w({ id: "distance", type: "distance", x: 60, y: 470, w: 430, h: 160, style: { fontSize: 76, color: "#ffffff" }, config: { text: "DISTANCE" } }),
      w({ id: "presence", type: "presence", x: 590, y: 500, w: 400, h: 90, style: { fontSize: 24, letterSpacing: 3 } }),
      w({ id: "camera", type: "cameraStatus", x: 60, y: 720, w: 430, h: 90, style: { fontSize: 24, letterSpacing: 3 } }),
      w({ id: "ai", type: "assistantStatus", x: 590, y: 720, w: 400, h: 90, style: { fontSize: 24, letterSpacing: 3 } }),
      w({ id: "net", type: "network", x: 60, y: 930, w: 430, h: 90, style: { fontSize: 24, letterSpacing: 3 } }),
      weather("weather", 590, 900, 390, true),
      line("line", 60, 1210, 920),
      quote("note", 60, 1280, 900, "Presence wakes the mirror. Camera vision only activates when you explicitly ask Go to look.", "slideUp"),
    ], { color: "#000000", ambientGlow: true, noise: true }),
  },
  {
    id: "voice-welcome",
    name: "Voice Welcome",
    category: "AI + Hardware",
    description: "An approachable entrance screen that invites visitors to interact with Go by voice.",
    tags: ["welcome", "voice", "visitor", "animated"],
    animated: true,
    screen: screen("voice-welcome", "Voice Welcome", "AI + Hardware", "Voice-enabled visitor welcome", [
      logo("logo", 245, 110, 590, "color", "fade"),
      w({ id: "welcome", type: "text", x: 100, y: 440, w: 880, h: 230, style: { fontSize: 78, fontWeight: 300, textAlign: "center", lineHeight: 1.08 }, config: { text: "Welcome to GoCreate." } }),
      w({ id: "prompt", type: "text", x: 130, y: 740, w: 820, h: 190, animation: "breathe", style: { fontSize: 42, fontWeight: 300, textAlign: "center", color: "#89dcff", lineHeight: 1.3 }, config: { text: "Say “Hey Go”\nand ask a question." } }),
      w({ id: "presence", type: "presence", x: 330, y: 1050, w: 420, h: 70, style: { fontSize: 20, textAlign: "center", letterSpacing: 3 } }),
      studios("studios", 90, 1480, 900),
    ], { color: "#000000", ambientGlow: true, noise: true }),
  },
  {
    id: "vision-bench",
    name: "Vision Bench",
    category: "AI + Hardware",
    description: "A maker-help screen for holding a component or project up to the camera and asking Go about it.",
    tags: ["camera", "vision", "maker", "help"],
    screen: screen("vision-bench", "Vision Bench", "AI + Hardware", "On-demand maker vision", [
      logo("icon", 65, 70, 180, "icon", "fade"),
      w({ id: "title", type: "text", x: 300, y: 75, w: 700, h: 120, style: { fontSize: 48, fontWeight: 300, textAlign: "right" }, config: { text: "SHOW GO WHAT YOU'RE MAKING" } }),
      w({ id: "instructions", type: "text", x: 120, y: 590, w: 840, h: 320, style: { fontSize: 46, fontWeight: 300, textAlign: "center", lineHeight: 1.35, color: "#d9edf8" }, config: { text: "Hold the object in front of the camera.\n\nSay: “Hey Go, look at this. What is it?”" } }),
      w({ id: "camera", type: "cameraStatus", x: 340, y: 1060, w: 400, h: 85, style: { fontSize: 22, textAlign: "center", letterSpacing: 3 } }),
      w({ id: "ai", type: "assistantStatus", x: 340, y: 1160, w: 400, h: 85, style: { fontSize: 22, textAlign: "center", letterSpacing: 3 } }),
      w({ id: "privacy", type: "badge", x: 260, y: 1370, w: 560, h: 70, style: { fontSize: 17, textAlign: "center", letterSpacing: 2, color: "#ffd400", borderColor: "rgba(255,212,0,.42)", borderWidth: 1, borderRadius: 99, padding: 20 }, config: { text: "CAMERA ONLY CAPTURES WHEN ASKED" } }),
    ], { color: "#000000", ambientGlow: true, noise: true }),
  },
];

export const DEFAULT_TEMPLATE_ID = "team-pulse";

export function getTemplate(id: string) {
  return TEMPLATE_LIBRARY.find((template) => template.id === id) || null;
}

export function getDefaultScreen() {
  return getTemplate(DEFAULT_TEMPLATE_ID)!.screen;
}
