# PRD: Hero Section — Scroll-Linked Animation

---

## 1. Overview

### Purpose
The hero section is the first thing users see when landing on Oxygy's AI Centre of Excellence website. It combines a **scroll-linked frame-sequence animation** with overlaid text to create a premium, cinematic first impression that communicates the site's core message: AI transformation is personalized, human-centered, and built around the individual.

### Where It Sits
This is the **very first section** of the site — it occupies the top of the page before any other content sections.

### Target Audience & Key Goal
- **External clients:** "This firm understands that AI transformation starts with people, not technology."
- **Internal employees:** "This program is designed around me — my role, my pace, my growth."
- The animation visually reinforces the "human at the center" philosophy — an abstract person surrounded by an orbiting arc of AI capability.

### Core Narrative
A single human figure stands at the center. As the user scrolls, an orbital arc of teal energy sweeps around them — representing personalized AI capability wrapping around the individual. The message: AI doesn't replace you. It orbits around you.

---

## 2. Animation Asset Specification

### Source Files
The animation is delivered as a **ZIP file containing 120 JPEG frames** extracted from a video at 15fps.

| Property | Value |
|----------|-------|
| File format | JPEG frames in a ZIP archive |
| ZIP filename | `ezgif-55b924ee0d70613d-jpg.zip` |
| Frame count | 120 frames |
| Frame naming | `ezgif-frame-001.jpg` through `ezgif-frame-120.jpg` |
| Frame dimensions | 1920 × 1080px (16:9) |
| Total file size | ~3.2MB |
| Average frame size | ~27KB |

### Frame Content Description (what the animation shows)
- **Frame 1 (start):** Clean off-white background. A teal geometric human silhouette centered in the frame. Subtle radial glow behind the figure. No other elements.
- **Frames 2–40 (~0–33%):** An orbital arc in darker teal begins drawing itself clockwise around the figure, starting from the bottom-left. A single node appears at the leading edge of the arc. Faint concentric ripple rings appear behind the figure.
- **Frames 41–80 (~34–66%):** The arc continues sweeping around. Multiple nodes become visible along the arc. The figure's ambient glow intensifies slightly. Dashed concentric circles appear in the background.
- **Frames 81–120 (~67–100%):** The arc completes nearly a full orbit (roughly 340°). 5–6 nodes are visible with small radial indicators. The full composition reads as: a person at the center, embraced by an orbital ring of connected intelligence. Faint dashed concentric circles expand outward behind.

### Known Frame Artifacts to Handle
1. **Black bars:** Thin black horizontal bars appear at the very top and bottom edges of some frames (from the video export). These should be **cropped or masked** via CSS (use `object-fit: cover` or crop the canvas drawing area).
2. **Watermark:** A small watermark appears in the bottom-right corner of frames. This should be masked by either the CSS crop approach or by positioning a UI element (like the CTA or a subtle gradient) over that corner.
3. **Centered composition:** The animation figure is centered in the frame, not right-positioned. The text overlay approach (described below) accounts for this by using a semi-transparent left panel.

---

## 3. Layout & Structure

### Overall Hero Dimensions
| Property | Desktop | Tablet | Mobile |
|----------|---------|--------|--------|
| Scroll height (total scrollable area) | `200vh` | `180vh` | `100vh` (static) |
| Visible/sticky viewport | `100vh` | `100vh` | `100vh` |
| Max content width | `1200px` centered | Full width | Full width |

### Spatial Layout (Desktop)
The hero uses a **full-viewport sticky container** with the animation canvas filling the entire background and text overlaid on the left side.

```
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────────────┐  ┌────────────────────────────┐ │
│ │                     │  │                            │ │
│ │  [Badge]            │  │                            │ │
│ │                     │  │     ANIMATION CANVAS       │ │
│ │  Headline           │  │     (figure + orbital      │ │
│ │  Text               │  │      arc centered)         │ │
│ │                     │  │                            │ │
│ │  Subheading text    │  │                            │ │
│ │                     │  │                            │ │
│ │  [CTA]   [CTA]     │  │                            │ │
│ │                     │  │                            │ │
│ └─────────────────────┘  └────────────────────────────┘ │
│       ~42% width              ~58% width                │
│                                                         │
│    Left text panel has a subtle gradient overlay:        │
│    solid white on left edge → transparent on right       │
│    This ensures text readability over the animation.     │
└─────────────────────────────────────────────────────────┘
```

### Z-Index Stacking Order
1. **Bottom (z-0):** Off-white background color (`#F7FAFC`)
2. **Middle (z-10):** Animation canvas (full viewport)
3. **Top (z-20):** Left gradient overlay panel (white → transparent)
4. **Topmost (z-30):** Text content (badge, headline, body, CTAs)

---

## 4. Component Breakdown

### 4.1 Hero Container
- **Element:** `<section>` with `position: relative`
- **Height:** `200vh` (creates the scroll runway)
- **Background:** `#F7FAFC` (off-white, matches site background)

### 4.2 Sticky Viewport
- **Element:** `<div>` nested inside the hero container
- **Position:** `position: sticky; top: 0`
- **Height:** `100vh`
- **Width:** `100vw`
- **Overflow:** `hidden` (clips any canvas overflow and black frame bars)

### 4.3 Animation Canvas
- **Element:** `<canvas>` element (NOT `<img>` tags — canvas is required for performant frame scrubbing)
- **Position:** `absolute`, filling the sticky viewport
- **Sizing:** Canvas internal resolution = `1920 × 1080`. Display size = full viewport. Use `object-fit: cover` logic in the draw function to ensure the frame fills the viewport without distortion, cropping top/bottom bars naturally.
- **Draw logic:** On each scroll tick, calculate the current frame index (0–119) based on scroll progress through the 200vh container, and draw that frame to the canvas.

### 4.4 Left Gradient Overlay
- **Element:** `<div>` positioned absolute over the left portion of the sticky viewport
- **Width:** `50%` of viewport
- **Height:** `100%`
- **Background:** `linear-gradient(to right, #F7FAFC 0%, #F7FAFC 55%, rgba(247, 250, 252, 0.85) 75%, rgba(247, 250, 252, 0) 100%)`
- **Purpose:** Creates a readable zone for text on the left while allowing the animation to be visible on the right. The gradient fades from solid off-white to transparent, so the animation figure (centered in the canvas) remains visible on the right side.

### 4.5 Text Content — Badge
- **Content:** `AI CENTRE OF EXCELLENCE`
- **Style:** Inline badge/pill — `1px solid #38B2AC` border, teal text `#38B2AC`, `background: transparent`, `border-radius: 20px`, `padding: 6px 16px`, `font-size: 13px`, `font-weight: 600`, `letter-spacing: 1.5px`, `text-transform: uppercase`
- **Font:** DM Sans or Plus Jakarta Sans (match site font)
- **Position:** Top of text block, left-aligned
- **Scroll animation:** Fades in (`opacity: 0 → 1`) during scroll progress **0–10%**. Present on initial load with slight fade.

### 4.6 Text Content — Main Headline
- **Content:**
  ```
  Empowering
  Your People
  to Build the Future
  with AI.
  ```
- **"Your People" treatment:** The words "Your People" have a **teal underline decoration** — a hand-drawn-style underline (can be a `border-bottom` or a positioned pseudo-element, `3px solid #38B2AC`, slightly wider than the text, positioned ~4px below the baseline). This matches the existing Oxygy site pattern visible in the screenshots.
- **Typography:** `font-size: 52px`, `font-weight: 800`, `color: #1A202C` (dark navy), `line-height: 1.15`
- **Font:** DM Sans or Plus Jakarta Sans — bold geometric sans-serif. **Never** Inter, Roboto, or Arial.
- **Max width:** `520px` (constrains text to ~42% viewport, prevents overlap with animation)
- **Scroll animation:** Fades in and slides up slightly (`opacity: 0 → 1`, `translateY: 20px → 0`) during scroll progress **5–20%**

### 4.7 Text Content — Subheading / Body
- **Content:** `A comprehensive upskilling framework that takes your team from curious explorers to builders of fully personalized AI applications.`
- **Typography:** `font-size: 17px`, `font-weight: 400`, `color: #4A5568` (medium gray), `line-height: 1.7`
- **Max width:** `480px`
- **Margin top:** `24px` below headline
- **Scroll animation:** Fades in (`opacity: 0 → 1`, `translateY: 15px → 0`) during scroll progress **20–35%**

### 4.8 CTA Buttons
Two buttons side by side:

**Primary CTA:**
- **Label:** `Start the Journey` with a `>` arrow icon
- **Style:** `background: #38B2AC`, `color: #FFFFFF`, `border-radius: 28px`, `padding: 14px 28px`, `font-size: 15px`, `font-weight: 600`. Pill-shaped. No shadow.
- **Hover:** `background: #2C9A94` (slightly darker teal)
- **Arrow icon:** Small chevron-right, white, to the right of text

**Secondary CTA:**
- **Label:** `Explore the Framework`
- **Style:** `background: transparent`, `border: 1px solid #1A202C`, `color: #1A202C`, `border-radius: 28px`, `padding: 14px 28px`, `font-size: 15px`, `font-weight: 600`
- **Hover:** `background: #1A202C`, `color: #FFFFFF`

**Layout:** Flex row, `gap: 16px`, left-aligned
**Margin top:** `32px` below subheading
**Scroll animation:** Fade in (`opacity: 0 → 1`) during scroll progress **35–50%**

---

## 5. Interactions & Animations

### 5.1 Scroll-Linked Frame Sequencing (Core Mechanic)

This is the primary interaction. As the user scrolls through the 200vh hero section, the animation canvas scrubs through 120 frames.

**Calculation:**
```
scrollProgress = (scrollTop - heroTop) / (heroHeight - viewportHeight)
// Clamp scrollProgress to 0–1
frameIndex = Math.floor(scrollProgress * 119)
// Clamp frameIndex to 0–119
// Draw frames[frameIndex] to canvas
```

**Performance requirements:**
- Use `requestAnimationFrame` for scroll handling — never raw scroll events
- Preload ALL 120 frames into an `Image[]` array on component mount before enabling scroll interaction
- Use a `<canvas>` element with `2D` context for drawing — `drawImage()` is faster than swapping `<img>` src attributes
- Only redraw when `frameIndex` changes (avoid redundant canvas draws)

### 5.2 Frame Preloading

On component mount:
1. Show a **loading state** (see 5.3) while frames load
2. Create 120 `new Image()` objects, set each `src` to the frame path
3. Track load progress with a counter
4. Once all 120 frames are loaded, hide loading state and enable scroll animation
5. Draw frame 1 immediately as the initial static image

**Frame paths:** `/hero-sequence/ezgif-frame-001.jpg` through `/hero-sequence/ezgif-frame-120.jpg`

Note: The developer should extract the provided ZIP file and place all 120 JPEG frames into a `/public/hero-sequence/` directory (or equivalent static assets folder).

### 5.3 Loading State

While frames are preloading:
- Show the off-white background (`#F7FAFC`)
- Display the text content immediately (badge, headline, subheading, CTAs) — text doesn't need to wait for frames
- In place of the animation, show a subtle loading indicator: a thin teal line (`#38B2AC`, 2px height) at the bottom of the hero that fills from left to right as frames load (0% → 100%)
- Once loaded, the loading bar fades out and the animation canvas fades in over `300ms`

### 5.4 Text Fade-In Timing (Scroll-Linked)

All text elements animate based on scroll progress through the hero section:

| Element | Scroll Start | Scroll End | Animation |
|---------|-------------|------------|-----------|
| Badge | 0% | 10% | `opacity: 0 → 1` |
| Headline | 5% | 20% | `opacity: 0 → 1`, `translateY: 20px → 0` |
| Subheading | 20% | 35% | `opacity: 0 → 1`, `translateY: 15px → 0` |
| CTAs | 35% | 50% | `opacity: 0 → 1` |

**Important:** All text should be **visible and static** once its animation completes. It should NOT continue to move or fade as the user keeps scrolling — it locks in place. The remaining scroll progress (50–100%) is dedicated to the animation completing its orbital arc.

**Alternative approach (simpler):** If scroll-linked text timing proves technically complex, the text can simply be **present on load with no scroll animation** — visible immediately in its final state. The scroll interaction then controls only the canvas animation. This is a valid fallback and still looks professional.

### 5.5 Sticky Release

When the user scrolls past the full 200vh hero container:
- The sticky viewport naturally unsticks and scrolls away
- The next section of the page scrolls up from below
- No special transition animation is needed — the natural CSS sticky behavior handles this

---

## 6. Visual Design Specification

### Colors
| Element | Color | Hex |
|---------|-------|-----|
| Page/hero background | Off-white | `#F7FAFC` |
| Gradient overlay (solid portion) | Off-white | `#F7FAFC` |
| Badge border + text | Oxygy Teal | `#38B2AC` |
| Headline text | Dark Navy | `#1A202C` |
| "Your People" underline | Oxygy Teal | `#38B2AC` |
| Subheading text | Medium Gray | `#4A5568` |
| Primary CTA background | Oxygy Teal | `#38B2AC` |
| Primary CTA text | White | `#FFFFFF` |
| Primary CTA hover | Darker Teal | `#2C9A94` |
| Secondary CTA border + text | Dark Navy | `#1A202C` |
| Secondary CTA hover bg | Dark Navy | `#1A202C` |
| Secondary CTA hover text | White | `#FFFFFF` |
| Loading bar | Oxygy Teal | `#38B2AC` |

### Typography
| Element | Font | Size | Weight | Color | Line-Height |
|---------|------|------|--------|-------|-------------|
| Badge | DM Sans / Plus Jakarta Sans | 13px | 600 | `#38B2AC` | 1.4 |
| Headline | DM Sans / Plus Jakarta Sans | 52px | 800 | `#1A202C` | 1.15 |
| Subheading | DM Sans / Plus Jakarta Sans | 17px | 400 | `#4A5568` | 1.7 |
| Primary CTA | DM Sans / Plus Jakarta Sans | 15px | 600 | `#FFFFFF` | 1.4 |
| Secondary CTA | DM Sans / Plus Jakarta Sans | 15px | 600 | `#1A202C` | 1.4 |

### Spacing
| Property | Value |
|----------|-------|
| Text block left padding (from viewport edge) | `max(48px, calc((100vw - 1200px) / 2 + 48px))` — aligns with site's 1200px max-width container |
| Text block top position | Vertically centered in viewport, biased slightly above center (~42% from top) |
| Gap: badge → headline | `20px` |
| Gap: headline → subheading | `24px` |
| Gap: subheading → CTAs | `32px` |
| Gap between CTAs | `16px` |

---

## 7. Responsive Behavior

### Desktop (1200px+)
Full experience as described above. Canvas fills viewport, text overlaid on left with gradient, scroll-linked animation at 200vh.

### Tablet (768px–1199px)
- **Scroll height:** Reduced to `180vh`
- **Text width:** Increases to `55%` of viewport to remain readable
- **Headline font-size:** Reduced to `42px`
- **Gradient overlay width:** `55%` of viewport
- **Canvas and scroll behavior:** Same as desktop
- **CTAs:** May stack vertically if viewport is narrow (`flex-wrap: wrap`)

### Mobile (<768px)
- **NO scroll-linked animation.** Mobile scroll behavior is unpredictable and frame sequences are heavy on mobile browsers.
- **Scroll height:** `100vh` (single viewport, no sticky scroll)
- **Layout:** Single column. Text block on top (~55% of viewport height), static image below (~45%).
- **Static image:** Display `ezgif-frame-120.jpg` (the final frame) as a static `<img>` element with `object-fit: contain`. This shows the completed orbital composition without any scroll interaction.
- **Headline font-size:** `36px`
- **Subheading font-size:** `15px`
- **Text alignment:** Left-aligned, full width with `padding: 0 24px`
- **CTAs:** Stack vertically, full width, `gap: 12px`
- **No gradient overlay needed** (text and image are stacked, not overlapping)

---

## 8. Content Data

### All Text Content (Exact Copy)

**Badge:**
```
AI CENTRE OF EXCELLENCE
```

**Headline:**
```
Empowering
Your People
to Build the Future
with AI.
```
(Line breaks as shown. "Your People" gets teal underline.)

**Subheading:**
```
A comprehensive upskilling framework that takes your team from curious explorers to builders of fully personalized AI applications.
```

**Primary CTA:**
```
Start the Journey  >
```

**Secondary CTA:**
```
Explore the Framework
```

### Animation Frames
120 JPEG files, named `ezgif-frame-001.jpg` through `ezgif-frame-120.jpg`, extracted from the provided ZIP file and placed in `/public/hero-sequence/`.

---

## 9. Developer Notes

### Technical Architecture

**Recommended stack:** React (with hooks) or vanilla JS. The component is self-contained — no external state management needed.

**Key implementation steps:**
1. Extract ZIP contents into `/public/hero-sequence/`
2. Build a `<canvas>`-based frame scrubber component
3. Implement scroll progress calculation relative to the hero section
4. Add text overlay with CSS positioning
5. Implement preloader with progress tracking
6. Add responsive breakpoints with mobile fallback

### Canvas Drawing — Object-Fit Cover Logic

The frames are 1920×1080 (16:9) but the viewport may be any aspect ratio. To fill the viewport without distortion (and to crop the black bars):

```javascript
// Pseudo-code for cover-fit canvas drawing
function drawFrame(ctx, img, canvasWidth, canvasHeight) {
  const imgRatio = img.width / img.height;  // 1920/1080 = 1.78
  const canvasRatio = canvasWidth / canvasHeight;
  
  let drawWidth, drawHeight, offsetX, offsetY;
  
  if (canvasRatio > imgRatio) {
    // Canvas is wider than image ratio — fit to width, crop height
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    offsetX = 0;
    offsetY = (canvasHeight - drawHeight) / 2;
  } else {
    // Canvas is taller than image ratio — fit to height, crop width
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imgRatio;
    offsetX = (canvasWidth - drawWidth) / 2;
    offsetY = 0;
  }
  
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}
```

This naturally crops the thin black bars at top/bottom and the watermark is pushed to the edge where the gradient overlay or viewport crop handles it.

### Performance Optimizations
- **Total asset weight:** ~3.2MB for 120 frames — acceptable. No additional compression needed unless targeting very slow connections.
- **Preload strategy:** Load all frames into memory on page load. At ~27KB per frame and 120 frames, this is well within memory limits.
- **Scroll throttling:** Use `requestAnimationFrame` — do NOT use `setInterval` or raw `addEventListener('scroll', ...)` without throttling.
- **Avoid re-renders:** Only call `drawImage()` when the calculated frame index actually changes. Store the last drawn frame index and compare.

### Edge Cases
1. **User scrolls very fast:** The frame sequencer should still work — we're just reading scroll position, not interpolating. Fast scrolling = skipping frames, which is fine.
2. **User arrives mid-scroll (anchor link or browser restore):** On mount, immediately calculate the correct frame for the current scroll position and draw it. Don't assume scroll starts at 0.
3. **Browser resize while scrolled:** Recalculate canvas dimensions and redraw current frame. Add a `resize` event listener.
4. **JavaScript disabled:** Show `ezgif-frame-120.jpg` as a fallback `<img>` behind the canvas (the canvas just won't render, and the image shows through).
5. **Reduced motion preference:** If `prefers-reduced-motion: reduce` is detected, disable scroll animation and show the final frame statically (same as mobile behavior). This is an accessibility requirement.

### Accessibility
- The animation canvas should have `role="img"` and `aria-label="Animated illustration of a person surrounded by an orbital arc representing personalized AI capability"`
- Text content should be semantic HTML (`<h1>` for headline, `<p>` for subheading)
- CTA buttons should be `<a>` tags or `<button>` elements with proper focus states
- Respect `prefers-reduced-motion` as described above

### Dependencies on Other Sections
- The hero section's bottom edge connects directly to the next section of the page (likely the "mindset shift" or "five levels overview" section)
- The primary CTA ("Start the Journey") should anchor-link to the five levels section
- The secondary CTA ("Explore the Framework") should anchor-link to a framework overview or methodology section
- Ensure the sticky behavior releases cleanly before the next section begins

### File Structure
```
/public/
  /hero-sequence/
    ezgif-frame-001.jpg
    ezgif-frame-002.jpg
    ...
    ezgif-frame-120.jpg
/src/
  /components/
    HeroSection.jsx (or .tsx)
```

---

## 10. Oxygy Brand Compliance Checklist

Before considering this section complete, verify:

- [ ] Font is DM Sans, Plus Jakarta Sans, Outfit, or Manrope — **never** Inter, Roboto, or Arial
- [ ] Headline text is dark navy `#1A202C` — never colored
- [ ] "Your People" has teal underline decoration, not colored text
- [ ] Primary CTA is solid teal pill `#38B2AC` — small and elegant, not oversized
- [ ] Secondary CTA is bordered pill, not filled
- [ ] No drop shadows on any elements
- [ ] No purple gradients, glassmorphism, or floating abstract shapes
- [ ] Background is off-white `#F7FAFC`, not pure white `#FFFFFF`
- [ ] Body text is constrained to max ~500px width
- [ ] No center-aligned body text (everything left-aligned)
- [ ] Card/component borders are `1px solid #E2E8F0` if present
