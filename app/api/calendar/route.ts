import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type IcsEvent = { title: string; start: string; end?: string; location?: string };

function unfold(text: string) {
  return text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

function decodeText(value: string) {
  return value.replace(/\\n/gi, " ").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

function parseIcsDate(raw: string) {
  const value = raw.trim();
  const basic = value.match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?(\d{2})?(Z)?$/);
  if (!basic) return null;
  const [, y, m, d, hh = "00", mm = "00", ss = "00", z] = basic;
  const iso = `${y}-${m}-${d}T${hh}:${mm}:${ss}${z ? "Z" : ""}`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function valueFor(block: string, key: string) {
  const line = block.split(/\r?\n/).find((entry) => entry.startsWith(`${key}:`) || entry.startsWith(`${key};`));
  if (!line) return "";
  return line.slice(line.indexOf(":") + 1);
}

function parseIcs(text: string): IcsEvent[] {
  const normalized = unfold(text);
  const blocks = normalized.split("BEGIN:VEVENT").slice(1).map((part) => part.split("END:VEVENT")[0]);
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  const events: IcsEvent[] = [];
  for (const block of blocks) {
    const start = parseIcsDate(valueFor(block, "DTSTART"));
    if (!start || new Date(start).getTime() < cutoff) continue;
    const end = parseIcsDate(valueFor(block, "DTEND")) || undefined;
    events.push({
      title: decodeText(valueFor(block, "SUMMARY") || "Untitled event"),
      start,
      ...(end ? { end } : {}),
      ...(valueFor(block, "LOCATION") ? { location: decodeText(valueFor(block, "LOCATION")) } : {}),
    });
  }
  return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).slice(0, 12);
}

function allowedUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host.startsWith("10.") || host.startsWith("192.168.") || host.startsWith("169.254.") || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return null;
    return url;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const feed = allowedUrl(url.searchParams.get("url") || "");
  if (!feed) return NextResponse.json({ error: "Use a valid public https iCal URL." }, { status: 400 });

  try {
    const response = await fetch(feed, { headers: { Accept: "text/calendar,text/plain,*/*" }, cache: "no-store" });
    if (!response.ok) throw new Error(`Calendar feed returned ${response.status}`);
    const events = parseIcs(await response.text());
    return NextResponse.json({ events }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch (error) {
    console.error("Calendar feed failed:", error);
    return NextResponse.json({ error: "Calendar feed unavailable." }, { status: 502 });
  }
}
