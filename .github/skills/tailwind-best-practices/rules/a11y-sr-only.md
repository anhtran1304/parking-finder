---
title: Use sr-only for Screen Reader Content
impact: LOW-MEDIUM
impactDescription: accessible labels without visual clutter
tags: a11y, sr-only, screen-reader, accessibility, icons
---

## Use sr-only for Screen Reader Content

`sr-only` visually hides content while keeping it accessible to screen readers. Use it whenever a visual element's meaning isn't clear without context — icon-only buttons, standalone icons, or table headers.

**Decorative vs meaningful icons:** Icons are decorative when accompanied by visible text, meaningful when they stand alone. Only meaningful icons need `sr-only` labels.

**Incorrect (aria-label on icon, or no label at all):**

```tsx
// ✗ Don't add labels to icons within buttons that have visible text
<button>
  <Plus aria-label="Plus icon" />
  Add document
</button>

// ✗ Icon-only button with no accessible name
<button>
  <House />
</button>

// ✗ aria-label is not translatable by browser translation tools
<button aria-label="Go to home">
  <House />
</button>
```

**Correct (sr-only for meaningful icons, nothing for decorative):**

```tsx
// ✓ Button with visible text — icon is decorative, no label needed
<button>
  <Plus />
  Add document
</button>

// ✓ Icon-only button — sr-only provides translatable accessible name
<button>
  <House />
  <span class="sr-only">Go to home</span>
</button>

// ✓ Standalone icon with sr-only context
<div>
  <Phone />
  <span class="sr-only">Phone number</span>
</div>
```

**Other common use cases:**

```html
<!-- "Skip to content" link — visible on focus -->
<a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-bg focus:px-4 focus:py-2">
  Skip to main content
</a>

<!-- Form labels when visual design omits them -->
<label>
  <span class="sr-only">Search</span>
  <input type="search" placeholder="Search..." />
</label>

<!-- Table context -->
<th class="sr-only">Actions</th>
```

**`not-sr-only` reverses the effect** — useful with `focus:` to create skip links that appear only when focused via keyboard.

**Prefer `sr-only` over `aria-label`** — `sr-only` text is translatable by browser translation tools, while `aria-label` strings are not.
