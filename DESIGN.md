# 🎨 Generic Web Design Document

---

## Table of Contents

- [Overview](#overview)
- [Design System](#design-system)
- [Component Library](#component-library)
- [Animation System](#animation-system)
- [Content Management](#content-management)
- [SEO & Meta](#seo--meta)
- [Theming (Dark/Light)](#theming-darklight)
- [Responsive Design](#responsive-design)
- [Asset Strategy](#asset-strategy)
- [Conventions & Patterns](#conventions--patterns)

---

## Overview

A modern, minimalist web design layout. The design system focuses on a clean editorial aesthetic — predominantly monochrome with subtle depth through shadows, blurs, and micro-animations. The layout promotes highly structured content, smooth animations, and premium micro-interactions to create a state-of-the-art user experience.

### Design Philosophy

| Principle | Implementation |
|---|---|
| **Minimalism** | Monochrome palette, generous whitespace, restrained typography |
| **Editorial** | Serif headings paired with sans-serif body text |
| **Subtle Depth** | Glassmorphism (`backdrop-blur`), layered shadows, gradient borders |
| **Motion with Purpose** | Scroll-triggered fade-ins, staggered reveals, smooth marquee transitions |
| **Content-First** | No decorative clutter — every element serves information hierarchy |

---

## Design System

### Color Palette

The site uses a **monochrome + neutral** palette with Tailwind's gray scale, supporting both light and dark modes.

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| **Background** | `white` (#fff) | `#0a0a0a` | Page background |
| **Text Primary** | `gray-900` | `white` | Headings, primary text |
| **Text Secondary** | `gray-500` | `gray-400` | Body text, descriptions |
| **Text Tertiary** | `gray-400` | `gray-500` | Meta info, timestamps, stats |
| **Border** | `gray-100` | `white/5` | Card borders, dividers |
| **Border Hover** | `gray-200` | `white/10` | Hover state borders |
| **Surface** | `white` | `gray-900/50` | Card backgrounds |
| **Surface Hover** | `gray-50` | `gray-800/50` | Hover backgrounds |
| **Accent** | `blue-500` | `blue-500` | Verified badge only |
| **Selection** | `black/10` | `white/10` | Text selection highlight |

### Typography

```css
@theme {
  --font-sans: "DM Sans", ui-sans-serif, system-ui, sans-serif;
  --font-serif: 'Aleo', serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

| Element | Font | Weight | Size (Mobile → Desktop) |
|---|---|---|---|
| **h1 (Hero)** | Aleo (serif) | 500 (medium) | 24px → 32px |
| **h2 (Section)** | Aleo (serif) | 700 (bold) | 17px → 22px |
| **h3 (Card title)** | Aleo (serif) | 700 (bold) | 15px → 16px |
| **Body** | DM Sans | 400/500 | 13px → 14px |
| **Code** | JetBrains Mono | 400–600 | 0.85em |
| **Tags/Meta** | DM Sans | 600–700 | 10px → 11px |
| **Navigation** | DM Sans | 600 (semibold) | 12px → 13px |

### Spacing & Layout

| Property | Value |
|---|---|
| **Max Width** | `1400px` (container) |
| **Sidebar Width** | `288px` (`w-72`, desktop only) |
| **Content Padding** | `16px–56px` (responsive) |
| **Card Border Radius** | `16px` (`rounded-2xl`) |
| **Section Gap** | `28px–40px` (responsive) |
| **Card Gap** | `16px–24px` (responsive) |

### Shadows

| Variant | Value | Usage |
|---|---|---|
| **Card Hover (Light)** | `0 8px 30px rgb(0,0,0,0.06)` | Blog/project cards |
| **Card Hover (Dark)** | `0 8px 30px rgba(0,0,0,0.3)` | Blog/project cards |
| **Project Image** | `0 15px 40px -15px rgba(0,0,0,0.12)` | Project row images |
| **Navigation** | `0 10px 30px -10px rgba(0,0,0,0.15)` | Mobile nav (floating) |
| **Navigation (Desktop)** | `0 2px 10px -3px rgba(0,0,0,0.07)` | Desktop nav (subtle) |

### Scrollbar

Custom scrollbar styling applied globally:

- Width: `5px`
- Track: `gray-100` / `gray-900`
- Thumb: `gray-300` / `gray-700` with `3px` border-radius
- Hidden on `.no-scrollbar` elements (sidebar, navigation overflow)

---

## Component Library

### Astro Components (Server-Rendered)

| Component | Props | Description |
|---|---|---|
| `Layout.astro` | `title`, `description`, `image`, `canonicalURL` | Base HTML layout with meta tags, fonts, theme script, structured data |
| `Sidebar.astro` | — | Profile card, GitHub commit chart, social links. `transition:persist` across pages |
| `Navigation.astro` | — | Floating pill nav with active state detection, theme toggle |
| `GridBackground.astro` | `className?` | Procedurally generated SVG particle grid with cluster-based density |
| `Starburst.astro` | — | Decorative starburst overlay image (top-right corner) |
| `Icon.astro` | `name`, `class?` | Inline SVG icon renderer with 19 available icons |
| `BlogCard.astro` | `tags`, `title`, `date`, `summary`, `thumbnail?`, `stats`, `index?`, `slug?` | Grid card with thumbnail, tags, stats footer |
| `BlogRowCard.astro` | Same as BlogCard | Horizontal card variant for blog listing page |
| `ProjectCard.astro` | `title`, `description`, `image`, `tags`, `link?`, `github?`, `index?` | Grid card with thumbnail and tech tags |
| `ProjectRowCard.astro` | Same as ProjectCard | Large alternating layout for work page |
| `TechMarquee.astro` | `className?` | Three-row infinite marquee with tech logos from Simple Icons |
| `TechBadge.astro` | `name`, `index?` | Individual tech pill with dot indicator (standalone, unused in current pages) |

### React Components (Client-Side Interactive)

| Component | Props | Description |
|---|---|---|
| `FadeIn.tsx` | `delay?`, `direction?`, `duration?`, `className?`, `as?`, `blur?` | Framer Motion wrapper for scroll-triggered fade-in animations. Supports directional movement (up/down/left/right/none) and optional blur effect. |
| `TextReveal.tsx` | `text`, `className?`, `delay?`, `staggerDelay?`, `duration?` | Word-by-word text reveal using Framer Motion springs. Each word fades in with blur and upward movement. |

### Available Icons

```
home, file-text, folder, book-open, mail, message-circle,
message-square, bot, moon, sun, eye, heart, terminal, map-pin,
calendar, sparkles, github, linkedin, instagram, external-link,
arrow-right, arrow-up-right, download, menu, x, arrow-left
```

---

## Animation System

All animations are handled by **Framer Motion** through two React island components.

### FadeIn

- **Trigger:** Scroll into viewport (`whileInView`)
- **Once:** Yes (`viewport.once: true`)
- **Viewport Margin:** `-50px`
- **Easing:** Custom cubic-bezier `[0.16, 1, 0.3, 1]` (aggressive ease-out)
- **Default Duration:** `0.6s`
- **Directions:** `up` (y: 20→0), `down` (y: -20→0), `left` (x: 20→0), `right` (x: -20→0), `none`
- **Blur:** Optional `blur(10px) → blur(0px)` transition

### TextReveal

- **Trigger:** Scroll into viewport
- **Type:** Spring animation (`damping: 12, stiffness: 100`)
- **Effect:** Word-by-word reveal with staggered delays
- **Per-word:** `opacity: 0→1`, `blur(8px)→blur(0px)`, `y: 5→0`
- **Default Stagger:** `0.02s` between words

### TechMarquee

- **Type:** CSS `@keyframes` infinite animation
- **3 Rows:** Alternating left/right scroll directions
- **Durations:** 50s, 45s, 60s (varied for organic feel)
- **Pause:** On hover (`animation-play-state: paused`)
- **Mask:** Gradient fade edges (`mask-image: linear-gradient`)
- **Items:** Quadrupled (`[...items, ...items, ...items, ...items]`) for seamless loop

### TechBadge

- **Type:** CSS `@keyframes revealUp`
- **Effect:** `translateY(12px) scale(0.96) blur(2px)` → base state
- **Hover:** `translateY(-2px) scale(1.02)`

### Page Transitions

- Astro `ClientRouter` for cross-page transitions
- Sidebar uses `transition:persist` and `transition:name="sidebar"` for continuity

---

## Content Management

### Blog Collection

Defined in `src/content.config.ts` using Astro's content collections with glob loader:

```typescript
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.string().optional(),
    summary: z.string().optional(),
    tags: z.array(z.string()).optional(),
    thumbnail: z.string().optional(),
    author: z.string().optional(),
  }),
});
```

### Data Constants

Static data is managed in `src/constants/index.ts`:

- **`navItems`** — Navigation links (4 items: Home, Blogs, Work, Resume)
- **`recentBlogs`** — Blog preview data for homepage (3 entries)
- **`recentProjects`** — Project data (3 entries: SR Cafe, SPKS, MAN 10 Jakarta)
- **`techStacksRow1/2/3`** — Tech names grouped for marquee rows (33 total)
- **`techIconMap`** — Mapping tech names → Simple Icons slugs

---

## SEO & Meta

### Head Tags (Layout.astro)

- **Title:** Dynamic per-page
- **Meta Description:** Dynamic per-page with fallback
- **Canonical URL:** Auto-generated from `Astro.url`
- **Open Graph:** Full OG tags (type, url, title, description, image, locale, site_name)
- **Twitter Card:** `summary_large_image` with full metadata
- **Structured Data:** JSON-LD `Person` schema with name, url, jobTitle, address, sameAs

### Additional SEO

- `@astrojs/sitemap` generates `sitemap.xml` automatically
- `robots.txt` in `public/` directory
- Semantic HTML with proper heading hierarchy
- `<link rel="canonical">` on every page

---

## Theming (Dark/Light)

### Implementation

1. **Detection Priority:** `localStorage` → `prefers-color-scheme` → `'light'`
2. **Toggle Mechanism:** CSS class `dark` on `<html>` element
3. **Storage:** `localStorage.setItem('theme', 'dark' | 'light')`
4. **FOUC Prevention:** Inline `<script>` in `<head>` applies theme before paint
5. **View Transitions:** `astro:after-swap` event re-applies theme after navigation

### Tailwind Dark Variant

```css
@variant dark (&:where(.dark, .dark *));
```

### Toggle UI

Located in `Navigation.astro`:
- ☀️ Sun icon shown in dark mode (click to go light)
- 🌙 Moon icon shown in light mode (click to go dark)
- Toggle uses `document.documentElement.classList.toggle("dark")`

---

## Responsive Design

### Breakpoints (Tailwind defaults)

| Breakpoint | Width | Layout Changes |
|---|---|---|
| **Mobile** | `< 640px` | Single column, sidebar horizontal, nav floating bottom |
| **sm** | `≥ 640px` | Wider padding, larger text, improved card spacing |
| **md** | `≥ 768px` | 2-column blog/project grid |
| **lg** | `≥ 1024px` | Sidebar becomes sticky left panel, desktop navigation |
| **xl** | `≥ 1280px` | 3-column grid on homepage |

### Sidebar Behavior

- **Mobile (`< lg`):** Horizontal bar at top with compact profile, icons-only social links
- **Desktop (`≥ lg`):** Sticky left sidebar (`w-72`, `h-screen`, `overflow-y-auto`)

### Navigation Behavior

- **Mobile:** Fixed at bottom center, floating pill with `backdrop-blur-xl`
- **Desktop:** Static, positioned above main content

---

## Asset Strategy

### Images

| Asset | Format | Size | Usage |
|---|---|---|---|
| `profile.webp` | WebP | ~19KB | Sidebar profile photo |
| `starburst.avif` | AVIF | ~1KB | Decorative background element |
| `starburst_2.webp` | WebP | ~45KB | Hero "available" badge icon |
| `projects/*.png` | PNG | 500KB–1MB | Project screenshots |
| `blogs/*.png` | PNG | ~183KB | Blog thumbnails |
| `favicon.svg` | SVG | ~500B | Browser tab icon |

### External Resources

- **Google Fonts** — Preconnected, loaded via stylesheet link
- **Simple Icons CDN** — `cdn.simpleicons.org/{slug}` for tech logos (lazy loaded)
- **GitHub Chart** — `ghchart.rshah.org/rakha-elctrnx` for commit activity

---

## Conventions & Patterns

### Component Patterns

1. **Astro-first:** Use `.astro` for static/server-rendered components
2. **React Islands:** Only for interactive features requiring client-side JS (`client:load`)
3. **FadeIn Wrapping:** All content sections wrapped in `<FadeIn>` with staggered delays
4. **Consistent Card Pattern:** Every card component accepts `index` prop for stagger calculation (`delay = index * 0.1–0.15`)
5. **Section Headers:** Uniform pattern of `h2 + gradient divider + description paragraph`

### Styling Conventions

1. **Tailwind-only:** No custom CSS classes except for animations and scrollbar hiding
2. **Dark mode pairs:** Every color class paired with `dark:` variant
3. **Transition defaults:** `transition-all duration-300` or `duration-500` for interactions
4. **Border patterns:** `border-gray-100 dark:border-white/5` → `hover:border-gray-200 dark:hover:border-white/10`
5. **Glassmorphism:** `bg-white/70 dark:bg-black/50 backdrop-blur-xl` for floating elements

### Code Organization

1. **Constants over props:** Static data in `constants/index.ts`, not hardcoded in components
2. **Type safety:** All component props defined with TypeScript interfaces
3. **Content collections:** Blog posts managed through Astro's typed content system
4. **No external icon library runtime:** Icons are inline SVG strings mapped in `Icon.astro`

### File Naming

- Components: `PascalCase.astro` or `PascalCase.tsx`
- Pages: `kebab-case.astro`
- Constants/types: `camelCase.ts`
- Assets: `lowercase` with numbers (`1.png`, `profile.webp`)

---

## GridBackground — Technical Detail

The `GridBackground.astro` component generates a **procedural halftone-style particle grid** using SVG:

1. **Grid:** 50 columns × 25 rows at 24px spacing
2. **Clusters:** 3 focal points create density variation (simulating halftone printing)
3. **Per-particle:** Size, opacity, jitter, and rotation calculated from distance to nearest cluster
4. **Falloff:** `Math.pow(1 - distance/radius, 1.5)` for steep contrast
5. **Theming:** CSS custom properties (`--particle-light`, `--particle-dark`) for dual-mode colors
6. **Performance:** Particles with `opacity < 0.03` are filtered out to keep DOM light
7. **Overlays:** Noise texture + radial gradient for smooth page integration
8. **Mask:** SVG `<mask>` with linear gradient for vertical fade-out

---

*Last updated: May 2026*
