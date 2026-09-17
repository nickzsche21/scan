"use client";

import { useEffect, useState } from "react";

type Mode = "system" | "light" | "dark";
const KEY = "scan.theme";

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    try { setMode((localStorage.getItem(KEY) as Mode) || "system"); } catch { /* private mode */ }
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    if (mode === "system") el.removeAttribute("data-theme");
    else el.setAttribute("data-theme", mode);
    try { localStorage.setItem(KEY, mode); } catch { /* private mode */ }
  }, [mode]);

  return (
    <div className="inline-flex rounded-md border border-rule bg-card p-0.5">
      {(["light", "system", "dark"] as Mode[]).map((m) => (
        <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m}
          className="mono rounded px-2 py-0.5 text-[10.5px] transition-colors"
          style={{ background: mode === m ? "var(--ink)" : "transparent", color: mode === m ? "var(--paper)" : "var(--ink-soft)" }}>
          {m}
        </button>
      ))}
    </div>
  );
}
