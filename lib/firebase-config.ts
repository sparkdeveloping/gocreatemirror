export const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCR53bnU91kNFZcfAp78rieEF_lJZhuxo4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "jollytiles.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://jollytiles.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "jollytiles",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "jollytiles.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "149794161056",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:149794161056:web:89bc8291b4ec740b3f64c5",
} as const;

export const FIREBASE_MIRROR_ROOT =
  process.env.NEXT_PUBLIC_FIREBASE_MIRROR_ROOT || "gocreatemirror";
export const FIREBASE_MIRROR_STATE_PATH = `${FIREBASE_MIRROR_ROOT}/state`;
export const FIREBASE_MIRROR_SCREENS_PATH = `${FIREBASE_MIRROR_ROOT}/screens`;

export const FIREBASE_DEVICE_STATUS_PATH = `${FIREBASE_MIRROR_ROOT}/device/status`;
export const FIREBASE_ASSISTANT_PATH = `${FIREBASE_MIRROR_ROOT}/assistant`;
export const FIREBASE_SYSTEM_SETTINGS_PATH = `${FIREBASE_MIRROR_ROOT}/settings`;
export const FIREBASE_TEAM_SCHEDULE_PATH = `${FIREBASE_MIRROR_ROOT}/teamSchedule`;
