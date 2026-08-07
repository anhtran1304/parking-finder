---
title: Extend Theme with @theme
impact: CRITICAL
impactDescription: correct token definition drives all utilities
tags: config, theme, tokens, v4, css-variables
---

## Extend Theme with @theme

In v4, `@theme` defines design tokens as CSS custom properties. The variable name determines which utilities are generated — get the naming wrong and the utility won't exist.
Theme variables are also required to be defined top-level and not nested under other selectors or media queries, and using a special syntax makes it possible to enforce that.

**Incorrect (wrong variable names, no utilities generated):**

```css
@theme {
  --brand-color: #6366f1;       /* ✗ no utility — missing namespace */
  --my-spacing-big: 3rem;       /* ✗ no utility — wrong prefix */
  --font-size-huge: 4rem;       /* ✗ wrong — should be --text-* for font-size */
}
```

**Correct (follows Tailwind's namespace conventions):**

```css
@theme {
  --color-brand: #6366f1;          /* → bg-brand, text-brand, border-brand */
  --spacing-18: 4.5rem;            /* → p-18, m-18, gap-18 */
  --font-size-huge: 4rem;          /* → text-huge */
  --font-display: "Inter", sans-serif; /* → font-display */
  --radius-pill: 9999px;           /* → rounded-pill */
  --breakpoint-3xl: 120rem;        /* → 3xl: responsive prefix */
}
```

**Theme variable namespaces:**

| Namespace | Utilities generated |
|-----------|---------------------|
| `--color-*` | Color utilities like `bg-red-500`, `text-sky-300` |
| `--font-*` | Font family utilities like `font-sans` |
| `--text-*` | Font size utilities like `text-xl` |
| `--font-weight-*` | Font weight utilities like `font-bold` |
| `--tracking-*` | Letter spacing utilities like `tracking-wide` |
| `--leading-*` | Line height utilities like `leading-tight` |
| `--breakpoint-*` | Responsive breakpoint variants like `sm:*` |
| `--container-*` | Container query variants like `@sm:*` and size utilities like `max-w-md` |
| `--spacing-*` | Spacing and sizing utilities like `px-4`, `max-h-16` |
| `--radius-*` | Border radius utilities like `rounded-sm` |
| `--shadow-*` | Box shadow utilities like `shadow-md` |
| `--inset-shadow-*` | Inset box shadow utilities like `inset-shadow-xs` |
| `--drop-shadow-*` | Drop shadow filter utilities like `drop-shadow-md` |
| `--blur-*` | Blur filter utilities like `blur-md` |
| `--perspective-*` | Perspective utilities like `perspective-near` |
| `--aspect-*` | Aspect ratio utilities like `aspect-video` |
| `--ease-*` | Transition timing function utilities like `ease-out` |
| `--animate-*` | Animation utilities like `animate-spin` |

**Defining animation keyframes:** Define `@keyframes` inside `@theme` alongside `--animate-*` variables:

```css
@theme {
  --animate-fade-in-scale: fade-in-scale 0.3s ease-out;

  @keyframes fade-in-scale {
    0% {
      opacity: 0;
      transform: scale(0.95);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
}
```

If you want `@keyframes` always included even without an `--animate-*` variable, define them outside `@theme` instead.

**Referencing other variables:** Use `@theme inline` when a variable references another variable:

```css
/* ✗ Without inline — resolves at definition site, not usage site */
@theme {
  --font-sans: var(--font-inter);  /* may resolve to fallback unexpectedly */
}

/* ✓ With inline — value is inlined into utilities */
@theme inline {
  --font-sans: var(--font-inter);
}
```

With `inline`, the generated utility uses the variable value directly:

```css
/* Generated CSS */
.font-sans {
  font-family: var(--font-inter);  /* resolves correctly at point of use */
}
```

Without `inline`, CSS variable scoping can cause values to resolve where they're defined rather than where they're used — leading to silent fallback behavior.

**Override vs extend:** `@theme` merges with Tailwind's defaults. To clear a namespace and replace entirely:

```css
@theme {
  --color-*: initial;    /* removes ALL default colors */
  --color-brand: #6366f1;
  --color-surface: #f8fafc;
}
```

**Defaults that users can override:** Use `@theme default` to set fallback values that projects can replace:

```css
@theme default {
  --color-accent: #6366f1;  /* used unless overridden by a later @theme */
}
```
