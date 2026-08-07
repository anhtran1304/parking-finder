---
title: Deduplicate and Merge Conflicting Classes
impact: CRITICAL
impactDescription: prevents visual bugs from conflicting utilities
tags: perf, deduplication, clsx, tailwind-merge, conflicts
---

## Deduplicate and Merge Conflicting Classes

When composing classes from multiple sources (props, variants, conditionals), conflicting utilities can collide. The last class in the HTML doesn't always win — CSS specificity depends on the order in the *stylesheet*, not the class attribute. Use `tailwind-merge` to resolve conflicts predictably.

**Incorrect (conflicting utilities, unpredictable result):**

```tsx
function Button({ className }) {
  return (
    <button className={`px-4 py-2 bg-blue-500 ${className}`}>
      Click
    </button>
  )
}

// Caller tries to override background — may not work
<Button className="bg-red-500" />
// Renders: class="px-4 py-2 bg-blue-500 bg-red-500"
// Which wins? Depends on stylesheet order, not class order.
```

**Correct (tailwind-merge resolves conflicts):**

```tsx
import { twMerge } from 'tailwind-merge'

function Button({ className }) {
  return (
    <button className={twMerge('px-4 py-2 bg-blue-500', className)}>
      Click
    </button>
  )
}

// Caller overrides cleanly
<Button className="bg-red-500" />
// Renders: class="px-4 py-2 bg-red-500"
```

**Combine with clsx for conditionals:**

```tsx
import { twMerge } from 'tailwind-merge'
import clsx from 'clsx'

function Button({ variant, disabled, className }) {
  return (
    <button
      className={twMerge(
        clsx(
          'px-4 py-2 rounded font-medium',
          variant === 'primary' && 'bg-blue-500 text-white',
          variant === 'secondary' && 'bg-gray-200 text-gray-800',
          disabled && 'opacity-50 cursor-not-allowed',
        ),
        className,
      )}
    />
  )
}
```

**Rule of thumb:** Any component that accepts a `className` prop should use `twMerge` to let callers override defaults safely.
