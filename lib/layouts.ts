export const LAYOUT_IDS = ["signature", "split", "halo", "studio", "icon"] as const;

export type LayoutId = (typeof LAYOUT_IDS)[number];

export type LayoutOption = {
  id: LayoutId;
  name: string;
  kicker: string;
  description: string;
};

export const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    id: "signature",
    name: "Signature v2",
    kicker: "PHOTO-TUNED",
    description: "Bigger type, stronger status and weather, with most of the glass left open for reflection.",
  },
  {
    id: "split",
    name: "Twin Rails",
    kicker: "MAX REFLECTION",
    description: "Information lives on the left and right edges while the center stays almost completely clear.",
  },
  {
    id: "halo",
    name: "Halo",
    kicker: "CENTER BRAND",
    description: "A restrained centered brand moment with time and status floating above and below it.",
  },
  {
    id: "studio",
    name: "Studio Grid",
    kicker: "BOLDER",
    description: "A more graphic option that makes GoCreate's studios visible from farther away.",
  },
  {
    id: "icon",
    name: "Icon Only",
    kicker: "PURE MIRROR",
    description: "Nothing but the GoCreate mark, dead center, with a controlled blue-and-yellow glow.",
  },
];

export function isLayoutId(value: unknown): value is LayoutId {
  return typeof value === "string" && (LAYOUT_IDS as readonly string[]).includes(value);
}
