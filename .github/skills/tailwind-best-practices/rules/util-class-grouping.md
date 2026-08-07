---
title: Group Classes by Category in Compositions
impact: HIGH
impactDescription: scannable class strings in tv() and twMerge
tags: util, grouping, readability, tv, twMerge, conventions
---

## Group Classes by Category in Compositions

When using `tv()`, `twMerge`, or `clsx`, pass an array of strings grouped by category with comment headers. This makes long class lists scannable and diffs meaningful.

**Incorrect (single long string, hard to scan):**

```tsx
const button = tv({
  base: 'font-semibold text-base m-4 p-2 rounded flex items-center justify-center shadow-xs bg-blue-500 text-white disabled:opacity-40 hover:bg-blue-600 focus-visible:ring-2',
})
```

**Correct (grouped by category with comments):**

```tsx
const button = tv({
  base: [
    // Typography
    'font-semibold text-base',
    // Spacing & Layout
    'm-4 p-2 rounded flex items-center justify-center',
    // Decorative
    'shadow-xs bg-blue-500 text-white',
    // State
    'hover:bg-blue-600 focus-visible:ring-2 disabled:opacity-40',
  ],
})
```

**Same pattern works in variants:**

```tsx
const card = tv({
  base: [
    // Layout
    'flex flex-col gap-4',
    // Decorative
    'rounded-lg border border-border bg-bg',
    // Spacing
    'p-6',
  ],
  variants: {
    elevated: {
      true: [
        // Decorative
        'shadow-md border-transparent',
        // State
        'hover:shadow-lg transition-shadow',
      ],
    },
  },
})
```

**Works with twMerge and clsx too:**

```tsx
<div className={twMerge([
  // Layout
  'grid grid-cols-1 md:grid-cols-2 gap-6',
  // Spacing
  'mx-auto max-w-7xl px-4 md:px-6',
  // Conditional
  className,
])} />
```

**Suggested grouping order:**
1. **Typography** — font, text, leading, tracking
2. **Layout** — display, flex, grid, position, overflow
3. **Sizing** — w, h, min/max width/height
4. **Spacing** — m, p, gap
5. **Decorative** — bg, border, rounded, shadow, ring
6. **State** — hover, focus, disabled, active, group-*
7. **Responsive** — sm:, md:, lg: overrides

Not every group is needed in every composition — only use the ones that apply.
