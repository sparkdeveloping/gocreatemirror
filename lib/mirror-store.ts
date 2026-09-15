import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { FIREBASE_CONFIG, FIREBASE_MIRROR_SCREENS_PATH, FIREBASE_MIRROR_STATE_PATH } from "./firebase-config";
import { cloneScreen, isScreenDefinition, type MirrorSelectionKind, type MirrorState, type ScreenDefinition } from "./screen-types";
import { DEFAULT_TEMPLATE_ID, getDefaultScreen, getTemplate } from "./templates";

type MemoryStore = {
  state: MirrorState;
  screens: Record<string, ScreenDefinition>;
};

declare global {
  // eslint-disable-next-line no-var
  var __gocreateMirrorStore: MemoryStore | undefined;
}

const DEFAULT_STATE: MirrorState = {
  selected: { kind: "template", id: DEFAULT_TEMPLATE_ID, name: getDefaultScreen().name },
  screen: cloneScreen(getDefaultScreen()),
  updatedAt: new Date(0).toISOString(),
  revision: 1,
};

function memoryStore(): MemoryStore {
  if (!globalThis.__gocreateMirrorStore) {
    globalThis.__gocreateMirrorStore = { state: cloneState(DEFAULT_STATE), screens: {} };
  }
  return globalThis.__gocreateMirrorStore;
}

function privateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim() || "";
}

function serviceAccountFromEnv() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    try {
      const parsed = JSON.parse(json) as { project_id?: string; client_email?: string; private_key?: string };
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key.replace(/\\n/g, "\n"),
        };
      }
    } catch (error) {
      console.error("FIREBASE_SERVICE_ACCOUNT_JSON is invalid:", error);
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || FIREBASE_CONFIG.projectId;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const key = privateKey();
  return projectId && clientEmail && key ? { projectId, clientEmail, privateKey: key } : null;
}

export function hasPersistentMirrorStore() {
  return Boolean(serviceAccountFromEnv());
}

function adminApp(): App {
  if (getApps().length) return getApp();
  const account = serviceAccountFromEnv();
  if (!account) throw new Error("Firebase Admin credentials are not configured.");
  return initializeApp({
    credential: cert(account),
    databaseURL: process.env.FIREBASE_DATABASE_URL || FIREBASE_CONFIG.databaseURL,
  });
}

function cloneState(state: MirrorState): MirrorState {
  return JSON.parse(JSON.stringify(state)) as MirrorState;
}

function normalizeState(input: unknown): MirrorState | null {
  if (!input || typeof input !== "object") return null;
  const legacy = input as { layout?: string; updatedAt?: string };
  if (legacy.layout) {
    const map: Record<string, string> = { signature: "signature-v3", split: "edge-rails", halo: "halo-motion", studio: "studio-board", icon: "icon-pure" };
    const template = getTemplate(map[legacy.layout] || legacy.layout);
    if (template) return {
      selected: { kind: "template", id: template.id, name: template.name },
      screen: cloneScreen(template.screen),
      updatedAt: legacy.updatedAt || new Date().toISOString(),
      revision: 1,
    };
  }
  const candidate = input as Partial<MirrorState>;
  if (!candidate.selected || typeof candidate.selected !== "object") return null;
  const selected = candidate.selected as Partial<MirrorState["selected"]>;
  if (!["template", "custom", "live"].includes(String(selected.kind))) return null;
  if (typeof selected.id !== "string" || typeof selected.name !== "string") return null;
  if (!isScreenDefinition(candidate.screen)) return null;
  return {
    selected: { kind: selected.kind as MirrorSelectionKind, id: selected.id, name: selected.name },
    screen: candidate.screen,
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date().toISOString(),
    revision: typeof candidate.revision === "number" ? candidate.revision : 1,
  };
}

async function publicRead(): Promise<MirrorState | null> {
  const base = (process.env.FIREBASE_DATABASE_URL || FIREBASE_CONFIG.databaseURL).replace(/\/$/, "");
  const response = await fetch(`${base}/${FIREBASE_MIRROR_STATE_PATH}.json`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;
  return normalizeState(await response.json());
}

export async function readMirrorState(): Promise<MirrorState> {
  if (hasPersistentMirrorStore()) {
    try {
      const snapshot = await getDatabase(adminApp()).ref(FIREBASE_MIRROR_STATE_PATH).get();
      const state = normalizeState(snapshot.val());
      if (state) return state;
    } catch (error) {
      console.error("Firebase mirror state read failed:", error);
    }
  } else {
    return cloneState(memoryStore().state);
  }

  try {
    return (await publicRead()) || cloneState(memoryStore().state);
  } catch {
    return cloneState(memoryStore().state);
  }
}

async function persistState(next: MirrorState) {
  memoryStore().state = cloneState(next);
  if (hasPersistentMirrorStore()) {
    await getDatabase(adminApp()).ref(FIREBASE_MIRROR_STATE_PATH).set(next);
  }
}

export async function publishScreen(
  screen: ScreenDefinition,
  selection: { kind: MirrorSelectionKind; id: string; name: string },
): Promise<MirrorState> {
  if (!isScreenDefinition(screen)) throw new Error("Invalid screen definition.");
  const previous = await readMirrorState();
  const next: MirrorState = {
    selected: selection,
    screen: cloneScreen(screen),
    updatedAt: new Date().toISOString(),
    revision: previous.revision + 1,
  };
  await persistState(next);
  return next;
}

export async function publishTemplate(templateId: string) {
  const template = getTemplate(templateId);
  if (!template) throw new Error("Unknown template.");
  return publishScreen(template.screen, { kind: "template", id: template.id, name: template.name });
}

export async function publishLive(screen: ScreenDefinition) {
  return publishScreen(screen, { kind: "live", id: "live", name: screen.name || "Live View" });
}

export async function listCustomScreens(): Promise<ScreenDefinition[]> {
  if (!hasPersistentMirrorStore()) {
    return Object.values(memoryStore().screens).map(cloneScreen);
  }
  const snapshot = await getDatabase(adminApp()).ref(FIREBASE_MIRROR_SCREENS_PATH).get();
  const raw = snapshot.val() as Record<string, unknown> | null;
  if (!raw) return [];
  return Object.values(raw).filter(isScreenDefinition).map(cloneScreen);
}

function safeKey(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);
}

export async function getCustomScreen(id: string): Promise<ScreenDefinition | null> {
  const key = safeKey(id);
  if (!hasPersistentMirrorStore()) return memoryStore().screens[key] ? cloneScreen(memoryStore().screens[key]) : null;
  const snapshot = await getDatabase(adminApp()).ref(`${FIREBASE_MIRROR_SCREENS_PATH}/${key}`).get();
  return isScreenDefinition(snapshot.val()) ? cloneScreen(snapshot.val()) : null;
}

export async function saveCustomScreen(screen: ScreenDefinition): Promise<ScreenDefinition> {
  if (!isScreenDefinition(screen)) throw new Error("Invalid screen definition.");
  const key = safeKey(screen.id);
  const now = new Date().toISOString();
  const next: ScreenDefinition = {
    ...cloneScreen(screen),
    id: key,
    createdAt: screen.createdAt || now,
    updatedAt: now,
  };
  memoryStore().screens[key] = cloneScreen(next);
  if (hasPersistentMirrorStore()) {
    await getDatabase(adminApp()).ref(`${FIREBASE_MIRROR_SCREENS_PATH}/${key}`).set(next);
  }
  return next;
}

export async function deleteCustomScreen(id: string) {
  const key = safeKey(id);
  delete memoryStore().screens[key];
  if (hasPersistentMirrorStore()) {
    await getDatabase(adminApp()).ref(`${FIREBASE_MIRROR_SCREENS_PATH}/${key}`).remove();
  }
}

export async function publishCustomScreen(id: string) {
  const screen = await getCustomScreen(id);
  if (!screen) throw new Error("Custom screen not found.");
  return publishScreen(screen, { kind: "custom", id: screen.id, name: screen.name });
}
