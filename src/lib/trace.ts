/** Running a fold and keeping every intermediate value — which is what a scan is. */

import { typeOf, sizeOf, type TypeName } from "./value";

export interface Step {
  /** Index in the source array of the element being folded in. */
  i: number;
  /** Accumulator going in. */
  acc: unknown;
  /** The element. */
  cur: unknown;
  /** Accumulator coming out. */
  next: unknown;
  accType: TypeName;
  nextType: TypeName;
  /** The accumulator became a different kind of thing on this step. */
  typeChanged: boolean;
  /** Size delta, when size means something. Positive means the fold grew. */
  delta: number | null;
}

export interface Trace {
  steps: Step[];
  result: unknown;
  /**
   * True when no initial value was supplied, so `reduce` seeded from the first
   * element and began at index 1. The commonest source of off-by-one surprise.
   */
  seededFromFirst: boolean;
  seed: unknown;
}

export class EmptyReduceError extends Error {
  constructor() {
    super("Reduce of empty array with no initial value — this throws a TypeError in JavaScript too.");
    this.name = "EmptyReduceError";
  }
}

export type Reducer = (acc: unknown, cur: unknown, i: number, arr: unknown[]) => unknown;

/** Run the fold, recording the accumulator before and after every element. */
export function traceReduce(items: unknown[], fn: Reducer, initial?: unknown, hasInitial = arguments.length > 2): Trace {
  if (!hasInitial && items.length === 0) throw new EmptyReduceError();

  const seededFromFirst = !hasInitial;
  let acc = seededFromFirst ? items[0] : initial;
  const start = seededFromFirst ? 1 : 0;
  const seed = acc;

  const steps: Step[] = [];
  for (let i = start; i < items.length; i++) {
    const before = acc;
    const next = fn(before, items[i], i, items);
    const aSize = sizeOf(before);
    const nSize = sizeOf(next);
    steps.push({
      i,
      acc: before,
      cur: items[i],
      next,
      accType: typeOf(before),
      nextType: typeOf(next),
      typeChanged: typeOf(before) !== typeOf(next),
      delta: aSize !== null && nSize !== null ? nSize - aSize : null,
    });
    acc = next;
  }

  return { steps, result: acc, seededFromFirst, seed };
}

/** Whether this fold actually reduced anything, or quietly grew. */
export function verdictOf(t: Trace): { grew: boolean; changedType: boolean; netDelta: number | null } {
  const deltas = t.steps.map((s) => s.delta).filter((d): d is number => d !== null);
  const netDelta = deltas.length ? deltas.reduce((a, b) => a + b, 0) : null;
  return {
    grew: netDelta !== null && netDelta > 0,
    changedType: t.steps.some((s) => s.typeChanged),
    netDelta,
  };
}
