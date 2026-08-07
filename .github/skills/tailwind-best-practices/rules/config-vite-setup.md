---
title: Use the Vite Plugin Over PostCSS
impact: CRITICAL
impactDescription: faster builds with native Vite integration
tags: config, vite, postcss, setup, v4
---

## Use the Vite Plugin Over PostCSS

Tailwind v4 ships a dedicated Vite plugin that's faster than the PostCSS path. If you're using Vite (or a Vite-based framework like Next.js, Remix, SvelteKit, etc.), prefer `@tailwindcss/vite` over `@tailwindcss/postcss`.

**Incorrect (using PostCSS when on Vite):**

```js
// postcss.config.js — unnecessary overhead with Vite
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

**Correct (Vite plugin):**

```js
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})
```

Then import Tailwind in your CSS entry point:

```css
@import "tailwindcss";
```

**When PostCSS is still needed:** Only if your build tool doesn't support Vite plugins (e.g., webpack, Parcel, or a legacy pipeline). In that case, use `@tailwindcss/postcss`.
