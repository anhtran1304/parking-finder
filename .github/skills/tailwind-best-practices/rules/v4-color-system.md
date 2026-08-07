---
title: v4 Color System and OKLCH
impact: MEDIUM
impactDescription: perceptually uniform colors with native opacity
tags: v4, colors, oklch, opacity, palette
---

## v4 Color System and OKLCH

Tailwind v4 uses OKLCH color space by default. Colors are perceptually uniform — equal lightness steps look equal to the human eye, unlike hex/RGB. Custom colors should follow this convention.

**Incorrect (hex values lose perceptual uniformity):**

```css
@theme {
  --color-brand-100: #e0e7ff;
  --color-brand-500: #6366f1;
  --color-brand-900: #312e81;
}
```

**Correct (OKLCH for consistency with the default palette):**

```css
@theme {
  --color-brand-100: oklch(0.943 0.029 294.588);
  --color-brand-500: oklch(0.585 0.233 277.117);
  --color-brand-900: oklch(0.302 0.098 281.553);
}
```

**Opacity with slash syntax:** Works on any color utility without extra configuration:

```html
<div class="bg-sky-500/50">50% opacity</div>
<div class="border-gray-200/75">75% opacity</div>
<div class="text-brand-500/[71.37%]">Arbitrary opacity</div>
<div class="bg-cyan-400/(--my-alpha)">CSS variable opacity</div>
```

**Using colors as CSS variables:** All `--color-*` theme tokens are available as native CSS variables:

```css
@layer components {
  .prose {
    color: var(--color-gray-950);
    a {
      color: var(--color-blue-500);
      &:hover {
        color: var(--color-blue-700);
      }
    }
  }
}
```

**The `--alpha()` function** for opacity in arbitrary CSS contexts:

```css
.overlay {
  background-color: --alpha(var(--color-gray-950) / 10%);
}
```

**Tip:** Use the [OKLCH Color Picker](https://oklch.com/) when defining custom colors. Hex values still work but won't blend consistently with the default palette's perceptual uniformity.
