"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase, onValue, ref, type Unsubscribe } from "firebase/database";
import { FIREBASE_CONFIG, FIREBASE_MIRROR_STATE_PATH } from "./firebase-config";
import { isLayoutId, type LayoutId } from "./layouts";

export type FirebaseMirrorState = {
  layout: LayoutId;
  updatedAt: string;
};

function getFirebaseDatabase() {
  const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
  return getDatabase(app);
}

export function subscribeToMirrorState(
  onState: (state: FirebaseMirrorState) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const database = getFirebaseDatabase();
  const stateRef = ref(database, FIREBASE_MIRROR_STATE_PATH);

  return onValue(
    stateRef,
    (snapshot) => {
      const value = snapshot.val() as Partial<FirebaseMirrorState> | null;
      if (!value || !isLayoutId(value.layout)) return;
      onState({
        layout: value.layout,
        updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
      });
    },
    (error) => onError?.(error),
  );
}
