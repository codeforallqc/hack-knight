# HackKnight — Design System (MASTER)

> Single source of truth for all visual decisions. The canonical tokens live in
> [`frontend/src/index.css`](frontend/src/index.css) (Tailwind v4 `@theme`); this
> document explains how to use them and defines the **Admin (backstage) layer**.
> No magic numbers, no rogue hex values — every color, spacing, radius, shadow,
> duration, and easing in the codebase must resolve to a token below.

---

## 1. Theses

**Visual** — The admin is HackKnight's backstage: same void/surface palette,
ultraviolet accent and glow shadows, Space Grotesk headings with JetBrains Mono
uppercase labels, 1rem-radius bordered surface panels — but denser and calmer
than the public site: tighter spacing, no pulsing CTAs, glow reserved for
primary actions, drag states, and unsaved-change indicators.

**Interaction** — Functional, minimal motion. Fast transitions (150–250ms,
`ease-brand`), hover = border/glow shift (no scale on dense controls),
drag-to-reorder cards lift with a subtle scale + ultraviolet glow, staged
changes reviewed in a plain fade-in diff modal before saving.
**Forbidden in the admin:** bounce, elastic, pulse-glow, staggered reveals,
scroll-triggered animation, any transition over 300ms.

---

## 2. Color

| Token | Value | Usage |
|---|---|---|
| `void` | `#1e1e24` | Page background, input backgrounds (as `black/30` overlay) |
| `surface` | `#12121a` | Panels, cards, navbar, modals |
| `border` | `#71717a` | Borders at reduced opacity: `border/40` default, `border/60` hover |
| `ultraviolet` | `#a855f7` | Primary accent: active tabs, primary buttons, focus, drag glow |
| `violet-light` | `#c084fc` | Primary hover |
| `violet-dark` | `#7c3aed` | Primary pressed/active |
| `cyber-teal` | `#2dd4bf` | Schedule "green" events (workshops/hacking) |
| `signal-yellow` | `#fbbf24` | Schedule "orange" events (food/logistics) |
| `electric-blue` | `#3b82f6` | Schedule "cyan" events (check-in) |
| `text-primary` | `#f4f4f5` | Headings, values |
| `text-secondary` | `#a1a1aa` | Labels, descriptions |
| `text-muted` | `#52525b` | Placeholders, disabled, empty states |

**Semantic (admin layer, derived — not new hues):**

| Role | Token expression |
|---|---|
| Danger / delete | `red-400` text, `red-500/10` bg, `red-500/40` border (Tailwind red, matches existing `admin-error` usage) |
| Success / added | `cyber-teal` text, `cyber-teal/10` bg |
| Modified / pending | `signal-yellow` text, `signal-yellow/10` bg |
| Unsaved indicator | `ultraviolet` dot / `shadow-glow` |

Schedule event color names stay `violet | cyan | green | orange` (DB values) and
map to the four accent tokens exactly as `components.css` already does.

## 3. Typography

| Token | Font | Usage |
|---|---|---|
| `font-display` | Space Grotesk (`ss01`) | H1/H2/H3, panel titles, member names |
| `font-body` | Lexend | Body copy, inputs, descriptions |
| `font-mono` | JetBrains Mono | Buttons (UPPERCASE), labels, chips, times, counts |

Admin scale: page title `text-2xl` display bold · panel title `text-lg` display
bold · mono labels `text-xs uppercase tracking-widest text-text-secondary` ·
body `text-sm`. Line-height ≥ 1.5 for body text.

## 4. Spacing (admin density)

Base unit 0.25rem (Tailwind). Admin uses the dense end of the scale:
panel padding `p-5`, gaps `gap-3`/`gap-4`, section stacking `space-y-6`,
page gutter `px-container` (1.5rem), max content width `max-w-6xl`.
Never use the public `py-section` (6rem) inside the admin.

## 5. Radii, Borders, Elevation

| Token | Value | Usage |
|---|---|---|
| `rounded-card` | 1rem | Panels, modals |
| `rounded-xl` | 0.75rem | Cards inside panels, images |
| `rounded-lg` | 0.5rem | Inputs, small buttons |
| `rounded-pill` | 9999px | Chips, badges, count pills |
| `shadow-card` | `0 4px 24px rgba(0,0,0,0.4)` | Panels, modals |
| `shadow-glow` | `0 0 20px rgba(124,58,237,0.4)` | Primary hover, dragged card, unsaved SaveBar |

Borders: `1px` everywhere; `border-border/40` resting → `border-border/60` or
`border-ultraviolet/60` on hover/focus. No 2px borders except the tab underline.

## 6. Motion (admin layer)

| Token | Value | Usage |
|---|---|---|
| `duration-fast` | 150ms | Hover, focus, chip toggles |
| `duration-base` | 200ms | Tab switch, list add/remove |
| `duration-modal` | 250ms | Modal/backdrop enter; exit 200ms |
| easing | `ease-brand` = `cubic-bezier(0.4, 0, 0.2, 1)` | Everything |

Rules: animate only `transform`/`opacity`; enter = ease-out feel (fade + ≤8px
translate or scale 0.97→1), exit = fade only; `AnimatePresence` for conditional
UI; dragged card = `scale 1.03` + `shadow-glow`; `prefers-reduced-motion`
already globally zeroes durations in `index.css` — never opt out of it.

## 7. Components (admin kit — `frontend/src/components/admin/ui.jsx` + `styles/admin.css`)

- **Panel** — `bg-surface border border-border/40 rounded-card p-5 shadow-card`,
  title row: display-bold title + optional mono count pill.
- **Field** — mono uppercase `text-xs` label above control; inputs
  `bg-black/30 border border-border/40 rounded-lg px-3 py-2 text-sm`,
  focus `border-ultraviolet` + `outline-none`. 5 states: default / hover /
  focus / active / disabled (`opacity-50`).
- **Buttons** — mono uppercase, `rounded-lg`:
  *primary* `bg-ultraviolet hover:bg-violet-light active:bg-violet-dark hover:shadow-glow`;
  *ghost* `border border-border/40 hover:border-ultraviolet/60 hover:text-text-primary`;
  *danger* `border border-red-500/40 text-red-400 hover:bg-red-500/10`.
  Disabled while async ops run. No `animate-pulse-glow` in the admin.
- **Tab bar** — mono uppercase tabs, active = `text-text-primary` + ultraviolet
  underline (shared `layoutId`), inactive = `text-text-secondary`. Unsaved dot:
  2px ultraviolet circle after the label.
- **SaveBar** — sticky bottom bar inside each tab; hidden when clean; when dirty:
  surface panel with mono "N UNSAVED CHANGES", ghost *Discard* + primary
  *Save Changes*.
- **DiffModal** — surface modal (`rounded-card`, `shadow-card`, backdrop
  `bg-black/60 backdrop-blur-sm`) listing staged changes grouped by kind with
  semantic chips: `+ ADD` teal · `~ EDIT` yellow · `− DELETE` red · `⇅ REORDER`
  ultraviolet. Confirm = primary button; per-op errors surface inline.
- **DragGrid** — HTML5 drag + `motion` `layout` shuffle. Grabbed card:
  `scale 1.03`, `shadow-glow`, `border-ultraviolet/60`; drop targets keep
  resting style. Keyboard fallback: ← → move buttons on card focus.
- **Empty state** — mono `text-text-muted` message centered in a dashed
  `border-border/40` box.

## 8. Anti-patterns (repo-wide)

Emoji as icons (SVG only) · scale on hover for dense controls · animating
width/height · `scale(0)` exits · >300ms UI transitions in admin · white/light
surfaces (the old edit modal) · native `confirm()`/`alert()` · rogue hex values
outside `index.css` `@theme` · new dependencies without asking.

## 9. Page overrides

None yet. If a page needs to deviate, add `design-system/pages/<page>.md`
and note it here.
