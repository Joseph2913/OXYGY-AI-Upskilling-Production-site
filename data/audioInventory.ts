/**
 * Audio Inventory — auto-generated list of all voiceover MP3 files on the platform.
 * Used by the Audio Review dashboard (/app/audio-review).
 */

export type ClipType = 'setup' | 'reveal' | 'reveal1' | 'reveal2' | 'reveal3' | 'reveal4' | 'reveal5' | 'tour';
export type LevelGroup = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'Tour';

export interface AudioClip {
  filename: string;
  path: string;
  level: LevelGroup;
  slide: number;        // 0 for tour clips
  clipType: ClipType;
  section: string;
  heading: string;
}

export const AUDIO_INVENTORY: AudioClip[] = [
  // ── Level 1, Topic 1 ──────────────────────────────────────────
  { filename: 'l1t1-s01-setup.mp3', path: '/audio/l1t1-s01-setup.mp3', level: 'L1', slide: 1, clipType: 'setup', section: 'PROMPT ENGINEERING', heading: 'Prompt Engineering Essentials' },
  { filename: 'l1t1-s02-setup.mp3', path: '/audio/l1t1-s02-setup.mp3', level: 'L1', slide: 2, clipType: 'setup', section: 'THE REALITY', heading: 'Adoption has surged.' },
  { filename: 'l1t1-s03-setup.mp3', path: '/audio/l1t1-s03-setup.mp3', level: 'L1', slide: 3, clipType: 'setup', section: 'THE REALITY', heading: 'Same tools. Very different results.' },
  { filename: 'l1t1-s04-setup.mp3', path: '/audio/l1t1-s04-setup.mp3', level: 'L1', slide: 4, clipType: 'setup', section: 'THE REALITY', heading: 'Prompting is the foundation everything else is built on.' },
  { filename: 'l1t1-s05-setup.mp3', path: '/audio/l1t1-s05-setup.mp3', level: 'L1', slide: 5, clipType: 'setup', section: 'SEE THE DIFFERENCE', heading: 'Same task. Same person. Completely different result.' },
  { filename: 'l1t1-s06-setup.mp3', path: '/audio/l1t1-s06-setup.mp3', level: 'L1', slide: 6, clipType: 'setup', section: 'SEE THE DIFFERENCE', heading: 'Context is the fuel. Fill the tank.' },
  { filename: 'l1t1-s07-setup.mp3', path: '/audio/l1t1-s07-setup.mp3', level: 'L1', slide: 7, clipType: 'setup', section: 'THE TOOLKIT', heading: 'Build a prompt from scratch.' },
  { filename: 'l1t1-s08-setup.mp3', path: '/audio/l1t1-s08-setup.mp3', level: 'L1', slide: 8, clipType: 'setup', section: 'TEST YOURSELF', heading: 'Spot the missing element.' },
  { filename: 'l1t1-s09-setup.mp3', path: '/audio/l1t1-s09-setup.mp3', level: 'L1', slide: 9, clipType: 'setup', section: 'THE APPROACHES', heading: 'Three ways to prompt.' },
  { filename: 'l1t1-s10-setup.mp3', path: '/audio/l1t1-s10-setup.mp3', level: 'L1', slide: 10, clipType: 'setup', section: 'THE APPROACHES', heading: 'Sam — Programme Coordinator' },
  { filename: 'l1t1-s10-reveal.mp3', path: '/audio/l1t1-s10-reveal.mp3', level: 'L1', slide: 10, clipType: 'reveal', section: 'THE APPROACHES', heading: 'Sam — Programme Coordinator (reveal)' },
  { filename: 'l1t1-s11-setup.mp3', path: '/audio/l1t1-s11-setup.mp3', level: 'L1', slide: 11, clipType: 'setup', section: 'THE APPROACHES', heading: 'Priya — Strategy Analyst' },
  { filename: 'l1t1-s11-reveal.mp3', path: '/audio/l1t1-s11-reveal.mp3', level: 'L1', slide: 11, clipType: 'reveal', section: 'THE APPROACHES', heading: 'Priya — Strategy Analyst (reveal)' },
  { filename: 'l1t1-s12-setup.mp3', path: '/audio/l1t1-s12-setup.mp3', level: 'L1', slide: 12, clipType: 'setup', section: 'THE APPROACHES', heading: 'Marcus — Delivery Lead' },
  { filename: 'l1t1-s12-reveal.mp3', path: '/audio/l1t1-s12-reveal.mp3', level: 'L1', slide: 12, clipType: 'reveal', section: 'THE APPROACHES', heading: 'Marcus — Delivery Lead (reveal)' },
  { filename: 'l1t1-s13-setup.mp3', path: '/audio/l1t1-s13-setup.mp3', level: 'L1', slide: 13, clipType: 'setup', section: 'THE APPROACHES', heading: 'Aisha — Communications Lead' },
  { filename: 'l1t1-s13-reveal.mp3', path: '/audio/l1t1-s13-reveal.mp3', level: 'L1', slide: 13, clipType: 'reveal', section: 'THE APPROACHES', heading: 'Aisha — Communications Lead (reveal)' },
  { filename: 'l1t1-s14-setup.mp3', path: '/audio/l1t1-s14-setup.mp3', level: 'L1', slide: 14, clipType: 'setup', section: 'THE APPROACHES', heading: 'Jordan — Process Designer' },
  { filename: 'l1t1-s14-reveal.mp3', path: '/audio/l1t1-s14-reveal.mp3', level: 'L1', slide: 14, clipType: 'reveal', section: 'THE APPROACHES', heading: 'Jordan — Process Designer (reveal)' },
  { filename: 'l1t1-s15-setup.mp3', path: '/audio/l1t1-s15-setup.mp3', level: 'L1', slide: 15, clipType: 'setup', section: 'THE TOOLKIT', heading: 'Which approach fits which situation?' },
  { filename: 'l1t1-s16-setup.mp3', path: '/audio/l1t1-s16-setup.mp3', level: 'L1', slide: 16, clipType: 'setup', section: 'WRAP UP', heading: 'What you\'ve learned' },

  // ── Level 2, Topic 1 ──────────────────────────────────────────
  { filename: 'l2t1-s01-setup.mp3', path: '/audio/l2t1-s01-setup.mp3', level: 'L2', slide: 1, clipType: 'setup', section: 'DESIGNING YOUR FIRST AI AGENT', heading: 'Designing Your First AI Agent' },
  { filename: 'l2t1-s02-setup.mp3', path: '/audio/l2t1-s02-setup.mp3', level: 'L2', slide: 2, clipType: 'setup', section: 'THE REALITY', heading: 'Everyone\'s using AI differently.' },
  { filename: 'l2t1-s03-setup.mp3', path: '/audio/l2t1-s03-setup.mp3', level: 'L2', slide: 3, clipType: 'setup', section: 'THE REALITY', heading: 'One agent. Compounding returns.' },
  { filename: 'l2t1-s04-setup.mp3', path: '/audio/l2t1-s04-setup.mp3', level: 'L2', slide: 4, clipType: 'setup', section: 'THE LEVEL 2 SHIFT', heading: 'You\'ve built something great.' },
  { filename: 'l2t1-s05-setup.mp3', path: '/audio/l2t1-s05-setup.mp3', level: 'L2', slide: 5, clipType: 'setup', section: 'WHAT IS AN AGENT', heading: 'What is an AI agent?' },
  { filename: 'l2t1-s06-setup.mp3', path: '/audio/l2t1-s06-setup.mp3', level: 'L2', slide: 6, clipType: 'setup', section: 'KNOW THE DIFFERENCE', heading: 'When does a prompt become an agent?' },
  { filename: 'l2t1-s07-setup.mp3', path: '/audio/l2t1-s07-setup.mp3', level: 'L2', slide: 7, clipType: 'setup', section: 'WHEN TO BUILD ONE', heading: 'Agent or prompt?' },
  { filename: 'l2t1-s08-setup.mp3', path: '/audio/l2t1-s08-setup.mp3', level: 'L2', slide: 8, clipType: 'setup', section: 'THE THREE-LAYER MODEL', heading: 'Every agent is built from three layers.' },
  { filename: 'l2t1-s09-setup.mp3', path: '/audio/l2t1-s09-setup.mp3', level: 'L2', slide: 9, clipType: 'setup', section: 'THE THREE-LAYER MODEL', heading: 'Inside the three layers.' },
  { filename: 'l2t1-s09-reveal1.mp3', path: '/audio/l2t1-s09-reveal1.mp3', level: 'L2', slide: 9, clipType: 'reveal1', section: 'THE THREE-LAYER MODEL', heading: 'Inside the three layers (reveal 1)' },
  { filename: 'l2t1-s09-reveal2.mp3', path: '/audio/l2t1-s09-reveal2.mp3', level: 'L2', slide: 9, clipType: 'reveal2', section: 'THE THREE-LAYER MODEL', heading: 'Inside the three layers (reveal 2)' },
  { filename: 'l2t1-s10-setup.mp3', path: '/audio/l2t1-s10-setup.mp3', level: 'L2', slide: 10, clipType: 'setup', section: 'TEST YOUR UNDERSTANDING', heading: 'Sort these into the three layers.' },
  { filename: 'l2t1-s11-setup.mp3', path: '/audio/l2t1-s11-setup.mp3', level: 'L2', slide: 11, clipType: 'setup', section: 'IN THE REAL WORLD', heading: 'Custom GPTs are agents you can build today.' },
  { filename: 'l2t1-s12-setup.mp3', path: '/audio/l2t1-s12-setup.mp3', level: 'L2', slide: 12, clipType: 'setup', section: 'IN THE REAL WORLD', heading: 'Claude Skills: instructions that follow you.' },
  { filename: 'l2t1-s13-setup.mp3', path: '/audio/l2t1-s13-setup.mp3', level: 'L2', slide: 13, clipType: 'setup', section: 'IN THE REAL WORLD', heading: 'Google Gems: agents inside your workflow.' },
  { filename: 'l2t1-s14-setup.mp3', path: '/audio/l2t1-s14-setup.mp3', level: 'L2', slide: 14, clipType: 'setup', section: 'IN PRACTICE', heading: 'The same task, three approaches.' },
  { filename: 'l2t1-s15-setup.mp3', path: '/audio/l2t1-s15-setup.mp3', level: 'L2', slide: 15, clipType: 'setup', section: 'WHAT YOU\'VE LEARNED', heading: 'Your five key takeaways' },

  // ── Level 3, Topic 1 ──────────────────────────────────────────
  { filename: 'l3t1-s01-setup.mp3', path: '/audio/l3t1-s01-setup.mp3', level: 'L3', slide: 1, clipType: 'setup', section: 'WORKFLOW DESIGN', heading: 'Mapping a Multi-Step AI Workflow' },
  { filename: 'l3t1-s02-setup.mp3', path: '/audio/l3t1-s02-setup.mp3', level: 'L3', slide: 2, clipType: 'setup', section: 'THE REALITY', heading: 'The task-to-workflow gap.' },
  { filename: 'l3t1-s03-setup.mp3', path: '/audio/l3t1-s03-setup.mp3', level: 'L3', slide: 3, clipType: 'setup', section: 'THE REALITY', heading: 'The gap is widening.' },
  { filename: 'l3t1-s04-setup.mp3', path: '/audio/l3t1-s04-setup.mp3', level: 'L3', slide: 4, clipType: 'setup', section: 'THE REALITY', heading: 'Adoption is high. Integration is rare.' },
  { filename: 'l3t1-s05-setup.mp3', path: '/audio/l3t1-s05-setup.mp3', level: 'L3', slide: 5, clipType: 'setup', section: 'THE GAP', heading: 'You\'ve built agents that work.' },
  { filename: 'l3t1-s06-setup.mp3', path: '/audio/l3t1-s06-setup.mp3', level: 'L3', slide: 6, clipType: 'setup', section: 'WHAT IS A WORKFLOW', heading: 'What is an AI workflow?' },
  { filename: 'l3t1-s07-setup.mp3', path: '/audio/l3t1-s07-setup.mp3', level: 'L3', slide: 7, clipType: 'setup', section: 'THE TECHNIQUE', heading: 'Not every task needs a workflow.' },
  { filename: 'l3t1-s08-setup.mp3', path: '/audio/l3t1-s08-setup.mp3', level: 'L3', slide: 8, clipType: 'setup', section: 'THE TECHNIQUE', heading: 'Workflow or not?' },
  { filename: 'l3t1-s09-setup.mp3', path: '/audio/l3t1-s09-setup.mp3', level: 'L3', slide: 9, clipType: 'setup', section: 'THE TECHNIQUE', heading: 'The Anatomy of an AI Workflow' },
  { filename: 'l3t1-s10-setup.mp3', path: '/audio/l3t1-s10-setup.mp3', level: 'L3', slide: 10, clipType: 'setup', section: 'THE LAYERS', heading: 'The Three Layers' },
  { filename: 'l3t1-s10-reveal1.mp3', path: '/audio/l3t1-s10-reveal1.mp3', level: 'L3', slide: 10, clipType: 'reveal1', section: 'THE LAYERS', heading: 'The Three Layers (reveal 1)' },
  { filename: 'l3t1-s10-reveal2.mp3', path: '/audio/l3t1-s10-reveal2.mp3', level: 'L3', slide: 10, clipType: 'reveal2', section: 'THE LAYERS', heading: 'The Three Layers (reveal 2)' },
  { filename: 'l3t1-s11-setup.mp3', path: '/audio/l3t1-s11-setup.mp3', level: 'L3', slide: 11, clipType: 'setup', section: 'THE TECHNIQUE', heading: 'The Six Node Types' },
  { filename: 'l3t1-s11-reveal1.mp3', path: '/audio/l3t1-s11-reveal1.mp3', level: 'L3', slide: 11, clipType: 'reveal1', section: 'THE TECHNIQUE', heading: 'The Six Node Types (reveal 1)' },
  { filename: 'l3t1-s11-reveal2.mp3', path: '/audio/l3t1-s11-reveal2.mp3', level: 'L3', slide: 11, clipType: 'reveal2', section: 'THE TECHNIQUE', heading: 'The Six Node Types (reveal 2)' },
  { filename: 'l3t1-s11-reveal3.mp3', path: '/audio/l3t1-s11-reveal3.mp3', level: 'L3', slide: 11, clipType: 'reveal3', section: 'THE TECHNIQUE', heading: 'The Six Node Types (reveal 3)' },
  { filename: 'l3t1-s11-reveal4.mp3', path: '/audio/l3t1-s11-reveal4.mp3', level: 'L3', slide: 11, clipType: 'reveal4', section: 'THE TECHNIQUE', heading: 'The Six Node Types (reveal 4)' },
  { filename: 'l3t1-s11-reveal5.mp3', path: '/audio/l3t1-s11-reveal5.mp3', level: 'L3', slide: 11, clipType: 'reveal5', section: 'THE TECHNIQUE', heading: 'The Six Node Types (reveal 5)' },
  { filename: 'l3t1-s12-setup.mp3', path: '/audio/l3t1-s12-setup.mp3', level: 'L3', slide: 12, clipType: 'setup', section: 'THE TECHNIQUE', heading: 'A workflow in action.' },
  { filename: 'l3t1-s13-setup.mp3', path: '/audio/l3t1-s13-setup.mp3', level: 'L3', slide: 13, clipType: 'setup', section: 'THE TECHNIQUE', heading: 'Handoffs: where things go right or wrong.' },
  { filename: 'l3t1-s14-setup.mp3', path: '/audio/l3t1-s14-setup.mp3', level: 'L3', slide: 14, clipType: 'setup', section: 'IN PRACTICE', heading: 'Apply It: Workflow Design Decisions' },
  { filename: 'l3t1-s15-setup.mp3', path: '/audio/l3t1-s15-setup.mp3', level: 'L3', slide: 15, clipType: 'setup', section: 'WHAT YOU\'VE LEARNED', heading: 'Your five key takeaways' },

  // ── Level 4, Topic 1 ──────────────────────────────────────────
  { filename: 'l4t1-s01-setup.mp3', path: '/audio/l4t1-s01-setup.mp3', level: 'L4', slide: 1, clipType: 'setup', section: 'DASHBOARD DESIGNER', heading: 'From Idea to Brief: Scoping Your AI Tool' },
  { filename: 'l4t1-s02-setup.mp3', path: '/audio/l4t1-s02-setup.mp3', level: 'L4', slide: 2, clipType: 'setup', section: 'THE REALITY', heading: 'Anyone can build now.' },
  { filename: 'l4t1-s03-setup.mp3', path: '/audio/l4t1-s03-setup.mp3', level: 'L4', slide: 3, clipType: 'setup', section: 'THE REALITY', heading: 'What is vibe coding?' },
  { filename: 'l4t1-s04-setup.mp3', path: '/audio/l4t1-s04-setup.mp3', level: 'L4', slide: 4, clipType: 'setup', section: 'THE REALITY', heading: 'Most AI projects stall — not because of the tech.' },
  { filename: 'l4t1-s05-setup.mp3', path: '/audio/l4t1-s05-setup.mp3', level: 'L4', slide: 5, clipType: 'setup', section: 'THE GAP', heading: 'The workflow runs. Nobody sees it.' },
  { filename: 'l4t1-s06-setup.mp3', path: '/audio/l4t1-s06-setup.mp3', level: 'L4', slide: 6, clipType: 'setup', section: 'THE TECHNIQUE', heading: 'What is a Product Requirements Document?' },
  { filename: 'l4t1-s07-setup.mp3', path: '/audio/l4t1-s07-setup.mp3', level: 'L4', slide: 7, clipType: 'setup', section: 'THE TECHNIQUE', heading: 'The Four Components of a Brief' },
  { filename: 'l4t1-s07-reveal1.mp3', path: '/audio/l4t1-s07-reveal1.mp3', level: 'L4', slide: 7, clipType: 'reveal1', section: 'THE TECHNIQUE', heading: 'The Four Components of a Brief (reveal 1)' },
  { filename: 'l4t1-s07-reveal2.mp3', path: '/audio/l4t1-s07-reveal2.mp3', level: 'L4', slide: 7, clipType: 'reveal2', section: 'THE TECHNIQUE', heading: 'The Four Components of a Brief (reveal 2)' },
  { filename: 'l4t1-s07-reveal3.mp3', path: '/audio/l4t1-s07-reveal3.mp3', level: 'L4', slide: 7, clipType: 'reveal3', section: 'THE TECHNIQUE', heading: 'The Four Components of a Brief (reveal 3)' },
  { filename: 'l4t1-s08-setup.mp3', path: '/audio/l4t1-s08-setup.mp3', level: 'L4', slide: 8, clipType: 'setup', section: 'THE TECHNIQUE', heading: 'Which component is under-defined?' },
  { filename: 'l4t1-s09-setup.mp3', path: '/audio/l4t1-s09-setup.mp3', level: 'L4', slide: 9, clipType: 'setup', section: 'SEE THE DIFFERENCE', heading: 'Same idea. Two very different briefs.' },
  { filename: 'l4t1-s10-setup.mp3', path: '/audio/l4t1-s10-setup.mp3', level: 'L4', slide: 10, clipType: 'setup', section: 'SEE THE DIFFERENCE', heading: 'Strong vs. weak at the component level.' },
  { filename: 'l4t1-s11-setup.mp3', path: '/audio/l4t1-s11-setup.mp3', level: 'L4', slide: 11, clipType: 'setup', section: 'IN PRACTICE', heading: 'Sort these brief statements by readiness level.' },
  { filename: 'l4t1-s12-setup.mp3', path: '/audio/l4t1-s12-setup.mp3', level: 'L4', slide: 12, clipType: 'setup', section: 'IN PRACTICE', heading: 'The Brief Readiness Framework.' },
  { filename: 'l4t1-s13-setup.mp3', path: '/audio/l4t1-s13-setup.mp3', level: 'L4', slide: 13, clipType: 'setup', section: 'WRAP UP', heading: 'The Brief: Your Pre-Build Toolkit' },
  { filename: 'l4t1-s14-setup.mp3', path: '/audio/l4t1-s14-setup.mp3', level: 'L4', slide: 14, clipType: 'setup', section: 'WHAT\'S NEXT', heading: 'Your brief is ready. Now build it.' },

  // ── Level 5, Topic 1 ──────────────────────────────────────────
  { filename: 'l5t1-s01-setup.mp3', path: '/audio/l5t1-s01-setup.mp3', level: 'L5', slide: 1, clipType: 'setup', section: 'THE BUILD PIPELINE', heading: 'Building Full-Stack AI Applications' },
  { filename: 'l5t1-s02-setup.mp3', path: '/audio/l5t1-s02-setup.mp3', level: 'L5', slide: 2, clipType: 'setup', section: 'THE REALITY', heading: 'A dashboard shows. An application serves.' },
  { filename: 'l5t1-s03-setup.mp3', path: '/audio/l5t1-s03-setup.mp3', level: 'L5', slide: 3, clipType: 'setup', section: 'THE REALITY', heading: 'What \'application\' actually means.' },
  { filename: 'l5t1-s04-setup.mp3', path: '/audio/l5t1-s04-setup.mp3', level: 'L5', slide: 4, clipType: 'setup', section: 'THE REALITY', heading: 'Level 5 is what all the other levels become.' },
  { filename: 'l5t1-s05-setup.mp3', path: '/audio/l5t1-s05-setup.mp3', level: 'L5', slide: 5, clipType: 'setup', section: 'THE GAP', heading: 'Five pieces. One decision.' },
  { filename: 'l5t1-s06-setup.mp3', path: '/audio/l5t1-s06-setup.mp3', level: 'L5', slide: 6, clipType: 'setup', section: 'THE GAP', heading: 'Two responses to complexity.' },
  { filename: 'l5t1-s07-setup.mp3', path: '/audio/l5t1-s07-setup.mp3', level: 'L5', slide: 7, clipType: 'setup', section: 'THE PIPELINE', heading: 'The five-stage build pipeline.' },
  { filename: 'l5t1-s07-reveal1.mp3', path: '/audio/l5t1-s07-reveal1.mp3', level: 'L5', slide: 7, clipType: 'reveal1', section: 'THE PIPELINE', heading: 'The five-stage build pipeline (reveal 1)' },
  { filename: 'l5t1-s07-reveal2.mp3', path: '/audio/l5t1-s07-reveal2.mp3', level: 'L5', slide: 7, clipType: 'reveal2', section: 'THE PIPELINE', heading: 'The five-stage build pipeline (reveal 2)' },
  { filename: 'l5t1-s07-reveal3.mp3', path: '/audio/l5t1-s07-reveal3.mp3', level: 'L5', slide: 7, clipType: 'reveal3', section: 'THE PIPELINE', heading: 'The five-stage build pipeline (reveal 3)' },
  { filename: 'l5t1-s07-reveal4.mp3', path: '/audio/l5t1-s07-reveal4.mp3', level: 'L5', slide: 7, clipType: 'reveal4', section: 'THE PIPELINE', heading: 'The five-stage build pipeline (reveal 4)' },
  { filename: 'l5t1-s08-setup.mp3', path: '/audio/l5t1-s08-setup.mp3', level: 'L5', slide: 8, clipType: 'setup', section: 'THE PIPELINE', heading: 'You already know these tools.' },
  { filename: 'l5t1-s09-setup.mp3', path: '/audio/l5t1-s09-setup.mp3', level: 'L5', slide: 9, clipType: 'setup', section: 'THE PIPELINE', heading: 'Where your existing skills connect.' },
  { filename: 'l5t1-s10-setup.mp3', path: '/audio/l5t1-s10-setup.mp3', level: 'L5', slide: 10, clipType: 'setup', section: 'THE PIPELINE', heading: 'Match the failure to the missing stage.' },
  { filename: 'l5t1-s11-setup.mp3', path: '/audio/l5t1-s11-setup.mp3', level: 'L5', slide: 11, clipType: 'setup', section: 'SEE THE DIFFERENCE', heading: 'Same idea. Completely different outcomes.' },
  { filename: 'l5t1-s12-setup.mp3', path: '/audio/l5t1-s12-setup.mp3', level: 'L5', slide: 12, clipType: 'setup', section: 'SEE THE DIFFERENCE', heading: 'Same brief. Different first move.' },
  { filename: 'l5t1-s13-setup.mp3', path: '/audio/l5t1-s13-setup.mp3', level: 'L5', slide: 13, clipType: 'setup', section: 'IN PRACTICE', heading: 'Six signals. Every brief has them.' },
  { filename: 'l5t1-s14-setup.mp3', path: '/audio/l5t1-s14-setup.mp3', level: 'L5', slide: 14, clipType: 'setup', section: 'IN PRACTICE', heading: 'Which pipeline stage is missing?' },
  { filename: 'l5t1-s15-setup.mp3', path: '/audio/l5t1-s15-setup.mp3', level: 'L5', slide: 15, clipType: 'setup', section: 'WRAP UP', heading: 'The Five-Stage Build Pipeline' },
  { filename: 'l5t1-s16-setup.mp3', path: '/audio/l5t1-s16-setup.mp3', level: 'L5', slide: 16, clipType: 'setup', section: 'WHAT\'S NEXT', heading: 'Your pipeline is ready. Now walk through it.' },

  // ── Product Tour ──────────────────────────────────────────────
  { filename: 'tour-welcome.mp3', path: '/audio/tour-welcome.mp3', level: 'Tour', slide: 0, clipType: 'tour', section: 'PRODUCT TOUR', heading: 'Welcome' },
  { filename: 'tour-step-1.mp3', path: '/audio/tour-step-1.mp3', level: 'Tour', slide: 1, clipType: 'tour', section: 'PRODUCT TOUR', heading: 'Step 1 — Your Control Centre' },
  { filename: 'tour-step-2.mp3', path: '/audio/tour-step-2.mp3', level: 'Tour', slide: 2, clipType: 'tour', section: 'PRODUCT TOUR', heading: 'Step 2 — Your Learning Journey' },
  { filename: 'tour-step-3.mp3', path: '/audio/tour-step-3.mp3', level: 'Tour', slide: 3, clipType: 'tour', section: 'PRODUCT TOUR', heading: 'Step 3 — Project Submissions & Scoring' },
  { filename: 'tour-step-4.mp3', path: '/audio/tour-step-4.mp3', level: 'Tour', slide: 4, clipType: 'tour', section: 'PRODUCT TOUR', heading: 'Step 4 — Your E-Learning Environment' },
  { filename: 'tour-step-5.mp3', path: '/audio/tour-step-5.mp3', level: 'Tour', slide: 5, clipType: 'tour', section: 'PRODUCT TOUR', heading: 'Step 5 — My Toolkit' },
  { filename: 'tour-step-6.mp3', path: '/audio/tour-step-6.mp3', level: 'Tour', slide: 6, clipType: 'tour', section: 'PRODUCT TOUR', heading: 'Step 6 — Your Learning Coach' },
  { filename: 'tour-step-7.mp3', path: '/audio/tour-step-7.mp3', level: 'Tour', slide: 7, clipType: 'tour', section: 'PRODUCT TOUR', heading: 'Step 7 — My Artefacts' },
  { filename: 'tour-step-8.mp3', path: '/audio/tour-step-8.mp3', level: 'Tour', slide: 8, clipType: 'tour', section: 'PRODUCT TOUR', heading: 'Step 8 — My Cohort' },
];

export const LEVEL_GROUPS: LevelGroup[] = ['L1', 'L2', 'L3', 'L4', 'L5', 'Tour'];

export const LEVEL_LABELS: Record<LevelGroup, string> = {
  L1: 'Level 1 — Prompt Engineering',
  L2: 'Level 2 — AI Agents',
  L3: 'Level 3 — Workflow Design',
  L4: 'Level 4 — Dashboard Designer',
  L5: 'Level 5 — Full-Stack AI Apps',
  Tour: 'Product Tour',
};
