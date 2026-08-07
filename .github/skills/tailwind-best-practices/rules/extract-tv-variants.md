---
title: Use Tailwind Variants for Multi-Variant Components
impact: MEDIUM
impactDescription: type-safe variant management with built-in merge
tags: extract, tailwind-variants, variants, tv
---

## Use Tailwind Variants for Multi-Variant Components

When a component has multiple variant axes (size, color, state), manual string concatenation becomes error-prone. `tailwind-variants` provides a structured, type-safe API with built-in `tailwind-merge` support.

**Incorrect (manual variant strings, no type safety):**

```tsx
function Button({ variant, size, disabled, className }) {
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
  }
  const sizes = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }
  return (
    <button className={twMerge(
      'rounded font-medium',
      variants[variant],
      sizes[size],
      disabled && 'opacity-50 cursor-not-allowed',
      className,
    )} />
  )
}
```

**Correct (tailwind-variants — structured variants with built-in merge):**

```tsx
import { tv, type VariantProps } from 'tailwind-variants'

const button = tv({
  base: 'rounded font-medium',
  variants: {
    variant: {
      primary: 'bg-blue-500 text-white hover:bg-blue-600',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
      ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    },
    size: {
      sm: 'px-2 py-1 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
})

type ButtonProps = VariantProps<typeof button> & {
  className?: string
}

function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={button({ variant, size, className })} {...props} />
}
```

**Slots for compound components:** Style multiple elements from a single variant definition:

```tsx
const card = tv({
  slots: {
    base: 'rounded-lg border border-border',
    header: 'px-4 py-3 border-b border-border',
    body: 'px-4 py-4',
    footer: 'px-4 py-3 border-t border-border',
  },
  variants: {
    variant: {
      elevated: { base: 'shadow-md', header: 'bg-bg-muted' },
      flat: { base: 'shadow-none', header: 'bg-transparent' },
    },
  },
})

const { base, header, body, footer } = card({ variant: 'elevated' })
```

**When tailwind-variants is worth it:**
- 2+ variant axes (size × color, variant × state)
- Compound components with multiple styled slots
- You want TypeScript to enforce valid variant combinations

**When it's overkill:**
- Single variant axis — a plain object map (like `extract-apply-sparingly`) is simpler
- One-off components that won't be reused
