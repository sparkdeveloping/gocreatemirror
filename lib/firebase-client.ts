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

import { FIREBASE_ASSISTANT_PATH, FIREBASE_DEVICE_STATUS_PATH, FIREBASE_SYSTEM_SETTINGS_PATH, FIREBASE_TEAM_SCHEDULE_PATH } from "./firebase-config";
import { DEFAULT_ASSISTANT_STATE, DEFAULT_DEVICE_STATUS, DEFAULT_SYSTEM_SETTINGS, type AssistantState, type DeviceStatus, type SystemSettings } from "./device-types";

export function subscribeToAssistantState(
  onState: (state: AssistantState) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const database = getFirebaseDatabase();
  return onValue(ref(database, FIREBASE_ASSISTANT_PATH), (snapshot) => {
    const value = snapshot.val();
    onState(value && typeof value === "object" ? { ...DEFAULT_ASSISTANT_STATE, ...(value as Partial<AssistantState>) } : DEFAULT_ASSISTANT_STATE);
  }, (error) => onError?.(error));
}

export function subscribeToDeviceStatus(
  onState: (state: DeviceStatus) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const database = getFirebaseDatabase();
  return onValue(ref(database, FIREBASE_DEVICE_STATUS_PATH), (snapshot) => {
    const value = snapshot.val();
    onState(value && typeof value === "object" ? { ...DEFAULT_DEVICE_STATUS, ...(value as Partial<DeviceStatus>) } : DEFAULT_DEVICE_STATUS);
  }, (error) => onError?.(error));
}

export function subscribeToSystemSettings(
  onState: (state: SystemSettings) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const database = getFirebaseDatabase();
  return onValue(ref(database, FIREBASE_SYSTEM_SETTINGS_PATH), (snapshot) => {
    const value = snapshot.val();
    onState(value && typeof value === "object" ? { ...DEFAULT_SYSTEM_SETTINGS, ...(value as Partial<SystemSettings>) } : DEFAULT_SYSTEM_SETTINGS);
  }, (error) => onError?.(error));
}


import { DEFAULT_TEAM_SCHEDULE, cloneTeamSchedule, isTeamSchedule, type TeamSchedule } from "./team-schedule";

export function subscribeToTeamSchedule(
  onState: (schedule: TeamSchedule) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const database = getFirebaseDatabase();
  return onValue(ref(database, FIREBASE_TEAM_SCHEDULE_PATH), (snapshot) => {
    const value = snapshot.val();
    onState(isTeamSchedule(value) ? cloneTeamSchedule(value) : cloneTeamSchedule(DEFAULT_TEAM_SCHEDULE));
  }, (error) => onError?.(error));
}
