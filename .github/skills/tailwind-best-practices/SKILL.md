---
description:
  This skill should be used when writing, reviewing, or refactoring Tailwind CSS code to ensure optimal patterns and conventions. Triggers on tasks involving Tailwind utility classes, responsive design, dark mode, component styling, CSS configuration, or Tailwind v4 migration.
---

# Tailwind CSS Best Practices

Comprehensive guide for writing clean, performant, and maintainable Tailwind CSS, covering configuration, utility patterns, component extraction, and v4 modern features. Contains rules across 7 categories, prioritized by impact.

## When to Apply

Reference these guidelines when:
- Writing new components with Tailwind utility classes
- Configuring Tailwind (v3 or v4)
- Reviewing code for CSS/styling issues
- Refactoring existing Tailwind code
- Migrating from v3 to v4
- Optimizing bundle size or styling performance

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Configuration & Setup | CRITICAL | `config-` |
| 2 | Performance & Bundle | CRITICAL | `perf-` |
| 3 | Utility Patterns | HIGH | `util-` |
| 4 | Component Extraction | MEDIUM | `extract-` |
| 5 | Responsive & Layout | MEDIUM | `layout-` |
| 6 | v4 Modern Features | MEDIUM | `v4-` |
| 7 | Accessibility | LOW-MEDIUM | `a11y-` |

## Quick Reference

### 1. Configuration & Setup (CRITICAL)

- `config-content-paths` - Configure source detection with @source
- `config-v4-css-first` - No tailwind.config.js in v4
- `config-theme-extend` - Extend theme with @theme and namespaces
- `config-vite-setup` - Use Vite plugin over PostCSS

### 2. Performance & Bundle (CRITICAL)

- `perf-avoid-arbitrary-bloat` - Use the design scale, extend theme for repeats
- `perf-class-deduplication` - Use tailwind-merge for conflicting classes
- `perf-purge-safelist` - Never construct class names dynamically

### 3. Utility Patterns (HIGH)

- `util-class-ordering` - Consistent class ordering with Prettier plugin
- `util-responsive-first` - Avoid redundant responsive prefixes
- `util-dark-mode` - Semantic color tokens with :root / .dark
- `util-arbitrary-values` - Correct syntax for arbitrary values and variants
- `util-group-peer` - Relational styling with group and peer
- `util-class-grouping` - Group classes by category in tv() and twMerge

### 4. Component Extraction (MEDIUM)

- `extract-apply-sparingly` - Use @apply sparingly, prefer components
- `extract-tv-variants` - Use tailwind-variants for multi-variant components
- `extract-component-not-class` - Extract components, not CSS classes

### 5. Responsive & Layout (MEDIUM)

- `layout-mobile-first` - Mobile-first, progressively enhance
- `layout-container-queries` - Container queries for component-level responsiveness
- `layout-breakpoint-patterns` - Common responsive layout recipes

### 6. v4 Modern Features (MEDIUM)

- `v4-theme-directive` - Use @theme for design tokens
- `v4-color-system` - OKLCH colors and opacity slash syntax
- `v4-custom-variant` - Reusable variants with @custom-variant

### 7. Accessibility (LOW-MEDIUM)

- `a11y-focus-visible` - Use focus-visible over focus
- `a11y-sr-only` - Visually hidden labels for screen readers
- `a11y-motion-reduce` - Respect reduced motion preferences
- `a11y-forced-colors` - Support forced colors / high contrast mode

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/util-class-ordering.md
rules/extract-apply-sparingly.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references
