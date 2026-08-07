---
title: Mobile-First Responsive Design
impact: MEDIUM
impactDescription: ensures correct cascade behavior
tags: layout, responsive, mobile-first, breakpoints
---

## Mobile-First Responsive Design

Tailwind's breakpoints (`sm:`, `md:`, `lg:`) are min-width. Base styles apply to mobile; breakpoints add overrides for larger screens. Writing desktop-first causes broken mobile layouts.

**Incorrect (desktop-first, mobile is an afterthought):**

```html
<div class="grid grid-cols-3 gap-8 sm:grid-cols-1 sm:gap-4">
  <h1 class="text-4xl lg:text-4xl md:text-3xl sm:text-2xl">Title</h1>
</div>
```

**Correct (mobile-first, progressively enhance):**

```html
<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
  <h1 class="text-2xl md:text-3xl lg:text-4xl">Title</h1>
</div>
```

**Mental model:** Start with the smallest screen. Add breakpoints only when the layout needs to change. If mobile and desktop look the same for a property, you don't need a breakpoint for it.
