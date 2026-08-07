---
title: Use Arbitrary Values Correctly
impact: HIGH
impactDescription: avoids syntax errors and unnecessary bloat
tags: util, arbitrary, custom-values, escape-hatch
---

## Use Arbitrary Values Correctly

Arbitrary values (`[...]`) are an escape hatch for one-off values that don't belong in the theme. Use them sparingly and with correct syntax.

**Incorrect (wrong syntax, common mistakes):**

```html
<!-- ✗ Spaces break the class — Tailwind sees two tokens -->
<div class="grid grid-cols-[1fr 2fr]" />

<!-- ✗ Missing type hint — ambiguous value (v3 syntax) -->
<div class="bg-[--brand-color]" />

<!-- ✗ Using arbitrary for a value that exists in the scale -->
<div class="w-[16rem]" />
```

**Correct:**

```html
<!-- ✓ Underscores replace spaces in arbitrary values -->
<div class="grid grid-cols-[1fr_2fr]" />

<!-- ✓ v4 shorthand for CSS variable references -->
<div class="bg-(--brand-color)" />

<!-- ✓ v3 fallback — type hint with var() -->
<div class="bg-[color:var(--brand-color)]" />

<!-- ✓ Use the scale when possible -->
<div class="w-64" />
```

**Arbitrary properties** for one-off CSS that has no utility:

```html
<!-- Custom property with no corresponding utility -->
<div class="[mask-type:luminance]" />

<!-- Supports modifiers -->
<div class="hover:[mask-type:alpha]" />
```

**Arbitrary variants** for one-off selectors:

```html
<!-- Target a specific child -->
<div class="[&>svg]:size-4 [&>svg]:text-fg-muted" />

<!-- Target a data attribute -->
<div class="[&[data-active]]:bg-bg-muted" />
```

**When to reach for arbitrary values:**
- Truly one-off values (a specific pixel offset for alignment)
- CSS properties Tailwind doesn't cover
- Complex selectors not available as variants

**When NOT to — extend the theme instead:** If the same arbitrary value appears more than twice, add it to `@theme` (see `config-theme-extend`).
