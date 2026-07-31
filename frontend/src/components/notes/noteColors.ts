/** Named note colors (Keep-style color picker). Keys are stored in
 * Note.color; values are the Tailwind background classes for the card. */
export const NOTE_COLORS: Record<string, { label: string; bg: string; swatch: string }> = {
  default: { label: "Default", bg: "bg-white", swatch: "bg-white border border-line" },
  sage: { label: "Sage", bg: "bg-[#DCEEE1]", swatch: "bg-[#DCEEE1]" },
  sand: { label: "Sand", bg: "bg-[#F3E5C8]", swatch: "bg-[#F3E5C8]" },
  sky: { label: "Sky", bg: "bg-[#DCE9F5]", swatch: "bg-[#DCE9F5]" },
  blush: { label: "Blush", bg: "bg-[#F5DCE0]", swatch: "bg-[#F5DCE0]" },
  lilac: { label: "Lilac", bg: "bg-[#E7DCF5]", swatch: "bg-[#E7DCF5]" },
};

export const NOTE_COLOR_KEYS = Object.keys(NOTE_COLORS);
