# Artifact Page Design Standards

> This document defines the mandatory design patterns for ALL artifact/level pages
> in the Oxygy AI Upskilling website. Every artifact page MUST follow these
> specifications to maintain visual consistency across the site.
>
> **Read this file before creating or modifying any artifact page.**

## Level Color System

Each level has a paired accent color system. All visual elements on that level's
artifact page derive from these two values.

| Level | Name | Accent Color | Dark Accent Color | Hash Route |
|-------|------|-------------|-------------------|------------|
| 1 | Fundamentals & Awareness | #A8F0E0 (Mint) | #2BA89C (Dark Mint) | `#playground` |
| 2 | Applied Capability | #C3D0F5 (Lavender) | #5B6DC2 (Dark Lavender) | `#agent-builder` |
| 3 | Systemic Integration | #F7E8A4 (Pale Yellow) | #C4A934 (Dark Gold) | `#workflow-designer` |
| 4 | Interactive Dashboards | #F5B8A0 (Soft Peach) | #D47B5A (Dark Peach) | `#dashboard-design` |
| 5 | Full AI Applications | #38B2AC (Teal) | #38B2AC (Teal) | `#product-architecture` |

### Color derivation rules
- Section accent borders: `darkAccentColor`
- Light background tints: `accentColor` at 8-15% opacity
- Tag/pill backgrounds: `accentColor` at 20% opacity
- Tag/pill text: `#2D3748` (dark navy)
- Hover states: `darkAccentColor`
- Icon highlights: `darkAccentColor`
- CTA buttons on artifact pages: `darkAccentColor` background, white text

## Global Typography (All Artifact Pages)

| Element | Font | Size | Weight | Color | Line-Height |
|---------|------|------|--------|-------|-------------|
| Page title (h1) | DM Sans | 36-48px | 800 | #1A202C | 1.15 |
| Section headings (h2) | DM Sans | 28-32px | 700 | #1A202C | 1.2 |
| Sub-section headings (h3) | DM Sans | 20-22px | 600 | #1A202C | 1.3 |
| Body text | DM Sans | 15-16px | 400 | #4A5568 | 1.7 |
| Labels / captions | DM Sans | 11-13px | 600 | #A0AEC0 | 1.4 |
| NEVER use | Inter, Roboto, Arial | - | - | - | - |

## Standard Page Structure

Every artifact page follows this vertical structure:

1. **Page Container** - `min-h-screen bg-white pt-24 pb-16`
2. **Content Wrapper** - `max-w-7xl mx-auto px-6`
3. **Breadcrumb** - `<- Back to Level N` link, `text-[14px] text-[#718096]`, hover changes to level accent color
4. **Centered Title** - `text-center`, `text-[36px] md:text-[48px] font-bold text-[#1A202C] leading-[1.15]` with accent-colored underline on key word
5. **"Did You Know?" Fun Fact Card** - Full-width, centered text, decorative dots (see spec below)
6. **Core Content Sections** - The main interactive tool/content (VARIES per page - DO NOT STANDARDIZE)
7. **Page Closing Section** - Summary text + next level CTA + back-to-home link (see spec below)

Sections 1-5 and 7 MUST be identical in structure across all pages.
Section 6 is unique to each page and should NOT be standardized.

## "Did You Know?" Fun Fact Card - Standard Component

### Container
- Full-width within the content wrapper (NOT narrower - no `max-w-2xl`)
- `rounded-2xl`, `px-8 md:px-12 py-8`, `text-center`, `overflow-hidden`
- Background: subtle gradient using the level's accent color at low opacity:
  `linear-gradient(135deg, rgba({accent}, 0.15) 0%, rgba({darkAccent}, 0.08) 50%, rgba({accent}, 0.12) 100%)`
- Border: `1.5px solid {accentColor}`
- Margin: `mb-8` below

### Decorative dots
- Three `span` elements, `absolute top-3 left-4`, each `w-2 h-2 rounded-full`
- Colors: `{darkAccentColor}` at 40%, `{accentColor}` at 60%, `{darkAccentColor}` at 30% opacity

### Content
- Label: `"Did you know?"` - `text-[11px] font-bold uppercase tracking-[0.1em]` in `{darkAccentColor}`, `mb-2`
- Main text: `text-[17px] md:text-[19px] font-medium text-[#2D3748] leading-[1.6] mb-2`
  - Key stat within the text: wrapped in `<span>` with `text-[{darkAccentColor}] font-bold`
- Supporting text: `text-[15px] text-[#718096] leading-[1.6] max-w-3xl mx-auto`

### Placement
- After the centered title, before the core interactive content

## Page Closing Section - Standard Component

Uses the shared `<ArtifactClosing>` component (`components/ArtifactClosing.tsx`).

### Container
- Full-width section
- Top border: `1px solid #E2E8F0`
- Padding: `48px 0` (`pt-12 pb-0`)
- Content centered, `max-w-2xl mx-auto text-center`

### Elements (top to bottom)
1. **Summary text** (optional): 1-2 sentence summary, `text-[15px] text-[#718096] leading-[1.7]`, `mb-8`
2. **"Explore Next Level" CTA button**: pill shape, `darkAccentColor` background, white text, `rounded-full`, `px-7 py-3`, `text-[15px] font-semibold`, hover: slight darken + `translateY(-1px)`
3. **"Back to Home" link**: below button, `mt-4`, `text-[14px] font-medium text-[#A0AEC0]`, hover: `text-[#38B2AC]`

### Per-level CTA mapping

| Level | CTA Label | Hash Link |
|-------|-----------|-----------|
| 1 | Continue to Level 2: Applied Capability -> | `#agent-builder` |
| 2 | Continue to Level 3: Systemic Integration -> | `#workflow-designer` |
| 3 | Continue to Level 4: Interactive Dashboards -> | `#dashboard-design` |
| 4 | Continue to Level 5: Full AI Applications -> | `#product-architecture` |
| 5 | Return to the Framework Overview | (scroll to `#journey`) |

## Scroll-to-Top Behavior

Handled globally in `App.tsx` via the hashchange event listener:
```tsx
const handleHashChange = () => {
  const page = getPageFromHash();
  setCurrentPage(page);
  window.scrollTo(0, 0);
};
```
No per-page scroll-to-top needed. All hash navigation automatically scrolls to top.

## Spacing & Layout Rules

- Max content width: `max-w-7xl` (1280px), centered with `mx-auto px-6`
- Body text max-width for readability: `max-w-3xl` within wider containers
- Card border radius: `12-16px` (`rounded-xl` to `rounded-2xl`)
- Card border: `1px solid #E2E8F0`, no shadow
- Alternating section backgrounds: white `#FFFFFF` / light gray `#F7FAFC`

## Navigation Rules

- All internal links between artifact pages use hash routes (`#playground`, `#agent-builder`, etc.)
- The shared Navbar component renders on all pages (controlled in App.tsx)
- Logo click navigates to homepage and scrolls to hero
- "Explore Next Level" links navigate to next artifact page hash

## Component File Paths

| Component | File | Purpose |
|-----------|------|---------|
| ArtifactClosing | `components/ArtifactClosing.tsx` | Shared closing section for all artifact pages |
| PromptPlayground | `components/PromptPlayground.tsx` | Level 1 artifact page |
| AgentBuilder | `components/AgentBuilder.tsx` | Level 2 artifact page |
| WorkflowDesigner | `components/WorkflowDesigner.tsx` | Level 3 artifact page |

---

*Last updated: 2026-02-11*
