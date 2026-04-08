/**
 * Auth setup — opens a fresh Chromium browser on localhost:5173.
 * Clears all existing state first, then waits for you to log in.
 *
 * Run: npx playwright test tests/auth.setup.ts --headed
 */
import { test as setup } from '@playwright/test';
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_FILE = path.join(__dirname, '.auth', 'state.json');

setup('authenticate', async () => {
  // Launch a fresh browser with NO existing state
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    baseURL: 'http://localhost:5173',
  });
  const page = await context.newPage();

  // Go to the app
  await page.goto('/app/workspace');

  console.log('\n🔐 A fresh Chromium browser has opened on localhost:5173');
  console.log('👉 Click "Continue with Google" and complete the login.');
  console.log('👉 If it redirects to the production site, navigate back to localhost:5173/app/workspace');
  console.log('⏳ Waiting up to 5 minutes...\n');

  // Poll every 2 seconds: check if localStorage on the CURRENT page has a Supabase auth token
  let authenticated = false;
  for (let i = 0; i < 150; i++) { // 150 * 2s = 5 min
    await page.waitForTimeout(2000);

    // Check current URL — if we're on the production site, navigate back to localhost
    const url = page.url();
    if (url.includes('oxygy-ai-upskilling-site.web.app/app/')) {
      console.log('🔄 Detected production URL, navigating back to localhost...');
      await page.goto('http://localhost:5173/app/workspace');
      await page.waitForTimeout(3000);
    }

    const hasAuth = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.some(k => k.includes('auth-token') || k.includes('supabase'));
    }).catch(() => false);

    if (hasAuth) {
      authenticated = true;
      console.log('🔑 Supabase auth token detected in localStorage!');
      break;
    }
  }

  if (!authenticated) {
    console.error('❌ Timed out waiting for login. Please try again.');
    await browser.close();
    return;
  }

  // Wait for page to settle
  await page.waitForTimeout(3000);

  // Save the full state
  const state = await context.storageState();
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(state, null, 2));

  // Verify it saved correctly
  const saved = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
  const originCount = saved.origins?.length || 0;
  const itemCount = saved.origins?.reduce((sum: number, o: any) => sum + (o.localStorage?.length || 0), 0) || 0;
  console.log(`\n✅ Auth state saved: ${originCount} origins, ${itemCount} localStorage items`);
  console.log(`   File: ${AUTH_FILE}\n`);

  await browser.close();
});
