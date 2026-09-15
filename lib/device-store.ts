import { getDatabase } from "firebase-admin/database";
import { DEFAULT_ASSISTANT_STATE, DEFAULT_DEVICE_STATUS, DEFAULT_SYSTEM_SETTINGS, type AssistantState, type DeviceStatus, type SystemSettings } from "./device-types";
import { getAdminFirebaseApp, hasPersistentMirrorStore } from "./mirror-store";
import { FIREBASE_ASSISTANT_PATH, FIREBASE_DEVICE_STATUS_PATH, FIREBASE_SYSTEM_SETTINGS_PATH } from "./firebase-config";

type MemoryDeviceStore = {
  settings: SystemSettings;
  status: DeviceStatus;
  assistant: AssistantState;
};

declare global {
  // eslint-disable-next-line no-var
  var __gocreateDeviceStore: MemoryDeviceStore | undefined;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function memory(): MemoryDeviceStore {
  if (!globalThis.__gocreateDeviceStore) {
    globalThis.__gocreateDeviceStore = {
      settings: clone(DEFAULT_SYSTEM_SETTINGS),
      status: clone(DEFAULT_DEVICE_STATUS),
      assistant: clone(DEFAULT_ASSISTANT_STATE),
    };
  }
  return globalThis.__gocreateDeviceStore;
}

function normalizeSettings(value: unknown): SystemSettings {
  const raw = (value && typeof value === "object" ? value : {}) as Partial<SystemSettings>;
  return {
    ...DEFAULT_SYSTEM_SETTINGS,
    ...raw,
    wakePhrase: String(raw.wakePhrase || DEFAULT_SYSTEM_SETTINGS.wakePhrase).slice(0, 48),
    sleepAfterSeconds: Math.max(5, Math.min(3600, Number(raw.sleepAfterSeconds ?? DEFAULT_SYSTEM_SETTINGS.sleepAfterSeconds))),
    nearDistanceCm: Math.max(20, Math.min(600, Number(raw.nearDistanceCm ?? DEFAULT_SYSTEM_SETTINGS.nearDistanceCm))),
    farDistanceCm: Math.max(30, Math.min(800, Number(raw.farDistanceCm ?? DEFAULT_SYSTEM_SETTINGS.farDistanceCm))),
    visualIntentWords: Array.isArray(raw.visualIntentWords)
      ? raw.visualIntentWords.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 30)
      : DEFAULT_SYSTEM_SETTINGS.visualIntentWords,
  };
}

export async function readSystemSettings(): Promise<SystemSettings> {
  if (!hasPersistentMirrorStore()) return clone(memory().settings);
  try {
    const snapshot = await getDatabase(getAdminFirebaseApp()).ref(FIREBASE_SYSTEM_SETTINGS_PATH).get();
    const settings = normalizeSettings(snapshot.val());
    memory().settings = clone(settings);
    return settings;
  } catch (error) {
    console.error("System settings read failed:", error);
    return clone(memory().settings);
  }
}

export async function writeSystemSettings(input: Partial<SystemSettings>): Promise<SystemSettings> {
  const current = await readSystemSettings();
  const next = normalizeSettings({ ...current, ...input });
  memory().settings = clone(next);
  if (hasPersistentMirrorStore()) {
    await getDatabase(getAdminFirebaseApp()).ref(FIREBASE_SYSTEM_SETTINGS_PATH).set(next);
  }
  return next;
}

export async function readDeviceStatus(): Promise<DeviceStatus> {
  if (!hasPersistentMirrorStore()) return clone(memory().status);
  try {
    const snapshot = await getDatabase(getAdminFirebaseApp()).ref(FIREBASE_DEVICE_STATUS_PATH).get();
    const value = snapshot.val();
    if (value && typeof value === "object") {
      const next = { ...DEFAULT_DEVICE_STATUS, ...(value as Partial<DeviceStatus>) };
      memory().status = clone(next);
      return next;
    }
  } catch (error) {
    console.error("Device status read failed:", error);
  }
  return clone(memory().status);
}

export async function writeDeviceStatus(input: Partial<DeviceStatus>): Promise<DeviceStatus> {
  const next: DeviceStatus = {
    ...memory().status,
    ...input,
    online: input.online ?? true,
    lastSeen: new Date().toISOString(),
  };
  memory().status = clone(next);
  if (hasPersistentMirrorStore()) {
    await getDatabase(getAdminFirebaseApp()).ref(FIREBASE_DEVICE_STATUS_PATH).set(next);
  }
  return next;
}

export async function readAssistantState(): Promise<AssistantState> {
  if (!hasPersistentMirrorStore()) return clone(memory().assistant);
  try {
    const snapshot = await getDatabase(getAdminFirebaseApp()).ref(FIREBASE_ASSISTANT_PATH).get();
    const value = snapshot.val();
    if (value && typeof value === "object") {
      const next = { ...DEFAULT_ASSISTANT_STATE, ...(value as Partial<AssistantState>) };
      memory().assistant = clone(next);
      return next;
    }
  } catch (error) {
    console.error("Assistant state read failed:", error);
  }
  return clone(memory().assistant);
}

export async function writeAssistantState(input: Partial<AssistantState>): Promise<AssistantState> {
  const next: AssistantState = {
    ...memory().assistant,
    ...input,
    updatedAt: new Date().toISOString(),
  };
  memory().assistant = clone(next);
  if (hasPersistentMirrorStore()) {
    await getDatabase(getAdminFirebaseApp()).ref(FIREBASE_ASSISTANT_PATH).set(next);
  }
  return next;
}
