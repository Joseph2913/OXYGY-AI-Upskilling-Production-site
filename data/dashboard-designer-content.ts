// App Designer (Level 4) — Static Content & Configuration

// ─── Step Overview (3 steps, matching L3 pattern) ───
export const DASHBOARD_STEPS = [
  {
    num: 1,
    label: 'Define Your Brief',
    question: 'What are you building?',
    desc: 'Describe your app\'s purpose, who it\'s for, and what it needs to do. This becomes the brief that drives everything else.',
    examples: 'Habit tracker, team dashboard, recipe organiser, client portal',
  },
  {
    num: 2,
    label: 'Generate Mockup',
    question: 'What should it look like?',
    desc: 'AI generates a visual mockup based on your brief. Review it, approve it, or give feedback to refine.',
    examples: 'KPI cards, data tables, form layouts, navigation patterns',
  },
  {
    num: 3,
    label: 'Generate PRD',
    question: 'How do you hand it off?',
    desc: 'Get a comprehensive Product Requirements Document — the exact specification you paste into an AI coding tool to build your app.',
    examples: 'Component specs, data model, tech stack, acceptance criteria',
  },
];

// ─── Example Briefs ───
export const EXAMPLE_BRIEFS = [
  {
    q1_purpose: 'Track real-time sales performance across regions and flag underperforming territories for the VP of Sales.',
    q2_audience: 'Regional sales managers, VP of Sales, Sales operations team',
    q3_type: 'Operational dashboard with KPI cards, charts, and filterable data tables',
    q4_metrics: 'Revenue, Conversion Rate, Pipeline Value, Win Rate, Average Deal Size, Deals Closed This Month',
    q5_dataSources: 'CRM (Salesforce), SQL database, sales activity logs',
    q7_visualStyle: 'data-dense',
    label: 'Sales Dashboard',
  },
  {
    q1_purpose: 'A personal habit tracker where I can log daily habits, see streaks, and visualise my consistency over time. Just a fun side project to keep me accountable.',
    q2_audience: 'Just me — a single user who wants a simple, satisfying way to track daily habits',
    q3_type: 'Personal productivity app with a calendar grid, streak counters, and daily check-in',
    q4_metrics: 'Current streak, longest streak, daily completion rate, weekly consistency score',
    q5_dataSources: 'Local storage or a simple database — no external APIs needed',
    q7_visualStyle: 'clean-minimal',
    label: 'Habit Tracker',
  },
  {
    q1_purpose: 'A recipe organiser where I can save, tag, and search my favourite recipes. I want to paste in a URL or type a recipe and have it neatly stored with ingredients and steps.',
    q2_audience: 'Home cooks who want a personal recipe collection that\'s easy to search and browse',
    q3_type: 'Content management app with cards, search/filter, and a detail view for each recipe',
    q4_metrics: 'Total recipes saved, recipes by tag/cuisine, most recently added, favourites list',
    q5_dataSources: 'User input (manual entry or URL paste), local storage or Supabase',
    q7_visualStyle: 'colorful-visual',
    label: 'Recipe Organiser',
  },
];

// ─── Dashboard Type Options ───
export const DASHBOARD_TYPE_OPTIONS = [
  'Sales & Revenue',
  'Marketing Analytics',
  'Operations & Logistics',
  'HR & People',
  'Finance & Budgeting',
  'Customer Success',
  'Product & Engineering',
  'Executive Summary',
  'Project Management',
  'Other',
];

// ─── Visual Style Options (optional, for users who want to specify) ───
export const VISUAL_STYLE_OPTIONS = [
  { id: 'clean-minimal', label: 'Clean & Minimal' },
  { id: 'data-dense', label: 'Data-Dense' },
  { id: 'executive-polished', label: 'Executive & Polished' },
  { id: 'colorful-visual', label: 'Colorful & Visual' },
];

// ─── PRD Section Definitions — optimised for AI coding tool handoff ───
export const PRD_SECTIONS = [
  {
    key: 'project_overview',
    title: 'Project Overview',
    description: 'What the app does, who it\'s for, the problem it solves, key success criteria, and scope boundaries. Written so a developer or AI coding tool could read only this section and understand exactly what to build.',
    example: 'App name, elevator pitch, core problem, 3-5 success criteria, explicit scope boundaries (what\'s in and what\'s out).',
  },
  {
    key: 'tech_stack',
    title: 'Tech Stack & Constraints',
    description: 'Exact frameworks, languages, libraries, and versions to use — locked down to prevent the AI from choosing defaults you don\'t want. Includes runtime constraints and deployment targets.',
    example: 'React 18 + TypeScript strict + Vite 5 + Tailwind CSS. Supabase for auth & DB. Deploy to Vercel. Node 20+.',
  },
  {
    key: 'file_structure',
    title: 'File & Folder Structure',
    description: 'Explicit directory tree showing where pages, components, hooks, utils, types, and API routes live. Includes naming conventions to prevent the AI from inventing its own structure.',
    example: 'src/pages/, src/components/, src/hooks/, src/lib/, src/types/. PascalCase components, camelCase hooks.',
  },
  {
    key: 'data_models',
    title: 'Data Models & Schema',
    description: 'Every entity with its fields, types, relationships, enums, and constraints. AI coding tools generate far more accurate code when the data shape is explicit rather than inferred.',
    example: 'User { id: string, email: string, role: "admin" | "member" }. Recipe { id, title, ingredients: Ingredient[], tags: string[] }.',
  },
  {
    key: 'feature_requirements',
    title: 'Feature Requirements',
    description: 'Each feature described as concrete, testable behaviour: "When X happens, do Y." Organised by user flow, not technical layer. Includes edge cases and error states explicitly.',
    example: 'When user submits empty form, show inline validation. When API returns 401, redirect to /login. When data is loading, show skeleton.',
  },
  {
    key: 'api_routes',
    title: 'API & Data Layer',
    description: 'Every endpoint or data operation with method, path, request body, response shape, and error codes. Removes ambiguity about the contract between frontend and backend.',
    example: 'POST /api/recipes { title, ingredients[] } => 201 { id, createdAt }. GET /api/recipes?tag=italian => 200 Recipe[].',
  },
  {
    key: 'ui_specifications',
    title: 'UI & Design System',
    description: 'Page-by-page layout specs, colour palette with hex codes, typography scale, spacing system, component hierarchy, and responsive breakpoints. References the approved mockup.',
    example: 'Primary: #38B2AC. Font: DM Sans. Cards: white, 16px radius, 1px #E2E8F0 border. Desktop: 12-col grid. Mobile: single column.',
  },
  {
    key: 'auth_permissions',
    title: 'Auth & Permissions',
    description: 'Who can access what, role-based rules, auth flow (sign-up, sign-in, password reset), and session management. Skip for single-user personal apps.',
    example: 'Supabase Auth with email/password. Admin role can manage all records. Member role read-only on shared dashboards.',
  },
  {
    key: 'scope_boundaries',
    title: 'Scope & Boundaries',
    description: 'Explicit list of what will NOT be built, plus behavioural guardrails: what the AI should always do, what it should ask about first, and what it must never do.',
    example: 'Out of scope: mobile native app, payment processing. Always: run tests before committing. Never: commit API keys or secrets.',
  },
  {
    key: 'acceptance_criteria',
    title: 'Acceptance Criteria',
    description: 'Specific, binary pass/fail testable conditions for every feature. Includes verification commands the AI should run against its own output.',
    example: '1. App loads in <2s. 2. All CRUD operations work. 3. Responsive on mobile. 4. npm test passes. 5. npm run build succeeds.',
  },
  {
    key: 'implementation_plan',
    title: 'Implementation Phases',
    description: 'Ordered build phases using vertical slices — each phase delivers a working end-to-end feature (DB to UI), not a horizontal layer. Designed for incremental prompting.',
    example: 'Phase 1: Auth + empty dashboard shell. Phase 2: CRUD for core entity. Phase 3: Filtering, search, export. Phase 4: Polish and responsive.',
  },
];

// ─── "Why Mockup First?" tooltip content ───
export const WHY_MOCKUP_TOOLTIP = 'Generating a visual mockup before writing code is a powerful shortcut. Vibe coding tools like Lovable, Bolt.new, V0, and Cursor can accept mockup images as input and recreate layouts in code far more accurately than text descriptions alone. A picture eliminates ambiguity, iteration is cheaper at the image stage, and the structured PRD can serve as the specification for your actual build.';

// ─── Inspiration Sites (with clickable links) ───
export const INSPIRATION_SITES = [
  { name: 'Dribbble', url: 'https://dribbble.com/search/web-app' },
  { name: 'Behance', url: 'https://www.behance.net/search/projects?search=web+application+design' },
  { name: 'Mobbin', url: 'https://mobbin.com/browse/web/apps' },
  { name: 'Godly', url: 'https://godly.website' },
  { name: 'Screenlane', url: 'https://screenlane.com' },
];

export const INSPIRATION_TOOLTIP_CONTENT = 'Browse the inspiration sites below for app and interface design ideas, then upload a screenshot to guide your mockup generation.';