# PRD-15: Content Registry, Audit Log & System Settings

> **Status:** Draft
> **Author:** Oxygy Design Agent
> **Date:** 16 March 2026
> **Depends on:** PRD-10 (Auth & Schema), PRD-11 (Admin Shell & Org CRUD), PRD-14 (Analytics — shared components)
> **Blocks:** Nothing — this is the final admin-side PRD before the client admin dashboard (PRD-16)

---

## 1. Overview

### 1.1 Purpose

This PRD fills the remaining two placeholder pages in the admin interface — Content and Settings — and completes the Oxygy Platform Admin as a fully operational tool. After implementation, every section in the admin sidebar has real functionality.

### 1.2 What It Delivers

1. **Content Registry** (`/admin/content`) — a read-only view of all learning content across all levels, showing what's been built, what's in progress, and what's missing
2. **Audit Log** (`/admin/settings`, "Audit Log" tab) — a searchable, filterable chronological feed of every admin action recorded since PRD-11 started writing log entries
3. **System Overview** (`/admin/settings`, "System" tab) — API endpoint status, platform configuration summary, and key infrastructure indicators
4. **Feature Flags** (`/admin/settings`, "Feature Flags" tab) — a simple toggle interface for platform-level and per-org flags

### 1.3 Non-Goals

- A full CMS for editing content — content changes go through the codebase via PRDs and Claude Code
- Real-time API monitoring or alerting — the system overview is informational, not operational
- Complex feature flag targeting rules — V1 flags are simple on/off toggles

---

## 2. Content Registry

**File:** `pages/admin/AdminContent.tsx`
**Route:** `/admin/content`

### 2.1 Data Source

Content status is derived from two static TypeScript files that already exist in the codebase:

- **`data/levelTopics.ts`** — defines all topics per level with metadata (title, subtitle, estimated minutes, phases)
- **`data/topicContent.ts`** — the content registry keyed by `${level}-${topicId}`, containing slides, articles, and videos

The content registry page reads these at build time and renders a status overview. No database queries needed — this is purely a reflection of what's in the codebase.

### 2.2 Page Layout

```
┌─────────────────────────────────────────────────────┐
│  h1: "Content Registry"                             │
│  "Overview of all learning content across levels."  │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  CONTENT COVERAGE                           │    │
│  │                                             │    │
│  │  Level 1  ██████░░░░  1/6 topics (17%)     │    │
│  │  Level 2  ██░░░░░░░░  1/6 topics (17%)     │    │
│  │  Level 3  ░░░░░░░░░░  0/4 topics (0%)      │    │
│  │  Level 4  ░░░░░░░░░░  0/4 topics (0%)      │    │
│  │  Level 5  ░░░░░░░░░░  0/3 topics (0%)      │    │
│  │                                             │    │
│  │  Overall: 2 of 23 topics have content       │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  CONTENT BY LEVEL                           │    │
│  │                                             │    │
│  │  ▾ Level 1: Fundamentals & Awareness        │    │
│  │    ┌────────────────────────────────────┐    │    │
│  │    │ Prompt Engineering       Published │    │    │
│  │    │ E-Learn ✓  Read ✓  Watch ✓  Prac ✓│    │    │
│  │    │ 16 slides · 3 articles · 2 videos │    │    │
│  │    │                     [Preview →]    │    │    │
│  │    └────────────────────────────────────┘    │    │
│  │                                             │    │
│  │  ▾ Level 2: Applied Capability              │    │
│  │    ┌────────────────────────────────────┐    │    │
│  │    │ From Prompts to Reusable Tools     │    │    │
│  │    │ E-Learn ✓  Read ✓  Watch ✓  Prac ✓│    │    │
│  │    │ ...                                │    │    │
│  │    └────────────────────────────────────┘    │    │
│  │                                             │    │
│  │  ▸ Level 3: Systemic Integration (empty)    │    │
│  │  ▸ Level 4: Interactive Dashboards (empty)  │    │
│  │  ▸ Level 5: Full AI Applications (empty)    │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Page container:** `padding: 28px 36px`, `maxWidth: 1200px`

### 2.3 Content Coverage Summary

**Container:** AdminCard, `padding: 24px`

**Section label:** "CONTENT COVERAGE" (standard admin section label)

**Per-level row:** `display: flex`, `alignItems: center`, `gap: 16`, `padding: 10px 0`, `borderBottom: 1px solid #F7FAFC`

Each row:
- Level pill badge (reuse `LEVEL_PILL_STYLES`)
- Level name (`fontSize: 13`, `fontWeight: 600`, `color: #2D3748`, `flex: 1`)
- Progress bar: `width: 120px`, `height: 6px`, `borderRadius: 3`, `background: #EDF2F7`
  - Fill: level accent colour, width proportional to (topics with content / total topics)
- Fraction text: "N/M topics" (`fontSize: 12`, `color: #718096`)
- Percentage: "({pct}%)" (`fontSize: 12`, `fontWeight: 600`, colour: green if 100%, amber if partial, muted if 0%)

**Overall summary** — below the level rows:
- `borderTop: 1px solid #E2E8F0`, `paddingTop: 16px`, `marginTop: 8px`
- "Overall: {N} of {M} topics have content" (`fontSize: 14`, `fontWeight: 700`, `color: #1A202C`)
- Beside it: overall progress bar (same spec, wider: `width: 200px`)

### 2.4 Content Status Logic

A topic "has content" if it has an entry in `TOPIC_CONTENT` with at least one slide. Phase completeness is determined by:

```typescript
import { LEVEL_TOPICS } from '../../data/levelTopics';
import { TOPIC_CONTENT } from '../../data/topicContent';

interface TopicStatus {
  level: number;
  topicId: number;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  hasContent: boolean;
  phases: {
    elearn: { available: boolean; count: number };  // slides count
    read:   { available: boolean; count: number };  // articles count
    watch:  { available: boolean; count: number };  // videos count
    practice: { available: boolean };               // always true (links to toolkit)
  };
  overallStatus: 'published' | 'partial' | 'empty';
}

function getTopicStatus(level: number, topicId: number): TopicStatus {
  const content = TOPIC_CONTENT[`${level}-${topicId}`];
  const topic = LEVEL_TOPICS[level]?.find(t => t.id === topicId);

  const hasSlides = (content?.slides?.length || 0) > 0;
  const hasArticles = (content?.articles?.length || 0) > 0;
  const hasVideos = (content?.videos?.length || 0) > 0;

  const phases = {
    elearn: { available: hasSlides, count: content?.slides?.length || 0 },
    read: { available: hasArticles, count: content?.articles?.length || 0 },
    watch: { available: hasVideos, count: content?.videos?.length || 0 },
    practice: { available: true },  // Practice phase always available (links to toolkit)
  };

  const phaseCount = [hasSlides, hasArticles, hasVideos].filter(Boolean).length;
  const overallStatus = phaseCount === 0 ? 'empty' : phaseCount === 3 ? 'published' : 'partial';

  return {
    level, topicId,
    title: topic?.title || 'Unknown',
    subtitle: topic?.subtitle || '',
    estimatedMinutes: topic?.estimatedMinutes || 0,
    hasContent: phaseCount > 0,
    phases,
    overallStatus,
  };
}
```

### 2.5 Content By Level — Accordion

**Container:** AdminCard, `padding: 0`

**Section label:** "CONTENT BY LEVEL" — rendered inside the card with `padding: 20px 24px 0`, `marginBottom: 0`

**Level accordion headers:**

Each level is a collapsible section. Click the header to expand/collapse.

```tsx
<button onClick={() => toggleLevel(level)} style={{
  width: '100%', display: 'flex', alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 24px',
  borderTop: '1px solid #E2E8F0', borderBottom: 'none',
  background: 'transparent', cursor: 'pointer', border: 'none',
}}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <ChevronRight size={14} color="#A0AEC0"
      style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
    <LevelPill level={n} />
    <span style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>
      Level {n}: {levelName}
    </span>
    <span style={{ fontSize: 12, color: '#A0AEC0' }}>
      ({topicsWithContent}/{totalTopics} topics)
    </span>
  </div>
  {allEmpty && (
    <span style={{ fontSize: 11, color: '#A0AEC0', fontStyle: 'italic' }}>No content yet</span>
  )}
</button>
```

**Default state:** Levels with content are expanded. Levels with no content are collapsed.

#### Topic Card (inside expanded level)

Each topic within an expanded level gets a card:

```
┌──────────────────────────────────────────────┐
│  Prompt Engineering              [Published] │
│  From brain dumps to structured prompts      │
│  ~45 min                                     │
│                                              │
│  E-Learn ✓ (16)  Read ✓ (3)  Watch ✓ (2)   │
│  Practice ✓                                  │
│                                              │
│                            [Preview →]       │
└──────────────────────────────────────────────┘
```

**Card container:** `margin: 0 24px 12px`, `padding: 16px 20px`, `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `borderRadius: 10`

**Header row:** `display: flex`, `justifyContent: space-between`, `alignItems: center`
- Topic title: `fontSize: 14`, `fontWeight: 700`, `color: #1A202C`
- Status badge:
  - Published: `background: #C6F6D5`, `color: #22543D` — "Published"
  - Partial: `background: #FEFCBF`, `color: #975A16` — "Partial"
  - Empty: `background: #EDF2F7`, `color: #A0AEC0` — "No Content"
  - All badges: `fontSize: 11`, `fontWeight: 600`, `padding: 3px 10px`, `borderRadius: 20`

**Subtitle:** `fontSize: 12`, `color: #718096`, `marginTop: 2`

**Estimated time:** `fontSize: 11`, `color: #A0AEC0`, `marginTop: 2`

**Phase indicators row:** `display: flex`, `gap: 16`, `marginTop: 12`

Each phase indicator:
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
  {available ? (
    <Check size={12} color="#48BB78" />
  ) : (
    <Minus size={12} color="#CBD5E0" />
  )}
  <span style={{
    fontSize: 12, fontWeight: 500,
    color: available ? '#2D3748' : '#A0AEC0',
  }}>
    {phaseName} {available && count > 0 ? `(${count})` : ''}
  </span>
</div>
```

**Preview button:** Bottom-right of the card. `fontSize: 12`, `fontWeight: 600`, `color: #38B2AC`, `cursor: pointer`. Only shown if the topic has content (`overallStatus !== 'empty'`).

On click: opens `/app/level?level={N}` in a new tab — the learner view of that level's content. This uses the same route the learner sees, so the admin previews exactly what learners experience.

#### Empty Level Expanded State

If a level has no topics with content (all topics are `empty`), show inside the expanded level:

```tsx
<div style={{
  margin: '0 24px 16px', padding: '20px 24px',
  background: '#F7FAFC', borderRadius: 10,
  border: '1px dashed #E2E8F0', textAlign: 'center',
}}>
  <div style={{ fontSize: 13, color: '#A0AEC0' }}>
    No content has been created for this level yet.
  </div>
  <div style={{ fontSize: 11, color: '#CBD5E0', marginTop: 4 }}>
    Content is added via the codebase — check data/topicContent.ts
  </div>
</div>
```

---

## 3. Settings Page

**File:** `pages/admin/AdminSettings.tsx`
**Route:** `/admin/settings`

The Settings page uses a tabbed layout with three tabs: Audit Log, System, and Feature Flags.

### 3.1 Page Layout

```
┌─────────────────────────────────────────────────────┐
│  h1: "Settings"                                     │
│                                                     │
│  [ Audit Log | System | Feature Flags ]             │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  Active tab content                         │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Page container:** `padding: 28px 36px`, `maxWidth: 1200px`

**Tab bar:** Same horizontal tab bar spec as the org detail page (PRD-11 §7.3). Default tab: "Audit Log".

---

## 4. Audit Log Tab

### 4.1 Layout

```
┌─────────────────────────────────────────────────────┐
│  Search         Actor ▾     Action ▾     Org ▾      │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  16 Mar 2026, 14:32                         │    │
│  │  Joseph Thomas created organisation          │    │
│  │  "Acme Corp" (tier: accelerator)             │    │
│  │                                     [▾ More] │    │
│  ├─────────────────────────────────────────────┤    │
│  │  16 Mar 2026, 14:35                         │    │
│  │  Joseph Thomas created enrollment channel    │    │
│  │  "Q1 Workshop Link" (type: link)             │    │
│  │  for Acme Corp                               │    │
│  │                                     [▾ More] │    │
│  ├─────────────────────────────────────────────┤    │
│  │  ...                                        │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ← Previous   Page 1 of 3   Next →                  │
└─────────────────────────────────────────────────────┘
```

### 4.2 Filter Bar

**Layout:** `display: flex`, `alignItems: center`, `gap: 10`, `marginBottom: 16`

**Search input:**
- Same spec as other admin search bars
- Placeholder: "Search actions..."
- Searches across `action`, `target_type`, and `metadata` (JSON text search via Supabase `textSearch` or client-side filter)

**Actor filter:**
- `<select>` dropdown
- Options: "All Actors" + list of distinct `actor_id` values with their names (fetched via a join to `profiles`)
- Queries `distinct actor_id` from `audit_log`, then fetches names

**Action filter:**
- `<select>` dropdown
- Options: "All Actions", then grouped by entity:
  - Organisation: "org.create", "org.update", "org.deactivate", "org.reactivate"
  - User: "user.invite", "user.enroll", "user.deactivate", "user.role_change"
  - Channel: "channel.create", "channel.deactivate"
  - Workshop: "workshop.create", "workshop.deactivate"

**Organisation filter:**
- `<select>` dropdown
- Options: "All Organisations" + list of active orgs
- Filters on `audit_log.org_id`

### 4.3 Audit Log Feed

**Container:** AdminCard, `padding: 0`

**Each entry** is a row with:

```tsx
<div style={{
  padding: '16px 24px',
  borderBottom: '1px solid #F7FAFC',
}}>
  {/* Timestamp */}
  <div style={{ fontSize: 11, color: '#A0AEC0', marginBottom: 6 }}>
    {formatDateTime(entry.created_at)}
  </div>

  {/* Action description */}
  <div style={{ fontSize: 13, color: '#2D3748', lineHeight: 1.5 }}>
    <span style={{ fontWeight: 600 }}>{actorName}</span>
    {' '}{actionDescription}
  </div>

  {/* Expand button */}
  <button onClick={() => toggleExpand(entry.id)} style={{
    marginTop: 8, fontSize: 11, fontWeight: 600, color: '#718096',
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 4,
  }}>
    <ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
    {expanded ? 'Less' : 'More'}
  </button>

  {/* Expanded metadata */}
  {expanded && (
    <div style={{
      marginTop: 8, padding: '10px 14px',
      background: '#F7FAFC', borderRadius: 8, border: '1px solid #EDF2F7',
    }}>
      <pre style={{
        fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
        color: '#4A5568', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6,
      }}>
        {JSON.stringify(entry.metadata, null, 2)}
      </pre>
    </div>
  )}
</div>
```

### 4.4 Action Description Generator

Transform the raw audit log entry into a human-readable sentence:

```typescript
function describeAction(entry: AuditLogRow, actorName: string): string {
  const m = entry.metadata || {};

  const descriptions: Record<string, () => string> = {
    'org.create':       () => `created organisation "${m.org_name}" (tier: ${m.tier})`,
    'org.update':       () => `updated organisation "${m.org_name}"`,
    'org.deactivate':   () => `deactivated organisation "${m.org_name}"`,
    'org.reactivate':   () => `reactivated organisation "${m.org_name}"`,
    'user.invite':      () => `invited ${m.user_email} to ${m.org_name} as ${m.role}`,
    'user.enroll':      () => `enrolled in ${m.org_name} via ${m.channel_type} channel`,
    'user.deactivate':  () => `deactivated ${m.user_name || m.user_email}'s membership in ${m.org_name}`,
    'user.role_change': () => `changed ${m.user_name}'s role to ${m.new_role} in ${m.org_name}`,
    'channel.create':   () => `created ${m.channel_type} enrollment channel "${m.channel_label || m.channel_value}" for ${m.org_name}`,
    'channel.deactivate': () => `deactivated enrollment channel "${m.channel_label || m.channel_value}"`,
    'workshop.create':  () => `created workshop session "${m.session_name}" (Level ${m.level}) for ${m.org_name}`,
    'workshop.deactivate': () => `deactivated workshop session "${m.session_name}"`,
  };

  const descFn = descriptions[entry.action];
  return descFn ? descFn() : `performed action: ${entry.action}`;
}
```

### 4.5 Timestamp Formatting

```typescript
function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  const time = d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day} ${month} ${year}, ${time}`;
}
// → "16 Mar 2026, 14:32"
```

### 4.6 Pagination

Server-side pagination, same pattern as PRD-13 users table:

```typescript
const PAGE_SIZE = 25;

let query = supabase
  .from('audit_log')
  .select(`
    id, actor_id, action, target_type, target_id, org_id, metadata, created_at,
    profiles!audit_log_actor_id_fkey(full_name)
  `, { count: 'exact' })
  .order('created_at', { ascending: false });

// Apply filters
if (actorFilter) query = query.eq('actor_id', actorFilter);
if (actionFilter) query = query.eq('action', actionFilter);
if (orgFilter) query = query.eq('org_id', orgFilter);
if (searchTerm) {
  query = query.or(`action.ilike.%${searchTerm}%,metadata->>'org_name'.ilike.%${searchTerm}%`);
}

const from = (page - 1) * PAGE_SIZE;
query = query.range(from, from + PAGE_SIZE - 1);
```

**Note on the profiles join:** The `audit_log.actor_id` references `auth.users(id)`, and `profiles.id` also references `auth.users(id)`. The join path is `profiles!audit_log_actor_id_fkey`. If Supabase doesn't auto-detect this relationship, use a manual join via a second query or add an explicit foreign key relationship hint.

**Pagination controls:** Same spec as PRD-13 (Previous/Next buttons, "Page X of Y", "Showing N of M entries").

### 4.7 Empty State

If no audit log entries exist:
- AdminEmptyState, icon: `ScrollText`
- Title: "No activity recorded yet"
- Description: "Admin actions will appear here as they happen — creating organisations, enrolling users, and managing the platform."

---

## 5. System Tab

### 5.1 Layout

```
┌─────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────┐    │
│  │  PLATFORM SUMMARY                           │    │
│  │                                             │    │
│  │  Platform   Oxygy AI Upskilling             │    │
│  │  Stack      React 19, Vite 6, Supabase,     │    │
│  │             Firebase Hosting + Functions     │    │
│  │  AI Models  OpenRouter (Claude Sonnet,       │    │
│  │             Gemini Flash)                    │    │
│  │  Endpoints  18 Cloud Functions               │    │
│  │  Hosting    Firebase                         │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  API HEALTH                                 │    │
│  │                                             │    │
│  │  /api/health          ● Online    [Test →]  │    │
│  │  OpenRouter Key       ● Valid     [Test →]  │    │
│  │  Supabase Connection  ● Connected           │    │
│  │                                             │    │
│  │  Last checked: just now         [Refresh]   │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  API ENDPOINTS                              │    │
│  │                                             │    │
│  │  /api/health              GET   health      │    │
│  │  /api/enhance-prompt      POST  enhancepro… │    │
│  │  /api/playground          POST  generatepl… │    │
│  │  ... (18 total)                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  QUICK LINKS                                │    │
│  │                                             │    │
│  │  🔗 Firebase Console                        │    │
│  │  🔗 Supabase Dashboard                      │    │
│  │  🔗 OpenRouter Dashboard                    │    │
│  │  🔗 GitHub Repository                       │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 5.2 Platform Summary

**Container:** AdminCard, `padding: 24px`

**Section label:** "PLATFORM SUMMARY"

A key-value list (same rendering pattern as PRD-13 user profile section):

| Label | Value |
|---|---|
| Platform | OXYGY AI Upskilling |
| Stack | React 19, Vite 6, TypeScript, Supabase, Firebase |
| AI Models | Via OpenRouter — Claude Sonnet 4, Gemini 2.0 Flash |
| Endpoints | 18 Cloud Functions |
| Hosting | Firebase Hosting + Cloud Functions |
| Database | Supabase (PostgreSQL) |

These values are hardcoded — they change rarely enough that static text is appropriate. If the endpoint count needs to be dynamic, it can be derived from `firebase.json` rewrites, but that's overkill for V1.

### 5.3 API Health

**Container:** AdminCard, `padding: 24px`

**Section label:** "API HEALTH"

Three status rows, fetched on mount and refreshable via a "Refresh" button:

#### Health Endpoint Check

```typescript
async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    return {
      status: data.status === 'ok' ? 'online' : 'error',
      hasApiKey: data.hasApiKey,
      nodeVersion: data.nodeVersion,
    };
  } catch {
    return { status: 'offline', hasApiKey: false, nodeVersion: null };
  }
}
```

**Status row rendering:**
```tsx
<div style={{
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '10px 0', borderBottom: '1px solid #F7FAFC',
}}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <span style={{
      width: 8, height: 8, borderRadius: '50%',
      background: status === 'online' ? '#48BB78' : status === 'error' ? '#ECC94B' : '#FC8181',
    }} />
    <span style={{ fontSize: 13, color: '#2D3748' }}>{label}</span>
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <span style={{
      fontSize: 12, fontWeight: 600,
      color: status === 'online' ? '#22543D' : '#9B2C2C',
    }}>
      {statusLabel}
    </span>
    {testable && (
      <button onClick={onTest} style={{
        fontSize: 11, fontWeight: 600, color: '#38B2AC',
        background: 'none', border: 'none', cursor: 'pointer',
      }}>
        Test →
      </button>
    )}
  </div>
</div>
```

**Status definitions:**

| Check | How It Works | Online | Error |
|---|---|---|---|
| Health Endpoint | `GET /api/health` returns `status: "ok"` | Green "Online" | Red "Offline" |
| OpenRouter Key | Health endpoint returns `hasApiKey: true` | Green "Valid" | Red "Missing" |
| Supabase Connection | A simple `supabase.from('organisations').select('id').limit(1)` succeeds | Green "Connected" | Red "Unreachable" |

**"Test" button:** For the health endpoint and OpenRouter key, clicking "Test →" re-runs just that check and updates the status. Brief loading state: replace status label with a spinning indicator for 500ms.

**"Refresh" button:** Bottom-right of the card. Re-runs all three checks. `fontSize: 12`, `fontWeight: 600`, `color: #38B2AC`.

**"Last checked" timestamp:** `fontSize: 11`, `color: #A0AEC0`. Updates when checks complete.

### 5.4 API Endpoints Table

**Container:** AdminCard, `padding: 24px`

**Section label:** "API ENDPOINTS"

A compact reference table listing all Cloud Function endpoints:

| Column | Content |
|---|---|
| Path | `/api/{path}` in monospace |
| Method | GET or POST badge |
| Function | Firebase function ID |

**Data source:** Hardcoded from `firebase.json` rewrites. This is a reference table, not a live status check — its purpose is to give the admin a quick reference of what endpoints exist.

```typescript
const API_ENDPOINTS = [
  { path: '/api/health', method: 'GET', functionId: 'health' },
  { path: '/api/enhance-prompt', method: 'POST', functionId: 'enhanceprompt' },
  { path: '/api/playground', method: 'POST', functionId: 'generateplaygroundprompt' },
  { path: '/api/summarize-role', method: 'POST', functionId: 'summarizerole' },
  { path: '/api/design-agent', method: 'POST', functionId: 'designagent' },
  { path: '/api/agent-setup-guide', method: 'POST', functionId: 'agentsetupguide' },
  { path: '/api/design-workflow', method: 'POST', functionId: 'designworkflow' },
  { path: '/api/analyze-architecture', method: 'POST', functionId: 'analyzearchitecture' },
  { path: '/api/analyze-insight', method: 'POST', functionId: 'analyzeinsight' },
  { path: '/api/generate-pathway', method: 'POST', functionId: 'generatepathway' },
  { path: '/api/design-dashboard', method: 'POST', functionId: 'designdashboard' },
  { path: '/api/generate-prd', method: 'POST', functionId: 'generateprd' },
  { path: '/api/app-build-guide', method: 'POST', functionId: 'appbuildguide' },
  { path: '/api/evaluate-app', method: 'POST', functionId: 'evaluateapp' },
  { path: '/api/evaluate-app-build-plan', method: 'POST', functionId: 'evaluateappbuildplan' },
  { path: '/api/generate-n8n-workflow', method: 'POST', functionId: 'generaten8nworkflow' },
  { path: '/api/generate-build-guide', method: 'POST', functionId: 'generatebuildguide' },
  { path: '/api/resolve-dispute', method: 'POST', functionId: 'resolvedispute' },
];
```

**Row styling:** `padding: 8px 0`, `borderBottom: 1px solid #F7FAFC`, `fontSize: 12`.

**Path:** `fontFamily: 'JetBrains Mono', monospace`, `color: #2D3748`

**Method badge:** `fontSize: 10`, `fontWeight: 700`, `padding: 2px 6px`, `borderRadius: 4`
- GET: `background: #C6F6D5`, `color: #22543D`
- POST: `background: #EBF4FF`, `color: #2B6CB0`

**Function ID:** `fontSize: 12`, `color: #718096`

### 5.5 Quick Links

**Container:** AdminCard, `padding: 24px`

**Section label:** "QUICK LINKS"

A short list of external links for the admin's convenience:

```typescript
const QUICK_LINKS = [
  { label: 'Firebase Console', url: 'https://console.firebase.google.com', icon: 'ExternalLink' },
  { label: 'Supabase Dashboard', url: 'https://supabase.com/dashboard', icon: 'ExternalLink' },
  { label: 'OpenRouter Dashboard', url: 'https://openrouter.ai/dashboard', icon: 'ExternalLink' },
  { label: 'GitHub Repository', url: 'https://github.com/Joseph2913/OXYGY-AI-Upskilling-Production-site', icon: 'ExternalLink' },
];
```

Each link: `display: flex`, `alignItems: center`, `gap: 8`, `padding: 8px 0`, `fontSize: 13`, `color: #38B2AC`, `fontWeight: 500`, `textDecoration: none`. Hover: `color: #2C9A94`. Opens in new tab (`target: _blank`).

---

## 6. Feature Flags Tab

### 6.1 Layout

```
┌─────────────────────────────────────────────────────┐
│  Feature flags let you enable or disable platform   │
│  features globally or for specific organisations.   │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  GLOBAL FLAGS                               │    │
│  │                                             │    │
│  │  scorm_export              [ OFF ]          │    │
│  │  Allow SCORM package export from e-learning │    │
│  │                                             │    │
│  │  ai_feedback_on_insights   [ ON  ]          │    │
│  │  Enable AI-generated feedback on insights   │    │
│  │                                             │    │
│  │  cohort_leaderboard        [ OFF ]          │    │
│  │  Show leaderboard within cohort views       │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  ORG-SPECIFIC OVERRIDES                     │    │
│  │                                             │    │
│  │  No overrides configured.                   │    │
│  │  [+ Add Override]                           │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 6.2 Schema

The `feature_flags` table was defined in PRD-10's brainstorm but not included in the migration script because it was marked as V2. This PRD adds it:

```sql
create table if not exists feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  description text,
  org_id uuid references organisations(id),
  enabled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_feature_flag unique (key, org_id)
);

alter table feature_flags enable row level security;

-- Only Oxygy admins can manage feature flags
create policy "Oxygy admins can manage flags"
  on feature_flags for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.platform_role in ('oxygy_admin', 'super_admin')
    )
  );

-- All authenticated users can read flags (needed to check flags in the learner app)
create policy "Authenticated can read flags"
  on feature_flags for select
  using (auth.role() = 'authenticated');
```

**Uniqueness:** The constraint `(key, org_id)` means a flag can have one global entry (`org_id = null`) and one entry per org. The org-specific entry overrides the global one.

### 6.3 Seed Data

Initial global flags (inserted in the migration script):

```sql
insert into feature_flags (key, description, enabled) values
  ('scorm_export', 'Allow SCORM package export from e-learning modules', false),
  ('ai_feedback_on_insights', 'Enable AI-generated feedback on application insights', true),
  ('cohort_leaderboard', 'Show leaderboard within cohort views', false)
on conflict do nothing;
```

### 6.4 Global Flags Section

**Container:** AdminCard, `padding: 24px`

**Section label:** "GLOBAL FLAGS"

Each flag is a row:

```tsx
<div style={{
  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
  padding: '14px 0', borderBottom: '1px solid #F7FAFC',
}}>
  <div>
    <div style={{
      fontSize: 13, fontWeight: 600, color: '#2D3748',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {flag.key}
    </div>
    <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
      {flag.description}
    </div>
  </div>
  <ToggleSwitch enabled={flag.enabled} onChange={(val) => updateFlag(flag.id, val)} />
</div>
```

### 6.5 Toggle Switch Component

A minimal on/off toggle:

```tsx
interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, disabled }) => (
  <button
    onClick={() => !disabled && onChange(!enabled)}
    style={{
      width: 44, height: 24, borderRadius: 12, border: 'none',
      background: enabled ? '#38B2AC' : '#CBD5E0',
      cursor: disabled ? 'not-allowed' : 'pointer',
      position: 'relative', transition: 'background 0.2s ease',
      flexShrink: 0,
    }}
  >
    <div style={{
      width: 18, height: 18, borderRadius: '50%',
      background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      position: 'absolute', top: 3,
      left: enabled ? 23 : 3,
      transition: 'left 0.2s ease',
    }} />
  </button>
);
```

### 6.6 Toggle Behaviour

On toggle:
1. Update `feature_flags.enabled` in Supabase
2. Write audit log: `action: 'flag.toggle'`, metadata: `{ key, enabled: newValue }`
3. Show toast: "{flag_key} {enabled ? 'enabled' : 'disabled'}"

### 6.7 Org-Specific Overrides Section

**Container:** AdminCard, `padding: 24px`, `marginTop: 20`

**Section label:** "ORG-SPECIFIC OVERRIDES"

**If no overrides exist:**
- "No org-specific overrides configured." (`fontSize: 13`, `color: #A0AEC0`)
- "Add Override" button below: secondary style

**If overrides exist:**

A table showing overrides:

| Column | Content |
|---|---|
| Flag | Flag key in monospace |
| Organisation | Org name |
| Value | ON/OFF toggle |
| Actions | Remove button |

**"Add Override" modal:**

Simple modal with three fields:
- **Flag:** `<select>` dropdown of all global flag keys
- **Organisation:** `<select>` dropdown of all active orgs
- **Value:** Toggle switch (ON/OFF)

Submit: Insert into `feature_flags` with the selected `org_id`. Write audit log. Refresh table. Close modal.

**Removing an override:** Click the remove button → ConfirmDialog → delete the row → audit log → toast → refresh.

### 6.8 Flag Resolution Logic (for the learner app)

When the learner app needs to check a flag:

```typescript
// lib/featureFlags.ts
export async function isFeatureEnabled(key: string, orgId?: string): Promise<boolean> {
  // 1. Check org-specific override first
  if (orgId) {
    const { data: orgFlag } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', key)
      .eq('org_id', orgId)
      .maybeSingle();
    if (orgFlag) return orgFlag.enabled;
  }

  // 2. Fall back to global flag
  const { data: globalFlag } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('key', key)
    .is('org_id', null)
    .maybeSingle();

  return globalFlag?.enabled ?? false;
}
```

This function is used by learner-facing components to conditionally render features. For V1, it's called on-demand. For V2, flag values can be cached in `AppContext` on mount.

---

## 7. File Structure

### 7.1 New Files

```
pages/admin/
├── AdminContent.tsx                 # Content registry page
└── AdminSettings.tsx                # Settings page with three tabs

components/admin/content/
├── ContentCoverageSummary.tsx       # Per-level coverage bars + overall summary
└── ContentLevelAccordion.tsx        # Expandable level sections with topic cards

components/admin/settings/
├── AuditLogTab.tsx                  # Audit log feed + filters + pagination
├── AuditLogEntry.tsx                # Single log entry with expandable metadata
├── SystemTab.tsx                    # Platform summary, API health, endpoints, links
├── FeatureFlagsTab.tsx              # Global flags + org overrides
├── ToggleSwitch.tsx                 # Reusable on/off toggle
└── AddOverrideModal.tsx             # Modal for adding org-specific flag overrides

lib/
└── featureFlags.ts                  # Flag resolution logic for learner app
```

### 7.2 Modified Files

| File | Change |
|---|---|
| `App.tsx` | Replace `/admin/content` and `/admin/settings` placeholder routes with real page imports |
| `supabase/schema.sql` | Add `feature_flags` table, RLS policies, and seed data |
| `lib/database.ts` | Add `queryAuditLog()` with pagination and filters, `getFeatureFlags()`, `updateFeatureFlag()`, `createFlagOverride()`, `deleteFlagOverride()` |

### 7.3 Migration Script

**File:** `supabase/migration-015-feature-flags.sql`

Contains the `feature_flags` table creation, RLS policies, and seed data. Idempotent.

---

## 8. Edge Cases

### 8.1 Content Registry Shows Stale Data

The content registry reads from static TypeScript files, not a database. If content is added to `topicContent.ts` but the admin hasn't refreshed the page, they see stale data. This is expected behaviour — the page reflects the deployed codebase, not a draft.

### 8.2 Audit Log with No Actor Name

If the `profiles` join fails to find a name (e.g., actor's profile was deleted), fall back to showing the actor's UUID. Display: `fontSize: 12`, `color: #A0AEC0`, `fontFamily: monospace`.

### 8.3 Feature Flag Conflict

If a global flag is OFF but an org override sets it to ON, the org override wins. This is by design — the resolution logic checks org-specific first, then falls back to global. The admin can see both states in the UI.

### 8.4 Health Check When API Is Down

If `/api/health` times out or returns an error, show the red "Offline" status. The other two checks (OpenRouter key, Supabase) can still succeed independently. Each check is independent — a failure in one doesn't block the others.

### 8.5 Large Audit Log

The audit log grows indefinitely. Server-side pagination (25 per page) handles this. For V2, consider adding a date range filter and/or an auto-archive policy (move entries older than 90 days to a cold table).

### 8.6 No Feature Flags Exist

If the seed data wasn't run, the feature flags tab shows an empty state: "No feature flags configured. Add flags via the Supabase SQL Editor." This is acceptable for V1 — flags are managed via migration scripts, not the UI. The UI only toggles existing flags.

---

## 9. Responsive Behaviour

Same rules as previous admin PRDs: minimum 1024px, horizontal scroll below that.

- Content coverage summary: progress bars scale down in width on narrower screens
- Audit log entries: text wraps naturally, metadata panel scrolls horizontally if JSON is wide
- API endpoints table: horizontal scroll via `overflow-x: auto`
- Feature flags: toggle switches remain accessible at all widths

---

## 10. Implementation Checklist

### Content Registry
- [ ] `AdminContent.tsx` with page header
- [ ] `ContentCoverageSummary.tsx` — per-level bars + overall summary
- [ ] Content status logic reading from `LEVEL_TOPICS` and `TOPIC_CONTENT`
- [ ] `ContentLevelAccordion.tsx` — expandable levels with topic cards
- [ ] Topic status badges (Published, Partial, No Content)
- [ ] Phase indicators with counts (E-Learn, Read, Watch, Practice)
- [ ] Preview links opening `/app/level?level=N` in new tab
- [ ] Empty level states
- [ ] Levels with content expanded by default

### Audit Log
- [ ] `AuditLogTab.tsx` with filter bar + paginated feed
- [ ] Search, Actor filter, Action filter, Org filter
- [ ] `AuditLogEntry.tsx` with human-readable descriptions
- [ ] Action description generator covering all action types
- [ ] Expandable metadata panel with formatted JSON
- [ ] Server-side pagination (25 per page)
- [ ] Empty state when no entries exist
- [ ] Actor name display with UUID fallback

### System Tab
- [ ] `SystemTab.tsx` with four sections
- [ ] Platform summary (static key-value list)
- [ ] API health checks: health endpoint, OpenRouter key, Supabase connection
- [ ] "Test" and "Refresh" buttons for health checks
- [ ] Status indicators (green/red dots + labels)
- [ ] API endpoints reference table (18 endpoints)
- [ ] Quick links to external dashboards

### Feature Flags
- [ ] `feature_flags` table + RLS policies + seed data (migration script)
- [ ] `FeatureFlagsTab.tsx` with global flags section
- [ ] `ToggleSwitch.tsx` component
- [ ] Toggle updates flag + writes audit log + shows toast
- [ ] Org-specific overrides section with table
- [ ] `AddOverrideModal.tsx` for creating org overrides
- [ ] Override removal with ConfirmDialog
- [ ] `lib/featureFlags.ts` — `isFeatureEnabled()` resolution function

### Post-Implementation Verification
- [ ] Content registry accurately reflects what's in `topicContent.ts` (currently 2 topics with content)
- [ ] Preview links open the correct learner-facing level view
- [ ] Audit log shows entries from PRD-11/12/13 admin actions in correct chronological order
- [ ] Audit log filters work correctly (actor, action type, org)
- [ ] Audit log pagination advances correctly
- [ ] Expanding a log entry shows properly formatted JSON metadata
- [ ] Health endpoint check shows green when API is up, red when down
- [ ] OpenRouter key check reflects actual key status from `/api/health`
- [ ] Supabase connection check succeeds
- [ ] Feature flag toggles persist across page refreshes
- [ ] Org-specific override correctly overrides global flag value
- [ ] `isFeatureEnabled()` returns correct value in learner app context
- [ ] Audit log entries created for flag toggles and override changes

---

*End of PRD-15*
