---
title: Extract Components, Not CSS Classes
impact: MEDIUM
impactDescription: keeps abstraction in the component layer where it belongs
tags: extract, components, abstraction, reuse
---

## Extract Components, Not CSS Classes

When you see repeated utility patterns, the instinct is to extract a CSS class. Resist — extract a component instead. Tailwind's abstraction layer is components, not stylesheets.

**Incorrect (extracting CSS classes for reuse):**

```css
/* styles.css */
.card {
  @apply rounded-lg border border-border bg-bg p-6 shadow-sm;
}
.card-title {
  @apply text-lg font-semibold text-fg;
}
.card-description {
  @apply text-sm text-fg-muted;
}
```

```html
<div class="card">
  <h3 class="card-title">Title</h3>
  <p class="card-description">Description</p>
</div>
```

**Correct (extract a component):**

```tsx
function Card({ children, className }) {
  return (
    <div className={twMerge('rounded-lg border border-border bg-bg p-6 shadow-sm', className)}>
      {children}
    </div>
  )
}

function CardTitle({ children }) {
  return <h3 className="text-lg font-semibold text-fg">{children}</h3>
}

function CardDescription({ children }) {
  return <p className="text-sm text-fg-muted">{children}</p>
}
```

**Why components over classes:**
- Components carry behavior, props, and types — classes are just styles
- Components are discoverable via imports — classes require grep
- Components compose with `children` and props — classes only compose via string concatenation
- Components work with TypeScript — classes have no type checking

**The decision tree:**

1. Used once → leave the utilities inline
2. Used 2-3 times, styles only → still inline, or a simple variable
3. Used widely, styles + structure → extract a component
4. Used widely, styles + variants → extract with `tv()` (see `extract-tv-variants`)
