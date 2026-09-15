import { cloneScreen, makeId, type ScreenDefinition, type ScreenWidget } from "./screen-types";
import { listCustomScreens, publishLive, publishTemplate, publishCustomScreen, readMirrorState } from "./mirror-store";
import { TEMPLATE_LIBRARY } from "./templates";
import { readSystemSettings } from "./device-store";
import { MIRROR_CONFIG } from "./mirror-config";
import { getFacilityStatus } from "./facility-hours";
import { WEATHER_LABELS } from "./weather";
import { readTeamSchedule } from "./team-schedule-store";
import { formatShift, peopleInNow, upcomingToday } from "./team-schedule";

export type AssistantAction =
  | { type: "activate_template"; screen?: string }
  | { type: "activate_custom"; screen?: string }
  | { type: "set_text"; target?: string; text?: string }
  | { type: "add_text"; text?: string; x?: number; y?: number; fontSize?: number; color?: string }
  | { type: "remove_widget"; target?: string }
  | { type: "style_widget"; target?: string; scale?: number; rotation?: number; fontSize?: number; color?: string; opacity?: number };

export type AssistantResult = {
  reply: string;
  actions: AssistantAction[];
  visualUsed?: boolean;
};

function cleanText(value: unknown, max = 800) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function findWidget(screen: ScreenDefinition, target = "") {
  const q = target.trim().toLowerCase();
  if (!q) return null;
  return screen.widgets.find((widget) => widget.id.toLowerCase() === q)
    || screen.widgets.find((widget) => widget.name.toLowerCase().includes(q))
    || screen.widgets.find((widget) => widget.type.toLowerCase() === q)
    || screen.widgets.find((widget) => `${widget.name} ${widget.type}`.toLowerCase().includes(q))
    || null;
}

function fuzzyTemplate(name = "") {
  const q = name.trim().toLowerCase();
  if (!q) return null;
  return TEMPLATE_LIBRARY.find((item) => item.id.toLowerCase() === q)
    || TEMPLATE_LIBRARY.find((item) => item.name.toLowerCase() === q)
    || TEMPLATE_LIBRARY.find((item) => item.name.toLowerCase().includes(q))
    || TEMPLATE_LIBRARY.find((item) => item.tags.some((tag) => tag.toLowerCase() === q))
    || null;
}

async function fuzzyCustom(name = "") {
  const q = name.trim().toLowerCase();
  if (!q) return null;
  const screens = await listCustomScreens();
  return screens.find((item) => item.id.toLowerCase() === q)
    || screens.find((item) => item.name.toLowerCase() === q)
    || screens.find((item) => item.name.toLowerCase().includes(q))
    || null;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

async function applyActions(actions: AssistantAction[]) {
  const settings = await readSystemSettings();
  if (!settings.allowScreenControl || !actions.length) return [] as string[];
  const notes: string[] = [];

  for (const action of actions.slice(0, 5)) {
    if (action.type === "activate_template") {
      const template = fuzzyTemplate(action.screen);
      if (template) {
        await publishTemplate(template.id);
        notes.push(`Switched to ${template.name}.`);
      }
      continue;
    }

    if (action.type === "activate_custom") {
      const custom = await fuzzyCustom(action.screen);
      if (custom) {
        await publishCustomScreen(custom.id);
        notes.push(`Switched to ${custom.name}.`);
      }
      continue;
    }

    const state = await readMirrorState();
    const screen = cloneScreen(state.screen);

    if (action.type === "add_text") {
      const widget: ScreenWidget = {
        id: makeId("ai-text"),
        type: "text",
        name: "AI text",
        x: clampNumber(action.x, 0, 980, 100),
        y: clampNumber(action.y, 0, 1820, 850),
        w: 780,
        h: 180,
        rotation: 0,
        scale: 1,
        opacity: 1,
        z: Math.max(10, ...screen.widgets.map((item) => item.z || 0)) + 1,
        animation: "fade",
        style: {
          color: cleanText(action.color, 24) || "#ffffff",
          background: "transparent",
          borderWidth: 0,
          borderRadius: 0,
          fontSize: clampNumber(action.fontSize, 16, 180, 48),
          fontWeight: 400,
          letterSpacing: 0,
          lineHeight: 1.12,
          textAlign: "left",
          padding: 0,
          glow: 0,
        },
        config: { text: cleanText(action.text, 500) || "New text" },
      };
      screen.widgets.push(widget);
      screen.name = `${state.screen.name} — AI Edit`;
      await publishLive(screen);
      notes.push("Added text to the live screen.");
      continue;
    }

    const target = findWidget(screen, "target" in action ? action.target : "");
    if (!target) continue;

    if (action.type === "set_text") {
      target.config.text = cleanText(action.text, 700);
      screen.name = `${state.screen.name} — AI Edit`;
      await publishLive(screen);
      notes.push(`Updated ${target.name}.`);
      continue;
    }

    if (action.type === "remove_widget") {
      screen.widgets = screen.widgets.filter((item) => item.id !== target.id);
      screen.name = `${state.screen.name} — AI Edit`;
      await publishLive(screen);
      notes.push(`Removed ${target.name}.`);
      continue;
    }

    if (action.type === "style_widget") {
      if (action.scale !== undefined) target.scale = clampNumber(action.scale, 0.25, 4, target.scale);
      if (action.rotation !== undefined) target.rotation = clampNumber(action.rotation, -360, 360, target.rotation);
      if (action.opacity !== undefined) target.opacity = clampNumber(action.opacity, 0, 1, target.opacity);
      if (action.fontSize !== undefined) target.style.fontSize = clampNumber(action.fontSize, 10, 260, target.style.fontSize || 34);
      if (action.color) target.style.color = cleanText(action.color, 24);
      screen.name = `${state.screen.name} — AI Edit`;
      await publishLive(screen);
      notes.push(`Adjusted ${target.name}.`);
    }
  }
  return notes;
}

function safeJsonFromModel(raw: string): AssistantResult | null {
  const fenced = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const first = fenced.indexOf("{");
  const last = fenced.lastIndexOf("}");
  if (first < 0 || last <= first) return null;
  try {
    const parsed = JSON.parse(fenced.slice(first, last + 1)) as Partial<AssistantResult>;
    return {
      reply: cleanText(parsed.reply, 1400) || "Done.",
      actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 5) as AssistantAction[] : [],
      visualUsed: Boolean(parsed.visualUsed),
    };
  } catch {
    return null;
  }
}

async function liveEnvironment() {
  const now = new Date();
  const facility = getFacilityStatus(now, MIRROR_CONFIG.timezone);
  let weather = "unavailable";
  try {
    const params = new URLSearchParams({
      latitude: String(MIRROR_CONFIG.latitude),
      longitude: String(MIRROR_CONFIG.longitude),
      current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
      daily: "temperature_2m_max,temperature_2m_min",
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      timezone: MIRROR_CONFIG.timezone,
      forecast_days: "1",
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { cache: "no-store", signal: AbortSignal.timeout(4500) });
    if (response.ok) {
      const data = await response.json();
      const code = Number(data.current?.weather_code);
      weather = `${Math.round(Number(data.current?.temperature_2m))}°F, ${WEATHER_LABELS[code] || "current conditions"}, feels like ${Math.round(Number(data.current?.apparent_temperature))}°F, wind ${Math.round(Number(data.current?.wind_speed_10m))} mph, high ${Math.round(Number(data.daily?.temperature_2m_max?.[0]))}°F, low ${Math.round(Number(data.daily?.temperature_2m_min?.[0]))}°F`;
    }
  } catch {}
  const localTime = new Intl.DateTimeFormat("en-US", { timeZone: MIRROR_CONFIG.timezone, dateStyle: "full", timeStyle: "short" }).format(now);
  return { facility, weather, localTime };
}

async function contextPrompt() {
  const [state, custom, environment, teamSchedule] = await Promise.all([readMirrorState(), listCustomScreens(), liveEnvironment(), readTeamSchedule()]);
  const now = new Date();
  const teamIn = peopleInNow(teamSchedule, now);
  const teamNext = upcomingToday(teamSchedule, now).slice(0, 6);
  return {
    state,
    custom,
    prompt: `You are Go, the concise voice assistant built into GoCreateMirror, a smart mirror at a makerspace.\n\nYou can answer general questions naturally. You can also control the mirror when the user explicitly asks. Never claim a screen changed unless you return an action.\n\nCurrent live screen: ${state.selected.name}.\nCurrent widgets: ${state.screen.widgets.map((widget) => `${widget.name} (${widget.type}, id=${widget.id})`).join(", ")}.\nAvailable templates: ${TEMPLATE_LIBRARY.map((item) => `${item.name} [${item.id}]`).join(", ")}.\nCustom screens: ${custom.map((item) => `${item.name} [${item.id}]`).join(", ") || "none"}.\nTeam currently in: ${teamIn.length ? teamIn.map(({ member, segment }) => `${member.name} (${formatShift(segment, true)})`).join(", ") : "nobody scheduled right now"}.\nUpcoming staff today: ${teamNext.length ? teamNext.map(({ member, segment }) => `${member.name} (${formatShift(segment, true)})`).join(", ") : "none"}.\n\nReturn JSON only in this shape:\n{"reply":"short spoken answer","actions":[]}\n\nAllowed action objects:\n{"type":"activate_template","screen":"template name or id"}\n{"type":"activate_custom","screen":"custom screen name or id"}\n{"type":"set_text","target":"widget name/type/id","text":"new text"}\n{"type":"add_text","text":"text","x":100,"y":850,"fontSize":48,"color":"#ffffff"}\n{"type":"remove_widget","target":"widget name/type/id"}\n{"type":"style_widget","target":"widget name/type/id","scale":1.2,"rotation":0,"fontSize":70,"color":"#ffffff","opacity":1}\n\nUse at most 3 actions unless absolutely necessary. For ordinary questions, actions must be empty. Keep reply suitable for speaking aloud; usually 1-4 sentences.`,
  };
}

async function callGroq(text: string) {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) throw new Error("GROQ_API_KEY is not configured.");
  const model = process.env.GROQ_LLM_MODEL?.trim() || "openai/gpt-oss-20b";
  const { prompt } = await contextPrompt();
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: text.slice(0, 2500) },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Groq LLM failed (${response.status}).`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const raw = payload.choices?.[0]?.message?.content || "";
  return safeJsonFromModel(raw) || { reply: raw.trim() || "I couldn't form a response.", actions: [] };
}

async function callGeminiText(text: string) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY is not configured.");
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const { prompt } = await contextPrompt();
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: prompt }] },
      generationConfig: { responseMimeType: "application/json", temperature: 0.35 },
      contents: [{ role: "user", parts: [{ text: text.slice(0, 2500) }] }],
    }),
  });
  if (!response.ok) throw new Error(`Gemini failed (${response.status}).`);
  const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const raw = payload.candidates?.[0]?.content?.parts?.map((item) => item.text || "").join("") || "";
  return safeJsonFromModel(raw) || { reply: raw.trim() || "I couldn't form a response.", actions: [] };
}

export async function answerText(text: string): Promise<AssistantResult> {
  const provider = (process.env.AI_PROVIDER || "groq").toLowerCase();
  const result = provider === "gemini" ? await callGeminiText(text) : await callGroq(text);
  const notes = await applyActions(result.actions || []);
  if (notes.length && !notes.some((note) => result.reply.toLowerCase().includes(note.toLowerCase().slice(0, 12)))) {
    result.reply = `${result.reply} ${notes.join(" ")}`.trim();
  }
  return result;
}

export async function answerWithVision(text: string, imageBase64: string, mimeType = "image/jpeg"): Promise<AssistantResult> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    return { reply: "Camera vision is available, but a Gemini API key has not been configured for image understanding yet.", actions: [], visualUsed: false };
  }
  const settings = await readSystemSettings();
  if (!settings.visionEnabled) return { reply: "Camera vision is turned off in the mirror settings.", actions: [], visualUsed: false };
  const model = process.env.GEMINI_VISION_MODEL?.trim() || process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const { prompt } = await contextPrompt();
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: `${prompt}\nAn image from the mirror camera is attached because the user explicitly asked you to look. Describe only what is useful for the request. Do not identify people.` }] },
      generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
      contents: [{ role: "user", parts: [{ text: text.slice(0, 2000) }, { inlineData: { mimeType, data: imageBase64 } }] }],
    }),
  });
  if (!response.ok) throw new Error(`Gemini vision failed (${response.status}).`);
  const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const raw = payload.candidates?.[0]?.content?.parts?.map((item) => item.text || "").join("") || "";
  const result = safeJsonFromModel(raw) || { reply: raw.trim() || "I couldn't understand the image.", actions: [] };
  result.visualUsed = true;
  const notes = await applyActions(result.actions || []);
  if (notes.length) result.reply = `${result.reply} ${notes.join(" ")}`.trim();
  return result;
}
