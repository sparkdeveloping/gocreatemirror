import { isLayoutId, type LayoutId } from "./layouts";

export type MirrorState = {
  layout: LayoutId;
  updatedAt: string;
};

const KEY = process.env.MIRROR_STATE_KEY || "gocreatemirror:state";
const DEFAULT_STATE: MirrorState = {
  layout: "signature",
  updatedAt: new Date(0).toISOString(),
};

type MemoryGlobal = typeof globalThis & { __gocreateMirrorState?: MirrorState };

function redisConfig() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.REDIS_REST_URL ||
    "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.REDIS_REST_TOKEN ||
    "";
  return { url: url.replace(/\/$/, ""), token };
}

export function hasPersistentMirrorStore() {
  const { url, token } = redisConfig();
  return Boolean(url && token);
}

async function redisCommand(command: unknown[]) {
  const { url, token } = redisConfig();
  if (!url || !token) throw new Error("Persistent mirror state is not configured.");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Redis request failed (${response.status}).`);
  const payload = (await response.json()) as { result?: unknown; error?: string };
  if (payload.error) throw new Error(payload.error);
  return payload.result;
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

export async function readMirrorState(): Promise<MirrorState> {
  if (hasPersistentMirrorStore()) {
    try {
      const raw = await redisCommand(["GET", KEY]);
      if (typeof raw === "string") {
        const parsed = normalizeState(JSON.parse(raw));
        if (parsed) return parsed;
      }
    } catch (error) {
      console.error("Mirror state read failed:", error);
    }
  }

  const memory = globalThis as MemoryGlobal;
  return memory.__gocreateMirrorState || DEFAULT_STATE;
}

export async function writeMirrorState(layout: LayoutId): Promise<MirrorState> {
  const next: MirrorState = { layout, updatedAt: new Date().toISOString() };
  const memory = globalThis as MemoryGlobal;
  memory.__gocreateMirrorState = next;

  if (hasPersistentMirrorStore()) {
    await redisCommand(["SET", KEY, JSON.stringify(next)]);
  }

  return next;
}
