export type FacilityStatus = {
  isOpen: boolean;
  label: string;
  detail: string;
  hoursToday: string;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

type Window = { open: number; close: number } | null;

const HOURS: Record<(typeof DAYS)[number], Window> = {
  Sunday: { open: 13 * 60, close: 18 * 60 },
  Monday: null,
  Tuesday: { open: 9 * 60, close: 21 * 60 },
  Wednesday: { open: 9 * 60, close: 21 * 60 },
  Thursday: { open: 9 * 60, close: 21 * 60 },
  Friday: { open: 9 * 60, close: 21 * 60 },
  Saturday: { open: 9 * 60, close: 21 * 60 },
};

function partsFor(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";

  const weekday = get("weekday") as (typeof DAYS)[number];
  return {
    weekday,
    dayIndex: DAYS.indexOf(weekday),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function formatHour(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 || 12;
  return `${twelve} ${suffix}`;
}

function nextOpening(dayIndex: number, minutes: number) {
  for (let offset = 0; offset < 8; offset += 1) {
    const index = (dayIndex + offset) % 7;
    const day = DAYS[index];
    const window = HOURS[day];
    if (!window) continue;
    if (offset === 0 && minutes >= window.open) continue;
    const dayLabel = offset === 0 ? "TODAY" : offset === 1 ? "TOMORROW" : day.slice(0, 3).toUpperCase();
    return `${dayLabel} ${formatHour(window.open)}`;
  }
  return "SOON";
}

export function getFacilityStatus(date: Date, timeZone: string): FacilityStatus {
  const { weekday, dayIndex, minutes } = partsFor(date, timeZone);
  const window = HOURS[weekday];

  if (!window) {
    return {
      isOpen: false,
      label: "CLOSED",
      detail: `OPENS ${nextOpening(dayIndex, minutes)}`,
      hoursToday: "MONDAY · CLOSED",
    };
  }

  if (minutes >= window.open && minutes < window.close) {
    return {
      isOpen: true,
      label: "OPEN",
      detail: `UNTIL ${formatHour(window.close)}`,
      hoursToday: `${weekday.toUpperCase()} · ${formatHour(window.open)}–${formatHour(window.close)}`,
    };
  }

  return {
    isOpen: false,
    label: "CLOSED",
    detail: `OPENS ${nextOpening(dayIndex, minutes)}`,
    hoursToday: `${weekday.toUpperCase()} · ${formatHour(window.open)}–${formatHour(window.close)}`,
  };
}
