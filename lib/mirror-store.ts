import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { FIREBASE_CONFIG, FIREBASE_MIRROR_STATE_PATH } from "./firebase-config";
import { isLayoutId, type LayoutId } from "./layouts";

export type MirrorState = {
  layout: LayoutId;
  updatedAt: string;
};

const DEFAULT_STATE: MirrorState = {
  layout: "signature",
  updatedAt: new Date(0).toISOString(),
};

function privateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim() || "";
}

function serviceAccountFromEnv() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    try {
      const parsed = JSON.parse(json) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key.replace(/\\n/g, "\n"),
        };
      }
    } catch (error) {
      console.error("FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON:", error);
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || FIREBASE_CONFIG.projectId;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const key = privateKey();
  if (projectId && clientEmail && key) {
    return { projectId, clientEmail, privateKey: key };
  }

  return null;
}

export function hasPersistentMirrorStore() {
  return Boolean(serviceAccountFromEnv());
}

function adminApp(): App {
  if (getApps().length) return getApp();

  const account = serviceAccountFromEnv();
  if (!account) {
    throw new Error(
      "Firebase Admin is not configured. Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (or FIREBASE_SERVICE_ACCOUNT_JSON) in Vercel.",
    );
  }

  return initializeApp({
    credential: cert(account),
    databaseURL: process.env.FIREBASE_DATABASE_URL || FIREBASE_CONFIG.databaseURL,
  });
}

function normalizeState(input: unknown): MirrorState | null {
  if (!input || typeof input !== "object") return null;
  const candidate = input as Partial<MirrorState>;
  if (!isLayoutId(candidate.layout)) return null;
  return {
    layout: candidate.layout,
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date().toISOString(),
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
  // If Admin credentials are configured, use the Admin SDK. Otherwise the GET
  // endpoint can still read through the database's read-only public rule.
  if (hasPersistentMirrorStore()) {
    try {
      const snapshot = await getDatabase(adminApp()).ref(FIREBASE_MIRROR_STATE_PATH).get();
      const state = normalizeState(snapshot.val());
      if (state) return state;
    } catch (error) {
      console.error("Firebase mirror-state read failed:", error);
    }
  }

  try {
    return (await publicRead()) || DEFAULT_STATE;
  } catch (error) {
    console.error("Firebase public mirror-state read failed:", error);
    return DEFAULT_STATE;
  }
}

export async function writeMirrorState(layout: LayoutId): Promise<MirrorState> {
  if (!hasPersistentMirrorStore()) {
    throw new Error("Firebase Admin credentials are not configured in Vercel.");
  }

  const next: MirrorState = {
    layout,
    updatedAt: new Date().toISOString(),
  };

  await getDatabase(adminApp()).ref(FIREBASE_MIRROR_STATE_PATH).set(next);
  return next;
}
