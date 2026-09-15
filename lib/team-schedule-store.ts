import { getDatabase } from "firebase-admin/database";
import { FIREBASE_TEAM_SCHEDULE_PATH } from "./firebase-config";
import { getAdminFirebaseApp, hasPersistentMirrorStore } from "./mirror-store";
import { cloneTeamSchedule, DEFAULT_TEAM_SCHEDULE, isTeamSchedule, type TeamSchedule } from "./team-schedule";

declare global {
  // eslint-disable-next-line no-var
  var __gocreateTeamSchedule: TeamSchedule | undefined;
}

function memorySchedule() {
  if (!globalThis.__gocreateTeamSchedule) globalThis.__gocreateTeamSchedule = cloneTeamSchedule(DEFAULT_TEAM_SCHEDULE);
  return globalThis.__gocreateTeamSchedule;
}

export async function readTeamSchedule(): Promise<TeamSchedule> {
  if (hasPersistentMirrorStore()) {
    try {
      const snapshot = await getDatabase(getAdminFirebaseApp()).ref(FIREBASE_TEAM_SCHEDULE_PATH).get();
      if (isTeamSchedule(snapshot.val())) return cloneTeamSchedule(snapshot.val());
    } catch (error) {
      console.error("Firebase team schedule read failed:", error);
    }
  }
  return cloneTeamSchedule(memorySchedule());
}

export async function saveTeamSchedule(schedule: TeamSchedule): Promise<TeamSchedule> {
  if (!isTeamSchedule(schedule)) throw new Error("Invalid team schedule.");
  const next = cloneTeamSchedule({ ...schedule, updatedAt: new Date().toISOString() });
  globalThis.__gocreateTeamSchedule = cloneTeamSchedule(next);
  if (hasPersistentMirrorStore()) {
    await getDatabase(getAdminFirebaseApp()).ref(FIREBASE_TEAM_SCHEDULE_PATH).set(next);
  }
  return next;
}

export async function resetTeamSchedule() {
  return saveTeamSchedule({ ...cloneTeamSchedule(DEFAULT_TEAM_SCHEDULE), updatedAt: new Date().toISOString() });
}
