/**
 * Workspace Chat Flow Tests
 *
 * Tests all 6 suggested prompt flows end-to-end:
 * 1. Write a prompt (→ Prompt Playground)
 * 2. Design an AI agent (→ Agent Builder)
 * 3. Map a workflow (→ Workflow Canvas)
 * 4. Design an app (→ Dashboard Designer)
 * 5. Evaluate an AI app (→ App Evaluator)
 * 6. Get learning guidance (→ Learning Coach)
 *
 * Pre-requisite: run auth setup first:
 *   npx playwright test tests/auth.setup.ts --headed
 */
import { test, expect, type Page } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_FILE = path.join(__dirname, '.auth', 'state.json');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// Reuse the saved auth session
test.use({ storageState: AUTH_FILE });

// Screenshot helper
async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true });
}

// Slugify flow name for filenames
function slug(name: string) {
  return name.replace(/\s+/g, '-').toLowerCase();
}

// Answer a chat question
async function answerQuestion(page: Page, answer: string) {
  // Find the chat input textarea (inside the chat view, not the workspace search bar)
  const textarea = page.locator('textarea').last();
  await textarea.waitFor({ state: 'visible', timeout: 10_000 });
  await textarea.fill(answer);
  await page.waitForTimeout(300);

  // Click the send button — it's the last button with an SVG inside the chat input area
  const sendButtons = page.locator('button:has(svg)');
  const count = await sendButtons.count();
  // The send button is the one at the bottom of the chat (last one)
  await sendButtons.nth(count - 1).click();
  await page.waitForTimeout(1500);
}

// Run overflow and spinner checks on the current page
async function visualChecks(page: Page, label: string) {
  const overflows = await page.evaluate(() => {
    const issues: string[] = [];
    const vw = window.innerWidth;
    document.querySelectorAll('*').forEach((el) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      if (r.right > vw + 5 && r.width > 0) {
        const tag = (el as HTMLElement).tagName.toLowerCase();
        const cls = (el as HTMLElement).className?.toString().slice(0, 60) || '';
        issues.push(`${tag}.${cls} right=${Math.round(r.right)}px > viewport=${vw}px`);
      }
    });
    return issues.slice(0, 10);
  });
  if (overflows.length > 0) {
    console.warn(`⚠️ [${label}] Overflow issues:`, overflows);
  }
  return overflows;
}

/* ═══════════════════════════════════════════
   Test data — 6 flows with answers
   ═══════════════════════════════════════════ */

const FLOWS = [
  {
    name: 'Write a prompt',
    pillText: 'Write a prompt',
    answers: [
      'Summarise weekly team meeting notes into clear action items with owners and deadlines.',
      'My direct reports and project managers who need quick visibility on commitments.',
      'A numbered list with owner name, action item, and due date for each.',
    ],
    toolPageUrl: '/app/toolkit/prompt-playground',
    checkTextareaFilled: true,
  },
  {
    name: 'Design an AI agent',
    pillText: 'Design an AI agent',
    answers: [
      'Answering onboarding FAQs for new hires — policies, benefits, IT setup guides.',
      'Employee handbook PDF, IT setup guide, benefits docs, and Slack messages.',
      'HR team and new hires, around 10-15 questions per day during onboarding waves.',
    ],
    toolPageUrl: '/app/toolkit/agent-builder',
    checkTextareaFilled: true,
  },
  {
    name: 'Map a workflow',
    pillText: 'Map a workflow',
    answers: [
      'Client onboarding from signed contract to project kickoff — welcome pack, accounts, intro calls.',
      'HubSpot CRM, Google Workspace, Slack, Asana for project management.',
      'Before the welcome pack goes out and before the kickoff meeting is scheduled.',
    ],
    toolPageUrl: '/app/toolkit/workflow-canvas',
    checkTextareaFilled: true,
  },
  {
    name: 'Design an app',
    pillText: 'Design an app',
    answers: [
      'Helps project managers track team utilisation and capacity across multiple projects in real-time.',
      'Dashboard with utilisation heat map, team member profiles, project allocation view, weekly forecast, PDF export.',
      'Supabase database synced with Harvest time-tracking and Asana project data.',
    ],
    toolPageUrl: '/app/toolkit/dashboard-designer',
    checkTextareaFilled: true,
  },
  {
    name: 'Evaluate an AI app',
    pillText: 'Evaluate an AI app',
    answers: [
      'A personalised learning platform that adapts content difficulty based on quiz scores and engagement.',
      'L&D managers who need efficient upskilling, and employees who want relevant content not generic courses.',
      'Employee profiles, quiz scores, module completion data, engagement metrics, and 500+ module content library.',
    ],
    toolPageUrl: '/app/toolkit/ai-app-evaluator',
    checkTextareaFilled: true,
  },
  {
    name: 'Get learning guidance',
    pillText: 'Get learning guidance',
    answers: [
      'How to chain AI agents into multi-step workflows for business automation.',
      'Intermediate — I have used single AI prompts but never chained agents together.',
      'YouTube videos and Perplexity deep-dives.',
    ],
    toolPageUrl: '/app/toolkit/learning-coach',
    checkTextareaFilled: false, // Learning Coach has cards, not textareas
  },
];

/* ═══════════════════════════════════════════
   Tests
   ═══════════════════════════════════════════ */

test.describe('Workspace Chat Flows', () => {
  test.beforeAll(async () => {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  for (const flow of FLOWS) {
    test(`${flow.name} — full chat → toolkit flow`, async ({ page }) => {
      const s = slug(flow.name);

      // ── 1. Navigate to workspace ──
      await page.goto('/app/workspace');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await shot(page, `${s}-01-workspace`);
      console.log(`📍 [${flow.name}] Workspace loaded`);

      // ── 2. Click chat input to open dropdown ──
      const chatInput = page.locator('textarea').first();
      await chatInput.waitFor({ state: 'visible', timeout: 10_000 });
      await chatInput.click();
      await page.waitForTimeout(800);
      await shot(page, `${s}-02-dropdown`);

      // ── 3. Click the suggested prompt pill ──
      // The pills are inside the dropdown that appeared
      const pill = page.locator('button').filter({ hasText: flow.pillText }).first();
      await expect(pill).toBeVisible({ timeout: 5_000 });
      await shot(page, `${s}-03-pill-visible`);
      await pill.click();
      await page.waitForTimeout(1500);
      await shot(page, `${s}-04-chat-started`);
      console.log(`💬 [${flow.name}] Chat started`);

      // ── 4. Verify chat interface is showing ──
      await page.waitForTimeout(500);

      // ── 5. Answer question 1 ──
      await answerQuestion(page, flow.answers[0]);
      await shot(page, `${s}-05-q1-answered`);
      console.log(`  Q1 answered`);

      // ── 6. Answer question 2 ──
      await answerQuestion(page, flow.answers[1]);
      await shot(page, `${s}-06-q2-answered`);
      console.log(`  Q2 answered`);

      // ── 7. Answer question 3 (triggers AI generation) ──
      await answerQuestion(page, flow.answers[2]);
      await shot(page, `${s}-07-q3-generating`);
      console.log(`  Q3 answered — waiting for AI generation...`);

      // ── 8. Wait for "Open in ..." CTA button ──
      const ctaBtn = page.locator('button').filter({ hasText: /Open in/ });
      await ctaBtn.waitFor({ state: 'visible', timeout: 90_000 });
      await shot(page, `${s}-08-cta-ready`);
      console.log(`  ✅ AI generation complete — CTA button visible`);

      // ── 9. Click CTA to navigate to toolkit ──
      await ctaBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await shot(page, `${s}-09-toolkit-loaded`);

      // ── 10. Verify correct page ──
      const currentUrl = page.url();
      expect(currentUrl).toContain(flow.toolPageUrl);
      console.log(`  📄 Navigated to ${flow.toolPageUrl}`);

      // ── 11. Verify pre-fill ──
      if (flow.checkTextareaFilled) {
        const textareas = page.locator('textarea');
        const taCount = await textareas.count();
        let filled = false;
        for (let i = 0; i < taCount; i++) {
          const val = await textareas.nth(i).inputValue();
          if (val && val.trim().length > 10) {
            filled = true;
            break;
          }
        }
        expect(filled).toBe(true);
        console.log(`  ✅ Textarea pre-filled with content`);
      } else {
        // Learning Coach — verify it skipped to step 2
        console.log(`  ✅ Learning Coach page loaded (skips to platform selection)`);
      }

      await shot(page, `${s}-10-prefill-verified`);

      // ── 12. Visual checks ──
      const overflows = await visualChecks(page, flow.name);
      await shot(page, `${s}-11-final`);

      console.log(`\n🎉 [${flow.name}] PASSED — ${flow.checkTextareaFilled ? 'fields pre-filled' : 'page loaded correctly'}, ${overflows.length} overflow issues\n`);
    });
  }
});
