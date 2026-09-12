export type Studio = {
  name: string;
  short: string;
};

export const MIRROR_CONFIG = {
  name: process.env.NEXT_PUBLIC_MIRROR_NAME || "GoCreateMirror",
  timezone: process.env.NEXT_PUBLIC_MIRROR_TIMEZONE || "America/Chicago",
  location: process.env.NEXT_PUBLIC_MIRROR_LOCATION || "Wichita, KS",
  latitude: Number(process.env.NEXT_PUBLIC_MIRROR_LATITUDE || 37.7195),
  longitude: Number(process.env.NEXT_PUBLIC_MIRROR_LONGITUDE || -97.2934),
  autoReloadMinutes: Number(process.env.NEXT_PUBLIC_AUTO_RELOAD_MINUTES || 10),
  brand: {
    yellow: "#FBBF11",
    blue: "#0499DB",
  },
  studios: [
    { name: "3D Print & Scan", short: "3D" },
    { name: "Design", short: "DSGN" },
    { name: "Tech Lab", short: "TECH" },
    { name: "Textiles", short: "TEXT" },
    { name: "Metals & Welding", short: "METAL" },
    { name: "Wood & Foam", short: "WOOD" },
  ] satisfies Studio[],
  prompts: [
    "The idea is only the start.",
    "Think it. Build it. Learn from it.",
    "Make the thing you wish existed.",
    "Prototype before perfect.",
    "Turn curiosity into something real.",
    "Make today tangible.",
  ],
} as const;
