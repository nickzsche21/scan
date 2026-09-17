/**
 * Running a fold that somebody typed, without letting it take the page down.
 *
 * It goes in a Worker with a hard deadline: a reducer containing `while (true)`
 * is a perfectly ordinary mistake, and on the main thread it would freeze the
 * tab with no way back. The worker only executes and snapshots; naming and
 * formatting the values happens on the main thread, so that logic lives in one
 * place rather than being duplicated into a string.
 */

export interface RawStep { i: number; acc: unknown; cur: unknown; next: unknown }
export interface RunOk {
  ok: true;
  steps: RawStep[];
  result: unknown;
  seededFromFirst: boolean;
  seed: unknown;
  items: unknown[];
}
export interface RunErr { ok: false; message: string }
export type RunResult = RunOk | RunErr;

const WORKER_SRC = String.raw`
// Functions and symbols cannot be structured-cloned, so stand them up as tags
// the main thread can still render. Everything else - including Map and Set -
// survives the clone intact.
function tag(v, depth) {
  depth = depth || 0;
  if (typeof v === "function") return { __tag: "fn", name: v.name || "anonymous" };
  if (typeof v === "symbol") return { __tag: "sym", name: String(v) };
  if (v === null || typeof v !== "object" || depth > 4) return v;
  if (Array.isArray(v)) return v.map(function (x) { return tag(x, depth + 1); });
  if (v instanceof Map) {
    var m = new Map();
    v.forEach(function (val, k) { m.set(tag(k, depth + 1), tag(val, depth + 1)); });
    return m;
  }
  if (v instanceof Set) {
    var s = new Set();
    v.forEach(function (x) { s.add(tag(x, depth + 1)); });
    return s;
  }
  var o = {};
  for (var k in v) { if (Object.prototype.hasOwnProperty.call(v, k)) o[k] = tag(v[k], depth + 1); }
  return o;
}

self.onmessage = function (e) {
  var d = e.data;
  try {
    var items = (0, eval)("(" + d.arraySrc + ")");
    if (!Array.isArray(items)) throw new Error("The input needs to be an array.");
    if (items.length > 500) throw new Error("Keep it under 500 elements - this is meant to be watched, not benchmarked.");

    var fn = (0, eval)("(" + d.reducerSrc + ")");
    if (typeof fn !== "function") throw new Error("The reducer needs to be a function.");

    var hasInitial = d.initialSrc !== null && d.initialSrc !== undefined && String(d.initialSrc).trim() !== "";
    var acc = hasInitial ? (0, eval)("(" + d.initialSrc + ")") : items[0];
    if (!hasInitial && items.length === 0) {
      throw new Error("Reduce of empty array with no initial value - real reduce throws a TypeError here too.");
    }

    var seed = acc;
    var start = hasInitial ? 0 : 1;
    var steps = [];
    var deadline = Date.now() + 2000;

    for (var i = start; i < items.length; i++) {
      if (Date.now() > deadline) throw new Error("That took more than two seconds. Something in the reducer is not finishing.");
      var before = acc;
      var next = fn(before, items[i], i, items);
      steps.push({ i: i, acc: tag(before), cur: tag(items[i]), next: tag(next) });
      acc = next;
    }

    self.postMessage({
      ok: true, steps: steps, result: tag(acc),
      seededFromFirst: !hasInitial, seed: tag(seed), items: tag(items)
    });
  } catch (err) {
    self.postMessage({ ok: false, message: (err && err.message) ? err.message : String(err) });
  }
};
`;

export function runFold(
  arraySrc: string,
  reducerSrc: string,
  initialSrc: string | null,
  timeoutMs = 3000
): Promise<RunResult> {
  return new Promise((resolve) => {
    let worker: Worker;
    let url: string;
    try {
      url = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
      worker = new Worker(url);
    } catch {
      resolve({ ok: false, message: "This browser would not start a worker, so the fold cannot be run safely." });
      return;
    }

    const done = (r: RunResult) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(r);
    };

    // The worker has its own inner deadline; this is the outer one, for the case
    // where it never gets far enough to check.
    const timer = setTimeout(
      () => done({ ok: false, message: "The fold never finished. It has been stopped." }),
      timeoutMs
    );

    worker.onmessage = (e: MessageEvent<RunResult>) => done(e.data);
    worker.onerror = (e) => done({ ok: false, message: e.message || "The fold threw before it could report." });
    worker.postMessage({ arraySrc, reducerSrc, initialSrc });
  });
}
