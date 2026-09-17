/**
 * The folds people actually trip over.
 *
 * Chosen from the arguments themselves rather than from a tutorial: the one
 * that changes type, the one that gets *longer*, the one whose accumulator is a
 * function, and the one that bites you for omitting the seed.
 */
export interface Example {
  id: string;
  name: string;
  /** Why this one is worth watching rather than reading. */
  note: string;
  array: string;
  reducer: string;
  initial: string | null;
}

export const EXAMPLES: Example[] = [
  {
    id: "sum",
    name: "Sum",
    note: "The one everybody already knows. Useful as a baseline: the accumulator is a number the whole way through and nothing surprising happens.",
    array: "[4, 8, 15, 16, 23, 42]",
    reducer: "(acc, n) => acc + n",
    initial: "0",
  },
  {
    id: "no-seed",
    name: "The missing seed",
    note: "Exactly the same fold with the initial value left off. Watch the step count: reduce quietly takes the first element as the seed and starts at index 1. On an empty array it throws instead.",
    array: "[4, 8, 15, 16, 23, 42]",
    reducer: "(acc, n) => acc + n",
    initial: null,
  },
  {
    id: "groupby",
    name: "Group by length",
    note: "An array goes in and an object comes out. This is the step where people lose the thread — the accumulator stops being the same kind of thing as the input.",
    array: '["ox", "cat", "dog", "emu", "ant", "bee"]',
    reducer: `(acc, word) => ({
  ...acc,
  [word.length]: [...(acc[word.length] ?? []), word],
})`,
    initial: "{}",
  },
  {
    id: "grow",
    name: "A reduce that grows",
    note: 'Three elements in, six out. "Reduce" is a misnomer — it is a transformation, and nothing obliges it to make anything smaller.',
    array: "[1, 2, 3]",
    reducer: "(acc, n) => [...acc, n, n * 2]",
    initial: "[]",
  },
  {
    id: "tally",
    name: "Tally into a Map",
    note: "A Map accumulator, mutated in place and handed back. Note the accumulator never changes identity — every step returns the same object.",
    array: '["a", "b", "a", "c", "b", "a"]',
    reducer: `(acc, ch) => acc.set(ch, (acc.get(ch) ?? 0) + 1)`,
    initial: "new Map()",
  },
  {
    id: "pipeline",
    name: "Fold over functions",
    note: "The accumulator is a function, and each step wraps it in another. This is compose, and it is the example that makes reduce click or breaks it entirely.",
    array: "[n => n + 1, n => n * 2, n => n - 3]",
    reducer: "(acc, f) => (x) => f(acc(x))",
    initial: "(x) => x",
  },
  {
    id: "maxby",
    name: "Longest word",
    note: "The accumulator is one of the elements rather than a summary of them. Handy when you want the item itself, not a number about it.",
    array: '["fig", "banana", "kiwi", "pomegranate", "plum"]',
    reducer: "(acc, w) => (w.length > acc.length ? w : acc)",
    initial: '""',
  },
];

export const DEFAULT_EXAMPLE = "groupby";
