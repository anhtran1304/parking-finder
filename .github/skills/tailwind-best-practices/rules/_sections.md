# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The section ID (in parentheses) is the filename prefix used to group rules.

---

## 1. Configuration & Setup (config)

**Impact:** CRITICAL
**Description:** Correct configuration ensures Tailwind works optimally. Misconfigured content paths or theme settings cause bloated output or missing utilities.

## 2. Performance & Bundle (perf)

**Impact:** CRITICAL
**Description:** Tailwind's utility-first approach can produce large CSS if not managed. Proper purging, safelist control, and avoiding unnecessary arbitrary values keep output lean.

## 3. Utility Patterns (util)

**Impact:** HIGH
**Description:** Consistent utility class usage improves readability, maintainability, and team collaboration. Covers class ordering, responsive patterns, and dark mode conventions.

## 4. Component Extraction (extract)

**Impact:** MEDIUM
**Description:** Knowing when to extract repeated utility patterns into components or @apply directives, and when to use variant libraries like CVA, prevents premature abstraction.

## 5. Responsive & Layout (layout)

**Impact:** MEDIUM
**Description:** Mobile-first responsive design, container queries, and proper breakpoint usage ensure layouts work across all screen sizes.

## 6. v4 Modern Features (v4)

**Impact:** MEDIUM
**Description:** Tailwind v4 introduces CSS-first configuration, @theme, new color system, and custom variants. Leveraging these features simplifies setup and unlocks new capabilities.

## 7. Accessibility (a11y)

**Impact:** LOW-MEDIUM
**Description:** Tailwind provides utilities for focus management, screen reader support, reduced motion, and forced colors. Using them correctly ensures inclusive interfaces.
