---
title: No tailwind.config.js in v4
impact: CRITICAL
impactDescription: eliminates unnecessary JS config file
tags: config, v4, css-first, zero-config
---

## No tailwind.config.js in v4

Tailwind v4 is CSS-first. Everything that used to live in `tailwind.config.js` now has a CSS-native equivalent. Don't create a config file out of habit — it's not needed.

**Incorrect (v3 reflex — creating a JS config on a v4 project):**

```js
// tailwind.config.js — unnecessary in v4
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: { brand: '#6366f1' },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
```

**Correct (CSS-first, no config file):**

```css
@import "tailwindcss";

@theme {
  --color-brand: #6366f1;
}

@plugin "@tailwindcss/typography";
```

**CSS equivalents for every config section:**

| `tailwind.config.js` | CSS-first equivalent |
|-----------------------|----------------------|
| `content: [...]` | `@source` / `source()` |
| `theme.extend` | `@theme` |
| `plugins: [...]` | `@plugin` |
| Custom variants | `@custom-variant` |
| Prefix | `@import "tailwindcss" prefix(tw)` |

**When JS config is still needed:** Only if you're writing a custom plugin with JavaScript logic that can't be expressed as a CSS `@plugin`. This is rare.
