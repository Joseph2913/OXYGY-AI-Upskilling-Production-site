# Claude Code Task: Video Curation Backend — Integrating Curated Videos into the Learning Coach

## Context: What Was Done

A three-stage YouTube video curation pipeline was built and executed locally. Here's what happened:

### Stage 1: Scraping
- Scraped 51 YouTube channels via Apify, producing **10,894 videos** stored in `data/channel-catalogue-raw.json`
- Each video has: `videoId`, `title`, `url`, `thumbnailUrl`, `durationSeconds`, `publishedAt`, `viewCount`, `channelName`, `channelTier` (1–4), `channelLevels` (which levels the channel maps to)

### Stage 2: Scoring
- Used a two-pass approach:
  - **Pass 1**: Gemini Flash bulk-filtered videos in chunks of 1,000, identifying candidates per topic
  - **Pass 2**: Claude Sonnet scored candidates in batches of 100, or Gemini Flash single-pass returned top 10 directly
- Results saved per topic as `data/scores-{topicId}.json`
- Each scored video has: all original fields + `relevanceScore`, `learningMethodType`, `relevanceRationale`

### Stage 3: Human Review
- Joseph reviewed the top 10 videos per topic via a localhost dashboard
- Selected his **top 3 picks** (1st, 2nd, 3rd) for each of the 29 topics
- Selections saved in `data/selections.json` — maps `topicId` → `{ videoIndex: rank }`

---

## Current Data Files

All files are in the `data/` directory:

| File | Description |
|------|-------------|
| `channel-catalogue-raw.json` | Full catalogue of 10,894 scraped videos |
| `scores-{topicId}.json` | Scored videos per topic (top 10 for single-pass topics, larger for two-pass topics) |
| `selections.json` | Joseph's top 3 picks per topic (index into the scores file → rank "1"/"2"/"3") |

---

## The 29 Topics (5 levels × 5–6 topics each)

### Level 1: Fundamentals
| Topic ID | Title |
|----------|-------|
| 1-1 | Prompt Engineering |
| 1-2 | Context Engineering |
| 1-3 | Responsible AI Use |
| 1-4 | Multimodal AI (Image / Video / Audio) |
| 1-5 | Learning How to Learn with AI |

### Level 2: Applied
| Topic ID | Title |
|----------|-------|
| 2-1 | From Prompts to Reusable Tools |
| 2-2 | What AI Agents Are & Why They Matter |
| 2-3 | Custom GPT / Agent Building |
| 2-4 | System Prompt & Instruction Design |
| 2-5 | Human-in-the-Loop Design |
| 2-6 | Sharing & Standardising Agents |

### Level 3: Systemic
| Topic ID | Title |
|----------|-------|
| 3-1 | Mapping AI Workflows |
| 3-2 | Agent Chaining & Orchestration |
| 3-3 | Input Logic & Role Mapping |
| 3-4 | Automated Output Generation |
| 3-5 | Human-in-the-Loop at Scale |
| 3-6 | Performance & Feedback Loops |

### Level 4: Dashboards & Design
| Topic ID | Title |
|----------|-------|
| 4-1 | Designing Interactive Interfaces |
| 4-2 | UI/UX Design Fundamentals for AI Products |
| 4-3 | Visual Design — Colour, Typography & Spacing |
| 4-4 | No-Code App & Website Building |
| 4-5 | Data Visualisation & Storytelling |
| 4-6 | Role-Based Views & Personalisation |

### Level 5: Applications
| Topic ID | Title |
|----------|-------|
| 5-1 | Application Architecture |
| 5-2 | Personalisation Engines |
| 5-3 | Knowledge Base Applications |
| 5-4 | Custom Learning Platforms |
| 5-5 | Full-Stack AI Integration |
| 5-6 | User Testing & Scaling |

---

## Joseph's Top 3 Picks Per Topic

These are the human-approved primary video recommendations. The rank (1st/2nd/3rd) determines display order.

### Level 1
**1-1 Prompt Engineering:**
1. Master the Perfect ChatGPT Prompt Formula (in just 8 minutes) — Jeff Su
2. Prompting 101 | Code w/ Claude — Anthropic
3. Prompt Engineering Guide - From Beginner to Advanced — Matthew Berman

**1-2 Context Engineering:**
1. Creating a contextual workspace in ChatGPT — OpenAI
2. Context Engineering Clearly Explained — Tina Huang
3. I Wish I Started Using "Projects" Sooner — Dylan Davis

**1-3 Responsible AI Use:**
1. Best practices for designing generative AI products — Google for Developers
2. Building trust with community-informed AI evaluation — Google for Developers
3. 7 hour AI Safety Course in 35 Mins — Tina Huang

**1-4 Multimodal AI:**
1. How to Create Cinematic AI Videos (No-BS Guide) — Jeff Su
2. How to Install & Use Whisper AI Voice to Text — Kevin Stratvert
3. Create Videos with Nano Banana, Runway, ElevenLabs — ElevenLabs

**1-5 Learning How to Learn with AI:**
1. You're Not Behind: Become AI-Native (without the overwhelm) — Jeff Su
2. Lesson 1: Introduction to AI Fluency — Anthropic
3. Learn To Learn In 25 Minutes — Tina Huang

### Level 2
**2-1 From Prompts to Reusable Tools:**
1. How to Create Custom GPT | OpenAI Tutorial — Kevin Stratvert
2. Zero To Your First AI Agent In 26 Minutes — Tina Huang
3. How to Use Microsoft Copilot Studio — Kevin Stratvert

**2-2 What AI Agents Are & Why They Matter:**
1. What are AI Agents? — IBM Technology
2. Introducing Agent Development Kit — Google for Developers
3. Delegate work to ChatGPT agent — OpenAI

**2-3 Custom GPT / Agent Building:**
1. How to Create Custom GPT | OpenAI Tutorial — Kevin Stratvert
2. Getting started with projects in Claude.ai — Anthropic
3. Copilot Agents | Complete Tutorial — Kevin Stratvert

**2-4 System Prompt & Instruction Design:**
1. Claude 4 system prompt discussion — IBM Technology
2. Personalize ChatGPT with custom instructions — OpenAI
3. Build ANY AI Agent with this Context Engineering Blueprint — Cole Medin

**2-5 Human-in-the-Loop Design:**
1. What is Human In The Loop with AI? — IBM Technology
2. Orchestrating Complex AI Workflows with AI Agents & LLMs — IBM Technology
3. Trust, but Verify: Knowledge Agents for Finance Workflows — AI Engineer

**2-6 Sharing & Standardising Agents:**
1. How to Create AI Agents in Microsoft SharePoint & Teams — Kevin Stratvert
2. How to package a Copilot Studio agent into a solution — Dewain Robinson
3. Connected Agents in Microsoft Copilot Studio — Microsoft Community Learning

### Level 3
**3-1 Mapping AI Workflows:**
1. Build ANYTHING with Claude Code & n8n — Nate Herk
2. n8n Quick Start Tutorial — n8n
3. n8n Tutorial For Beginners — Aurelius Tjin

**3-2 Agent Chaining & Orchestration:**
1. Orchestrating Complex AI Workflows — IBM Technology
2. Multi-Agent Systems Have NEVER Been EASIER — Nate Herk
3. I Built the Ultimate Team of AI Agents in n8n — Nate Herk

**3-3 Input Logic & Role Mapping:**
1. What are AI Agents? — IBM Technology
2. Anatomy of AI Agents — IBM Technology
3. Multi Agent Systems Explained — IBM Technology

**3-4 Automated Output Generation:**
1. n8n Tutorial for Beginners — Kevin Stratvert
2. Automate Everything with Zapier AI Agents — Kevin Stratvert
3. Make.com AI Agent Tutorial — Kevin Stratvert

**3-5 Human-in-the-Loop at Scale:**
1. Scaling AI Agents Without Breaking Reliability — AI Engineer
2. 1 Click Human in The Loop — n8n
3. The Secret to Making AI Agents 100% Reliable — Nate Herk

**3-6 Performance & Feedback Loops:**
1. From pilot to production: Driving ROI with genAI — IBM Technology
2. Rogue AI Agents: AI Observability — IBM Technology
3. Ensure AI Agents Work: Evaluation Frameworks — AI Engineer

### Level 4
**4-1 Designing Interactive Interfaces:**
1. How to Build & Sell Web Apps With AI Without Coding — Liam Ottley
2. AG-UI Just Released: The NEW WAVE of AI Agent Apps — Cole Medin
3. Watch Me Build Chatbots That Make Money! — Liam Ottley

**4-2 UI/UX Design Fundamentals:**
1. How To Design Better AI Apps — Y Combinator
2. AI Interfaces Of The Future | Design Review — Y Combinator
3. The design process is dead. Here's what's replacing it — Lenny's Podcast

**4-3 Visual Design:**
1. Figma Tutorial for Beginners — Kevin Stratvert
2. DesignKit 3.5 — Microsoft Community Learning
3. Why Design Matters: Lessons from Stripe, Lyft and Airbnb — Y Combinator

**4-4 No-Code App & Website Building:**
1. How to Make An App For Your Business — Kevin Stratvert
2. Best AI App Builder to Make Software in Minutes — Aurelius Tjin
3. These AI App Builders Make Full Apps You Can Sell — Aurelius Tjin

**4-5 Data Visualisation & Storytelling:**
1. Data Visualization Made Simple: Do's & Don'ts — IBM Technology
2. Stunning Visualizations with AI-First Colab — Google for Developers
3. Converting YouTube Videos into Visual Explainers — Google for Developers

**4-6 Role-Based Views & Personalisation:**
1. Building personalized experiences — Microsoft Community Learning
2. Building custom news experiences with personalisation — Microsoft Community Learning
3. Building hyper-personalized SharePoint experiences with AI — Microsoft Community Learning

### Level 5
**5-1 Application Architecture:**
1. Rise of the AI Architect — AI Engineer
2. AI Platform Engineering — AI Engineer
3. AI Copilots for Tech Architecture — AI Engineer

**5-2 Personalisation Engines:**
1. Becoming an AI PM — Lenny's Podcast
2. Why AI is disrupting traditional product management — Lenny's Podcast
3. Behind the product: Duolingo streaks — Lenny's Podcast

**5-3 Knowledge Base Applications:**
1. How to build Multimodal RAG — Google for Developers
2. VoiceVision RAG — AI Engineer
3. When Vectors Break Down: Graph-Based RAG — AI Engineer

**5-4 Custom Learning Platforms:**
1. Vibe Coding an Educational Search Tool with Gemini 3 — Google for Developers
2. Scaling AI in Education: A Khanmigo case study — AI Engineer
3. AI Slides Reviewer with Google Workspace and Gemini — Google for Developers

**5-5 Full-Stack AI Integration:**
1. 12-Factor Agents: Patterns of reliable LLM applications — AI Engineer
2. 3 ingredients for building reliable enterprise agents — AI Engineer
3. Practical tactics to build reliable AI apps — AI Engineer

**5-6 User Testing & Scaling:**
1. Shipping AI That Works: An Evaluation Framework — AI Engineer
2. Evals Are Not Unit Tests — AI Engineer
3. Ensure AI Agents Work: Evaluation Frameworks — AI Engineer

---

## What Needs to Be Built Now

### Goal
Integrate the curated video data into the Oxygy application backend so the Learning Coach can serve personalised video recommendations based on the user's selected level and topic.

### Data Architecture

**Primary recommendations (top 3 picks):**
- When a user selects a topic via the Learning Coach onboarding survey, the system should return the 3 human-approved videos for that topic, in rank order (1st, 2nd, 3rd)
- These are the guaranteed, editorially-approved recommendations

**Backup pool (remaining top 10):**
- Each topic also has up to 7 additional scored videos (the rest of the top 10 from the scoring pipeline)
- These should be available as a secondary pool for when:
  - The user asks a specific question that maps better to a different video in the pool
  - The Learning Coach wants to suggest "you might also find this useful"
  - A user has already watched the top 3 and wants more

### Implementation Steps

1. **Create a `curated_videos` Supabase table** with columns matching the CSV spec from the original PRD:
   - `level` (int), `topic_id` (text), `topic_name` (text)
   - `youtube_video_id` (text), `title` (text), `channel_name` (text), `channel_tier` (int)
   - `duration_seconds` (int), `url` (text), `thumbnail_url` (text)
   - `published_at` (text), `view_count` (int)
   - `relevance_score` (float), `learning_method_type` (text), `relevance_rationale` (text)
   - `rank` (int, nullable) — 1, 2, or 3 for primary picks; NULL for backup pool
   - `is_primary` (boolean) — true for top 3 picks, false for backup pool

2. **Write a data import script** (`scripts/4-import-to-supabase.cjs`) that:
   - Reads all `data/scores-{topicId}.json` files and `data/selections.json`
   - For each topic, marks the top 3 selected videos with their rank and `is_primary = true`
   - Marks the remaining top 10 videos as `is_primary = false`
   - Inserts all rows into the `curated_videos` table

3. **Create an API endpoint** in `functions/src/index.ts`:
   - `GET /api/curated-videos?topicId=1-1` → returns primary videos (rank 1, 2, 3) for the topic
   - `GET /api/curated-videos?topicId=1-1&includeBackup=true` → returns all 10 videos
   - `GET /api/curated-videos?level=1` → returns all primary videos for a level

4. **Integrate with the Learning Coach** (`components/app/toolkit/AppLearningCoach.tsx`):
   - When the user selects a topic in the Learning Coach survey, fetch the top 3 videos for that topic
   - Display them as recommended Watch content in the learning plan
   - When the Learning Coach chat needs to suggest additional videos (e.g. user asks a specific question), query the backup pool for the relevant topic

### Important Technical Notes

- **All API calls go through OpenRouter** for any AI features — see CLAUDE.md
- **Firebase Cloud Functions** for backend APIs — no Vercel
- **Supabase** for the database — use existing connection from `.env.local`
- **RLS policies** — follow the rules in `docs/SUPABASE_RLS_RECURSION_GUIDE.md` and use existing SECURITY DEFINER helpers
- The `data/selections.json` file uses video indices (into the scores array) as keys, and rank strings ("1", "2", "3") as values
- Some score files have 10 videos (single-pass topics), others have 1000+ (two-pass topics) — only the top 10 by relevanceScore should be imported regardless

### File References
- Score files: `data/scores-{topicId}.json` (29 files)
- Selections: `data/selections.json`
- Raw catalogue: `data/channel-catalogue-raw.json`
- Learning Coach: `components/app/toolkit/AppLearningCoach.tsx`
- Learning Coach Survey: `components/app/toolkit/LearningCoachSurvey.tsx`
- Topic definitions (current): `data/learningCoachContent.ts` → `LEVEL_OBJECTIVES`
- Cloud Functions: `functions/src/index.ts`
- Dashboard (reference only): `scripts/progress-dashboard.cjs`
