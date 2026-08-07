---
title: Use Container Queries for Component-Level Responsiveness
impact: MEDIUM
impactDescription: components adapt to their container, not the viewport
tags: layout, container-queries, responsive, @container
---

## Use Container Queries for Component-Level Responsiveness

Viewport breakpoints (`md:`, `lg:`) couple components to page layout. Container queries (`@sm:`, `@md:`) let components respond to their own container width — making them truly reusable across different layout contexts.

**Incorrect (viewport breakpoints — breaks when placed in a sidebar):**

```html
<div class="grid grid-cols-1 md:grid-cols-3">
  <!-- This card assumes it has full viewport width at md: -->
  <div class="flex flex-col md:flex-row gap-4">
    <img class="w-full md:w-48" />
    <div>...</div>
  </div>
</div>
```

**Correct (container queries — adapts to available space):**

```html
<div class="@container">
  <div class="flex flex-col @md:flex-row gap-4">
    <img class="w-full @md:w-48" />
    <div>...</div>
  </div>
</div>
```

The `@container` class marks the query boundary. Children use `@sm:`, `@md:`, `@lg:` etc. to respond to the container's width instead of the viewport.

**Named containers** for targeting a specific ancestor:

```html
<div class="@container/card">
  <div class="@container/header">
    <h2 class="text-base @md/card:text-xl">Responds to card width</h2>
    <span class="hidden @sm/header:inline">Responds to header width</span>
  </div>
</div>
```

**Custom container sizes via @theme:**

```css
@theme {
  --container-prose: 65ch;
}
```

```html
<!-- Triggers at 65ch container width -->
<div class="@container">
  <div class="@prose:columns-2">...</div>
</div>
```

**When to use container vs viewport queries:**
- **Container (`@md:`)** — reusable components (cards, widgets, form fields) that may live in different layout contexts
- **Viewport (`md:`)** — page-level layout (grid columns, navigation, sidebars)
