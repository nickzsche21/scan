import Scan from "@/components/Scan";
import ThemeToggle from "@/components/ThemeToggle";

export default function Page() {
  return (
    <main>
      <div className="ruled relative px-5 pt-10 pb-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-between">
            <span className="label text-ink-soft">javascript · fold · scan</span>
            <ThemeToggle />
          </div>

          <h1 className="text-[clamp(40px,8vw,74px)] font-semibold leading-[0.9] tracking-[-0.045em]">SCAN</h1>
          <p className="mt-4 max-w-[34ch] text-[clamp(19px,3vw,28px)] font-medium leading-[1.18] tracking-[-0.025em]">
            A scan is a fold that shows its work.
          </p>
          <p className="mt-4 max-w-[62ch] text-[15.5px] leading-[1.68] text-ink-soft">
            <code className="mono">reduce</code> hands you an answer and keeps the middle to itself.
            Everything people find hard about it lives in that middle — so here it is, one element at
            a time, with the accumulator&rsquo;s type coloured so you can see it turn into something
            else.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 pb-16">
        <Scan />
      </div>

      <section className="mx-auto max-w-4xl border-t border-rule px-5 py-14">
        <div className="label mb-3 text-ink-soft">why this exists</div>
        <h2 className="text-[26px] font-medium leading-[1.18] tracking-[-0.02em]">
          Nobody says reduce is hard. They say they cannot see it.
        </h2>
        <div className="mt-6 space-y-4 text-[15px] leading-[1.7] text-ink-soft">
          <p>
            Every few months this argument runs again, and the complaint is always the same shape —
            not that the concept is difficult, but that the code refuses to show you what it is doing:
          </p>
          <blockquote className="border-l-2 border-rule pl-5 text-[14.5px] italic leading-[1.65]">
            &ldquo;Because <code className="mono not-italic">f</code> can do arbitrary things to{" "}
            <code className="mono not-italic">x</code> you have to look at it just to know the general
            shape of the computation… reduce is much more flexible and so I need to do a much more
            detailed analysis to answer a basic question.&rdquo;
            <span className="label block pt-2 not-italic">— Hacker News, September 2026</span>
          </blockquote>
          <blockquote className="border-l-2 border-rule pl-5 text-[14.5px] italic leading-[1.65]">
            &ldquo;I could never keep it straight in my mind.&rdquo;
            <span className="label block pt-2 not-italic">— same thread</span>
          </blockquote>
          <p>And in the same thread, somebody describes the fix that actually worked on a client:</p>
          <blockquote className="border-l-2 border-rule pl-5 text-[14.5px] italic leading-[1.65]">
            &ldquo;I broke through to him when I added comments that showed a particular data
            structure going in, and what was coming out. Once the transformation was clear, the
            apparent complexity was no longer a problem.&rdquo;
            <span className="label block pt-2 not-italic">— same thread</span>
          </blockquote>
          <p>
            That is this, automated. There is even a proper name for a fold that keeps its
            intermediate values — a <em className="not-italic text-ink">scan</em>. Haskell spells it{" "}
            <code className="mono">scanl</code>. It has been sitting next to{" "}
            <code className="mono">reduce</code> the whole time.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl border-t border-rule px-5 py-14">
        <div className="label mb-3 text-ink-soft">three things it makes obvious</div>
        <div className="grid gap-px overflow-hidden rounded-xl border border-rule bg-rule-soft sm:grid-cols-3">
          {[
            ["It is not a reduction", "A fold can hand back something longer than it got. Run “A reduce that grows”: three elements in, six out."],
            ["The type changes", "An array goes in, an object comes out, and the accumulator stops being the same kind of thing as the input. The colour moves when it happens."],
            ["The seed is not optional", "Leave it off and reduce silently takes your first element and starts at index 1 — one fewer step than you expected, and a TypeError on an empty array."],
          ].map(([h, b]) => (
            <div key={h} className="bg-card px-5 py-5">
              <div className="text-[15px] font-medium">{h}</div>
              <p className="mt-2 text-[13.5px] leading-[1.6] text-ink-soft">{b}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 max-w-[72ch] text-[13.5px] leading-[1.7] text-ink-soft">
          Your code runs in a Worker with a two-second deadline, because a reducer that never
          finishes is an ordinary mistake and it should not cost you the tab. Nothing is uploaded —
          there is no server here to upload it to.
        </p>
      </section>

      <footer className="mx-auto max-w-4xl border-t border-rule px-5 py-8">
        <div className="label flex flex-col gap-2 text-ink-soft sm:flex-row sm:justify-between">
          <span>SCAN · MIT</span>
          <span>colour is the accumulator&rsquo;s type, not decoration</span>
        </div>
      </footer>
    </main>
  );
}
