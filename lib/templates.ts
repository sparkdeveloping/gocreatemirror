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
  w({ id, type: "logo", x, y, w: width, h: variant === "icon" ? width : Math.round(width * .29), animation, style: { glow: variant === "icon" ? 20 : 10 }, config: { logoVariant: variant } });
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
    description: "Only the GoCreate icon, perfectly centered, with a soft breathing glow.",
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
];

export const DEFAULT_TEMPLATE_ID = "signature-v3";

export function getTemplate(id: string) {
  return TEMPLATE_LIBRARY.find((template) => template.id === id) || null;
}

export function getDefaultScreen() {
  return getTemplate(DEFAULT_TEMPLATE_ID)!.screen;
}
