---
title: Consistent Class Ordering
impact: HIGH
impactDescription: improves readability and maintainability
tags: util, ordering, conventions, prettier
---

## Consistent Class Ordering

A consistent class order makes scanning utility strings predictable. Use the Prettier plugin for automatic enforcement; when writing manually, follow this logical grouping.

**Incorrect (random order, hard to scan):**

```html
<div class="text-white p-4 flex bg-blue-500 rounded-lg hover:bg-blue-600 md:p-6 items-center shadow-lg">
```

**Correct (logical grouping: layout → sizing → spacing → typography → visual → interactive → responsive):**

```html
<div class="flex items-center p-4 md:p-6 text-white bg-blue-500 rounded-lg shadow-lg hover:bg-blue-600">
```

**Recommended:** Install `prettier-plugin-tailwindcss` to automate this:

```bash
npm install -D prettier-plugin-tailwindcss
```

The plugin sorts classes following Tailwind's recommended order, eliminating debates and ensuring consistency across the team.
