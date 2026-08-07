---
title: Use @apply Sparingly
impact: MEDIUM
impactDescription: prevents recreating CSS-in-CSS antipattern
tags: extract, apply, abstraction, components
---

## Use @apply Sparingly

`@apply` extracts utilities into CSS classes. Overusing it recreates the "name every element" problem that Tailwind eliminates. Prefer component extraction over class extraction.

**Incorrect (recreating BEM with @apply):**

```css
.btn {
  @apply px-4 py-2 rounded font-medium;
}
.btn-primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}
.btn-secondary {
  @apply bg-gray-200 text-gray-800 hover:bg-gray-300;
}
.btn-lg {
  @apply px-6 py-3 text-lg;
}
```

**Correct (extract a component instead):**

```tsx
function Button({ variant = 'primary', size = 'md', children, ...props }) {
  const styles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  }
  const sizes = {
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button className={`rounded font-medium ${styles[variant]} ${sizes[size]}`} {...props}>
      {children}
    </button>
  )
}
```

**When @apply IS appropriate:**
- Base styles for elements you don't control (e.g., prose content from a CMS)
- Third-party library overrides
- Keyframe animations referencing utility values
