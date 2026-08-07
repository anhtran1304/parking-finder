---
title: Dark Mode with Semantic Color Tokens
impact: HIGH
impactDescription: maintainable theming without dark: everywhere
tags: util, dark-mode, theming, css-variables
---

## Dark Mode with Semantic Color Tokens

Sprinkling `dark:` on every element creates duplication and maintenance burden. Define semantic color tokens with CSS variables so components reference a single name and dark mode switches automatically.

**Incorrect (dark: on every element):**

```html
<div class="bg-white dark:bg-gray-900">
  <h1 class="text-gray-900 dark:text-white">Title</h1>
  <p class="text-gray-600 dark:text-gray-400">Body text</p>
  <div class="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
    <span class="text-gray-500 dark:text-gray-400">Caption</span>
  </div>
</div>
```

**Correct (semantic tokens with `:root` / `.dark` and `@theme inline`):**

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

/* Light theme — default values on :root */
:root {
  --color-bg: #ffffff;
  --color-bg-muted: #f9fafb;
  --color-fg: #111827;
  --color-fg-muted: #4b5563;
  --color-border: #e5e7eb;
}

/* Dark theme — override on .dark class */
.dark {
  --color-bg: #111827;
  --color-bg-muted: #1f2937;
  --color-fg: #f9fafb;
  --color-fg-muted: #9ca3af;
  --color-border: #374151;
}

/* Register as theme tokens so utilities are generated (see config-theme-extend) */
@theme inline {
  --color-bg: var(--color-bg);
  --color-bg-muted: var(--color-bg-muted);
  --color-fg: var(--color-fg);
  --color-fg-muted: var(--color-fg-muted);
  --color-border: var(--color-border);
}
```

```html
<div class="bg-bg">
  <h1 class="text-fg">Title</h1>
  <p class="text-fg-muted">Body text</p>
  <div class="border-border bg-bg-muted">
    <span class="text-fg-muted">Caption</span>
  </div>
</div>
```

Toggle dark mode by adding/removing the `.dark` class on `<html>`:

```js
document.documentElement.classList.toggle('dark')
```

**When `dark:` is still appropriate:**
- One-off overrides where a semantic token doesn't make sense
- Components with intentionally different dark mode behavior (e.g., inverted cards)
- Quick prototyping before establishing a token system
