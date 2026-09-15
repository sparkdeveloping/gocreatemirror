export type AssistantPhase = "idle" | "listening" | "thinking" | "speaking" | "error";

export type AssistantState = {
  phase: AssistantPhase;
  transcript?: string;
  reply?: string;
  visualPrompt?: string;
  interactionId?: string;
  updatedAt: string;
  speak: boolean;
};

export type DeviceStatus = {
  online: boolean;
  presence: boolean;
  distanceCm?: number | null;
  proximity?: "near" | "far" | "none";
  lastSeen: string;
  cameraReady: boolean;
  microphoneReady: boolean;
  wakeReady: boolean;
  wakeEngine?: string;
  wakePhrase?: string;
  agentVersion?: string;
  note?: string;
};

export type SystemSettings = {
  assistantEnabled: boolean;
  wakePhrase: string;
  speakResponses: boolean;
  showTranscript: boolean;
  allowScreenControl: boolean;
  visionEnabled: boolean;
  presenceEnabled: boolean;
  sleepAfterSeconds: number;
  sleepStyle: "black" | "icon" | "dim";
  nearDistanceCm: number;
  farDistanceCm: number;
  visualIntentWords: string[];
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  assistantEnabled: true,
  wakePhrase: "hey go",
  speakResponses: true,
  showTranscript: true,
  allowScreenControl: true,
  visionEnabled: true,
  presenceEnabled: true,
  sleepAfterSeconds: 45,
  sleepStyle: "icon",
  nearDistanceCm: 90,
  farDistanceCm: 220,
  visualIntentWords: [
    "look at this",
    "what is this",
    "what am i holding",
    "what do you see",
    "look at me",
    "use the camera",
    "scan this",
  ],
};

export const DEFAULT_ASSISTANT_STATE: AssistantState = {
  phase: "idle",
  updatedAt: new Date(0).toISOString(),
  speak: false,
};

export const DEFAULT_DEVICE_STATUS: DeviceStatus = {
  online: false,
  presence: true,
  proximity: "none",
  lastSeen: new Date(0).toISOString(),
  cameraReady: false,
  microphoneReady: false,
  wakeReady: false,
};
