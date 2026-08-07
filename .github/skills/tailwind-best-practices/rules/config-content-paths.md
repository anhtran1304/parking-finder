---
title: Configure Content Paths Correctly
impact: CRITICAL
impactDescription: prevents missing utilities in production
tags: config, purge, content, setup
---

## Configure Content Paths Correctly

Tailwind will scan every file in your project for class names, except in the following cases:
- Files that are in your `.gitignore` file
- Files in the `node_modules` directory
- Binary files like images, videos, or zip files
- CSS files
- Common package manager lock files
- If you need to scan any files that Tailwind is ignoring by default, you can explicitly register those sources.

Content paths tell Tailwind which files to scan for class names. Missing paths cause utilities to be purged in production even though they work in development.

**Tailwind v4 (CSS-first):**

```css
@import "tailwindcss";
/* 
  To set the base path for source detection explicitly, use the `source()` function when importing Tailwind in your CSS
  This can be useful when working with monorepos where your build commands run from the root of the monorepo instead of the root of each project.
*/
@import "tailwindcss" source("../src");
/* 
  Use `source(none)` to completely disable automatic source detection if you want to register all of your sources explicitly.
  This can be useful in projects that have multiple Tailwind stylesheets where you want to make sure each one only includes the classes each stylesheet needs.
*/
@import "tailwindcss" source(none);
/* 
  Use `@source` to explicitly register source paths relative to the stylesheet.
  This is especially useful when you need to scan an external library that is built with Tailwind,
  since dependencies are usually listed in your `.gitignore` file and ignored by Tailwind by default.
*/
@source "../node_modules/@acmecorp/ui-lib";
/* 
  Use `@source not` to ignore specific paths, relative to the stylesheet, when scanning for class names.
  This is useful when you have large directories in your project that you know don't use Tailwind classes, like legacy components or third-party libraries.
*/
@source not "../src/components/legacy";
```

**Tip:** If a utility class works in dev but vanishes in production, check content paths first — it's the #1 cause.
