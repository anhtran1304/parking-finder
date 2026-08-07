---
title: Common Responsive Layout Patterns
impact: MEDIUM
impactDescription: proven patterns for typical layout needs
tags: layout, breakpoints, grid, patterns
---

## Common Responsive Layout Patterns

Reusable layout recipes for common responsive scenarios. Start with these before inventing custom solutions.

**Stack to row:**

```html
<div class="flex flex-col md:flex-row gap-4">
  <div class="md:flex-1">Main</div>
  <div class="md:w-64">Sidebar</div>
</div>
```

**Responsive grid (auto-fill):**

```html
<!-- Cards fill available space, minimum 16rem each -->
<div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
  <div>Card</div>
  <div>Card</div>
  <div>Card</div>
</div>
```

**Responsive grid (explicit columns):**

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div>Item</div>
  <div>Item</div>
  <div>Item</div>
</div>
```

**Full-bleed within constrained parent:**

```html
<div class="mx-auto max-w-prose">
  <p>Constrained text content</p>
  <!-- Break out to full width -->
  <img class="-mx-[calc(50vw-50%)] w-screen max-w-none" />
  <p>Back to constrained</p>
</div>
```

**Sticky sidebar with scrollable main:**

```html
<div class="flex gap-6">
  <aside class="sticky top-0 hidden h-dvh w-64 shrink-0 overflow-y-auto md:block">
    Navigation
  </aside>
  <main class="min-w-0 flex-1">Content</main>
</div>
```

**Centered content with consistent padding:**

```html
<div class="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">
  Content
</div>
```

**Tip:** Prefer `auto-fill`/`auto-fit` grids over explicit column breakpoints when the number of items is dynamic — the grid handles responsiveness automatically without breakpoint classes.
