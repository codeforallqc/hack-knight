# HackKnight Frontend — Setup Changelog

> Documents all changes made to the `Frontend/` directory during initial CSS system setup.
> Branch: `main` | Date: 2026-04-02

---

## Summary of Changes

| File | Status | What Changed |
|---|---|---|
| `index.html` | Modified | Added Google Fonts link |
| `vite.config.js` | Modified | Added `@tailwindcss/vite` plugin |
| `tailwind.config.js` | Created | Full design token config |
| `src/index.css` | Replaced | Swapped to Tailwind v4 syntax + base layer |
| `src/styles/components.css` | Created | All reusable component classes |
| `src/App.jsx` | Replaced | Component showcase with Framer Motion |

---

## File-by-File Details

### `index.html`
Added the Google Fonts `<link>` tag inside `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;900&family=Lexend:wght@300;400;600&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
```
> **Rule:** Do not re-import fonts inside any component file — this is the single source of truth.

---

### `vite.config.js`
Added the Tailwind CSS Vite plugin so that Tailwind v4 processes styles through the build pipeline:
```js
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

---

### `tailwind.config.js` *(new file)*
Created from scratch with all design tokens used across the site.

#### Colors
| Token | Hex | Use |
|---|---|---|
| `void` | `#0a0a0f` | Page background |
| `surface` | `#12121a` | Cards, navbar |
| `border` | `#1e1e2e` | Dividers, outlines |
| `ultraviolet` | `#7c3aed` | Primary accent, CTAs |
| `violet-light` | `#a78bfa` | Hover states |
| `violet-dark` | `#5b21b6` | Active/pressed |
| `text-primary` | `#f4f4f5` | Headings |
| `text-secondary` | `#a1a1aa` | Body copy |
| `text-muted` | `#52525b` | Placeholders |
| `sponsor-gold` | `#f59e0b` | Gold tier |
| `sponsor-silver` | `#94a3b8` | Silver tier |
| `sponsor-bronze` | `#b45309` | Bronze tier |

#### Typography
| Token | Family | Use |
|---|---|---|
| `font-display` | Space Grotesk | H1, H2, logo |
| `font-body` | Lexend | Paragraphs, buttons, nav links |
| `font-mono` | JetBrains Mono | Countdown timer digits |

> **Note:** Display font was originally `Orbitron` in the spec but corrected to `Space Grotesk` to match the actual Google Fonts import.

#### Custom Font Sizes
| Token | Size | Use |
|---|---|---|
| `text-hero` | 4.5rem | Main landing headline |
| `text-section` | 2.25rem | Section headings |
| `text-card` | 1.125rem | Card body text |

#### Custom Spacing
| Token | Value | Use |
|---|---|---|
| `py-section` | 6rem | Vertical section padding |
| `px-container` | 1.5rem | Horizontal page gutters |

#### Custom Border Radius
| Token | Value | Use |
|---|---|---|
| `rounded-card` | 1rem | Cards, panels |
| `rounded-pill` | 9999px | Buttons, badges |

#### Custom Shadows
| Token | Use |
|---|---|
| `shadow-glow` | Ultraviolet glow on CTAs |
| `shadow-card` | Card elevation |

#### Animations
| Token | Duration | Use |
|---|---|---|
| `animate-marquee` | 30s linear | Sponsor carousel scroll |
| `animate-pulseGlow` | 2s ease-in-out | CTA button pulse |
| `animate-fadeUp` | 0.6s ease | Scroll reveal (CSS fallback) |
| `animate-fadeIn` | 0.4s ease | General fade |

---

### `src/index.css` *(replaced)*
Old file was plain CSS variables. Replaced entirely with Tailwind v4 syntax:

```css
@import "tailwindcss";
@config "../tailwind.config.js";

@import "./styles/components.css";

@layer base {
  html { scroll-behavior: smooth; }
  body { @apply bg-void text-text-primary font-body; }
  h1, h2, h3 { @apply font-display; }

  /* Reduced motion accessibility */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

> **Why `@import "tailwindcss"` instead of `@tailwind base/components/utilities`?**
> The project uses Tailwind v4, which replaced the three `@tailwind` directives with a single `@import "tailwindcss"`.

---

### `src/styles/components.css` *(new file)*
Created all reusable component classes using `@apply`. Added `@reference "tailwindcss"` at the top — required in Tailwind v4 for `@apply` to resolve custom tokens in a separately imported CSS file.

#### Components defined
| Class | Description |
|---|---|
| `.btn-primary` | Filled violet CTA button with pulse glow animation |
| `.btn-outline` | Bordered button with violet glow on hover |
| `.card` | Dark surface panel with hover lift and glow |
| `.card-team` | Card variant — centered column layout for team members |
| `.card-sponsor` | Card variant — grayscale by default, color on hover |
| `.section-wrapper` | Max-width page section with standard padding |
| `.section-title` | Display font section heading |
| `.section-subtitle` | Body font secondary heading text |
| `.navbar` | Fixed top bar with blur backdrop |
| `.navbar-link` | Nav anchor with hover color transition |
| `.timer-digit` | Mono font large violet number |
| `.timer-label` | Small muted uppercase unit label |
| `.faq-item` | Bordered accordion container |
| `.faq-question` | Full-width clickable accordion header |
| `.faq-answer` | Accordion body text |
| `.badge-gold` | Gold sponsor tier badge pill |
| `.badge-silver` | Silver sponsor tier badge pill |
| `.badge-bronze` | Bronze sponsor tier badge pill |
| `.schedule-tab` | Inactive tab pill |
| `.schedule-tab-active` | Active tab pill with violet fill |
| `.marquee-track` | Scrolling flex row with marquee animation |
| `.marquee-wrapper` | Overflow container; pauses on hover |

> **Tailwind v4 gotcha:** You cannot `@apply` a custom component class (e.g. `@apply card`) inside another class in the same file. `.card-team` and `.card-sponsor` have their base card utilities repeated inline instead of extending `.card`.

---

### `src/App.jsx` *(replaced)*
Replaced the default Vite starter template with a **component showcase page** for team reference. Uses:
- `motion` (Framer Motion v11) — imported as `import { motion } from 'motion/react'`
- `fadeUp` variant on every section using `whileInView` + `viewport={{ once: true }}`
- `staggerContainer` + `staggerChildren: 0.1` demonstrated on the `.card-team` grid

---

## Framer Motion Notes

The `motion` package was already listed in `package.json`. No install needed.

> **Import path for v11+:**
> ```js
> import { motion } from 'motion/react'  // correct
> import { motion } from 'framer-motion' // old package name — do not use
> ```

### Standard scroll reveal pattern
```jsx
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
};

<motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
  <div className="card">...</div>
</motion.div>
```

### Staggered grid pattern
```jsx
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

<motion.div
  className="grid grid-cols-3 gap-6"
  variants={staggerContainer}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
>
  {items.map(item => (
    <motion.div key={item.name} variants={fadeUp}>
      <div className="card-team">...</div>
    </motion.div>
  ))}
</motion.div>
```
