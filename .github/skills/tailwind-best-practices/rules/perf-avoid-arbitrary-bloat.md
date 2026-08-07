---
title: Avoid Arbitrary Value Bloat
impact: CRITICAL
impactDescription: reduces CSS output size
tags: perf, arbitrary, bundle, bloat
---

## Avoid Arbitrary Value Bloat

Arbitrary values (`[...]`) generate one-off CSS rules that can't be deduplicated. Overusing them defeats Tailwind's utility reuse model and inflates bundle size.

**Incorrect (arbitrary values for common spacing):**

```html
<div class="mt-[13px] mb-[27px] p-[19px] gap-[11px]">
  <span class="text-[15px] leading-[22px]">Content</span>
</div>
```

**Correct (use the design scale, extend when needed):**

```html
<div class="mt-3 mb-7 p-5 gap-3">
  <span class="text-sm leading-relaxed">Content</span>
</div>
```

If you genuinely need a custom value repeatedly, extend the theme instead of using arbitrary values everywhere:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: { '18': '4.5rem' },
    },
  },
}
```

**Rule of thumb:** If you use the same arbitrary value more than twice, it belongs in your theme.
