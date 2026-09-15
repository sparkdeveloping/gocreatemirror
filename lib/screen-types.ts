export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;

export const WIDGET_TYPES = [
  "text",
  "clock",
  "date",
  "weather",
  "temperature",
  "facilityStatus",
  "logo",
  "image",
  "calendar",
  "quote",
  "studios",
  "divider",
  "shape",
  "marquee",
  "countdown",
  "greeting",
  "network",
  "iframe",
  "metric",
  "badge",
  "wind",
  "feelsLike",
  "dayProgress",
  "weekNumber",
  "video",
  "list",
  "progress",
  "distance",
  "presence",
  "assistantStatus",
  "cameraStatus",
  "teamNow",
  "teamNext",
  "teamToday",
  "teamWeek",
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];
export type WidgetAnimation =
  | "none"
  | "fade"
  | "float"
  | "pulse"
  | "glow"
  | "breathe"
  | "slideUp"
  | "slideLeft"
  | "shimmer"
  | "drift";

export type TextAlign = "left" | "center" | "right";
export type ObjectFit = "cover" | "contain" | "fill";

export type CalendarEvent = {
  title: string;
  start: string;
  end?: string;
  location?: string;
};

export type WidgetConfig = {
  text?: string;
  subtext?: string;
  format?: "12h" | "24h" | "short" | "long";
  variant?: string;
  logoVariant?: "icon" | "color" | "white";
  imageSrc?: string;
  objectFit?: ObjectFit;
  calendarUrl?: string;
  calendarTitle?: string;
  calendarEvents?: CalendarEvent[];
  maxItems?: number;
  countdownTo?: string;
  countdownLabel?: string;
  tickerItems?: string[];
  metricLabel?: string;
  metricValue?: string;
  metricSuffix?: string;
  url?: string;
  shape?: "rect" | "circle" | "pill" | "line";
  showHighLow?: boolean;
  showCondition?: boolean;
  showLocation?: boolean;
  scheduleTitle?: string;
  scheduleMaxItems?: number;
  scheduleShowTimes?: boolean;
  scheduleShowLabels?: boolean;
};

export type WidgetStyle = {
  color?: string;
  background?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: number;
  lineHeight?: number;
  textAlign?: TextAlign;
  padding?: number;
  shadow?: string;
  glow?: number;
  backdropBlur?: number;
};

export type ScreenWidget = {
  id: string;
  type: WidgetType;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  scale: number;
  opacity: number;
  z: number;
  locked?: boolean;
  animation?: WidgetAnimation;
  style: WidgetStyle;
  config: WidgetConfig;
};

export type ScreenBackground = {
  color: string;
  gradient?: string;
  imageSrc?: string;
  imageOpacity?: number;
  ambientGlow?: boolean;
  noise?: boolean;
};

export type ScreenDefinition = {
  id: string;
  name: string;
  description: string;
  category: string;
  width: number;
  height: number;
  background: ScreenBackground;
  widgets: ScreenWidget[];
  createdAt?: string;
  updatedAt?: string;
};

export type MirrorSelectionKind = "template" | "custom" | "live";

export type MirrorState = {
  selected: {
    kind: MirrorSelectionKind;
    id: string;
    name: string;
  };
  screen: ScreenDefinition;
  updatedAt: string;
  revision: number;
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function makeId(prefix = "widget") {
  const random = Math.random().toString(36).slice(2, 9);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function cloneScreen(screen: ScreenDefinition): ScreenDefinition {
  return JSON.parse(JSON.stringify(screen)) as ScreenDefinition;
}

export function isScreenDefinition(input: unknown): input is ScreenDefinition {
  if (!input || typeof input !== "object") return false;
  const screen = input as Partial<ScreenDefinition>;
  return (
    typeof screen.id === "string" &&
    typeof screen.name === "string" &&
    screen.width === CANVAS_WIDTH &&
    screen.height === CANVAS_HEIGHT &&
    Boolean(screen.background) &&
    Array.isArray(screen.widgets) &&
    screen.widgets.every((widget) => {
      if (!widget || typeof widget !== "object") return false;
      const candidate = widget as Partial<ScreenWidget>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.type === "string" &&
        (WIDGET_TYPES as readonly string[]).includes(candidate.type) &&
        typeof candidate.x === "number" &&
        typeof candidate.y === "number" &&
        typeof candidate.w === "number" &&
        typeof candidate.h === "number"
      );
    })
  );
}
