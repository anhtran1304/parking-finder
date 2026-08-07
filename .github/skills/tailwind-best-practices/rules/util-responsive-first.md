---
title: Avoid Redundant Responsive Prefixes
impact: HIGH
impactDescription: cleaner markup, fewer classes to maintain
tags: util, responsive, breakpoints, mobile-first
---

## Avoid Redundant Responsive Prefixes

Unprefixed utilities apply at all screen sizes. Breakpoint prefixes (`sm:`, `md:`, etc.) are additive min-width overrides that stack upward. Don't repeat a value at every breakpoint when the base already covers it.

**Incorrect (redundant prefixes, same value repeated):**

```html
<div class="p-4 sm:p-4 md:p-4 lg:p-6 xl:p-6">
  <h1 class="text-lg sm:text-lg md:text-xl lg:text-2xl xl:text-2xl">Title</h1>
</div>
```

**Correct (only specify where the value changes):**

```html
<div class="p-4 lg:p-6">
  <h1 class="text-lg md:text-xl lg:text-2xl">Title</h1>
</div>
```

**Breakpoints stack upward.** `md:text-xl` applies at `md` *and above* until overridden by a larger breakpoint. No need to repeat it at `lg:` and `xl:`.

**Max-width breakpoints in v4:** Use the `max-*` variant when you need a style only below a certain breakpoint:

```html
<!-- Show only on mobile, hide from md up -->
<nav class="block max-md:block md:hidden">Mobile nav</nav>

<!-- Different padding below and above lg -->
<div class="max-lg:p-4 lg:p-8">Content</div>
```

**Breakpoint ranges in v4:** Combine `min-*` and `max-*` for a specific range:

```html
<!-- Only between md and xl -->
<div class="md:max-xl:grid-cols-2">Sidebar layout</div>
```
