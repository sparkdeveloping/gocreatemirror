export const TEAM_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export type TeamDay = (typeof TEAM_DAYS)[number];

export type ShiftSegment = {
  start: string; // 24-hour HH:MM
  end: string;   // 24-hour HH:MM
  label?: "Opening" | "Mid" | "Closing" | "Split" | string;
};

export type TeamMember = {
  id: string;
  name: string;
  active?: boolean;
  shifts: Record<TeamDay, ShiftSegment[]>;
};

export type TeamSchedule = {
  title: string;
  timezone: string;
  sourceNote?: string;
  updatedAt: string;
  members: TeamMember[];
};

const OFF: ShiftSegment[] = [];
const s = (start: string, end: string, label?: ShiftSegment["label"]): ShiftSegment => ({ start, end, label });
const shifts = (input: Partial<Record<TeamDay, ShiftSegment[]>>): Record<TeamDay, ShiftSegment[]> => ({
  monday: input.monday || OFF,
  tuesday: input.tuesday || OFF,
  wednesday: input.wednesday || OFF,
  thursday: input.thursday || OFF,
  friday: input.friday || OFF,
  saturday: input.saturday || OFF,
  sunday: input.sunday || OFF,
});

// Seeded from the weekly team schedule photo supplied for GoCreate on 2026-09-15.
// It is intentionally editable from /admin → Team Schedule and repeats weekly until changed.
export const DEFAULT_TEAM_SCHEDULE: TeamSchedule = {
  title: "GoCreate — Weekly Team Schedule",
  timezone: "America/Chicago",
  sourceNote: "Seeded from the posted GoCreate weekly team schedule. Update in Admin whenever staffing changes.",
  updatedAt: new Date(0).toISOString(),
  members: [
    { id: "breanna", name: "Breanna", active: true, shifts: shifts({
      tuesday: [s("08:45", "17:00", "Opening")], wednesday: [s("08:45", "17:00", "Opening")], thursday: [s("08:45", "17:00", "Opening")], friday: [s("08:45", "17:00", "Opening")],
    }) },
    { id: "jake-t", name: "Jake T", active: true, shifts: shifts({
      tuesday: [s("08:45", "17:00", "Opening")], thursday: [s("08:45", "17:00", "Opening")], friday: [s("08:45", "17:00", "Opening")], saturday: [s("08:45", "17:00", "Opening")],
    }) },
    { id: "nomi", name: "Nomi", active: true, shifts: shifts({
      tuesday: [s("09:00", "18:00", "Opening")], wednesday: [s("11:00", "14:00", "Mid")], thursday: [s("09:00", "17:00", "Opening")],
    }) },
    { id: "denzel", name: "Denzel", active: true, shifts: shifts({
      monday: [s("09:30", "13:30", "Split"), s("15:30", "18:00", "Split")],
      tuesday: [s("11:00", "13:30", "Split"), s("15:30", "17:00", "Split")],
      friday: [s("09:00", "12:00", "Opening")],
    }) },
    { id: "tain", name: "Tain", active: true, shifts: shifts({
      tuesday: [s("10:00", "12:30", "Split"), s("15:30", "18:00", "Split")],
      wednesday: [s("10:00", "16:00", "Mid")],
      thursday: [s("10:00", "12:00", "Split"), s("15:30", "18:00", "Split")],
      friday: [s("10:00", "14:30", "Mid")],
    }) },
    { id: "camden", name: "Camden", active: true, shifts: shifts({
      tuesday: [s("13:00", "18:00", "Mid")], wednesday: [s("13:00", "18:00", "Mid")], friday: [s("13:00", "18:00", "Mid")], saturday: [s("16:00", "21:00", "Closing")],
    }) },
    { id: "kim", name: "Kim", active: true, shifts: shifts({
      tuesday: [s("09:30", "12:15", "Split"), s("14:00", "21:00", "Split")],
      thursday: [s("09:30", "12:15", "Split"), s("14:00", "21:00", "Split")],
    }) },
    { id: "anneth", name: "Anneth", active: true, shifts: shifts({
      tuesday: [s("11:00", "15:00", "Mid")], thursday: [s("18:00", "21:00", "Closing")], sunday: [s("14:00", "18:00", "Mid")],
    }) },
    { id: "gracie", name: "Gracie", active: true, shifts: shifts({
      tuesday: [s("11:00", "19:00", "Mid")], thursday: [s("11:00", "19:00", "Mid")], saturday: [s("17:00", "21:00", "Closing")],
    }) },
    { id: "dontae", name: "Dontae", active: true, shifts: shifts({
      friday: [s("17:00", "21:00", "Closing")], saturday: [s("13:00", "21:00", "Closing")], sunday: [s("12:45", "18:00", "Closing")],
    }) },
    { id: "saniya", name: "Saniya", active: true, shifts: shifts({
      tuesday: [s("13:00", "19:00", "Mid")], wednesday: [s("13:00", "19:00", "Mid")], friday: [s("09:00", "15:00", "Opening")], saturday: [s("09:00", "14:00", "Opening")],
    }) },
    { id: "clarence", name: "Clarence", active: true, shifts: shifts({
      tuesday: [s("14:00", "18:00", "Closing")], wednesday: [s("11:00", "17:30", "Mid")], thursday: [s("14:00", "18:00", "Mid")], friday: [s("16:00", "21:00", "Closing")],
    }) },
    { id: "amish", name: "Amish", active: true, shifts: shifts({
      tuesday: [s("16:00", "21:00", "Closing")], wednesday: [s("17:00", "21:00", "Closing")], thursday: [s("16:00", "21:00", "Closing")], saturday: [s("08:45", "14:00", "Opening")],
    }) },
    { id: "asia", name: "Asia", active: true, shifts: shifts({
      wednesday: [s("13:00", "21:00", "Closing")], thursday: [s("14:00", "21:00", "Closing")], sunday: [s("13:00", "18:00", "Opening")],
    }) },
    { id: "sully", name: "Sully", active: true, shifts: shifts({
      saturday: [s("08:45", "17:00", "Opening")], sunday: [s("12:45", "18:00", "Opening")],
    }) },
    { id: "bright", name: "Bright", active: true, shifts: shifts({
      wednesday: [s("17:00", "21:00", "Closing")], friday: [s("13:00", "21:00", "Closing")], saturday: [s("14:00", "21:00", "Closing")],
    }) },
  ],
};

export type ActiveShift = {
  member: TeamMember;
  segment: ShiftSegment;
  day: TeamDay;
};

function minutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function dayForDate(now: Date, timezone: string): TeamDay {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "long" }).format(now).toLowerCase();
  return (TEAM_DAYS.includes(weekday as TeamDay) ? weekday : "monday") as TeamDay;
}

export function localMinutes(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
  return hour * 60 + minute;
}

export function peopleInNow(schedule: TeamSchedule, now: Date): ActiveShift[] {
  const day = dayForDate(now, schedule.timezone);
  const current = localMinutes(now, schedule.timezone);
  const result: ActiveShift[] = [];
  for (const member of schedule.members.filter((item) => item.active !== false)) {
    for (const segment of member.shifts[day] || []) {
      if (current >= minutes(segment.start) && current < minutes(segment.end)) result.push({ member, segment, day });
    }
  }
  return result.sort((a, b) => minutes(a.segment.end) - minutes(b.segment.end));
}

export function upcomingToday(schedule: TeamSchedule, now: Date): ActiveShift[] {
  const day = dayForDate(now, schedule.timezone);
  const current = localMinutes(now, schedule.timezone);
  const result: ActiveShift[] = [];
  for (const member of schedule.members.filter((item) => item.active !== false)) {
    for (const segment of member.shifts[day] || []) {
      if (minutes(segment.start) > current) result.push({ member, segment, day });
    }
  }
  return result.sort((a, b) => minutes(a.segment.start) - minutes(b.segment.start));
}

export function scheduledToday(schedule: TeamSchedule, now: Date) {
  const day = dayForDate(now, schedule.timezone);
  return schedule.members
    .filter((member) => member.active !== false && (member.shifts[day] || []).length)
    .map((member) => ({ member, segments: member.shifts[day], day }))
    .sort((a, b) => minutes(a.segments[0].start) - minutes(b.segments[0].start));
}

export function formatTime12(value: string) {
  const [hRaw, mRaw] = value.split(":").map(Number);
  const h = hRaw % 12 || 12;
  const suffix = hRaw >= 12 ? "PM" : "AM";
  return `${h}:${String(mRaw || 0).padStart(2, "0")} ${suffix}`;
}

export function formatShift(segment: ShiftSegment, compact = false) {
  const start = formatTime12(segment.start);
  const end = formatTime12(segment.end);
  const range = compact ? `${start.replace(":00", "")}–${end.replace(":00", "")}` : `${start}–${end}`;
  return segment.label ? `${range} · ${segment.label}` : range;
}

export function weeklyHours(member: TeamMember) {
  let total = 0;
  for (const day of TEAM_DAYS) for (const segment of member.shifts[day] || []) total += Math.max(0, minutes(segment.end) - minutes(segment.start));
  return Math.round((total / 60) * 100) / 100;
}

function to24Hour(hour: number, minute: number, suffix: string) {
  let h = hour % 12;
  if (suffix.toUpperCase() === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseScheduleCell(value: string): ShiftSegment[] {
  const input = value.trim();
  if (!input || /^off$/i.test(input)) return [];
  const labelMatch = input.match(/\b(Opening|Mid|Closing|Split)\b/i);
  const label = labelMatch ? (labelMatch[1][0].toUpperCase() + labelMatch[1].slice(1).toLowerCase()) as ShiftSegment["label"] : undefined;
  const re = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/gi;
  const segments: ShiftSegment[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(input))) {
    segments.push({
      start: to24Hour(Number(match[1]), Number(match[2] || 0), match[3]),
      end: to24Hour(Number(match[4]), Number(match[5] || 0), match[6]),
      label,
    });
  }
  return segments;
}

export function formatScheduleCell(segments: ShiftSegment[]) {
  if (!segments.length) return "OFF";
  const label = segments[0]?.label ? ` ${segments[0].label}` : "";
  return `${segments.map((segment) => `${formatTime12(segment.start)}-${formatTime12(segment.end)}`).join(" / ")}${label}`;
}

export function cloneTeamSchedule(schedule: TeamSchedule): TeamSchedule {
  return JSON.parse(JSON.stringify(schedule)) as TeamSchedule;
}

export function isTeamSchedule(input: unknown): input is TeamSchedule {
  if (!input || typeof input !== "object") return false;
  const candidate = input as Partial<TeamSchedule>;
  if (!Array.isArray(candidate.members) || typeof candidate.timezone !== "string") return false;
  return candidate.members.every((member) => {
    if (!member || typeof member !== "object") return false;
    const item = member as Partial<TeamMember>;
    return typeof item.id === "string" && typeof item.name === "string" && Boolean(item.shifts) && TEAM_DAYS.every((day) => Array.isArray((item.shifts as Record<string, unknown[]>)[day]));
  });
}
