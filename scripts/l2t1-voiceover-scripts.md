# L2T1 Voiceover Scripts — "From Prompts to Reusable Tools"

Voice: `en-GB-RyanNeural` | 13 slides, 13 setup clips, 0 reveal clips

---

## Slide 1 — Course Intro (`courseIntro`)
**File:** `l2t1-s01-setup.mp3`

Welcome to Level 2 — Designing Your First AI Agent. In about twenty minutes, you'll learn how to take the prompts you built in Level 1 and turn them into permanent, reusable tools that anyone on your team can run. We'll cover three things: how to recognise when a task deserves to become an agent, how to design one using a simple three-layer model, and how to build in accountability so the outputs can actually be trusted. Let's get into it.

**~70 words**

---

## Slide 2 — Evidence Hero: The rework problem (`evidenceHero`)
**File:** `l2t1-s02-setup.mp3`

Here's the problem. Teams everywhere are using AI — but everyone's doing it their own way. One person writes a prompt, gets a result, and moves on. Their colleague does the same task with a completely different approach and gets a completely different output. According to McKinsey, knowledge workers spend nearly a fifth of their week just recreating information that already exists somewhere in their organisation. That's not an AI problem — it's a standardisation problem. And that's exactly what Level 2 solves.

**~80 words**

---

## Slide 3 — Evidence Hero: Compounding returns (`evidenceHero`)
**File:** `l2t1-s03-setup.mp3`

Now here's the upside. A prompt runs once and disappears. But a well-designed agent runs every time — for anyone. McKinsey's 2024 survey found that teams get two point four times more value when AI tools are standardised and shared, compared to individual use. That's because every run after the first one is essentially free. You're not saving time once — you're saving it hundreds of times, across everyone who does that task.

**~72 words**

---

## Slide 4 — Tension Statement (`tensionStatement`)
**File:** `l2t1-s04-setup.mp3`

So here's the tension. Level 1 gave you a prompt that gets results — and that's a real skill. But that prompt lives in your session history. It doesn't run when you're away. It doesn't reach your colleagues. And every time someone else tries to recreate it, they get something slightly different. The Level 2 unlock is taking that prompt and turning it into a standardised tool that anyone on the team can run, any time, and get the same output.

**~78 words**

---

## Slide 5 — Concept: What is an AI agent? (`concept`)
**File:** `l2t1-s05-setup.mp3`

Let's start with a definition. A prompt is a one-time request — you write it, the AI responds, and it's gone. An agent is different. It's a configured AI tool that remembers its purpose, its rules, and its output format. You design it once, and it runs the same way every time. The key difference isn't that agents are smarter. It's that they're permanent. Think of it this way: a prompt is a conversation. An agent is a colleague.

**~76 words**

---

## Slide 6 — Concept: When does a prompt become an agent? (`concept`)
**File:** `l2t1-s06-setup.mp3`

Not every prompt should become an agent — that would be overkill. The investment makes sense when three conditions are true. First, the task repeats on a regular pattern. Second, the output needs to look the same every time. And third, more than one person on your team needs to run it. When all three apply, you've got a strong case for building an agent. Let's put that to the test right now.

**~70 words**

---

## Slide 7 — Situational Judgment: Agent or prompt? (`situationalJudgment`)
**File:** `l2t1-s07-setup.mp3`

Time for a judgement call. You're about to meet three people — each with a real task. For each one, decide: should they build a reusable agent, or is a well-crafted prompt the right tool? Think about the three conditions you just learned — does the task repeat, does the output need consistency, and does more than one person need to run it? Take your time with each scenario. There's no rush.

**~68 words**

---

## Slide 8 — Concept: The Three-Layer Model (`concept`)
**File:** `l2t1-s08-setup.mp3`

Now that you know when to build an agent, let's talk about how. Every Level 2 agent is built from three distinct layers. What goes in — that's the Input layer. How the AI behaves — that's the Processing layer. And what comes out — that's the Output layer. Design all three, and you have something reusable, consistent, and shareable. On the next slide, we'll open each one up and look at what's inside.

**~72 words**

---

## Slide 9 — RCTF: Inside the three layers (`rctf`, progressive-reveal × 3 clips)

### 9a — Setup (Input layer)
**File:** `l2t1-s09-setup.mp3`

Let's go deeper, starting with the Input layer. This is what the user provides each time — the data format, the required fields, and how to supply them. Think meeting notes, email threads, project tracker entries — all pasted into a standard template. The rule is simple: consistent input equals consistent output. Click next to see the second layer.

**~55 words**

### 9b — Reveal 1 (Processing layer)
**File:** `l2t1-s09-reveal1.mp3`

Now the Processing layer. This is the system prompt — the agent's permanent operating manual. It defines the role, the task instructions, the reasoning steps, and the accountability rules. This is your Prompt Blueprint from Level 1, promoted to permanent instructions. The system prompt never changes from run to run — that's what makes the agent reliable.

**~52 words**

### 9c — Reveal 2 (Output layer)
**File:** `l2t1-s09-reveal2.mp3`

And finally, the Output layer. This locks down the structure of what comes out — a defined format like a JSON schema or a structured template that stays consistent across every single run. When the output is structured, results become comparable, shareable, and verifiable. Get all three layers right, and the agent just works.

**~52 words**

---

## Slide 10 — Drag Sort: Sort the layers (`dragSort`)
**File:** `l2t1-s10-setup.mp3`

Let's see if you've got it. On screen you'll see eight design elements from a real agent — a weekly status update tool for a project team. Your job is to drag each element into the correct layer: Input, Processing, or Output. Think about it this way — is this something the user provides, something that tells the AI how to behave, or something that defines the shape of the result?

**~66 words**

---

## Slide 11 — Concept: Custom GPTs (`concept`)
**File:** `l2t1-s11-setup.mp3`

So where do you actually build one of these? One of the fastest routes is Custom GPTs inside ChatGPT. Every field in the builder maps directly to the three layers you just learned. The Instructions field is your system prompt — that's the Processing layer. The Knowledge section lets you upload context files — enriching the Input layer. And Conversation Starters define how your team begins each interaction. You can share the finished agent with your team via a simple link.

**~76 words**

---

## Slide 12 — Concept: Claude Skills (`concept`)
**File:** `l2t1-s12-setup.mp3`

Anthropic's Claude takes a completely different approach. Instead of building a standalone tool in a graphical interface, you write a Skill — a plain markdown file that contains your system prompt, your rules, your expected input format, and your output structure. When you need that behaviour, you call the skill from any conversation. The critical difference is portability. With a Custom GPT, your team has to navigate to a specific tool. With a Claude Skill, the instructions come to the conversation — wherever it's happening. The same skill works in the Claude chat interface, in Claude Code for developers, or through the API. Your agent logic isn't locked to one product surface. And because it's a markdown file, anyone on the team can read it, edit it, or put it in version control — just like any other document.

**~130 words**

---

## Slide 13 — Concept: Google Gems (`concept`)
**File:** `l2t1-s13-setup.mp3`

Google takes yet another approach with Gems inside Gemini. You create a Gem by writing a name, adding instructions, and uploading knowledge files — the same three-layer pattern we've been using. But what makes Gems unique is where they live. The same Gem appears in the Gemini web app, on your phone, and — this is the key part — in the Gemini side panel inside Google Docs, Sheets, Slides, and Gmail. Your agent sits right next to the document you're working on, not in a separate tab or a separate tool. Sharing is just as natural: you share a Gem the same way you'd share a Drive file. Google also recommends structuring your instructions around four areas — Persona, Task, Context, and Format — which maps almost exactly to the Prompt Blueprint you learned in Level 1.

**~132 words**

---

## Slide 14 — Comparison: Same task, three approaches (`comparison`)
**File:** `l2t1-s14-setup.mp3`

Here's where it all comes together. You're looking at the same task — producing a weekly status update — approached three different ways. Toggle between the tabs to see the difference. The first is a basic ad-hoc prompt. The second adds a Processing layer — role and instructions. The third is a full three-layer agent with structured input, defined behaviour, and a locked output format. Notice how each layer you add makes the result more consistent and more trustworthy.

**~76 words**

---

## Slide 13 — Module Summary (`moduleSummary`)
**File:** `l2t1-s13-setup.mp3`

That's Level 2. You now have a framework for turning your best prompts into permanent, reusable agents. Remember the three layers: Input defines what goes in, Processing defines how the AI behaves, and Output locks down the structure. And remember the test — build an agent when the task repeats, when consistency matters, and when more than one person needs to run it. Head to the Agent Builder in the toolkit to put this into practice.

**~74 words**
