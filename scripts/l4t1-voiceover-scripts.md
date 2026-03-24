# L4T1 Voiceover Scripts — "Scoping Your AI Tool"

Voice: `en-GB-RyanNeural` | 14 slides, 17 total clips (14 setup + 3 progressive-reveal)

---

## Slide 1 — Course Intro (`courseIntro`)
**File:** `l4t1-s01-setup.mp3`

Welcome to Level 4 — From Idea to Brief: Scoping Your AI Tool. In about twenty minutes, you'll learn why the bottleneck in building AI tools has shifted from technical skill to clarity. We'll cover what a PRD is and why it matters, the four components of a strong brief — Purpose, Users, Features, and Data Sources — how to tell a well-scoped tool from an under-defined idea, and a scoring framework to pressure-test any brief before you build.

**~72 words**

---

## Slide 2 — Evidence Hero: Anyone can build now (`evidenceHero`)
**File:** `l4t1-s02-setup.mp3`

Here's the new reality. A paradigm shift has arrived: describe what you want in plain language, and an AI tool builds it for you. No traditional coding required. McKinsey's 2024 survey found that sixty-five percent of organisations now regularly use generative AI — up from thirty-three percent just two years earlier. Building has never been more accessible. But when anyone can build, the constraint shifts from how to build to how clearly you can define what you want.

**~74 words**

---

## Slide 3 — Concept: What is vibe coding? (`concept`)
**File:** `l4t1-s03-setup.mp3`

This shift has a name — vibe coding. Coined by AI researcher Andrej Karpathy in early 2025, it means building software by describing what you want in plain language and letting an AI tool generate the working implementation. Tools like Cursor, Bolt, Lovable, and Replit Agent now produce working web apps from a description in minutes. The hard part is no longer the build. It's being specific enough about what you want that the AI builds the right thing.

**~76 words**

---

## Slide 4 — Concept: Most AI projects stall (`concept`)
**File:** `l4t1-s04-setup.mp3`

And that's exactly where things go wrong. Gartner predicts that thirty percent of generative AI projects will be abandoned after proof of concept. The reason is rarely technical. When organisations survey why projects stall, unclear business value, poor data quality, and misaligned expectations rank far above technology problems. The tools work. The problem is that builders couldn't articulate who the tool was for, what it needed to do, or what data it needed to run.

**~72 words**

---

## Slide 5 — Tension Statement (`tensionStatement`)
**File:** `l4t1-s05-setup.mp3`

So here's the tension. At Level 3, you built workflows that run themselves — triggered by events, chained across steps, delivering outputs with no one pressing go. But those outputs land somewhere: a log file, a spreadsheet, a database row. The people who need to act on them still have to go looking. The Level 4 unlock is building a front end that surfaces the right output to the right person at the right time.

**~72 words**

---

## Slide 6 — Concept: What is a PRD? (`concept`)
**File:** `l4t1-s06-setup.mp3`

Enter the Product Requirements Document — or PRD. It's a written definition of the tool you intend to build, created before a single line of code is written. It answers four questions: what problem does this solve, who will use it, what should it do, and what data does it need? In an era where AI can build almost anything you describe, the PRD is how you make sure you describe the right thing. It's not bureaucracy — it's the shortest path between an idea and a working tool.

**~84 words**

---

## Slide 7 — RCTF: The Four Components (progressive-reveal, 4 clips)

### 7a — Setup (Purpose)
**File:** `l4t1-s07-setup.mp3`

A strong brief has exactly four components. First up: Purpose. This defines what problem the tool solves and for whom. A clear purpose includes the trigger — when someone opens the tool — the outcome — what they should be able to do after using it — and the success criteria — how you'll know it's working. Without this, any output feels like it worked because there's no agreed definition of success. Click next to see the second component.

**~72 words**

### 7b — Reveal 1 (Users)
**File:** `l4t1-s07-reveal1.mp3`

Second: Users. Not the team the tool benefits — the specific person who opens it. Their role, context, technical comfort, and what they already know shape every design decision that follows. A non-technical operations manager who checks in weekly needs something fundamentally different from a data analyst reading raw tables. Without this, features get built for the builder's preferences, not the user's actual needs.

**~62 words**

### 7c — Reveal 2 (Features)
**File:** `l4t1-s07-reveal2.mp3`

Third: Features. This defines what the tool actually does — what inputs it accepts, what AI processing it performs, and what outputs it produces. The key is scoping features to what the user needs, not to everything the builder could add. Without a clear feature scope, the build expands indefinitely as new ideas arrive mid-development.

**~54 words**

### 7d — Reveal 3 (Data Sources)
**File:** `l4t1-s07-reveal3.mp3`

And fourth: Data Sources. Every AI-powered tool depends on data — and many fail right here because the data required doesn't exist, isn't accessible, or isn't clean enough to use. Define this before you build. A tool that gets built and then discovers its data doesn't exist has wasted everyone's time. Those are your four components — skip any one and the build will reflect it.

**~64 words**

---

## Slide 8 — Situational Judgment: Which component is under-defined? (`situationalJudgment`)
**File:** `l4t1-s08-setup.mp3`

Time to apply what you've learned. You're about to see three real briefs — each one has a gap. Your job is to identify which of the four components is under-defined. Think carefully about what information is missing and what consequence that gap would create. Each scenario is based on a pattern that shows up in real projects.

**~56 words**

---

## Slide 9 — Comparison: Same idea, two briefs (`comparison`)
**File:** `l4t1-s09-setup.mp3`

Here's the difference a good brief makes. You're looking at the same tool idea — a project status dashboard for leadership — approached two different ways. Toggle between the tabs to compare. The first brief is under-defined: vague on what status means, which projects, which leader, and what action they should take. The second brief answers all four components. Notice how every design decision becomes answerable once the brief is specific.

**~70 words**

---

## Slide 10 — Flipcard: Strong vs. weak components (`flipcard`)
**File:** `l4t1-s10-setup.mp3`

Let's zoom in to the component level. Each card shows a weak version of a brief component on the front. Click to flip and see what a strong version looks like. Pay attention to the difference — it's always specificity. A vague component leaves design decisions to the builder's assumptions. A specific one makes every decision answerable.

**~55 words**

---

## Slide 11 — Drag Sort: Brief readiness (`dragSort`)
**File:** `l4t1-s11-setup.mp3`

Now put it into practice. You're reviewing six brief statements before they go to a builder. Drag each one into the correct readiness level — Strong, Partial, or Not Ready. Think about whether the statement is specific enough to make a design decision from, whether it's defined but still needs detail, or whether it's too vague to act on at all.

**~60 words**

---

## Slide 12 — Concept: The Brief Readiness Framework (`concept`)
**File:** `l4t1-s12-setup.mp3`

Here's the framework you'll use before every build. Score your brief on each of the four components — from zero for missing, up to three for specific. A brief scoring ten or above out of twelve is ready to build from. Below eight, you need to go back and define further. And any component scoring zero is a blocker — do not build until it's addressed. A brief that scores ten takes twenty minutes to write. The rebuild it prevents takes weeks.

**~78 words**

---

## Slide 13 — Module Summary (`moduleSummary`)
**File:** `l4t1-s13-setup.mp3`

That's Level 4. You now have a complete framework for scoping any AI-powered tool before you build it. Remember the four components: Purpose defines the problem and success criteria. Users names the specific person, not the team. Features scopes what the tool does to what the user needs. And Data Sources validates that the information actually exists. Score your brief before you build — and head to the Dashboard Designer in the toolkit to put this into practice.

**~74 words**

---

## Slide 14 — Bridge: Your brief is ready (`bridge`)
**File:** `l4t1-s14-setup.mp3`

Your brief is ready — now it's time to build it. The Dashboard Designer takes your four components and walks you through them step by step. It flags gaps between your features and your data sources, scores your brief on the readiness framework, and produces a shareable specification document. Everything you've learned in this module feeds directly into the tool. Go ahead and open it when you're ready.

**~66 words**
