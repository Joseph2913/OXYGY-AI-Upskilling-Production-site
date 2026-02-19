# PRD: Oxygy Engagement Model Page

## Context for the Coding Agent

You are building a single-page section of the Oxygy AI Centre of Excellence website. This page presents Oxygy's engagement model — how the firm delivers AI upskilling to client organizations. The audience is **senior leadership teams** at client organizations evaluating Oxygy as a transformation partner. The tone is authoritative, consultative, and strategic — not playful or casual.

This page exists alongside (and links to) the Five Levels detail pages, which cover the specific training curriculum. This page answers the question: **"How do you actually deliver this, and what will it look like for our organization?"**

### Technology Stack
- React (functional components with hooks)
- Tailwind CSS or CSS custom properties for styling
- Lucide React for icons (never emoji)
- DM Sans from Google Fonts (loaded via `@import` or `<link>`)
- Framer Motion or CSS-based scroll-triggered animations (IntersectionObserver)
- SVG for the constellation diagram (code-generated, not an image file)

### Brand Compliance — CRITICAL

Read these rules before writing a single line of code. Violations of these rules are the most common failure mode.

**Colors — define as CSS variables, use ONLY these values:**
```
--color-navy: #1A202C
--color-navy-mid: #2D3748
--color-deep-blue: #1E3A5F
--color-deep-blue-mid: #2B4C7E
--color-teal: #38B2AC
--color-teal-light: #4FD1C5
--color-lavender: #C3D0F5
--color-yellow: #F7E8A4
--color-peach: #F5B8A0
--color-mint: #A8F0E0
--color-ice-blue-bg: #E6FFFA
--color-white: #FFFFFF
--color-light-gray: #F7FAFC
--color-section-bg: #F7FAFC (alternating sections)
--color-med-gray: #A0AEC0
--color-body-text: #4A5568
--color-body-text-light: #718096
--color-border: #E2E8F0
```

**Typography:**
- Font family: `'DM Sans', sans-serif` — load weights 400, 500, 600, 700, 800
- Hero headline: 48-52px, weight 800, color `--color-navy`
- Section headings: 34-38px, weight 800, color `--color-navy`
- Card titles: 16-20px, weight 700, color `--color-navy`
- Body text: 14-16px, weight 400, color `--color-body-text`, line-height 1.65-1.75
- Eyebrow labels: 12-13px, weight 600-700, letter-spacing 0.06-0.08em, uppercase, color `--color-teal`
- Max body text width: 480-540px
- Key heading words get a teal underline decoration (a `::after` pseudo-element or `<span>` with absolute-positioned bar) — NEVER colored text

**Card patterns:**
- White background, `1px solid var(--color-border)`, border-radius 10-12px, NO box-shadow
- Left-bordered cards: add `border-left: 4px solid var(--color-teal)`, remove other borders optional
- Dark navy circle icons: 48-56px circle, `background: var(--color-deep-blue)`, white icon inside (Lucide, 20-22px stroke)

**Buttons:**
- Primary: `background: var(--color-teal)`, white text, `border-radius: 28px`, padding `13px 28px`, font-size 14px weight 600. Hover: `background: var(--color-teal-light)`, transition 200ms
- Secondary: transparent/white background, `1px solid var(--color-navy)`, same pill shape
- Card CTAs: bordered rectangle (not pill), navy text + arrow icon `→`, NOT filled

**Layout:**
- Max content width: 1160px, centered with `margin: 0 auto`
- Section vertical padding: 96-112px top and bottom
- Alternating section backgrounds: white → `--color-section-bg` → white → repeat
- Two-column layouts: text ~45%, visual ~55%, text top-aligned (not vertically centered)
- Body text is always left-aligned, never centered (centered text is only for section headings and their sub-headings)

**NEVER do these things:**
- Never use Inter, Roboto, or Arial
- Never add box-shadow to cards
- Never use purple gradients, glassmorphism, or floating abstract shapes
- Never color heading text (always `--color-navy`, decoration only via teal underline)
- Never use heavy gradients — flat/solid colors only
- Never center-align body/paragraph text
- Never use emoji anywhere — use Lucide React icons
- Never create oversized buttons
- No orphan hex values — every color must reference a CSS variable

**Interactions — every interactive element needs:**
- Hover state with 150-200ms transition
- Focus state (teal-derived ring, not browser default)
- Scroll-triggered fade-in-up animations for below-the-fold content: `translateY(20-24px)` → `translateY(0)` + `opacity: 0` → `opacity: 1`, duration 500-600ms, staggered 80-120ms between siblings, triggered via IntersectionObserver at ~15% threshold
- Expand/collapse transitions: 250-350ms ease-out
- Card hover: `translateY(-2px)`, 200ms

---

## Page Architecture

The page consists of 6 sections. The Leadership AGENDA framework serves as a persistent navigational spine connecting sections 2 through 5.

| # | Section | AGENDA Phase | Background |
|---|---------|-------------|------------|
| 1 | Hero + AI Champions | — | White + geometric texture |
| 2 | Personalized Pathways | Generate | `--color-section-bg` |
| 3 | Capability Waves + Innovation + Operationalization | Navigate / Develop / Act | White |
| 4 | Choose Your Depth (toggle tiers) | — | `--color-section-bg` |
| 5 | CTA Band | — | `--color-teal` full-width |

The AGENDA bar sits between sections 1 and 2 and becomes sticky on scroll, serving as both a navigation element and a progress indicator.

---

## Section 1: Hero + AI Champions (Combined)

### 1.1 Overview
The opening section of the page. It combines the strategic transformation promise with the AI Champions concept, establishing immediately that Oxygy's approach is people-centered and built for sustainability. The interactive constellation diagram invites engagement and makes the Champions concept tangible.

### 1.2 Content Specification

**Eyebrow label:** "Our Engagement Model"

**Headline:** "We Embed AI Champions to Architect Transformation That Lasts"
- The word "Champions" receives the teal underline decoration
- The word "Lasts" receives the teal underline decoration

**Body copy (below headline):**
"Most AI training ends when the facilitator leaves. Ours doesn't. We identify, develop, and strategically deploy AI Champions across your organization — internal leaders who carry capability forward, coach their peers, and sustain transformation long after the engagement concludes. Our approach starts with your strategy, builds personalized capability in waves, and ensures every lesson translates into measurable organizational impact."

**CTA button:** "See How It Works" (primary teal pill) — smooth-scrolls to the AGENDA bar / Section 2

**Below the body copy, a horizontal row of three Champion lifecycle labels:**
1. "Identified" — "Selected during discovery based on influence, capability, and position"
2. "Deployed" — "Embedded across cohorts as peer coaches and catalysts"
3. "Sustained" — "Activated as long-term stewards of AI capability"

These are compact — each is a small block with a bold title and a single-line description. They sit in a horizontal row with small teal left-borders. Not full cards — think tight, inline annotations.

### 1.3 Layout & Structure

**Desktop (1200px+):**
- Two-column layout: text left (48% width), constellation visual right (52% width)
- Text is top-aligned within its column (do not vertically center)
- Max content area: 1160px centered
- Section min-height: 80vh (generous, hero-like)
- Padding: 100px top, 80px bottom
- Geometric texture in top-right corner of section (subtle diagonal shapes using CSS clip-path, color `--color-section-bg` at 6-8% opacity)

**The three Champion lifecycle labels sit below the CTA button, spanning the full width of the text column. They are arranged horizontally as three inline blocks, each with:**
- 4px teal left border
- Padding-left: 12px
- Title: 14px, weight 700, `--color-navy`
- Description: 12px, weight 400, `--color-body-text-light`
- Gap between the three: 24px

### 1.4 Component: Constellation Diagram (Interactive SVG)

**What it is:** A code-generated SVG visualization showing an organization as clusters of nodes (teams/functions). Most nodes are small (4px radius) and muted gray (`--color-med-gray` at 40% opacity). 4-5 larger nodes (6px radius) in teal represent AI Champions. Thin lines connect Champions to nearby team members (within-cluster influence) and dashed lines connect Champions to each other across clusters (cross-functional bridge).

**Node clusters:** Create 4-5 clusters of 5-7 nodes each, loosely grouped. Each cluster represents a team. Champions are positioned centrally within or between clusters. Each Champion has a subtle outer ring (12px radius, `--color-teal` at 25% opacity, 1px stroke).

**Animation on load:** Nodes and connections fade in with a staggered animation. Nodes appear first (200ms stagger per cluster), then connections draw in (SVG line-drawing animation, 400ms).

**Hover interaction — CRITICAL:**
When the user hovers over a Champion (teal) node, a tooltip card appears adjacent to the node. The tooltip is a small white card (max-width 260px) with:
- `1px solid var(--color-border)` border, border-radius 8px, padding 16px
- A role title in bold navy (e.g., "Senior Consultant, Strategy")
- A "Why selected" line: e.g., "Cross-functional influencer with early AI adoption track record"
- A "Deployed as" line: e.g., "Peer coach across L&D and Operations cohorts"
- Tooltip appears with fade + slight translateY animation (150ms)

**Champion tooltip content (create 4-5 archetypes):**

| # | Role | Why Selected | Deployed As |
|---|------|-------------|-------------|
| 1 | Senior Consultant, Strategy | Cross-functional influencer with strong stakeholder relationships | Peer coach across Strategy and BD cohorts |
| 2 | Digital Lead, Operations | Early AI adopter managing automation initiatives | Technical bridge between Ops and IT teams |
| 3 | Learning Manager, L&D | Deep understanding of organizational skill gaps and training infrastructure | Training design collaborator and feedback conduit |
| 4 | Project Manager, Consulting | High informal influence among mid-level practitioners | Cohort facilitator for Level 1-2 training waves |
| 5 | Data Analyst, Analytics | Strongest technical AI proficiency in the organization | Advanced prototyping lead for Level 4-5 projects |

**Accessibility:** The SVG should have `role="img"` and an `aria-label`. Champion nodes should be focusable (`tabindex="0"`) and tooltips should appear on focus as well as hover.

**Below the SVG, centered:**
A small legend: a teal dot + "AI Champions" label, a gray dot + "Team Members" label. Font: 12px, `--color-med-gray`.

### 1.5 Responsive Behavior

**Tablet (768-1199px):** Two-column layout maintained but narrower. Constellation may reduce to 3 clusters. Champion lifecycle labels stack to 2+1 or go vertical.

**Mobile (<768px):** Single column. Text block first, then constellation below (scaled to fit viewport width). Champion lifecycle labels stack vertically. Tooltips appear on tap instead of hover and dismiss on tap-outside.

---

## Section 1.5: Leadership AGENDA Bar (Sticky Navigation Spine)

### Overview
The AGENDA bar is a horizontal strip containing six labeled nodes — A (Analyze), G (Generate), E (Evaluate), N (Navigate), D (Develop), A (Act). It sits directly below the hero section. On scroll, it becomes sticky at the top of the viewport and serves as both a navigation aid and a progress indicator.

### Layout
- Full-width strip, background: `--color-white`, border-bottom: `1px solid var(--color-border)`
- Inner content: 1160px max-width, centered
- Height: 64px
- The six AGENDA items are horizontally centered with equal spacing
- Each item: the single letter in a 36px circle + the word below it (12px, weight 600)

### States
**Default:** Letter circle has `border: 2px solid var(--color-border)`, background white, letter color `--color-navy`. Word label color `--color-body-text-light`.

**Active (corresponding section in viewport):** Circle fills with `--color-teal`, letter turns white. Word label turns `--color-teal`. A thin teal line connects all completed phases (left of active node).

**Clickable:** Each node is a button. Clicking smooth-scrolls to the corresponding page section.

### Sticky behavior
- Becomes `position: sticky; top: 0; z-index: 100` when the user scrolls past its natural position
- Adds a subtle `box-shadow: 0 1px 4px rgba(0,0,0,0.06)` when sticky (not when in natural position)
- Updates active state based on IntersectionObserver watching each section below

### AGENDA-to-Section Mapping
| AGENDA Phase | Section it navigates to |
|---|---|
| Analyze | Brief inline panel below the bar (expands on click, does not navigate) |
| Generate | Section 2: Personalized Pathways |
| Evaluate | Brief inline panel below the bar (expands on click, does not navigate) |
| Navigate | Section 3: Waves (Wave 1 & 2 portion) |
| Develop | Section 3: Waves (Wave 3 + Innovation portion) |
| Act | Section 3: Waves (Operationalization portion) |

**Analyze and Evaluate** do not have dedicated full sections. Instead, clicking them expands a content panel directly below the AGENDA bar (pushing content down with a 300ms height animation). These panels contain:

**Analyze panel content:**
- Heading: "Strategic Discovery"
- Body: "Every engagement begins with understanding your organization — not deploying a curriculum. We conduct leadership alignment workshops, audit your existing data infrastructure (LMS records, project data, active initiatives), and map pain points and opportunities across functions. The result: a strategic enabler framework that ensures every training pathway and innovation activity is tied to your actual business goals."
- Three check-marked items:
  - "Leadership alignment workshops to define strategic AI ambitions"
  - "Existing infrastructure audit — LMS data, project records, active initiatives"
  - "Pain point and opportunity mapping across all functions"
- Left-bordered card callout: "We don't create data burden. Our discovery process plugs into what already exists and layers our diagnostic on top."

**Evaluate panel content:**
- Heading: "Baseline & Calibration"
- Body: "Before training begins, we establish the measurement baseline that will prove ROI at close. Individual calibration combines organizational data with a lightweight self-assessment to assign each participant to the right track — ensuring nobody wastes time and everyone reaches the standard their role requires."
- Three check-marked items:
  - "Individual calibration using organizational data and self-assessment"
  - "Baseline measurement of AI maturity for ROI tracking"
  - "Track assignment calibrated to role, function, and strategic priority"

Panel styling: background `--color-section-bg`, border-bottom `1px solid var(--color-border)`, padding 32px. Max-width 720px centered within the bar's content area.

### Responsive Behavior
**Tablet:** AGENDA bar maintains horizontal layout but items become more compact. Letters and words shrink slightly.

**Mobile:** The bar becomes a scrollable horizontal strip (overflow-x: auto, no wrapping). Or collapses to just the six letters without the words below, with the active letter labeled. Still sticky.

---

## Section 2: Personalized Pathways

### 2.1 Overview
Corresponds to the "Generate" phase of the AGENDA. Explains how individuals are assigned to Foundation, Accelerated, or Validation tracks. Uses flippable cards to provide depth on demand.

### 2.2 Content Specification

**Section heading:** "Personalized Pathways" with "Pathways" receiving the teal underline decoration.

**Sub-heading:** "Everyone passes through every level — nobody skips. But the depth of engagement is calibrated to each individual's role, readiness, and strategic relevance."

**Disclaimer text (below the cards):** "These pathways are illustrative. Every engagement is calibrated to your organization's specific context, data, and strategic priorities." — styled as 13px italic, `--color-body-text-light`, centered.

**Link text (below disclaimer):** "Each track is tailored across all five capability levels →" — `--color-teal`, weight 600, 14px. Links to the Five Levels overview page.

### 2.3 Layout & Structure
- Background: `--color-section-bg`
- Section padding: 100px top and bottom
- Centered heading group (heading + sub-heading), max-width 540px
- Below the heading group: three cards in a horizontal row, equal width, gap 24px
- Below cards: disclaimer text, then link text, both centered

### 2.4 Component: Track Cards (Flippable)

Three cards, each representing a track. Each card has a **front face** (default) and a **back face** (revealed on hover/click).

**Card dimensions:** Flex 1, min-width 280px, height 320px (fixed to enable flip). Border-radius 12px.

**Front face content:**

| Track | Color accent | Tagline | Depth indicator |
|---|---|---|---|
| Foundation | `--color-peach` | Full immersion for deep learning | 4–6 sessions per level |
| Accelerated | `--color-yellow` | Targeted depth for familiar practitioners | 1–2 sessions per level |
| Validation | `--color-mint` | Rapid validation for proficient users | Self-paced validation |

Front face layout:
- A horizontal color bar at the top of the card (8px height, full width, using the track's accent color, border-radius top corners)
- Track name: 20px, weight 700, `--color-navy`, centered
- Tagline: 14px, weight 400, `--color-body-text`, centered, max 2 lines
- Depth indicator: displayed in a small pill/badge using the accent color as background, navy text, 12px weight 600
- A subtle "Flip for details" label at the bottom: 12px, `--color-med-gray`, with a small rotate icon (Lucide `RotateCw` or `FlipHorizontal`)

**Back face content:**

| Track | Activities | Checkpoint |
|---|---|---|
| Foundation | Workshop series with hands-on exercises, guided practice with real work scenarios, peer collaboration sessions, practical capstone project | Comprehensive assessment covering application, not just knowledge |
| Accelerated | Condensed workshop covering core concepts, focused practical exercise using participant's own workflows, brief peer discussion | Targeted assessment validating both understanding and application |
| Validation | Diagnostic self-assessment to identify any gaps, practical competency challenge using a real scenario, gap-fill micro-session if needed | Certification granted on demonstrated proficiency |

Back face layout:
- Same card dimensions and border-radius
- Background: white
- Title: "What [Track Name] Looks Like" — 16px, weight 700, `--color-navy`
- 3-4 compact items with small teal check icons, 13px body text
- At the bottom: "All tracks converge on the same certification standard" — 12px, `--color-teal`, weight 600

**Flip interaction:**
- CSS 3D transform: `rotateY(180deg)` on hover (desktop) or click/tap (mobile)
- Transition: 500ms ease
- Use `perspective(1000px)` on the parent, `backface-visibility: hidden` on both faces
- Both faces positioned absolutely within the card container
- On mobile: tap to flip, tap again or tap outside to flip back

### 2.5 Responsive Behavior
**Tablet:** Three cards may shrink or shift to a 2+1 stacked layout. Card height adjusts if needed.
**Mobile:** Cards stack vertically, full width. Flip becomes tap-triggered. Card height auto-adjusts to content.

---

## Section 3: Capability Waves + Innovation + Operationalization (Combined)

### 3.1 Overview
This is the largest section of the page. It unifies three previously separate concepts — the five-level training deployed in waves, the innovation pipeline, and operationalization — into a single narrative flow. It corresponds to the Navigate, Develop, and Act phases of the AGENDA.

The section is structured as three distinct wave blocks stacked vertically, each with progressively richer visual treatment to signal escalating complexity and impact.

### 3.2 Content Specification

**Section heading:** "From Capability to Impact" with "Impact" receiving the teal underline decoration.

**Sub-heading:** "Five levels of AI capability deployed in three progressive waves — from changing daily habits to rethinking your entire operating model."

### 3.3 Wave 1: Changing Ways of Working

**AGENDA phase:** Navigate

**Wave label:** "WAVE 1" (eyebrow, teal, uppercase, 12px weight 700, letter-spacing 0.08em)

**Wave title:** "Changing Ways of Working"

**Wave description (2-3 sentences):**
"The goal of Wave 1 is behavioral change — getting your people to confidently use AI in their daily work. This isn't about innovation tenders or complex systems. It's about building comfort, creating shared language, understanding risks, and embedding AI into the way your teams already operate."

**Key message callout (left-bordered card, teal border):**
"Wave 1 focuses on adoption and culture. Participants apply what they learn immediately to their existing workflows — no sandbox required, no committee approvals. The change happens at desk level."

**Level cards within Wave 1:**

**Level 1: AI Fundamentals & Awareness**
- Focus: Prompt engineering, AI literacy, responsible use, multimodal awareness
- Objective: Build comfort and curiosity using AI in everyday tasks
- Target: New joiners, juniors, AI beginners
- Key topics: What is an LLM, prompting basics, everyday use cases, intro to creative AI, responsible use & governance, prompt library creation
- Tools: ChatGPT, DALL·E, Opus Clip, Snipd, Descript
- Sessions: Microlearning videos, myth-busting quizzes, live demos, prompt practice exercises
- Card CTA: "Explore Level 1 →" (links to Level 1 detail page)

**Level 2: Applied Capability**
- Focus: Building custom AI agents/GPTs for specific roles and workflows
- Objective: Empower individuals to design AI assistants tailored to their work
- Target: Consultants, PMs, functional experts
- Key topics: What are AI agents, custom GPTs, instruction design, human-in-the-loop, ethical framing, agent templates
- Tools: ChatGPT Custom GPT Builder, Claude Skills, Copilot Agents, prompt template libraries
- Sessions: Hands-on GPT building workshops, template library creation, peer review of agents
- Card CTA: "Explore Level 2 →" (links to Level 2 detail page)

**Visual treatment:** Wave 1 block has a white background with `1px solid var(--color-border)` border, border-radius 16px. Clean, simple — reflecting foundational content. Level cards inside are standard white cards with border.

### 3.4 Wave 2: Building Systems That Last

**AGENDA phase:** Navigate / Develop (transition)

**Wave label:** "WAVE 2"

**Wave title:** "Building Systems That Last"

**Wave description:**
"Wave 2 shifts from individual capability to systemic integration. This is where cross-functional collaboration begins — connecting workflows across teams, identifying structural pain points, and designing automated pipelines that scale. The sandbox environment becomes essential, giving teams a protected space to experiment with integration before anything touches production."

**Key message callout:**
"This wave is about infrastructure, not experimentation. You're identifying the workflows that, once automated, will deliver compounding returns. Cross-functional cohorts design together, because the best systems span departmental boundaries."

**Sandbox callout (styled differently — ice-blue background panel):**
Title: "The Sandbox Environment"
Body: "A protected workspace where teams can prototype automated workflows with real data structures but no production risk. IT sets this up with Oxygy's guidance. Ideas that prove viable here advance to Wave 3 for full innovation evaluation."

**Level card within Wave 2:**

**Level 3: Systemic Integration**
- Focus: End-to-end automated workflows using integration platforms
- Objective: Scale AI usage through integrated, automated pipelines
- Target: Advanced users, digital leads, CoEs
- Key topics: AI workflow mapping, agent chaining, input logic & role mapping, automated output generation, human-in-the-loop design, performance & feedback loops
- Tools: Make, Zapier, n8n, API integrations
- Key concept: Data collected → processed by AI agents → stored in databases, automatically. Human-in-the-loop via rationale trails for every AI decision
- Sessions: Workflow design workshops, live build sessions, architecture reviews
- Card CTA: "Explore Level 3 →"

**Visual treatment:** Wave 2 block has a subtle ice-blue tinted background (`--color-ice-blue-bg`), `1px solid var(--color-border)` border, border-radius 16px. The Level 3 card has a 4px teal left border. Slightly more visual weight than Wave 1.

### 3.5 Wave 3: Rethinking the Model

**AGENDA phase:** Develop / Act

**Wave label:** "WAVE 3"

**Wave title:** "Rethinking the Model"

**Wave description:**
"This is where innovation truly begins. Wave 3 participants aren't incrementally improving — they're reimagining how the organization operates. Level 4 and 5 capabilities enable teams to build entirely new interfaces, applications, and user experiences. The innovation pipeline ensures the best ideas are captured, validated, and deployed."

**Level cards within Wave 3:**

**Level 4: Interactive Dashboards & Tailored Front-Ends**
- Focus: Designing interactive dashboards for AI-powered outputs
- Objective: Shift from data-in-a-spreadsheet to tailored experiences for specific end users
- Design approach: Work backwards from the end user — what insights, what layout, what inputs, what processing
- Example: Custom LMS dashboard for HR/L&D tracking learning journeys, scores, surveys
- Sessions: UX design workshops, dashboard prototyping, user journey mapping
- Card CTA: "Explore Level 4 →"

**Level 5: Full AI-Powered Applications**
- Focus: Complete applications with individual user accounts, personalized experiences, role-based journeys
- Objective: Full-stack AI applications where different users get different experiences
- Builds on: L3 workflows + L4 front-ends + individual accounts + personalization
- Examples: Second Brain app (AI-processed notes, docs, videos → personal knowledge base), Custom LMS platform (individual learning pathways, per-account tracking, admin dashboard)
- Sessions: Product design sprints, full-stack build workshops, user testing sessions
- Card CTA: "Explore Level 5 →"

**Innovation Pipeline (embedded within Wave 3):**

Below the level cards, a sub-section titled "The Innovation Pipeline" appears. This is a vertical funnel visualization with 5 narrowing stages:

| Stage | Width | Title | Description | Who |
|---|---|---|---|---|
| 1 | 100% | Innovation Briefs Submitted | Participants submit structured ideas aligned to strategic enablers — not free-form brainstorming | All Wave 2-3 participants |
| 2 | 85% | Steering Committee Review | Joint Oxygy + client leadership evaluate ideas against strategic fit, impact, and feasibility | Oxygy advisors + client leadership |
| 3 | 68% | Sandbox Prototyping | Approved ideas enter the sandbox for rapid prototyping. Level 4-5 participants build these as training projects | Advanced cohorts + IT |
| 4 | 52% | Technical Validation | Engineering assesses data requirements, security, integration feasibility, and scalability | Client tech team + Oxygy |
| 5 | 38% | Prioritized for Deployment | Top-scoring ideas resourced and prepared for operating model integration | Steering committee decision |

Each stage is a card that narrows in width, centered, connected by vertical lines (2px `--color-border`). Stage 5 card uses teal accent (deeper teal border or teal icon background) to signal the output point.

**Operationalization (embedded as closing beat of Wave 3):**

Below the pipeline, a brief operationalization segment:

Title: "From Validated to Operational"

Three items in a horizontal row (matching the Oxygy service card pattern):

| Item | Icon (Lucide) | Title | Description |
|---|---|---|---|
| 1 | Settings | Operating Model Integration | Validated solutions embedded into workflows, processes, and roles. SOPs updated, ownership defined, monitoring established. |
| 2 | ShieldCheck | Governance & Accountability | Human-in-the-loop protocols, escalation paths, and quality frameworks. Every AI decision has a reasoning trail. |
| 3 | Network | Sustained by Champions | AI Champions become long-term stewards — internal advocates, first-line support, continuous improvement drivers. |

Card styling: White bg, `1px solid var(--color-border)`, 48px navy circle icon at top, bold navy title, gray body text. Standard Oxygy service card pattern. No shadow.

**ROI callout (left-bordered teal card, below the three items):**
"Every engagement begins and ends with measurement. We baseline your organization's AI maturity during discovery and measure impact at close — so you can quantify the transformation, not just feel it."

**Visual treatment for Wave 3 overall:** The wave block has a more prominent background — `background: var(--color-ice-blue-bg)` with a very subtle teal-tinted inner border. Level cards use colored backgrounds (mint or ice-blue fill). This is the most visually rich wave, signaling advanced capability.

### 3.6 Responsive Behavior

**Desktop:** Wave blocks are full-width within the 1160px container. Level cards within each wave sit in a two-column layout (side by side). Pipeline stages center-narrow in the middle.

**Tablet:** Level cards stack to single column within each wave. Pipeline stages maintain centered-narrowing behavior.

**Mobile:** Everything stacks vertically. Pipeline stages become equal-width stacked cards with a number indicator (1-5) instead of width-narrowing (the funnel effect is lost on narrow viewports — replace with numbered sequential cards).

---

## Section 4: Choose Your Depth (Toggle-Based Engagement Tiers)

### 4.1 Overview
Presents the three engagement tiers as a toggle-driven visualization. The key design principle: each tier builds visibly on the previous one — the flow diagram extends rather than resets.

### 4.2 Content Specification

**Section heading:** "Choose Your Depth" with "Depth" receiving the teal underline decoration.

**Sub-heading:** "Every organization's transformation journey is different. Our engagement model scales to your ambition."

### 4.3 Component: Toggle Bar

Three toggle buttons in a horizontal row, centered:
- "Capability Building"
- "Capability + Innovation"
- "Full Transformation"

**Toggle styling:**
- Container: `1px solid var(--color-border)`, border-radius 8px, background `--color-white)`, inline-flex, padding 4px
- Each toggle button: padding `10px 24px`, border-radius 6px, font-size 14px, weight 600
- **Inactive:** background transparent, color `--color-body-text`
- **Active:** background `--color-teal`, color white
- Transition: background 200ms, color 200ms
- Only one active at a time (radio behavior)

### 4.4 Component: Engagement Flow Diagram

Below the toggle, a **horizontal flow diagram** (on desktop) or **vertical flow** (on mobile) that shows the steps included in the selected tier. The diagram uses connected nodes/cards.

**Tier 1 — Capability Building steps:**

| Step | Icon (Lucide) | Label | Detail |
|---|---|---|---|
| 1 | Search | Strategic Discovery | Leadership alignment, organizational audit, pain point mapping |
| 2 | Users | Champions Identified | Strategic selection based on influence, capability, and position |
| 3 | Sliders | Pathway Design | Individual calibration, Foundation/Accelerated/Validation assignment |
| 4 | GraduationCap | Wave 1 Training | Levels 1 & 2 — AI fundamentals and applied capability |
| 5 | GitBranch | Wave 2 Training | Level 3 — systemic integration and workflow building |
| 6 | ClipboardCheck | Baseline Measurement | AI maturity assessment and progress tracking |

**Tier 2 — Capability + Innovation adds these steps (appended):**

| Step | Icon | Label | Detail |
|---|---|---|---|
| 7 | Lightbulb | Innovation Tender | Structured brief process aligned to strategic enablers |
| 8 | FlaskConical | Sandbox Prototyping | Protected environment for rapid prototyping and experimentation |
| 9 | ShieldCheck | Steering Committee | Joint Oxygy + client evaluation of ideas against prioritization criteria |
| 10 | Cpu | Technical Validation | Feasibility, security, and integration assessment by tech team |

**Tier 3 — Full Transformation adds these steps (appended):**

| Step | Icon | Label | Detail |
|---|---|---|---|
| 11 | Layers | Wave 3 Training | Levels 4 & 5 — dashboards, applications, personalized experiences |
| 12 | Settings | Operationalization | SOP updates, process embedding, ownership and monitoring |
| 13 | Shield | Governance Frameworks | Human-in-the-loop protocols, escalation paths, accountability |
| 14 | Network | Champions Activation | Formal network activation as long-term capability stewards |
| 15 | BarChart3 | ROI Measurement | Baseline-to-close impact report quantifying transformation |

**Flow diagram node styling:**
- Each node: a compact horizontal card (auto-width, ~200px), containing the Lucide icon (20px, `--color-teal`), bold label (14px, weight 600, `--color-navy`), and detail text below (12px, `--color-body-text-light`)
- Nodes connected by horizontal lines (2px, `--color-border`) with small arrow indicators
- Nodes belonging to Tier 1 have a white background
- Additional Tier 2 nodes have a subtle ice-blue background (`--color-ice-blue-bg`)
- Additional Tier 3 nodes have a slightly deeper teal tint (`--color-teal` at 8% opacity background)

**Animation on toggle switch:**
When switching from Tier 1 to Tier 2, the existing Tier 1 nodes remain and the Tier 2 nodes animate in from the right (fade + translateX, 300ms, staggered 80ms). Same pattern for Tier 2 → Tier 3. When switching backwards (e.g., Tier 3 → Tier 1), the extra nodes animate out (fade + translateX, 200ms).

**Deliverables summary panel (below the flow diagram):**

This panel updates based on the active toggle. It shows concrete deliverables and engagement scope.

| Tier | Sessions | Key Deliverables | Engagement Footprint |
|---|---|---|---|
| Capability Building | 15–25 training sessions across cohorts | Personalized learning pathways for every participant, AI Champions identified and deployed, prompt libraries and agent template toolkits, baseline AI maturity assessment | 3–5 Oxygy facilitators, 8–12 weeks typical |
| Capability + Innovation | 25–40 sessions including innovation workshops | Everything in Capability Building, plus: innovation brief templates and tender process, sandbox environment setup and management, 4–6 steering committee sessions, technical feasibility reports for top-scoring ideas | 4–7 Oxygy facilitators, 12–18 weeks typical |
| Full Transformation | 40–60 sessions including operationalization sprints | Everything in Capability + Innovation, plus: Wave 3 advanced training (Levels 4 & 5), operating model integration workshops, governance and accountability framework documentation, Champions Network playbook and activation plan, ROI impact report (baseline-to-close) | 6–10 Oxygy facilitators, 16–24 weeks typical |

**Deliverables panel styling:**
- Background: white, `1px solid var(--color-border)`, border-radius 12px, padding 32px
- Three columns: Sessions count (large number, 28px weight 800 teal), Deliverables list (check-marked items), Footprint summary
- Content transitions with a 250ms fade when the toggle changes

### 4.5 Responsive Behavior

**Desktop:** Flow diagram is horizontal, scrollable if it exceeds viewport (but ideally wraps to 2 rows for Tier 3). Deliverables panel is three-column.

**Tablet:** Flow diagram wraps more aggressively. Deliverables panel goes to two-column.

**Mobile:** Toggle buttons stack vertically or become a segmented control. Flow diagram becomes a vertical list of steps. Deliverables panel goes to single column with the session count as a prominent header.

---

## Section 5: CTA Band

### 5.1 Overview
Full-width closing call-to-action. Standard Oxygy pattern.

### 5.2 Content
**Headline:** "Ready to Build AI Capability That Lasts?"
**Sub-text:** "Start with strategy. Build with your people. Transform with accountability."
**CTA button:** "Start the Conversation" — white pill button with teal text

### 5.3 Visual Spec
- Background: `var(--color-teal)` full-width
- Subtle watermark pattern: `repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(255,255,255,0.04) 60px, rgba(255,255,255,0.04) 62px)`
- Headline: 32-34px, weight 800, white
- Sub-text: 16px, weight 400, white at 85% opacity
- Button: white background, `--color-teal` text, pill shape (border-radius 28px), padding `14px 36px`, weight 600
- Button hover: `translateY(-1px)` + `box-shadow: 0 4px 12px rgba(0,0,0,0.15)`, 200ms
- Section padding: 72px vertical
- All content centered, max-width 640px

### 5.4 Responsive Behavior
Scales naturally. Headline may reduce to 28px on mobile. Button remains full-width on mobile with consistent padding.

---

## Developer Notes & Edge Cases

### General

1. **Scroll behavior:** All anchor links (AGENDA clicks, CTAs) should use `scroll-behavior: smooth` with an offset for the sticky AGENDA bar height (64px).

2. **IntersectionObserver setup:** Create a reusable hook (e.g., `useInView`) that returns a ref and a boolean. Use threshold 0.15 for general fade-in triggers, and threshold 0.5 for AGENDA bar active-state updates.

3. **Flip card CSS:** The 3D flip requires `transform-style: preserve-3d` on the card container and `backface-visibility: hidden` on both faces. Test in Safari — it historically has bugs with `preserve-3d`. Apply `-webkit-backface-visibility: hidden` as a fallback.

4. **SVG constellation:** Generate the node positions procedurally (or hardcode a set of coordinates). Avoid using an image — this must be inline SVG so hover interactions work. Use `<circle>`, `<line>`, and `<g>` elements.

5. **Toggle state management:** Use React `useState` for the active tier. When rendering the flow diagram, include all steps up to and including the active tier (not just the new tier's steps). This is critical for the additive visual effect.

6. **Performance:** The constellation SVG animation and the scroll-triggered reveals should use `will-change: transform, opacity` on animated elements. Remove `will-change` after animation completes to free compositor memory.

7. **AGENDA bar intersection tracking:** Use a single IntersectionObserver that watches all section containers. The AGENDA bar's active state should update to whichever section is currently most in viewport (highest intersection ratio).

8. **Reduced motion:** Respect `prefers-reduced-motion: reduce`. When detected, disable all animations — show elements at their final state immediately. The flip cards should use a simple toggle (show/hide) instead of 3D rotation.

9. **Tooltip positioning for constellation:** Tooltips should be positioned dynamically based on the Champion node's position within the SVG. If the node is in the right half of the SVG, tooltip appears to the left, and vice versa. Prevent tooltips from overflowing the viewport.

### Content integrity
10. **Level detail links:** The "Explore Level X →" links should be `<a>` tags pointing to the appropriate Level detail page routes. Use `href` props, not `onClick` handlers, for proper SEO and accessibility. If the routes aren't defined yet, use `href="/levels/1"` through `href="/levels/5"` as placeholders.

11. **All content in this PRD is final copy** unless marked as "copy direction." The developer should use the exact text provided, not invent or paraphrase.

### Anti-Vibe-Code Compliance Checklist
Before shipping, verify:
- [ ] Zero emoji anywhere — all icons are Lucide React components
- [ ] Every hex value in the code exists in the CSS variables — no orphan colors
- [ ] No box-shadow on any cards (only on sticky AGENDA bar when sticky, and CTA button on hover)
- [ ] Hover states exist on every clickable element with 150-200ms transition
- [ ] Focus states exist on every interactive element (teal-derived, not browser default)
- [ ] Scroll-triggered reveals on all below-the-fold content
- [ ] No two adjacent sections use the identical layout pattern
- [ ] Spacing varies: section gaps (96-112px) > group gaps (40-56px) > item gaps (16-24px)
- [ ] The constellation diagram uses real SVG, not an image
- [ ] The flip cards have both face states fully implemented
- [ ] Toggle flow diagram nodes animate additively (extend, not reset)
- [ ] Body text is never centered (only headings and sub-headings)
- [ ] Font is DM Sans loaded from Google Fonts — never a system font fallback
- [ ] Accent colors (peach, yellow, mint, lavender) appear only in their designated contexts
- [ ] The teal underline decoration is a positioned element, not colored text
