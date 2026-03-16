# PRD-12: Enrollment Channels & Join Flow

> **Status:** Draft
> **Author:** Oxygy Design Agent
> **Date:** 16 March 2026
> **Depends on:** PRD-10 (Auth & Multi-Tenancy Foundation), PRD-11 (Admin Shell & Org CRUD)
> **Blocks:** PRD-13 (User Mgmt), PRD-14 (Analytics), PRD-16 (Client Admin)

---

## 1. Overview

### 1.1 Purpose

This PRD builds the end-to-end enrollment pipeline: the admin interface for creating invite links, access codes, and cohorts; and the learner-facing join flow where users arrive via those mechanisms and get assigned to the correct organisation. After this PRD is implemented, an Oxygy admin can onboard a new client's entire user base without touching the database.

### 1.2 What It Delivers

**Admin-facing (inside `/admin`):**
1. Enrollment tab on the org detail page — create and manage invite links, access codes, and domain-based auto-assign channels
2. Cohort management — create cohorts within an org, assign enrollment channels to cohorts
3. Workshops tab on the org detail page — create workshop sessions with attendance codes (building on the existing `workshop_sessions` table)

**Learner-facing (public + post-login):**
4. `/join/:slug` — a branded public page where users sign up via an invite link and get auto-enrolled
5. `/app/join` — a post-login code entry screen for users who authenticated but have no org membership
6. Domain-based auto-assign — background logic that auto-enrolls users whose email domain matches a configured channel

### 1.3 Non-Goals

- User management table and user detail views (PRD-13)
- Analytics on enrollment channels (PRD-14)
- Client admin visibility into enrollment (PRD-16)
- Bulk CSV import of users (PRD-13)
- Transactional invite emails — there is no email sending infrastructure in the current stack. Invite links and codes are shared manually by the Oxygy team or the client's transformation lead. Email integration can be added later.

---

## 2. Admin: Enrollment Tab

**Location:** Organisation detail page (`/admin/organisations/:id`), "Enrollment" tab (replaces placeholder from PRD-11)

### 2.1 Tab Layout

```
┌─────────────────────────────────────────────────────┐
│  ENROLLMENT CHANNELS          [+ New Channel] btn   │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ Label │ Type │ Value │ Cohort │ Uses │ Stat │    │
│  ├───────┼──────┼───────┼────────┼──────┼──────┤    │
│  │ Q1 Wk │ Link │ acme… │  Q1    │ 12/50│ Act  │    │
│  │ Drop  │ Code │ ACME… │  —     │ 3/∞  │ Act  │    │
│  │ Auto  │ Dom  │ acme… │  —     │ 47/∞ │ Act  │    │
│  └───────┴──────┴───────┴────────┴──────┴──────┘    │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  COHORTS                      [+ New Cohort] btn    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ Name  │ Start │ End  │ Members │ Status     │    │
│  ├───────┼───────┼──────┼─────────┼────────────┤    │
│  │ Q1 26 │ Jan 6 │ Mar  │   23    │ Active     │    │
│  │ Q2 26 │ Apr 7 │ Jun  │    0    │ Active     │    │
│  └───────┴───────┴──────┴─────────┴────────────┘    │
└─────────────────────────────────────────────────────┘
```

The tab content is split into two sections with a divider between them: Enrollment Channels (top) and Cohorts (bottom).

### 2.2 Enrollment Channels Section

#### Section Header

**Left:** Section label "ENROLLMENT CHANNELS" (standard admin section label: `fontSize: 11`, `fontWeight: 700`, `color: #A0AEC0`, `uppercase`, `letterSpacing: 0.06em`)

**Right:** "New Channel" button — same primary style as PRD-11's "New Organisation" button (`background: #38B2AC`, `color: #FFFFFF`, `borderRadius: 24`, `padding: 9px 18px`, `fontSize: 13`). Opens the channel creation modal (§2.3).

#### Channels Table

**Container:** `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `borderRadius: 12`, `overflow: hidden`

**Columns:**

| Column | Width | Content |
|---|---|---|
| Label | 22% | Channel label (or auto-generated from type + value if no label) |
| Type | 10% | Type pill badge |
| Value | 22% | The slug, code, or domain — with copy button |
| Cohort | 14% | Cohort name or "—" |
| Uses | 12% | "N / max" or "N / ∞" |
| Status | 10% | Active / Expired / Maxed badge |
| Actions | 10% | Copy link, Deactivate |

**Type pill badges:**
```typescript
const CHANNEL_TYPE_STYLES = {
  link:   { bg: '#EBF4FF', text: '#2B6CB0', label: 'Link' },
  code:   { bg: '#FAF5FF', text: '#6B46C1', label: 'Code' },
  domain: { bg: '#FFFBEB', text: '#975A16', label: 'Domain' },
};
```

**Value column — with copy button:**
- For `link` type: show the full URL (`oxygy.ai/join/{value}`) truncated with ellipsis, plus a copy icon button (`Copy` from Lucide, 14px, `color: #A0AEC0`, hover: `color: #38B2AC`). Click copies the full URL to clipboard and shows "Copied!" toast.
- For `code` type: show the code in monospace style (`fontFamily: 'JetBrains Mono', monospace`, `background: #F7FAFC`, `padding: 2px 8px`, `borderRadius: 4`, `fontSize: 12`, `letterSpacing: '0.05em'`) plus a copy icon.
- For `domain` type: show the domain string (no copy button needed).

**Status column:**
```typescript
function getChannelStatus(channel: EnrollmentChannel): { label: string; color: string; bg: string } {
  if (!channel.active) return { label: 'Inactive', color: '#9B2C2C', bg: '#FED7D7' };
  if (channel.expiresAt && new Date(channel.expiresAt) < new Date())
    return { label: 'Expired', color: '#975A16', bg: '#FEFCBF' };
  if (channel.maxUses && channel.usesCount >= channel.maxUses)
    return { label: 'Maxed', color: '#975A16', bg: '#FEFCBF' };
  return { label: 'Active', color: '#22543D', bg: '#C6F6D5' };
}
```
Render as a pill badge: `fontSize: 11`, `fontWeight: 600`, `padding: 3px 10px`, `borderRadius: 20`.

**Actions column:**
- For `link` type: "Copy Link" icon button (same as value column copy — duplicated for convenience)
- For all types: "Deactivate" icon button (`Power` from Lucide, 14px, `color: #A0AEC0`, hover: `color: #E53E3E`). Click shows a `ConfirmDialog` (from PRD-11 shared components). On confirm: set `active = false`, write audit log, refresh table, show toast.

**Empty state:** "No enrollment channels yet. Create one to start enrolling users." with a "New Channel" button.

**Row styling:** Same as PRD-11 org table — `padding: 14px 16px`, `fontSize: 13`, `borderBottom: 1px solid #F7FAFC`, hover: `background: #FAFAFA`.

### 2.3 Create Channel Modal

Opens when the admin clicks "New Channel". This is a **modal overlay** (not a separate page) because it's a quick creation flow with few fields.

**Modal container:**
- Overlay: `position: fixed`, `inset: 0`, `background: rgba(26, 32, 44, 0.5)`, `zIndex: 50`, `display: flex`, `alignItems: center`, `justifyContent: center`
- Card: `background: #FFFFFF`, `borderRadius: 16`, `width: 100%`, `maxWidth: 520px`, `padding: 0`, `overflow: hidden`, `boxShadow: 0 20px 60px rgba(0,0,0,0.15)`
- Click on overlay backdrop closes the modal

**Modal structure:**

```
┌──────────────────────────────────────────┐
│  New Enrollment Channel           [×]    │
├──────────────────────────────────────────┤
│                                          │
│  Channel Type                            │
│  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │ Link │  │ Code │  │Domain│           │
│  └──────┘  └──────┘  └──────┘           │
│                                          │
│  [Type-specific fields]                  │
│                                          │
│  Label (optional)                        │
│  [ __________________________________ ]  │
│                                          │
│  Assign to Cohort (optional)             │
│  [ Select cohort ▾              ]        │
│                                          │
│  ── Advanced ──                          │
│  Max Uses        Expires                 │
│  [ __________ ]  [ __________ ]          │
│                                          │
├──────────────────────────────────────────┤
│                    [Cancel] [Create]      │
└──────────────────────────────────────────┘
```

**Modal header:**
- `padding: 20px 24px`, `borderBottom: 1px solid #E2E8F0`
- Title: `fontSize: 16`, `fontWeight: 700`, `color: #1A202C`
- Close button: top-right, `X` icon, `24px`, `color: #A0AEC0`, hover: `color: #718096`

**Modal body:** `padding: 24px`

#### Channel Type Selector

Three selectable cards in a row, same pattern as the tier selector in PRD-11 (§6.4):

| Type | Icon | Label | Description |
|---|---|---|---|
| Link | `Link` | Invite Link | "Generate a shareable URL" |
| Code | `Hash` | Access Code | "Create a code users enter after login" |
| Domain | `Globe` | Email Domain | "Auto-enroll users by email domain" |

- Default: `border: 1px solid #E2E8F0`, `background: #FFFFFF`
- Selected: `border: 2px solid #38B2AC`, `background: #E6FFFA`
- `flex: 1`, `padding: 14px`, `borderRadius: 10`, `cursor: pointer`, `textAlign: center`

#### Type-Specific Fields

**When `link` is selected:**
```
URL Slug *
[ acme-q1-2026                              ]
Preview: oxygy.ai/join/acme-q1-2026
```
- Auto-generated from org name + current quarter (e.g., `acme-corp-q1-2026`), editable
- Validation: alphanumeric + hyphens only, 3-60 chars, must be unique across all channels
- Preview line: `fontSize: 12`, `color: #718096`, bold the slug portion
- Helper text: "This will be the public URL users visit to join."

**When `code` is selected:**
```
Access Code *
[ ACME-Q1 ] [↻ Generate]
```
- Auto-generated 6-character alphanumeric code (uppercase), editable
- "Generate" button regenerates a random code
- Validation: alphanumeric + hyphens, 4-12 chars, must be unique
- Helper text: "Share this code with users. They'll enter it after signing in."

**When `domain` is selected:**
```
Email Domain *
[ acme.com                                  ]
```
- Manual entry only, no auto-generation
- Validation: must contain a dot, no spaces, no `@` prefix
- Helper text: "Users with this email domain will be auto-enrolled."
- **Warning card** (if org already has a domain channel): `background: #FFFBEB`, `border: 1px solid #FEFCBF`, `borderRadius: 8`, `padding: 12px`. "This organisation already has a domain channel ({existing_domain}). Only one domain channel can be active per domain."

#### Common Fields

**Label (optional):**
- Standard admin text input
- Placeholder: "e.g., Q1 2026 London Workshop"
- Helper text: "A human-readable name for this channel. Visible only to admins."

**Assign to Cohort (optional):**
- `<select>` dropdown listing all active cohorts for this org, plus "No cohort" default
- If no cohorts exist: show "No cohorts available — create one below" in muted text, dropdown disabled
- If a cohort is selected: users enrolled via this channel will be assigned to that cohort automatically

#### Advanced Section

Collapsed by default. Toggle: "Advanced options ▾" / "Advanced options ▴" — `fontSize: 12`, `fontWeight: 600`, `color: #718096`, `cursor: pointer`.

**Max Uses:**
- Number input, `min: 1`, placeholder: "Unlimited"
- If empty/null: no cap
- Helper text: "Maximum number of users who can enroll via this channel."

**Expires:**
- Date input (`type: date`)
- If empty/null: never expires
- Helper text: "After this date, the channel will no longer accept enrollments."

#### Modal Footer

- `padding: 16px 24px`, `borderTop: 1px solid #E2E8F0`, `display: flex`, `justifyContent: flex-end`, `gap: 12`
- Cancel button: same secondary style as PRD-11
- Create button: same primary teal style. Disabled until required fields are filled.

#### Submit Behaviour

1. Validate all fields
2. Check uniqueness of value (query `enrollment_channels` for matching `value`)
3. If not unique: show error below the value field ("This {slug/code/domain} is already in use")
4. Insert into `enrollment_channels`:
   ```typescript
   const { data, error } = await supabase
     .from('enrollment_channels')
     .insert({
       org_id: orgId,
       cohort_id: selectedCohortId || null,
       type: channelType,
       value: channelValue.trim(),
       label: label.trim() || null,
       max_uses: maxUses || null,
       expires_at: expiresAt || null,
       active: true,
       created_by: user.id,
     })
     .select()
     .single();
   ```
5. Write audit log: `action: 'channel.create'`, metadata includes type, value, org_name
6. Close modal, refresh channel table, show success toast
7. **If type is `link`:** immediately show a "Link created" confirmation with the full URL and a prominent copy button — the admin's most common next action is copying the URL.

### 2.4 Cohorts Section

Below the channels table, separated by a divider (`borderTop: 1px solid #E2E8F0`, `paddingTop: 24px`, `marginTop: 24px`).

#### Section Header

Same pattern: "COHORTS" label left, "New Cohort" button right.

#### Cohorts Table

**Columns:**

| Column | Width | Content |
|---|---|---|
| Name | 25% | Cohort name |
| Start Date | 18% | Formatted date or "—" |
| End Date | 18% | Formatted date or "—" |
| Members | 15% | Count of users in this cohort |
| Status | 12% | Active/Inactive badge |
| Actions | 12% | Edit, Deactivate |

**Row styling:** Same as channels table.

**Empty state:** "No cohorts yet. Cohorts let you group users and track their progress separately."

#### Create Cohort Modal

Simpler than the channel modal — fewer fields.

**Fields:**
- **Cohort Name** * — text input, required
- **Description** — text input, optional
- **Start Date** — date input, optional
- **End Date** — date input, optional

**Submit:** Insert into `cohorts`, write audit log, refresh table, close modal, show toast.

#### Edit Cohort

Clicking "Edit" on a cohort row opens the same modal pre-populated for editing. Save updates the record + writes audit log.

---

## 3. Admin: Workshops Tab

**Location:** Organisation detail page, "Workshops" tab (replaces placeholder from PRD-11)

This tab manages workshop sessions — live events where a facilitator shares an attendance code and learners enter it to mark a level as "workshop attended." The `workshop_sessions` table already exists in the schema.

### 3.1 Tab Layout

```
┌─────────────────────────────────────────────────────┐
│  WORKSHOP SESSIONS               [+ New Session]    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ Name   │ Level │ Code  │ Date   │ Status    │    │
│  ├────────┼───────┼───────┼────────┼───────────┤    │
│  │ L1 Wksp│  1    │ WK-L1 │ 15 Mar │ Active    │    │
│  │ L2 Wksp│  2    │ WK-L2 │ 22 Mar │ Active    │    │
│  └────────┴───────┴───────┴────────┴───────────┘    │
└─────────────────────────────────────────────────────┘
```

### 3.2 Workshops Table

**Columns:**

| Column | Width | Content |
|---|---|---|
| Session Name | 28% | Workshop session name |
| Level | 12% | Level number with level name (e.g., "Level 1 — Fundamentals") |
| Code | 18% | Workshop code in monospace style + copy button |
| Date | 18% | Session date formatted |
| Status | 12% | Active/Inactive badge |
| Actions | 12% | Deactivate |

### 3.3 Create Workshop Session Modal

**Fields:**
- **Session Name** * — text input (e.g., "London Cohort — Level 1 Workshop")
- **Level** * — select dropdown with levels 1-5, filtered by the org's `level_access`. Each option shows level number + name.
- **Session Code** * — auto-generated 6-char alphanumeric (uppercase), editable. "Generate" button for re-roll. Same validation as enrollment channel codes.
- **Session Date** — date input, optional

**Submit:** Insert into `workshop_sessions`:
```typescript
await supabase.from('workshop_sessions').insert({
  org_id: orgId,
  level: selectedLevel,
  code: sessionCode.trim().toUpperCase(),
  session_name: sessionName.trim(),
  session_date: sessionDate || null,
  created_by: user.id,
  active: true,
});
```
Write audit log, refresh table, close modal, show toast.

**Note:** Workshop codes are validated by the existing `validateWorkshopCode()` function in `lib/database.ts`, which is already called from the learner's level progress flow. No changes needed to that function — this PRD just provides the admin UI for creating the sessions.

---

## 4. Join Page — Invite Link Flow

**File:** `pages/JoinPage.tsx`
**Route:** `/join/:slug`

This is a **public** page — no authentication required to view it. It's the first thing a user sees when they click an invite link. The page must feel polished and branded because it's the user's first impression of the platform.

### 4.1 Behaviour Flow

```
User clicks oxygy.ai/join/acme-q1-2026
         │
         ▼
    Look up channel by slug
         │
    ┌────┴────┐
    │ Valid?  │
    └────┬────┘
    No   │   Yes
    │    │    │
    ▼    │    ▼
  Error  │  Show branded join page
  page   │  with org name
         │
         ▼
    User clicks "Get Started"
         │
         ▼
    Auth modal opens (SSO / magic link)
         │
         ▼
    After auth → auto-enroll
         │
         ▼
    Redirect to /app/dashboard
```

### 4.2 Channel Validation

On mount, fetch the channel:
```typescript
const { data: channel, error } = await supabase
  .from('enrollment_channels')
  .select('*, organisations(name, branding)')
  .eq('value', slug)
  .eq('type', 'link')
  .single();
```

Then check validity:
1. Does the channel exist? If not → show "not found" error page
2. Is `active` true? If not → show "link is no longer active" error page
3. Is it expired (`expires_at < now()`)? If yes → show "link has expired" error page
4. Is it maxed (`uses_count >= max_uses`)? If yes → show "link has reached its limit" error page

### 4.3 Valid Channel — Join Page Layout

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              ┌────────────────────┐                  │
│              │   OXYGY Logo       │                  │
│              └────────────────────┘                  │
│                                                     │
│         You've been invited to join                  │
│                                                     │
│            ╔════════════════════╗                    │
│            ║   Acme Corp's     ║                    │
│            ║ AI Upskilling     ║                    │
│            ║   Programme       ║                    │
│            ╚════════════════════╝                    │
│                                                     │
│       Build practical AI skills through             │
│       interactive tools and guided learning.        │
│                                                     │
│          [ Get Started →         ]                  │
│                                                     │
│       Already have an account? Sign in              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Page container:**
- `minHeight: 100vh`, `display: flex`, `alignItems: center`, `justifyContent: center`
- `background: linear-gradient(135deg, #F7FAFC 0%, #E6FFFA 100%)` — subtle teal tint
- `padding: 24px`

**Content card:**
- `maxWidth: 480px`, `width: 100%`, `background: #FFFFFF`, `borderRadius: 16`, `overflow: hidden`
- `boxShadow: 0 4px 32px rgba(0,0,0,0.08)`

**Card top accent bar:** `height: 4px`, `background: #38B2AC` (matching the original AuthModal)

**Card content:** `padding: 48px 40px 36px`, `textAlign: center`

**OXYGY Logo:**
- Teal square (36px) with "O" + "OXYGY" text beside it, centred
- `marginBottom: 32`

**Invite text:**
- "You've been invited to join" — `fontSize: 14`, `color: #718096`, `marginBottom: 8`

**Organisation name card:**
- `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `borderRadius: 12`, `padding: 20px 24px`, `marginBottom: 16`
- Org name: `fontSize: 20`, `fontWeight: 800`, `color: #1A202C`
- "AI Upskilling Programme" below: `fontSize: 14`, `color: #718096`, `marginTop: 4`

**Description:**
- "Build practical AI skills through interactive tools and guided learning." — `fontSize: 14`, `color: #718096`, `lineHeight: 1.6`, `maxWidth: 340`, `margin: '0 auto 28px'`

**CTA button — "Get Started":**
- Full width, `padding: 14px`, `borderRadius: 24`, `background: #38B2AC`, `color: #FFFFFF`, `fontSize: 15`, `fontWeight: 600`, `border: none`, `cursor: pointer`
- Hover: `background: #2C9A94`
- On click: opens the AuthModal in overlay mode (see §4.4)

**Sign in link:**
- "Already have an account? Sign in" — `fontSize: 13`, `color: #A0AEC0`, `marginTop: 16`
- "Sign in" is a teal link: `color: #38B2AC`, `fontWeight: 600`
- On click: same as "Get Started" — opens AuthModal

### 4.4 Authentication on the Join Page

When the user clicks "Get Started", the AuthModal (restored in PRD-10) opens in overlay mode. Before opening it, save the channel context so the enrollment can complete after auth:

```typescript
// Save enrollment context before auth redirect
sessionStorage.setItem('oxygy_enrollment_channel', JSON.stringify({
  channelId: channel.id,
  orgId: channel.org_id,
  cohortId: channel.cohort_id,
  slug: slug,
}));
sessionStorage.setItem('oxygy_auth_return_path', `/join/${slug}`);
```

**After auth completes** (handled in the `AuthContext` `onAuthStateChange` listener):
1. Check `sessionStorage` for `oxygy_enrollment_channel`
2. If present: execute the enrollment pipeline (§6)
3. Clear the sessionStorage entry
4. Redirect to `/app/dashboard`

### 4.5 Error States

All error states use the same page layout as the valid state but replace the content card body with an error message.

**Channel not found:**
- Icon: `AlertCircle` (48px, `color: #A0AEC0`)
- Title: "This link isn't valid"
- Description: "The invite link you followed doesn't exist or has been removed. Please contact the person who shared it with you."
- CTA: "Go to homepage →" — links to `/`

**Channel expired:**
- Icon: `Clock` (48px, `color: #A0AEC0`)
- Title: "This link has expired"
- Description: "The invite link you followed is no longer active. Please contact your programme administrator for a new link."
- Same CTA

**Channel maxed:**
- Icon: `UserX` (48px, `color: #A0AEC0`)
- Title: "This link has reached its limit"
- Description: "The maximum number of users have already enrolled via this link. Please contact your programme administrator."
- Same CTA

**Channel inactive:**
- Same as "expired" with title "This link is no longer active"

---

## 5. Post-Login Code Entry

**File:** `pages/app/AppJoinCode.tsx`
**Route:** `/app/join`

This page is shown to authenticated users who don't have an org membership and haven't been auto-enrolled. It provides a code entry field for access-code-based enrollment.

### 5.1 When to Show This Page

In `AppAuthGuard` (or a new `OrgCheckGuard` wrapper), after confirming the user is authenticated, check if they have any active `user_org_memberships` records. If not, and if there's no pending enrollment from a link flow (no `oxygy_enrollment_channel` in sessionStorage), redirect to `/app/join`.

**Important:** This redirect should NOT apply to users with `platform_role = 'oxygy_admin'` or `'super_admin'` — admins don't need org membership to use the platform.

**Implementation — new guard component:**

**File:** `components/app/OrgCheckGuard.tsx`

```typescript
export const OrgCheckGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, orgMemberships, isOxygyAdmin, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  // Admins bypass org check
  if (isOxygyAdmin) return <>{children}</>;

  // No org membership → code entry page
  if (orgMemberships.length === 0) return <Navigate to="/app/join" replace />;

  return <>{children}</>;
};
```

**Wire into `App.tsx`:** Wrap the `/app` route's `AppLayout` element with `OrgCheckGuard` AFTER `AppAuthGuard`:

```tsx
<Route path="/app" element={
  <AppAuthGuard>
    <OrgCheckGuard>
      <AppLayout />
    </OrgCheckGuard>
  </AppAuthGuard>
}>
```

The `/app/join` route itself sits OUTSIDE `OrgCheckGuard` but INSIDE `AppAuthGuard`:

```tsx
<Route path="/app/join" element={
  <AppAuthGuard>
    <AppSuspense><AppJoinCode /></AppSuspense>
  </AppAuthGuard>
} />
```

### 5.2 Code Entry Page Layout

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              ┌────────────────────┐                  │
│              │   OXYGY Logo       │                  │
│              └────────────────────┘                  │
│                                                     │
│           Enter your access code                    │
│                                                     │
│      Your programme administrator should have       │
│      given you a code to join your organisation.    │
│                                                     │
│         [ ______________________________ ]          │
│                                                     │
│              [ Join Programme → ]                    │
│                                                     │
│         Don't have a code? Contact your             │
│         programme administrator.                    │
│                                                     │
│              [ Sign out ]                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Page container:** Same centered layout as the join page — `minHeight: 100vh`, centred card, subtle gradient background.

**Content card:** Same style as join page — `maxWidth: 480px`, white, `borderRadius: 16`, teal accent bar.

**Code input:**
- Large, centred input: `textAlign: center`, `fontSize: 20`, `fontWeight: 700`, `letterSpacing: '0.1em'`, `textTransform: 'uppercase'`
- `padding: 14px 20px`, `border: 2px solid #E2E8F0`, `borderRadius: 12`, `width: 100%`, `maxWidth: 320px`
- Focus: `borderColor: #38B2AC`, `boxShadow: 0 0 0 3px rgba(56, 178, 172, 0.1)`
- Placeholder: "ABC-123"

**Submit button:** Same full-width teal button as the join page.

**Sign out link:** `fontSize: 13`, `color: #A0AEC0`, `marginTop: 20`. Calls `signOut()`.

### 5.3 Code Validation and Enrollment

On submit:
1. Trim and uppercase the code
2. Query `enrollment_channels`:
   ```typescript
   const { data: channel } = await supabase
     .from('enrollment_channels')
     .select('*, organisations(name)')
     .eq('value', code)
     .eq('type', 'code')
     .eq('active', true)
     .single();
   ```
3. If no match: show error below input — "Invalid code. Please check and try again." (`color: #E53E3E`, `fontSize: 13`)
4. Check expiry and max uses (same logic as §4.2)
5. If valid: execute enrollment pipeline (§6)
6. Redirect to `/app/dashboard`

### 5.4 Error States

- **Invalid code:** Inline error message below the input field. Input border turns red (`borderColor: #FC8181`). Error clears when the user types.
- **Expired code:** "This code has expired. Please contact your programme administrator for a new one."
- **Maxed code:** "This code has reached its enrollment limit."

---

## 6. Enrollment Pipeline

This is the shared logic executed regardless of how the user arrives (link, code, or domain). It runs after authentication is confirmed.

### 6.1 Steps

```typescript
async function enrollUser(
  userId: string,
  channel: EnrollmentChannel,
): Promise<{ success: boolean; error?: string }> {

  // 1. Check if user is already a member of this org
  const { data: existing } = await supabase
    .from('user_org_memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('org_id', channel.org_id)
    .eq('active', true)
    .maybeSingle();

  if (existing) {
    // Already enrolled — skip creation, just redirect
    return { success: true };
  }

  // 2. Check channel constraints one more time (race condition guard)
  if (channel.max_uses && channel.uses_count >= channel.max_uses) {
    return { success: false, error: 'This enrollment link has reached its limit.' };
  }
  if (channel.expires_at && new Date(channel.expires_at) < new Date()) {
    return { success: false, error: 'This enrollment link has expired.' };
  }

  // 3. Create membership
  const { error: membershipError } = await supabase
    .from('user_org_memberships')
    .insert({
      user_id: userId,
      org_id: channel.org_id,
      role: 'learner',
      cohort_id: channel.cohort_id || null,
      enrolled_via: channel.id,
      active: true,
    });

  if (membershipError) {
    console.error('Enrollment failed:', membershipError);
    return { success: false, error: 'Enrollment failed. Please try again.' };
  }

  // 4. Increment channel uses_count
  await supabase
    .from('enrollment_channels')
    .update({ uses_count: channel.uses_count + 1 })
    .eq('id', channel.id);

  // 5. Write audit log (using service role from Cloud Function, or client-side if admin)
  // For learner-initiated enrollment, we skip audit log from client side
  // and rely on a Supabase trigger or handle it in the next admin view

  return { success: true };
}
```

### 6.2 Where It's Called

**From the link flow (§4.4):** In the `AuthContext` `onAuthStateChange` handler, after `SIGNED_IN`, check for `oxygy_enrollment_channel` in sessionStorage. If present, call `enrollUser()`.

**From the code flow (§5.3):** Directly after validating the code.

**From domain auto-assign (§7):** In the Cloud Function or Supabase trigger.

### 6.3 Post-Enrollment

After successful enrollment:
1. Clear any enrollment-related sessionStorage entries
2. Refresh the `AuthContext` to pick up the new org membership (call `loadUserContext(userId)`)
3. Navigate to `/app/dashboard`

The `AppContext` will then fetch the org's `level_access` and apply it to the learner's My Journey view (as specified in PRD-10 §4).

---

## 7. Domain-Based Auto-Assign

### 7.1 Mechanism

When a new user signs up (or signs in for the first time), check if their email domain matches any active domain-type enrollment channel. If so, auto-enroll them.

### 7.2 Implementation Option A: AuthContext Hook (Recommended for V1)

Add the domain check to the profile auto-creation logic in `AuthContext` (the "auto-create profile on first sign-in" block from PRD-10 §3.2.1):

```typescript
// After creating the profile for a new user…
const emailDomain = user.email?.split('@')[1]?.toLowerCase();
if (emailDomain) {
  const { data: domainChannel } = await supabase
    .from('enrollment_channels')
    .select('*')
    .eq('type', 'domain')
    .eq('value', emailDomain)
    .eq('active', true)
    .maybeSingle();

  if (domainChannel) {
    await enrollUser(user.id, domainChannel);
  }
}
```

This runs client-side, which is acceptable for V1. The user experiences a brief delay (~200ms) during first sign-in while the domain check runs, but it's invisible because they're still seeing the loading spinner from auth.

### 7.3 Implementation Option B: Supabase Trigger (Future)

For production scale, move this to a Supabase database trigger that fires on `INSERT` to `profiles`. The trigger calls an Edge Function that performs the domain lookup and enrollment. This eliminates the client-side check and handles edge cases like users created via admin bulk import.

Not required for V1 — document as a future improvement.

### 7.4 Edge Cases

- **User's domain matches multiple channels:** Use the first active, non-expired, non-maxed channel. Order by `created_at` ascending (oldest first) so the original channel takes priority.
- **User already has a membership in the matching org:** Skip enrollment (idempotent).
- **User's email has no domain** (e.g., anonymous auth): Skip the check.

---

## 8. Enrollment Status in AuthContext

### 8.1 Extended Context

After PRD-10, `AuthContext` already provides `orgMemberships`. This PRD adds enrollment-related state:

```typescript
interface AuthContextValue {
  // ... existing from PRD-10 ...
  enrollmentPending: boolean;  // true while enrollment pipeline is running
  enrollmentError: string | null;  // error message if enrollment failed
}
```

### 8.2 Loading State During Enrollment

When the enrollment pipeline runs (after sign-in via link or code), set `enrollmentPending = true`. The `OrgCheckGuard` should show a loading state (not redirect to `/app/join`) while `enrollmentPending` is true:

```typescript
if (enrollmentPending) return <EnrollmentLoadingScreen />;
```

**EnrollmentLoadingScreen:** Same centred layout as the join page, with:
- OXYGY logo
- "Setting up your account…" text
- A subtle loading spinner (same style as `AppSuspense`)

This prevents a flash of the code entry page during the brief enrollment processing time.

---

## 9. Data Fetching Patterns

### 9.1 Enrollment Tab Data

```typescript
// Fetch channels + cohorts for this org in parallel
async function fetchEnrollmentData(orgId: string) {
  const [channelsRes, cohortsRes] = await Promise.all([
    supabase
      .from('enrollment_channels')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false }),
    supabase
      .from('cohorts')
      .select('*, user_org_memberships(count)')
      .eq('org_id', orgId)
      .order('start_date', { ascending: false }),
  ]);

  return {
    channels: channelsRes.data || [],
    cohorts: (cohortsRes.data || []).map(c => ({
      ...c,
      memberCount: c.user_org_memberships?.[0]?.count ?? 0,
    })),
  };
}
```

### 9.2 Workshops Tab Data

```typescript
async function fetchWorkshops(orgId: string) {
  const { data } = await supabase
    .from('workshop_sessions')
    .select('*')
    .eq('org_id', orgId)
    .order('session_date', { ascending: false });
  return data || [];
}
```

### 9.3 Channel Lookup (Join Page)

```typescript
// Public lookup — uses the public RLS policy from PRD-10
async function lookupChannel(slug: string) {
  const { data, error } = await supabase
    .from('enrollment_channels')
    .select('*, organisations(name, branding)')
    .eq('value', slug)
    .eq('type', 'link')
    .eq('active', true)
    .maybeSingle();

  return { channel: data, error };
}
```

---

## 10. Code Generation Utilities

### 10.1 Access Code Generator

```typescript
function generateAccessCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excludes I, O, 0, 1 to avoid confusion
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
```

### 10.2 URL Slug Generator

```typescript
function generateSlug(orgName: string): string {
  const base = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
  const quarter = `q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
  const year = new Date().getFullYear();
  return `${base}-${quarter}-${year}`;
}
```

---

## 11. File Structure

### 11.1 New Files

```
pages/
├── JoinPage.tsx                         # Public /join/:slug invite link page
└── app/
    └── AppJoinCode.tsx                  # Post-login code entry page

components/
├── admin/
│   ├── enrollment/
│   │   ├── ChannelTable.tsx             # Enrollment channels table
│   │   ├── CreateChannelModal.tsx       # Modal for creating new channels
│   │   ├── CohortTable.tsx             # Cohorts table
│   │   ├── CreateCohortModal.tsx       # Modal for creating new cohorts
│   │   └── WorkshopTable.tsx           # Workshop sessions table + create modal
│   └── ...
├── app/
│   ├── OrgCheckGuard.tsx               # Redirects org-less users to /app/join
│   └── EnrollmentLoadingScreen.tsx     # Loading state during enrollment
└── ...

lib/
└── enrollment.ts                        # enrollUser() pipeline + code generators
```

### 11.2 Modified Files

| File | Change |
|---|---|
| `App.tsx` | Add `/app/join` route outside `OrgCheckGuard`, replace `/join/:slug` placeholder with real `JoinPage` |
| `context/AuthContext.tsx` | Add `enrollmentPending`, `enrollmentError` to context. Add domain auto-assign in first-sign-in block. Handle `oxygy_enrollment_channel` sessionStorage after `SIGNED_IN`. |
| `pages/admin/AdminOrgDetail.tsx` | Replace Enrollment tab placeholder with `ChannelTable` + `CohortTable`. Replace Workshops tab placeholder with `WorkshopTable`. |
| `lib/database.ts` | Add functions: `createChannel`, `lookupChannel`, `incrementChannelUses`, `deactivateChannel`, `listChannels`, `createCohort`, `updateCohort`, `listCohorts`, `createWorkshopSession`, `listWorkshopSessions` |

### 11.3 Files NOT Changed

All learner-facing tool pages, e-learning views, marketing site, and existing app pages remain untouched. The only learner-facing changes are the new JoinPage and AppJoinCode pages, which are net-new routes.

---

## 12. Edge Cases

### 12.1 User Clicks Invite Link but Already Has an Account and Membership

If the user authenticates and `enrollUser()` finds they're already a member of the target org, it silently succeeds and redirects to `/app/dashboard`. No error, no duplicate membership.

### 12.2 User Clicks Invite Link for Org A but Is Already a Member of Org B

The current data model supports multiple org memberships (the `user_org_memberships` junction table allows multiple rows per user). The user will be enrolled in Org A in addition to their existing Org B membership. The `AppContext` uses the `primaryOrg` (first active membership), so the learner sees Org A's level access. Multi-org switching UI is out of scope — for V1, users belong to one org in practice.

### 12.3 Channel Becomes Maxed or Expired Between Page Load and Submit

The `enrollUser()` pipeline re-checks constraints before creating the membership (§6.1 step 2). If the channel became invalid between page load and submit, the user sees an error message. The page should offer to go to the homepage.

### 12.4 Two Users Submit at the Same Time on a Channel with max_uses = 1

The `uses_count` increment is not atomic in the current implementation (read-then-write). For V1 with small user counts, this race condition is negligible. For production scale, replace with a Supabase RPC function that atomically increments and checks:

```sql
create or replace function increment_channel_uses(channel_id uuid)
returns boolean as $$
  update enrollment_channels
  set uses_count = uses_count + 1
  where id = channel_id
    and active = true
    and (max_uses is null or uses_count < max_uses)
    and (expires_at is null or expires_at > now())
  returning true;
$$ language sql;
```

Document this as a future improvement. Not required for V1.

### 12.5 Admin Creates a Domain Channel for a Domain That Doesn't Exist

No validation against real DNS records. The admin is responsible for entering the correct domain. If they mistype it, no users will match and the channel will have 0 uses — easily identified and corrected.

### 12.6 User Signs In via Magic Link and the Email Redirect Loses the Join Context

Magic link emails redirect to the `redirectTo` URL configured in the Supabase auth call. The join page stores context in `sessionStorage`, which persists across redirects within the same browser tab. The original AuthModal (pre-removal) used `getBaseUrl()` as the redirect URL, which returns the current origin + pathname. For the join page, this means the redirect URL is `oxygy.ai/join/acme-q1-2026` — the user returns to the join page, the sessionStorage context is still there, and enrollment completes.

**Potential issue:** If the user opens the magic link in a different browser tab, sessionStorage is tab-scoped and the context is lost. In this case, the user authenticates successfully but doesn't get enrolled. They land on `/app/join` (the code entry page) because they have no org membership.

**Mitigation:** Encode the channel slug in the magic link redirect URL: `redirectTo: oxygy.ai/join/${slug}`. When the user returns, the join page re-validates the slug and completes enrollment. This removes the dependency on sessionStorage for the critical path.

---

## 13. Responsive Behaviour

**Admin pages (enrollment tab, workshop tab):** Same rule as PRD-11 — minimum 1024px, horizontal scroll below that. Tables get `overflow-x: auto`.

**Join page (`/join/:slug`):** Fully responsive. The centred card scales down to `padding: 32px 24px` on small screens. The gradient background fills the viewport. Touch targets meet 44px minimum.

**Code entry page (`/app/join`):** Same responsive behaviour as the join page.

---

## 14. Implementation Checklist

### Admin: Enrollment Tab
- [ ] Replace enrollment placeholder with real tab content
- [ ] `ChannelTable` with all columns, status badges, copy buttons
- [ ] `CreateChannelModal` with type selector, type-specific fields, common fields, advanced options
- [ ] Channel creation: validate uniqueness, insert, audit log, toast, refresh table
- [ ] Channel deactivation: ConfirmDialog, update, audit log, toast
- [ ] `CohortTable` with member counts
- [ ] `CreateCohortModal` with name, description, dates
- [ ] Cohort edit functionality
- [ ] Copy-to-clipboard for link URLs and access codes

### Admin: Workshops Tab
- [ ] Replace workshops placeholder with real tab content
- [ ] `WorkshopTable` with all columns
- [ ] Create workshop session modal with level selector (filtered by org's level_access)
- [ ] Workshop code auto-generation
- [ ] Workshop deactivation

### Join Page
- [ ] `JoinPage.tsx` with channel lookup on mount
- [ ] Valid state: branded page with org name, "Get Started" button
- [ ] Error states: not found, expired, maxed, inactive
- [ ] Auth integration: AuthModal overlay, sessionStorage context
- [ ] Post-auth enrollment via enrollment pipeline

### Code Entry Page
- [ ] `AppJoinCode.tsx` with code input and validation
- [ ] Large centred code input with uppercase transform
- [ ] Error messages for invalid/expired/maxed codes
- [ ] Sign out link
- [ ] `OrgCheckGuard.tsx` redirecting org-less learners to `/app/join`

### Enrollment Pipeline
- [ ] `lib/enrollment.ts` with `enrollUser()` function
- [ ] Duplicate membership check (idempotent)
- [ ] Constraint re-check before enrollment
- [ ] Membership creation + channel uses increment
- [ ] `generateAccessCode()` and `generateSlug()` utilities

### Domain Auto-Assign
- [ ] Domain check in AuthContext first-sign-in block
- [ ] Match against active domain channels
- [ ] Auto-enroll if match found

### Integration
- [ ] `AuthContext` updated with `enrollmentPending`, `enrollmentError`
- [ ] sessionStorage-based enrollment context for link flow
- [ ] `EnrollmentLoadingScreen` shown during pipeline execution
- [ ] Magic link redirect URL includes channel slug (§12.6 mitigation)
- [ ] Post-enrollment: refresh context, navigate to dashboard

### Post-Implementation Verification
- [ ] Admin can create a link channel → copy URL → open in incognito → sign up → get enrolled in correct org
- [ ] Admin can create a code channel → new user signs in → enters code → gets enrolled
- [ ] Admin can create a domain channel → user signs up with matching email domain → gets auto-enrolled
- [ ] Channel uses_count increments after each enrollment
- [ ] Maxed channel shows correct error on join page
- [ ] Expired channel shows correct error on join page
- [ ] Deactivated channel shows correct error on join page
- [ ] User already in org → no duplicate membership, silent redirect to dashboard
- [ ] Cohort assignment works when channel has a cohort_id
- [ ] Workshop session codes validate correctly in the existing level progress flow
- [ ] OrgCheckGuard redirects org-less learners to `/app/join` but allows admins through

---

*End of PRD-12*
