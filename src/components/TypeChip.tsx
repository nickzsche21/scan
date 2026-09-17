"use client";

import { shapeOf, typeOf, TYPE_HUE } from "@/lib/value";

/**
 * The type, named and coloured. The name is never optional — pink and orange
 * sit close together under tritanopia, so the text is what actually carries
 * identity and the colour is reinforcement.
 */
export default function TypeChip({ value, size = "sm" }: { value: unknown; size?: "sm" | "lg" }) {
  const hue = TYPE_HUE[typeOf(value)];
  return (
    <span
      className={`mono inline-flex shrink-0 items-center rounded ${size === "lg" ? "px-2 py-1 text-[12px]" : "px-1.5 py-0.5 text-[10.5px]"}`}
      style={{ color: hue, background: `color-mix(in srgb, ${hue} 13%, transparent)` }}
    >
      {shapeOf(value)}
    </span>
  );
}
