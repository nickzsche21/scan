import { traceReduce, verdictOf, EmptyReduceError, type Reducer } from "./trace";
import { typeOf, shapeOf, preview, sizeOf } from "./value";

let pass = 0, fail = 0;
const ok = (label: string, cond: boolean, detail = "") => {
  cond ? pass++ : fail++;
  console.log(`${cond ? "  ok  " : " FAIL "} ${label}${cond || !detail ? "" : `\n         ${detail}`}`);
};
const sum: Reducer = (a, c) => (a as number) + (c as number);

console.log("\nTyping a value");
ok("array", typeOf([1, 2]) === "array");
ok("object", typeOf({ a: 1 }) === "object");
ok("null is not object", typeOf(null) === "null");
ok("Map is not object", typeOf(new Map()) === "map");
ok("Set is not array", typeOf(new Set()) === "set");
ok("shape names the size", shapeOf([1, 2, 3]) === "array(3)", shapeOf([1, 2, 3]));
ok("object shape uses braces", shapeOf({ a: 1, b: 2 }) === "object{2}", shapeOf({ a: 1, b: 2 }));
ok("scalars have no size", sizeOf(42) === null);

console.log("\nPreview shows what JSON.stringify hides");
ok("a Map renders its entries", preview(new Map([["a", 1]])).includes("→"), preview(new Map([["a", 1]])));
ok("a Set renders as a Set", preview(new Set([1, 2])).startsWith("Set{"), preview(new Set([1, 2])));
ok("strings stay quoted", preview("hi") === '"hi"');
ok("long values are truncated", preview("x".repeat(200), 20).endsWith("…"));
ok("undefined is not dropped", preview(undefined) === "undefined");

console.log("\nThe fold itself");
{
  const t = traceReduce([1, 2, 3, 4], sum, 0);
  ok("one step per element when seeded", t.steps.length === 4);
  ok("first step starts at index 0", t.steps[0].i === 0);
  ok("result is right", t.result === 10, String(t.result));
  ok("each step records what went in and what came out",
     t.steps[1].acc === 1 && t.steps[1].cur === 2 && t.steps[1].next === 3);
  ok("not flagged as seeded from the first element", !t.seededFromFirst);
}

console.log("\nNo initial value — the off-by-one everyone hits");
{
  const t = traceReduce([1, 2, 3, 4], sum);
  ok("flagged as seeded from the first element", t.seededFromFirst);
  ok("the seed IS the first element", t.seed === 1);
  ok("it starts at index 1, not 0", t.steps[0].i === 1, String(t.steps[0].i));
  ok("so there is one fewer step than elements", t.steps.length === 3, String(t.steps.length));
  ok("same answer by a different route", t.result === 10);
}

console.log("\nEmpty arrays");
{
  let threw = false;
  try { traceReduce([], sum); } catch (e) { threw = e instanceof EmptyReduceError; }
  ok("empty with no initial value throws, as real reduce does", threw);
  const t = traceReduce([], sum, 0);
  ok("empty WITH an initial value returns it", t.result === 0);
  ok("...and records no steps", t.steps.length === 0);
}

console.log("\n\"Reduce\" is a misnomer — it transforms");
{
  // ketzu's point in the thread: a fold can hand you back something longer.
  const grow: Reducer = (a, c) => [...(a as number[]), c as number, (c as number) * 2];
  const t = traceReduce([1, 2, 3], grow, []);
  ok("an array can come out longer than it went in", (t.result as number[]).length === 6, String((t.result as number[]).length));
  const v = verdictOf(t);
  ok("and the tool says so rather than calling it a reduction", v.grew);
  ok("net growth is counted", v.netDelta === 6, String(v.netDelta));
}

console.log("\nWatching the type change");
{
  // The groupBy everyone reaches for: array in, object out.
  const groupBy: Reducer = (a, c) => {
    const acc = a as Record<string, string[]>;
    const word = c as string;
    const k = String(word.length);
    return { ...acc, [k]: [...(acc[k] ?? []), word] };
  };
  const t = traceReduce(["a", "bb", "cc", "d"], groupBy, {});
  ok("result is an object", typeOf(t.result) === "object");
  ok("grouped correctly", JSON.stringify(t.result) === '{"1":["a","d"],"2":["bb","cc"]}', JSON.stringify(t.result));
  ok("no step changed type — it was an object throughout", !verdictOf(t).changedType);

  // Now one that genuinely switches type partway.
  const toLen: Reducer = (a, c, i) => (i === 0 ? String(c) : (a as string).length + (c as number));
  const t2 = traceReduce([1, 2, 3], toLen, "" as unknown);
  ok("a type change is detected", verdictOf(t2).changedType);
  ok("...and attributed to a specific step", t2.steps.some((s) => s.typeChanged));
}

console.log("\nThe reducer sees what reduce gives it");
{
  const seen: number[] = [];
  const spy: Reducer = (a, c, i, arr) => { seen.push(i); return (a as number) + (arr as number[]).length; };
  const t = traceReduce([5, 5, 5], spy, 0);
  ok("index is passed through", JSON.stringify(seen) === "[0,1,2]", JSON.stringify(seen));
  ok("the whole array is passed through", t.result === 9, String(t.result));
}

console.log("\nSteps carry enough to render a scan");
{
  const t = traceReduce([1, 2, 3], sum, 0);
  ok("every step knows both types", t.steps.every((s) => s.accType === "number" && s.nextType === "number"));
  ok("scalar steps have no size delta", t.steps.every((s) => s.delta === null));
  const t2 = traceReduce(["a", "b"], (a, c) => [...(a as string[]), c], [] as unknown);
  ok("array steps do have a size delta", t2.steps.every((s) => s.delta === 1), JSON.stringify(t2.steps.map(s => s.delta)));
}

console.log("\nWorker clone markers");
{
  const fnTag = { __tag: "fn", name: "compose" };
  ok("a tagged function types as a function", typeOf(fnTag) === "function", typeOf(fnTag));
  ok("...and renders as one, not as bookkeeping", preview(fnTag) === "\u0192 compose", preview(fnTag));
  ok("...and has no size", sizeOf(fnTag) === null);
  ok("a real object with a __tag-ish key is left alone",
     typeOf({ __tag: "fn", name: 1 }) === "object");
  ok("tagged functions nested in an array still render",
     preview([fnTag, fnTag]) === "[\u0192 compose, \u0192 compose]", preview([fnTag, fnTag]));
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
