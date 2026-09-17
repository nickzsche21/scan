"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXAMPLES, DEFAULT_EXAMPLE, type Example } from "@/lib/examples";
import { runFold, type RunResult } from "@/lib/runner";
import { preview, typeOf, TYPE_HUE } from "@/lib/value";
import TypeChip from "./TypeChip";

export default function Scan() {
  const [ex, setEx] = useState<Example>(EXAMPLES.find((e) => e.id === DEFAULT_EXAMPLE)!);
  const [arraySrc, setArraySrc] = useState(ex.array);
  const [reducerSrc, setReducerSrc] = useState(ex.reducer);
  const [initialSrc, setInitialSrc] = useState<string | null>(ex.initial);
  const [run, setRun] = useState<RunResult | null>(null);
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback((e: Example) => {
    setEx(e);
    setArraySrc(e.array);
    setReducerSrc(e.reducer);
    setInitialSrc(e.initial);
    setAt(0);
    setPlaying(false);
  }, []);

  // Re-run whenever the fold changes, with a beat so typing is not fought.
  useEffect(() => {
    let live = true;
    const t = setTimeout(async () => {
      const r = await runFold(arraySrc, reducerSrc, initialSrc);
      if (!live) return;
      setRun(r);
      setAt(0);
    }, 220);
    return () => { live = false; clearTimeout(t); };
  }, [arraySrc, reducerSrc, initialSrc]);

  const steps = run?.ok ? run.steps : [];
  const total = steps.length;

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (!playing || !total) return;
    timer.current = setInterval(() => {
      setAt((a) => {
        if (a >= total) { setPlaying(false); return a; }
        return a + 1;
      });
    }, 850);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing, total]);

  // at = 0 is "before anything happened"; at = n is after step n.
  const step = at > 0 ? steps[at - 1] : null;
  const acc = run?.ok ? (at === 0 ? run.seed : steps[at - 1].next) : undefined;
  const items = run?.ok ? run.items : [];

  const consumedUpTo = run?.ok
    ? (at === 0 ? (run.seededFromFirst ? 0 : -1) : steps[at - 1].i)
    : -1;

  const grew = useMemo(() => {
    if (!run?.ok || !Array.isArray(run.result) || !Array.isArray(items)) return false;
    return run.result.length > items.length;
  }, [run, items]);

  const typeChanges = useMemo(
    () => steps.filter((s) => typeOf(s.acc) !== typeOf(s.next)).length,
    [steps]
  );

  return (
    <div>
      {/* Which fold */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {EXAMPLES.map((e) => (
          <button
            key={e.id}
            onClick={() => load(e)}
            className="mono rounded-md border px-2.5 py-1.5 text-[11.5px] transition-colors"
            style={{
              borderColor: ex.id === e.id ? "var(--ink)" : "var(--rule)",
              background: ex.id === e.id ? "var(--ink)" : "var(--card)",
              color: ex.id === e.id ? "var(--paper)" : "var(--ink-soft)",
            }}
          >
            {e.name}
          </button>
        ))}
      </div>

      <p className="mb-5 max-w-[68ch] text-[14px] leading-[1.7] text-ink-soft">{ex.note}</p>

      {/* The fold, editable */}
      <div className="overflow-hidden rounded-xl border border-rule bg-card">
        <div className="flex items-center justify-between border-b border-rule px-4 py-2">
          <span className="label text-ink-soft">the fold</span>
          <span className="mono text-[10.5px] text-ink-soft">editable — it re-runs as you type</span>
        </div>
        <div className="grid gap-px bg-rule-soft sm:grid-cols-[1fr_auto]">
          <div className="bg-card p-3">
            <label className="label mb-1.5 block text-ink-soft">array</label>
            <textarea value={arraySrc} onChange={(e) => setArraySrc(e.target.value)} rows={1} spellCheck={false}
              className="mono w-full resize-y rounded border border-rule bg-sunk px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-ink-soft" />
            <label className="label mb-1.5 mt-3 block text-ink-soft">reducer</label>
            <textarea value={reducerSrc} onChange={(e) => setReducerSrc(e.target.value)} rows={4} spellCheck={false}
              className="mono w-full resize-y rounded border border-rule bg-sunk px-2.5 py-1.5 text-[12.5px] leading-[1.6] text-ink outline-none focus:border-ink-soft" />
          </div>
          <div className="bg-card p-3 sm:w-[210px]">
            <label className="label mb-1.5 block text-ink-soft">initial value</label>
            <textarea
              value={initialSrc ?? ""}
              onChange={(e) => setInitialSrc(e.target.value)}
              rows={1} spellCheck={false} placeholder="(none)"
              className="mono w-full resize-y rounded border border-rule bg-sunk px-2.5 py-1.5 text-[12.5px] text-ink outline-none placeholder:text-ink-soft focus:border-ink-soft" />
            <button
              onClick={() => setInitialSrc(initialSrc === null || initialSrc === "" ? "0" : null)}
              className="mono mt-2 w-full rounded border border-rule bg-card px-2 py-1.5 text-[11px] text-ink-soft hover:text-ink"
            >
              {initialSrc === null || initialSrc === "" ? "add a seed" : "drop the seed"}
            </button>
            {run?.ok && run.seededFromFirst && (
              <p className="mt-2.5 text-[11.5px] leading-[1.5]" style={{ color: "var(--t-array)" }}>
                No seed, so reduce took <span className="mono">{preview(run.seed, 18)}</span> as the
                accumulator and started at index 1.
              </p>
            )}
          </div>
        </div>
      </div>

      {run && !run.ok && (
        <div className="mt-4 rounded-lg border px-4 py-3 text-[13.5px] leading-relaxed"
          style={{ borderColor: "color-mix(in srgb, var(--t-object) 40%, transparent)", background: "color-mix(in srgb, var(--t-object) 7%, transparent)" }}>
          {run.message}
        </div>
      )}

      {run?.ok && (
        <>
          {/* The array being eaten */}
          <div className="mt-6">
            <div className="label mb-2 text-ink-soft">input</div>
            <div className="flex flex-wrap gap-1.5">
              {items.map((it, i) => {
                const done = i <= consumedUpTo;
                const now = step?.i === i;
                return (
                  <span key={i}
                    className="mono rounded-md border px-2 py-1 text-[12px] transition-all"
                    style={{
                      borderColor: now ? "var(--ink)" : "var(--rule)",
                      background: now ? "var(--ink)" : done ? "var(--sunk)" : "var(--card)",
                      color: now ? "var(--paper)" : done ? "var(--ink-soft)" : "var(--ink)",
                      opacity: done && !now ? 0.5 : 1,
                    }}>
                    {preview(it, 22)}
                  </span>
                );
              })}
            </div>
          </div>

          {/* The step, spelled out */}
          <div className="mt-6 overflow-hidden rounded-xl border border-rule bg-card">
            <div className="label border-b border-rule px-4 py-2 text-ink-soft">
              {step ? `step ${at} of ${total} · element at index ${step.i}` : "before the first step"}
            </div>
            <div className="divide-y divide-rule-soft">
              {[
                ["accumulator in", step ? step.acc : run.seed],
                ["element", step ? step.cur : undefined],
                ["accumulator out", step ? step.next : run.seed],
              ].map(([lbl, v], i) => (
                <div key={lbl as string} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
                  <span className="label w-[128px] shrink-0 text-ink-soft">{lbl as string}</span>
                  {step || i !== 1 ? (
                    <>
                      <TypeChip value={v} />
                      <code className="mono min-w-0 flex-1 break-all text-[13px]">{preview(v, 120)}</code>
                    </>
                  ) : (
                    <span className="mono text-[13px] text-ink-soft">—</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* The accumulator, large */}
          <div className="mt-4 rounded-xl border-2 p-5 transition-colors"
            style={{ borderColor: `color-mix(in srgb, ${TYPE_HUE[typeOf(acc)]} 45%, var(--rule))`, background: "var(--card)" }}>
            <div className="mb-2 flex items-center gap-2">
              <span className="label text-ink-soft">accumulator</span>
              <TypeChip value={acc} size="lg" />
              {step && typeOf(step.acc) !== typeOf(step.next) && (
                <span className="mono rounded px-1.5 py-0.5 text-[10.5px]"
                  style={{ color: "var(--paper)", background: TYPE_HUE[typeOf(step.next)] }}>
                  became a {typeOf(step.next)} on this step
                </span>
              )}
            </div>
            <code key={at} className="land mono block break-all text-[clamp(15px,2.4vw,21px)] leading-[1.5]"
              style={{ color: TYPE_HUE[typeOf(acc)] }}>
              {preview(acc, 260)}
            </code>
          </div>

          {/* Transport */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button onClick={() => { setPlaying(false); setAt(Math.max(0, at - 1)); }} disabled={at === 0}
              className="mono rounded-md border border-rule bg-card px-3 py-2 text-[12px] disabled:opacity-35">← back</button>
            <button onClick={() => { setPlaying(false); setAt(Math.min(total, at + 1)); }} disabled={at >= total}
              className="mono rounded-md border border-rule bg-card px-3 py-2 text-[12px] disabled:opacity-35">step →</button>
            <button onClick={() => { if (at >= total) setAt(0); setPlaying((p) => !p); }} disabled={!total}
              className="mono rounded-md border px-3 py-2 text-[12px]"
              style={{ borderColor: "var(--ink)", background: playing ? "var(--ink)" : "var(--card)", color: playing ? "var(--paper)" : "var(--ink)" }}>
              {playing ? "pause" : "play"}
            </button>
            <input type="range" min={0} max={total} value={at}
              onChange={(e) => { setPlaying(false); setAt(Number(e.target.value)); }}
              className="min-w-[140px] flex-1 accent-[var(--ink)]" />
            <span className="mono shrink-0 text-[12px] text-ink-soft">{at} / {total}</span>
          </div>

          {/* What the fold actually did */}
          <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-rule bg-rule-soft sm:grid-cols-3">
            {[
              ["elements in", String(items.length)],
              ["steps taken", String(total)],
              [grew ? "it grew" : "result", grew ? `${(run.result as unknown[]).length} out of ${items.length} in` : preview(run.result, 26)],
            ].map(([k, v]) => (
              <div key={k} className="bg-card px-4 py-3">
                <div className="label text-ink-soft">{k}</div>
                <div className="mono mt-1 truncate text-[14px]">{v}</div>
              </div>
            ))}
          </div>

          {(grew || typeChanges > 0 || run.seededFromFirst) && (
            <p className="mt-3 max-w-[72ch] text-[13.5px] leading-[1.65] text-ink-soft">
              {grew && <>This fold handed back more than it was given, which is why &ldquo;reduce&rdquo; is a poor name for it. </>}
              {typeChanges > 0 && <>The accumulator changed type {typeChanges === 1 ? "once" : `${typeChanges} times`} — watch the colour move. </>}
              {run.seededFromFirst && <>And with no seed it began at index 1, so there is one fewer step than there are elements.</>}
            </p>
          )}
        </>
      )}
    </div>
  );
}
