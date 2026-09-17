# SCAN

**A scan is a fold that shows its work.**

`reduce` hands you an answer and keeps the middle to itself. Everything people find hard about it
lives in that middle — so here it is, one element at a time, with the accumulator's type coloured
so you can watch it turn into something else.

**Live: https://scan-nine.vercel.app**

---

## Why

This argument runs on Hacker News every few months, and the complaint is never that the concept is
difficult. It is that the code refuses to show you what it is doing:

> "Because `f` can do arbitrary things to `x` you have to look at it just to know the general shape
> of the computation… reduce is much more flexible and so I need to do a much more detailed
> analysis to answer a basic question." — *ema*

> "I could never keep it straight in my mind." — *bananaflag*

And in the same thread, somebody describes the fix that actually worked on a client:

> "I broke through to him when I added comments that showed a particular data structure going in,
> and what was coming out. Once the transformation was clear, the apparent complexity was no longer
> a problem." — *fatbird*

That is this, automated. There is even a proper name for a fold that keeps its intermediate values
— a **scan**. Haskell spells it `scanl`. It has been sitting next to `reduce` the whole time.

## Three things it makes obvious

**It is not a reduction.** A fold can hand back something longer than it got. Run *A reduce that
grows*: three elements in, `[1, 2, 2, 4, 3, 6]` out. The page says "6 out of 3 in" rather than
pretending anything was reduced.

**The type changes.** An array goes in and an object comes out; the accumulator stops being the
same kind of thing as the input. The step where it happens is labelled *became an object on this
step*, and the colour moves with it.

**The seed is not optional.** Drop it and `reduce` silently takes your first element as the
accumulator and starts at index 1 — six elements, five steps — and throws a `TypeError` on an empty
array. Both are shown, not described.

## Colour is data here

The accumulator's **type** picks the hue: number, string, boolean, array, object. That is why a
fold changing type is something you see rather than something you work out.

Both palettes — light and dark — were run through a categorical validator for lightness band,
chroma floor, colour-vision separation and 3:1 contrast, rather than picked by eye. Pink and orange
sit close together under tritanopia, which is only acceptable because **every colour is always
accompanied by its type in text** (`object{2}`, `array(3)`). The label is not decoration; do not
remove it.

The surface is warm paper rather than another near-black page, so five saturated hues have room to
read.

## Your code runs in a Worker

A reducer containing `while (true)` is an ordinary mistake and it should not cost you the tab, so
user code executes in a Worker with a two-second inner deadline and a three-second outer one. The
worker only runs and snapshots; naming and formatting values happens on the main thread, so that
logic lives in one place instead of being duplicated into a string.

Functions and symbols cannot be structured-cloned, so they cross the boundary as `{__tag}` markers
and render as `ƒ name` — which is what makes *Fold over functions*, the compose example, work at
all.

```bash
npm install
npm test      # 44 assertions
npm run dev
```

No server, no account, nothing uploaded — there is nowhere to upload it to.

MIT.
