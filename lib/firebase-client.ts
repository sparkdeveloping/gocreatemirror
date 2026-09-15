"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase, onValue, ref, type Unsubscribe } from "firebase/database";
import { FIREBASE_CONFIG, FIREBASE_MIRROR_STATE_PATH } from "./firebase-config";
import { cloneScreen, isScreenDefinition, type MirrorState } from "./screen-types";
import { getTemplate } from "./templates";

function getFirebaseDatabase() {
  const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
  return getDatabase(app);
}

function normalize(value: unknown): MirrorState | null {
  if (!value || typeof value !== "object") return null;
  const legacy = value as { layout?: string; updatedAt?: string };
  if (legacy.layout) {
    const map: Record<string, string> = { signature: "signature-v3", split: "edge-rails", halo: "halo-motion", studio: "studio-board", icon: "icon-pure" };
    const template = getTemplate(map[legacy.layout] || legacy.layout);
    if (template) return { selected: { kind: "template", id: template.id, name: template.name }, screen: cloneScreen(template.screen), updatedAt: legacy.updatedAt || new Date().toISOString(), revision: 1 };
  }
  const candidate = value as Partial<MirrorState>;
  if (!candidate.selected || !isScreenDefinition(candidate.screen)) return null;
  if (typeof candidate.updatedAt !== "string") return null;
  return candidate as MirrorState;
}

export function subscribeToMirrorState(
  onState: (state: MirrorState) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const database = getFirebaseDatabase();
  const stateRef = ref(database, FIREBASE_MIRROR_STATE_PATH);
  return onValue(stateRef, (snapshot) => {
    const state = normalize(snapshot.val());
    if (state) onState(state);
  }, (error) => onError?.(error));
}
