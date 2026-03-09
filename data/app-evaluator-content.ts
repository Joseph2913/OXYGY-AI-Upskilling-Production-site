/** Content constants for the Level 5 AI App Evaluator toolkit page. */

/* ─── Educational content for the 4 output sections ─── */
export const EVALUATOR_SECTIONS = [
  {
    key: 'design_score',
    label: 'Design Score',
    icon: '🎯',
    color: '#5B6DC2',
    why: 'Before investing time in building, you need an honest assessment of your idea\'s readiness. This section evaluates your application design across five dimensions — user clarity, data architecture, personalisation, technical feasibility, and scalability — giving you a clear picture of strengths and gaps.',
    example: 'An app scored 78% overall: strong user clarity and personalisation logic, but the data architecture needs refinement before development begins — saving weeks of rework later.',
  },
  {
    key: 'architecture',
    label: 'Architecture & Components',
    icon: '🏗️',
    color: '#38B2AC',
    why: 'A well-designed AI application is a system of connected components — each with a clear purpose, the right tools, and a connection to the skills you\'ve built across Levels 1–4. This section maps every component you\'ll need and shows how they connect.',
    example: 'A student portal requires 6 components: authentication (Supabase), content engine (Claude API), progress tracker (database), dashboard (React), notification system (webhooks), and admin panel — each mapped to specific tools and levels.',
  },
  {
    key: 'implementation_plan',
    label: 'Implementation Plan',
    icon: '📋',
    color: '#D69E2E',
    why: 'Knowing what to build is different from knowing how to build it. This section breaks your project into phased steps with realistic time estimates, task breakdowns, and dependency chains — so you can start building with confidence.',
    example: 'Phase 1 (Week 1): Set up repository and deploy scaffold. Phase 2 (Weeks 2–3): Build core data models and authentication. Phase 3 (Weeks 3–4): Implement AI features and personalisation logic.',
  },
  {
    key: 'risks_and_gaps',
    label: 'Risks & Next Steps',
    icon: '⚠️',
    color: '#E53E3E',
    why: 'Every project has blind spots. This section identifies potential risks, missing pieces, and architectural gaps before they become expensive problems — and provides specific mitigation strategies for each.',
    example: 'Risk identified: "No offline fallback for AI features" (medium severity). Mitigation: Cache recent AI responses locally and display a graceful degradation message when the API is unavailable.',
  },
];

/* ─── Score criteria display labels ─── */
export const SCORE_CRITERIA_LABELS: Record<string, { label: string; icon: string }> = {
  user_clarity: { label: 'User Clarity', icon: '👤' },
  data_architecture: { label: 'Data Architecture', icon: '🗄️' },
  personalisation: { label: 'Personalisation', icon: '✨' },
  technical_feasibility: { label: 'Technical Feasibility', icon: '⚙️' },
  scalability: { label: 'Scalability', icon: '📈' },
};

/* ─── Example apps for quick-fill ─── */
export const EXAMPLE_APPS = [
  {
    name: 'AI-Powered Student Portal',
    appDescription: 'A personalised learning platform where students log in, see their progress across modules, receive AI-generated study recommendations, and complete interactive quizzes that adapt to their knowledge level.',
    problemAndUsers: 'Students in a professional certification programme struggle to track their progress and identify weak areas. The portal serves 200+ students across 3 cohorts, each with different learning paths and pace requirements.',
    dataAndContent: 'Student profiles, quiz scores, module completion data, AI-generated recommendations, and cohort analytics. Content includes video lessons, reading materials, and practice exercises stored in a CMS.',
  },
  {
    name: 'Internal Knowledge Assistant',
    appDescription: 'An AI chatbot that answers employee questions by searching across company documentation, policies, and historical Q&A threads — with role-based access so HR, engineering, and sales each see relevant content.',
    problemAndUsers: 'Employees waste 3+ hours per week searching for internal information across scattered Confluence pages, Slack threads, and email chains. Serves 500 employees across 8 departments with different access levels.',
    dataAndContent: 'Company documentation (PDFs, wiki pages), Slack message archives, HR policies, engineering runbooks, and sales playbooks. Requires vector embeddings for semantic search and role-based content filtering.',
  },
  {
    name: 'Client Report Generator',
    appDescription: 'A tool where consultants input project data and the AI generates branded, structured client reports with executive summaries, data visualisations, and actionable recommendations — ready for presentation.',
    problemAndUsers: 'Consultants spend 8+ hours per client report manually compiling data, writing summaries, and formatting documents. Serves a team of 30 consultants producing 15–20 reports per month.',
    dataAndContent: 'Project metrics from spreadsheets, client feedback surveys, financial data, and benchmark comparisons. Output includes formatted PDF reports with charts, tables, and branded templates.',
  },
];

/* ─── Priority badge styling ─── */
export function getPriorityStyle(priority: string) {
  switch (priority) {
    case 'essential': return { bg: '#F0FFF4', color: '#276749', border: '#C6F6D5' };
    case 'recommended': return { bg: '#FFFFF0', color: '#B7791F', border: '#F6E05E' };
    default: return { bg: '#F7FAFC', color: '#718096', border: '#E2E8F0' };
  }
}

/* ─── Severity badge styling ─── */
export function getSeverityStyle(severity: string) {
  switch (severity) {
    case 'high': return { bg: '#FFF5F5', color: '#C53030', border: '#FC8181' };
    case 'medium': return { bg: '#FFFFF0', color: '#B7791F', border: '#F6E05E' };
    default: return { bg: '#F0FFF4', color: '#276749', border: '#C6F6D5' };
  }
}