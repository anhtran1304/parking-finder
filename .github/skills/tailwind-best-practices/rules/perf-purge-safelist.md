---
title: Never Construct Class Names Dynamically
impact: CRITICAL
impactDescription: prevents missing utilities in production
tags: perf, purge, safelist, dynamic-classes
---

## Never Construct Class Names Dynamically

Tailwind scans source files as plain text for complete class names. It doesn't execute your code — string concatenation, template literals, and dynamic expressions are invisible to the scanner.

**Incorrect (dynamic construction, classes not detected):**

```tsx
function Badge({ color }) {
  return <span className={`bg-${color}-500 text-${color}-50`}>New</span>
}
```

```tsx
const size = isLarge ? '6' : '4'
<div className={`p-${size}`} />
```

**Correct (complete class names, always detectable):**

```tsx
const colorStyles = {
  red: 'bg-red-500 text-red-50',
  blue: 'bg-blue-500 text-blue-50',
  green: 'bg-green-500 text-green-50',
}

function Badge({ color }) {
  return <span className={colorStyles[color]}>New</span>
}
```

```tsx
<div className={isLarge ? 'p-6' : 'p-4'} />
```

**When you truly can't avoid it** (e.g., colors from a CMS or database), use `@source inline()` in v4 to safelist specific utilities:

```css
@import "tailwindcss";
@source inline("bg-red-500 bg-blue-500 bg-green-500 text-red-50 text-blue-50 text-green-50");
```

**Rule of thumb:** If you can `grep` for the full class name in your source code, Tailwind can find it. If you can't, neither can Tailwind.
