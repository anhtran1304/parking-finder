---
title: Use group and peer for Relational Styling
impact: HIGH
impactDescription: eliminates JS for parent/sibling state reactions
tags: util, group, peer, state, selectors
---

## Use group and peer for Relational Styling

`group-*` styles a child based on parent state. `peer-*` styles an element based on a sibling's state. Both eliminate JavaScript for common interactive patterns.

**Incorrect (JS for parent hover effect on child):**

```tsx
function Card() {
  const [hovered, setHovered] = useState(false)
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <img className={hovered ? 'scale-105' : 'scale-100'} />
      <span className={hovered ? 'text-blue-500' : 'text-gray-500'}>View</span>
    </div>
  )
}
```

**Correct (group — parent state drives child styling):**

```html
<div class="group">
  <img class="transition group-hover:scale-105" />
  <span class="text-gray-500 group-hover:text-blue-500">View</span>
</div>
```

**peer — sibling state drives styling:**

```html
<label>
  <input type="checkbox" class="peer sr-only" />
  <span class="text-fg-muted peer-checked:text-fg peer-checked:font-medium">
    Option
  </span>
</label>
```

**Named groups/peers for nesting:** When groups are nested, name them to avoid ambiguity:

```html
<div class="group/card">
  <div class="group/header">
    <h2 class="group-hover/card:text-blue-500">Card title</h2>
    <button class="opacity-0 group-hover/header:opacity-100">Edit</button>
  </div>
</div>
```

**Available state modifiers:** `group-hover`, `group-focus`, `group-active`, `group-focus-within`, `group-has-*`, `group-not-*` — same for `peer-*`.

**Ordering rule:** `peer-*` only works on *subsequent* siblings. The `peer` element must come before the element that reacts to it in the DOM.
