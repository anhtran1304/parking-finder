---
title: Respect Reduced Motion Preferences
impact: LOW-MEDIUM
impactDescription: prevents motion sickness and seizure triggers
tags: a11y, motion, animation, prefers-reduced-motion
---

## Respect Reduced Motion Preferences

Some users enable "Reduce motion" in their OS settings due to vestibular disorders, motion sickness, or seizure sensitivity. Tailwind provides `motion-safe:` and `motion-reduce:` variants to respect this preference.

**Incorrect (animations ignore user preference):**

```html
<div class="animate-bounce">Notification</div>

<div class="transition-transform duration-300 hover:scale-105">
  Card
</div>
```

**Correct (opt-in animations with motion-safe):**

```html
<!-- Only animate when user hasn't requested reduced motion -->
<div class="motion-safe:animate-bounce">Notification</div>

<div class="transition-transform duration-300 motion-safe:hover:scale-105">
  Card
</div>
```

**Alternative approach — disable animations with motion-reduce:**

```html
<!-- Animate by default, disable for reduced-motion users -->
<div class="animate-spin motion-reduce:animate-none">
  <LoaderIcon />
</div>

<!-- Instant transitions for reduced-motion users -->
<div class="transition-all duration-300 motion-reduce:duration-0">
  Sidebar
</div>
```

**Which approach to use:**
- **`motion-safe:`** (opt-in) — safer default, animations are progressive enhancement
- **`motion-reduce:`** (opt-out) — when the animation is important for understanding (e.g., a loading spinner should still appear, just not spin)

**What to keep for reduced-motion users:**
- Opacity transitions (fades are generally safe)
- Color transitions
- Instant state changes (0ms duration)

**What to remove:**
- Translation/transform animations (sliding, bouncing, scaling)
- Parallax effects
- Auto-playing carousels or marquees
- Continuous looping animations
