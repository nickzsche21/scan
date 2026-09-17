/**
 * Describing a value well enough to watch it change.
 *
 * The complaint that runs through every argument about `reduce` is that you
 * cannot see the shape of the computation — you have to hold the accumulator in
 * your head and simulate. So the accumulator's *type* is treated as first-class
 * here: it names it, sizes it, and gives it a colour, which is how a fold that
 * turns a list into an object becomes visible rather than inferred.
 */

export type TypeName =
  | "number" | "string" | "boolean" | "array" | "object"
  | "map" | "set" | "null" | "undefined" | "bigint" | "function" | "symbol";

/**
 * Functions and symbols cannot cross the worker boundary, so the runner replaces
 * them with `{__tag}` markers. Everything downstream has to understand those or
 * a fold whose accumulator is a function — the single best example there is —
 * renders as raw bookkeeping.
 */
interface Tagged { __tag: "fn" | "sym"; name: string }
export function asTagged(v: unknown): Tagged | null {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const t = v as Partial<Tagged>;
    if ((t.__tag === "fn" || t.__tag === "sym") && typeof t.name === "string") return t as Tagged;
  }
  return null;
}

export function typeOf(v: unknown): TypeName {
  const tag = asTagged(v);
  if (tag) return tag.__tag === "fn" ? "function" : "symbol";
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (v instanceof Map) return "map";
  if (v instanceof Set) return "set";
  const t = typeof v;
  if (t === "object") return "object";
  if (t === "number" || t === "string" || t === "boolean" || t === "undefined"
    || t === "bigint" || t === "function" || t === "symbol") return t;
  return "object";
}

/** How many things are in it, when that is a meaningful question. */
export function sizeOf(v: unknown): number | null {
  if (asTagged(v)) return null;
  if (Array.isArray(v)) return v.length;
  if (typeof v === "string") return v.length;
  if (v instanceof Map || v instanceof Set) return v.size;
  if (v && typeof v === "object") return Object.keys(v as object).length;
  return null;
}

/** "array(3)", "object{2}", "number" — the shape, not the contents. */
export function shapeOf(v: unknown): string {
  const t = typeOf(v);
  const n = sizeOf(v);
  if (t === "array") return `array(${n})`;
  if (t === "object") return `object{${n}}`;
  if (t === "map") return `Map(${n})`;
  if (t === "set") return `Set(${n})`;
  if (t === "string") return `string(${n})`;
  return t;
}

/** A short, readable rendering. Deliberately not JSON.stringify — that hides Maps and Sets. */
export function preview(v: unknown, max = 72): string {
  const s = render(v, 0);
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function render(v: unknown, depth: number): string {
  const tag = asTagged(v);
  if (tag) return tag.__tag === "fn" ? `ƒ ${tag.name}` : tag.name;
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  const t = typeof v;
  if (t === "string") return JSON.stringify(v);
  if (t === "number" || t === "boolean" || t === "bigint") return String(v);
  if (t === "function") return `ƒ ${(v as { name?: string }).name || "anonymous"}`;
  if (t === "symbol") return String(v);

  if (depth > 2) return Array.isArray(v) ? "[…]" : "{…}";

  if (Array.isArray(v)) return `[${v.slice(0, 8).map((x) => render(x, depth + 1)).join(", ")}${v.length > 8 ? ", …" : ""}]`;
  if (v instanceof Map) {
    const e = [...v.entries()].slice(0, 6).map(([k, val]) => `${render(k, depth + 1)} → ${render(val, depth + 1)}`);
    return `Map{${e.join(", ")}${v.size > 6 ? ", …" : ""}}`;
  }
  if (v instanceof Set) return `Set{${[...v].slice(0, 8).map((x) => render(x, depth + 1)).join(", ")}${v.size > 8 ? ", …" : ""}}`;

  const entries = Object.entries(v as object);
  const body = entries.slice(0, 6).map(([k, val]) => `${k}: ${render(val, depth + 1)}`);
  return `{${body.join(", ")}${entries.length > 6 ? ", …" : ""}}`;
}

/**
 * Colour is an output here, not a theme: it names the accumulator's type, so a
 * fold that changes type is visible as a colour change rather than something
 * you have to read for.
 */
export const TYPE_HUE: Record<TypeName, string> = {
  number: "var(--t-number)",
  string: "var(--t-string)",
  boolean: "var(--t-boolean)",
  array: "var(--t-array)",
  object: "var(--t-object)",
  map: "var(--t-object)",
  set: "var(--t-array)",
  null: "var(--t-empty)",
  undefined: "var(--t-empty)",
  bigint: "var(--t-number)",
  function: "var(--t-other)",
  symbol: "var(--t-other)",
};
