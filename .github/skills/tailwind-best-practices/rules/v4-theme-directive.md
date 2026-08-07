---
title: Use @theme for Design Tokens in v4
impact: MEDIUM
impactDescription: replaces JS config with native CSS
tags: v4, theme, config, tokens
---

## Use @theme for Design Tokens in v4

Tailwind v4 replaces `tailwind.config.js` theme configuration with the `@theme` CSS directive. Design tokens are defined in CSS, enabling native cascade and IDE support.

**Incorrect (v3-style JS config in a v4 project):**

```js
// tailwind.config.js (unnecessary in v4)
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: { 500: '#6366f1', 600: '#4f46e5' },
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      },
    },
  },
}
```

**Correct (v4 CSS-first with @theme):**

```css
@import "tailwindcss";

@theme {
  --color-brand-500: #6366f1;
  --color-brand-600: #4f46e5;
  --font-display: "Inter", sans-serif;
}
```

Now `bg-brand-500`, `text-brand-600`, and `font-display` work as utilities. The values are also available as CSS custom properties throughout your stylesheet.

**Migration tip:** Run `npx @tailwindcss/upgrade` to automatically convert a v3 config to v4 CSS-first format.
