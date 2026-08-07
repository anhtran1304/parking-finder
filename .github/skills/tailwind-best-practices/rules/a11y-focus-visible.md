---
title: Use focus-visible Over focus
impact: LOW-MEDIUM
impactDescription: proper keyboard vs mouse focus distinction
tags: a11y, focus, keyboard, accessibility
---

## Use focus-visible Over focus

`focus-visible` only shows focus rings for keyboard navigation, not mouse clicks. This provides accessibility for keyboard users without visual noise for mouse users.

**Incorrect (focus ring on every click):**

```html
<button class="focus:ring-2 focus:ring-blue-500 focus:outline-none">
  Click me
</button>
```

**Correct (focus ring only for keyboard users):**

```html
<button class="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none">
  Click me
</button>
```

**For custom interactive elements**, combine with outline-offset for better visibility:

```html
<a class="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
  Link
</a>
```

**Note:** All modern browsers support `:focus-visible`. There's no reason to use `focus:` for ring styles unless you explicitly want them on mouse click too.
