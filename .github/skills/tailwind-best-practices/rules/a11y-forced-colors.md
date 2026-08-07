---
title: Support Forced Colors Mode
impact: LOW-MEDIUM
impactDescription: ensures usability in Windows High Contrast Mode
tags: a11y, forced-colors, high-contrast, accessibility
---

## Support Forced Colors Mode

Forced colors mode (Windows High Contrast Mode) overrides all colors with a user-defined system palette. Most elements should respect this — but some need to opt out when custom colors carry meaning.

**The `forced-colors:` variant** applies styles only when forced colors mode is active:

```html
<!-- Add a visible border that only appears in forced colors mode -->
<button class="rounded bg-blue-500 text-white forced-colors:border forced-colors:border-[ButtonText]">
  Submit
</button>
```

System color keywords available in forced colors: `Canvas`, `CanvasText`, `LinkText`, `GrayText`, `Highlight`, `HighlightText`, `ButtonFace`, `ButtonText`, `Field`, `FieldText`, `Mark`, `MarkText`.

**`forced-color-adjust-none`** — opt out when color is functional, not decorative:

```html
<!-- Color swatches must retain their actual colors -->
<fieldset class="forced-color-adjust-none">
  <label>
    <input class="sr-only" type="radio" name="color" value="white" />
    <span class="sr-only">White</span>
    <span class="size-6 rounded-full border border-black/10 bg-white"></span>
  </label>
  <label>
    <input class="sr-only" type="radio" name="color" value="blue" />
    <span class="sr-only">Blue</span>
    <span class="size-6 rounded-full bg-blue-500"></span>
  </label>
</fieldset>
```

**`forced-color-adjust-auto`** — restore forced colors compliance (the default):

```html
<!-- Opt out on mobile, restore on desktop -->
<fieldset class="forced-color-adjust-none lg:forced-color-adjust-auto">
  ...
</fieldset>
```

**Common patterns for forced colors support:**

```html
<!-- Custom checkbox that remains visible -->
<div class="size-5 rounded border bg-blue-500 forced-colors:border-[ButtonText] forced-colors:bg-[Highlight]">
  <CheckIcon class="text-white forced-colors:text-[HighlightText]" />
</div>

<!-- Focus ring visible in high contrast -->
<button class="focus-visible:ring-2 focus-visible:ring-blue-500 forced-colors:focus-visible:ring-[Highlight]">
  Action
</button>
```

**Testing:** In Chrome DevTools, open Rendering panel and set "Emulate CSS media feature forced-colors" to `active`.
