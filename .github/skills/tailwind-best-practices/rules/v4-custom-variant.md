---
title: Define Custom Variants with @custom-variant
impact: MEDIUM
impactDescription: reusable state selectors without arbitrary variants
tags: v4, custom-variant, variants, selectors
---

## Define Custom Variants with @custom-variant

`@custom-variant` creates reusable variants that work like built-in ones (`hover:`, `focus:`, etc.). Use them instead of repeating arbitrary variants throughout your markup.

**Incorrect (arbitrary variants repeated everywhere):**

```html
<div class="[&[data-theme='midnight']_*]:bg-gray-900">...</div>
<p class="[&[data-theme='midnight']_*]:text-white">...</p>
<a class="[&[data-theme='midnight']_*]:text-blue-400">...</a>
```

**Correct (define once, use everywhere):**

```css
@custom-variant theme-midnight (&:where([data-theme="midnight"] *));
```

```html
<div class="theme-midnight:bg-gray-900">...</div>
<p class="theme-midnight:text-white">...</p>
<a class="theme-midnight:text-blue-400">...</a>
```

**Shorthand syntax** for simple selectors:

```css
/* Attribute selectors */
@custom-variant aria-current (&[aria-current="page"]);

/* Class-based dark mode (see util-dark-mode) */
@custom-variant dark (&:where(.dark, .dark *));
```

**Full syntax with `@slot`** for complex variants involving media queries or nesting:

```css
/* Hover only on devices that support it */
@custom-variant any-hover {
  @media (any-hover: hover) {
    &:hover {
      @slot;
    }
  }
}

/* Print-specific styles */
@custom-variant print {
  @media print {
    @slot;
  }
}
```

`@slot` marks where the utility declarations get inserted. `&` refers to the element the variant is applied to.

**Composes with other modifiers:**

```html
<button class="any-hover:focus:ring-2 any-hover:bg-blue-600">
  Hover effect only on capable devices
</button>
```

**When to use `@custom-variant`:**
- A selector pattern appears 3+ times across your markup
- You need media query + selector combinations
- You're implementing theme switching (data attributes, classes)

**When arbitrary variants are fine:**
- Truly one-off selectors (`[&>svg]:size-4`)
- Selectors specific to a single component
