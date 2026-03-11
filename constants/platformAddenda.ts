/**
 * Platform-specific knowledge addenda for the Build Guide system prompt.
 *
 * Each entry contains deep platform knowledge — exact module/node names,
 * credential setup flows, data reference syntax, gotchas, and best practices.
 * Appended to BUILD_GUIDE_SYSTEM_PROMPT when generating a guide for that platform.
 */

export const PLATFORM_ADDENDA: Record<string, string> = {

// ═══════════════════════════════════════════════════════════════
// n8n
// ═══════════════════════════════════════════════════════════════
'n8n': `
PLATFORM-SPECIFIC KNOWLEDGE — n8n (v1.x)

Use these exact node names, syntax, and patterns when writing the Build Guide.

EXACT NODE NAMES (use these in step titles and instructions):
- Triggers: Webhook, Schedule Trigger, Manual Trigger, Email Trigger (IMAP), Chat Trigger
- HTTP: HTTP Request (supports all methods, auth types, pagination, retry)
- Logic: IF (true/false branches), Switch (multi-branch), Filter, Merge
- Data: Edit Fields (Set), Sort, Limit, Remove Duplicates, Aggregate, Split Out, Summarize, Compare Datasets
- Code: Code (JavaScript or Python), Execute Command
- Flow: Loop Over Items (formerly Split In Batches), Wait, Execute Workflow, Respond to Webhook
- Error: Error Trigger (workflow-level error handler)
- AI: AI Agent, Basic LLM Chain, LLM Chat Model (select your preferred provider), Structured Output Parser, Tool sub-nodes, Vector Store nodes

AI AGENT NODE — TRIPLE PROMPT PATTERN (critical for any step using AI Agent):
When configuring an AI Agent node, there are THREE distinct prompt fields. Document all three:

1. System Prompt (under "Options" → "System Message"):
   - The persistent instructions: role definition, constraints, behaviour rules
   - This does NOT change per execution — it defines WHO the agent is
   - Example: "You are an expert at analysing client feedback. Always provide structured analysis."

2. User Prompt (the main "Prompt" / "Text" input field):
   - The per-execution dynamic input — mapped from the trigger or previous node
   - Use field expressions: \`{{ $json.response_text }}\`, \`{{ $('Webhook').item.json.body }}\`
   - This is what the agent processes each time the workflow runs

3. Structured Output Parser (add as a sub-node under the AI Agent):
   - Attach a "Structured Output Parser" sub-node to force JSON output
   - Define the exact JSON schema the agent must return
   - This ensures downstream nodes can reliably parse the response
   - Without this, the agent returns free-text which is fragile to parse

POPULAR INTEGRATION NODES (exact names):
| Service | Trigger | Action Node |
|---|---|---|
| Slack | Slack Trigger | Slack |
| Google Sheets | Google Sheets Trigger | Google Sheets |
| Gmail | Gmail Trigger | Gmail |
| Airtable | Airtable Trigger | Airtable |
| Notion | Notion Trigger | Notion |
| AI / LLM | — | AI node (your chosen provider) |
| PostgreSQL | — | Postgres |
| MySQL | — | MySQL |
| MongoDB | — | MongoDB |
| HubSpot | HubSpot Trigger | HubSpot |
| GitHub | GitHub Trigger | GitHub |
| Supabase | — | Supabase |

DATA REFERENCE SYNTAX:
- Current item field: \`{{ $json.fieldName }}\` or \`{{ $json["field name"] }}\`
- Nested: \`{{ $json.nested.field }}\` or \`{{ $json.array[0].name }}\`
- From another node: \`{{ $('NodeName').item.json.field }}\`
- First/last item: \`{{ $('NodeName').first().json.field }}\` / \`{{ $('NodeName').last().json.field }}\`
- All items: \`{{ $('NodeName').all() }}\`
- Built-ins: \`{{ $now }}\`, \`{{ $today }}\`, \`{{ $itemIndex }}\`, \`{{ $runIndex }}\`
- Execution: \`{{ $execution.id }}\`, \`{{ $workflow.name }}\`
- Env vars: \`{{ $vars.myVar }}\` (Cloud/Enterprise) or \`{{ $env.MY_VAR }}\` (self-hosted)
- Ternary: \`{{ $if($json.score > 50, "pass", "fail") }}\`
- Legacy syntax \`{{ $node["Name"].json.field }}\` still works but prefer \`$('Name')\`

CREDENTIAL SETUP (tell users exactly where to go):
1. Left sidebar → Credentials → Add Credential
2. Search for the credential type (e.g. "Slack OAuth2 API", or the LLM API credential approved by your team)
3. For API keys: paste the key into the API Key field → Save
4. For OAuth2: fill Client ID + Secret → click Connect → authorize in popup → Save
5. Credentials are encrypted at rest (AES-256-CBC)
Auth types on HTTP Request node: Predefined Credential Type, Header Auth, OAuth2, Basic Auth, Query Auth, Digest Auth

CODE NODE:
- JavaScript "Run Once for All Items": access \`$input.all()\`, return array of \`{ json: {...} }\`
- JavaScript "Run Once for Each Item": access \`$input.item\`, return single \`{ json: {...} }\`
- Python: use \`_input.all()\` / \`_input.item\`, same return shape
- \`require()\` blocked by default. Self-hosted: set \`NODE_FUNCTION_ALLOW_EXTERNAL=moduleName\`

WEBHOOK SETUP:
- Test URL: \`https://<domain>/webhook-test/<path>\` — works only in editor with "Listen for Test Event"
- Production URL: \`https://<domain>/webhook/<path>\` — works only when workflow is active
- Set HTTP Method, Authentication (None/Basic/Header/JWT), Response mode (Immediate / When Last Node Finishes / Respond to Webhook node)

LOOPING (Loop Over Items node):
- Set Batch Size (default 1). Two outputs: "Loop" (connect processing chain back to input) and "Done" (fires after last batch).
- Most nodes auto-iterate over all items — only use Loop Over Items when you need rate-limit delays or batch control.

CONDITIONAL ROUTING:
- IF node: boolean condition → True/False branches. Combine with AND/OR.
- Switch node: multiple outputs via Rules mode (conditions per output) or Expression mode (value matching).
- Filter node: single output, drops non-matching items.

ERROR HANDLING:
- Per-node: Settings tab → "Retry On Fail" (max retries + wait ms) or "Continue On Fail" (outputs error as data)
- Workflow-level: Error Trigger node fires on any execution failure. Also: Workflow Settings → Error Workflow.

GOTCHAS:
- n8n Cloud: execution timeout varies by plan (Starter ~3min, Pro longer). Self-hosted: configurable via EXECUTIONS_TIMEOUT env var.
- Self-hosted default DB is SQLite — use PostgreSQL for production.
- Memory: default Node.js ~1.5GB heap. Increase with NODE_OPTIONS=--max-old-space-size=4096.
- No built-in rate limiting — add Wait nodes or use Loop Over Items with small batches for rate-limited APIs.
- Binary data (files, images): flows through \`binary\` property alongside \`json\`. Access via \`$input.item.binary.data\`.
- Dates use Luxon: \`{{ $json.date.toDateTime().toFormat('yyyy-MM-dd') }}\`
`,

// ═══════════════════════════════════════════════════════════════
// ZAPIER
// ═══════════════════════════════════════════════════════════════
'Zapier': `
PLATFORM-SPECIFIC KNOWLEDGE — Zapier (2025)

Use these exact step type names, syntax, and patterns when writing the Build Guide.

TERMINOLOGY:
- A workflow is called a "Zap". Each Zap has a Trigger (step 1) and one or more Actions.
- Steps are numbered: 1 (trigger), 2, 3, etc. Referenced in data mapping as step numbers.

STEP TYPES (exact names in UI):
- Trigger: first step, starts the Zap (polling or instant/webhook)
- Action: performs an operation in an app
- Search: looks up an existing record (e.g. "Find Row in Google Sheets")
- Filter by Zapier: continues only if conditions are met (like an IF that stops the Zap if false)
- Paths by Zapier: conditional branching — up to 3 paths (5 on paid plans), each with its own conditions and sub-steps
- Formatter by Zapier: text/number/date transformations (split text, extract pattern, math, dates, lookup table, etc.)
- Delay by Zapier: pause for a duration, until a specific time, or until a queue clears
- Looping by Zapier: iterate over a line-item array, running downstream steps for each item
- Sub-Zap by Zapier: call another Zap as a subroutine (requires paid plan)
- Code by Zapier: run JavaScript or Python
- Webhooks by Zapier: send/receive raw HTTP requests
- Digest by Zapier: collect data over time, then release as a batch
- Email by Zapier: send simple emails
- Storage by Zapier: simple key-value store across Zap runs
- Transfer by Zapier: bulk data migration between apps

POPULAR APP NAMES (exact as they appear in Zapier's app directory):
| Service | Trigger Example | Action Example |
|---|---|---|
| Slack | New Message in Channel | Send Channel Message |
| Google Sheets | New or Updated Spreadsheet Row | Create Spreadsheet Row |
| Gmail | New Email, New Labeled Email | Send Email |
| Webhooks by Zapier | Catch Hook (receive) | Custom Request (send) |
| Airtable | New Record, New or Updated Record | Create Record |
| Notion | New Database Item, Updated Database Item | Create Database Item |
| AI / LLM | — | Send Prompt (via your chosen AI provider) |
| HubSpot | New Contact, New Deal | Create Contact, Create Deal |
| Salesforce | New Record, Updated Record | Create Record |
| Microsoft Excel | New Row | Add Row |
| Trello | New Card | Create Card |
| Asana | New Task | Create Task |
| Jira | New Issue | Create Issue |

DATA REFERENCE / FIELD MAPPING:
- In the Zap editor, click a field → "Insert Data" dropdown shows output fields from all previous steps
- Data pills: displayed as chips showing "Step N. Field Name"
- In Code by Zapier: access via \`inputData.fieldName\` (you define input fields that map to previous steps)
- In Webhooks/custom fields: use \`{{stepNumber__fieldName}}\` (double underscore) in some contexts
- Line items: arrays shown as comma-separated values. Use Looping to process individually.

CREDENTIAL SETUP (tell users exactly where to go):
1. When you add a step and select an app, Zapier prompts "Connect [App Name]"
2. Click "Sign in to [App]" → OAuth popup or API key entry form
3. For OAuth apps (Slack, Google, etc.): authorise in popup → connection stored
4. For API key apps: paste your API key → Zapier tests the connection
5. Manage connections: Settings (top-right avatar) → Connections → shows all connected accounts
6. You can have multiple accounts per app and choose which one each step uses

CODE BY ZAPIER:
- JavaScript: Node.js environment. Access input via \`inputData\` object. Return output as object: \`output = { key: value }\`
- Python: access input via \`input_data\` dict. Return via \`output\` list of dicts: \`output = [{"key": "value"}]\`
- Define input fields in the step config — map them to data from previous steps
- No \`require()\` / \`import\` for external packages. Limited to built-in modules (fetch available in JS).
- 10-second execution timeout. 1MB memory limit.

WEBHOOKS BY ZAPIER:
- **Catch Hook** (trigger): Zapier gives you a unique URL → send POST/GET to it → Zap fires
- **Catch Raw Hook**: same but gives you the raw body as a string
- **Custom Request** (action): make any HTTP request (GET/POST/PUT/DELETE) with custom headers, body, auth
- Authentication options on Custom Request: None, Basic, API Key (header), API Key (query), Bearer Token

PATHS BY ZAPIER:
- Add a Paths step → define Path A, Path B (up to 3-5 paths depending on plan)
- Each path has a "Filter" condition (AND/OR logic with field comparisons)
- Each path can have its own sequence of downstream steps
- Only matching paths execute. If multiple match, all matching paths run.
- You can nest Paths for complex logic (but it gets hard to manage)

LOOPING BY ZAPIER:
- Takes a line-item field (array) and runs subsequent steps once per item
- All steps after the loop step run for each iteration
- Supports "Collect" at the end to aggregate results back
- Loop limit: up to 500 iterations per run on most plans

FILTER BY ZAPIER:
- Conditions: field [operator] value. Operators: Contains, Does not contain, Exactly matches, Is greater than, Is less than, Exists, Does not exist, Starts with, Ends with, Is in, Is not in
- AND/OR logic for combining conditions
- If filter fails, the Zap stops for that run (no "else" branch — use Paths for that)

GOTCHAS:
- Polling triggers check every 1-15 minutes depending on plan (Free: 15min, Starter: 15min, Professional: 2min, Team: 1min, Enterprise: 1min)
- Instant/webhook triggers fire immediately
- Task usage: each action step that runs = 1 task. Triggers don't count. Filters don't count. Monthly task limits per plan.
- Free plan: 100 tasks/month, 5 Zaps, single-step only
- Starter: 750 tasks/month, 20 Zaps, multi-step
- Professional: 2,000 tasks/month, unlimited Zaps, Paths, Webhooks, Custom Logic
- Team: 50,000+ tasks/month
- Errors: Zap History shows every run. Failed runs can be replayed. Set up error alerts (Settings → Alerts).
- Autoreplay: Zapier can auto-retry certain errors (e.g. rate limits) — configure in Zap Settings.
- Data retention: Zap History kept for 7-90 days depending on plan.
- 30-second timeout per step (except Code which is 10s). Entire Zap timeout: 30 minutes.
- Zapier cannot loop back to earlier steps — data flows strictly forward. Use Sub-Zaps for recursion patterns.
`,

// ═══════════════════════════════════════════════════════════════
// MAKE (formerly Integromat)
// ═══════════════════════════════════════════════════════════════
'Make': `
PLATFORM-SPECIFIC KNOWLEDGE — Make (formerly Integromat, 2025)

Use these exact module names, syntax, and patterns when writing the Build Guide.

TERMINOLOGY:
- A workflow is called a "Scenario". Scenarios contain Modules connected by routes.
- Each module has a number (1, 2, 3...) used in data references.
- Modules are connected by lines (routes). A Router creates multiple parallel routes.

MODULE TYPES:
- Trigger modules: start a scenario (instant webhook or polling). Shown with a clock icon or lightning bolt.
- Action modules: perform an operation (create, update, delete, send)
- Search modules: look up records (return multiple items — triggers an implicit loop)
- Aggregator modules: collect multiple items into one (Array Aggregator, Text Aggregator, Table Aggregator, etc.)
- Iterator module: takes an array and outputs individual items (the inverse of Aggregator)
- Router module: splits flow into multiple parallel routes, each with optional filter conditions
- Transformer modules: JSON → Parse JSON, JSON → Create JSON, Text parser, CSV, XML, etc.

CORE UTILITY MODULES (under "Flow Control" and "Tools"):
- Router — multi-branch routing with filters
- Iterator — unpack arrays into individual bundles
- Array Aggregator — collect bundles back into a single array
- Text Aggregator — concatenate text from multiple bundles
- Table Aggregator — build a table from bundles
- Set Variable — store a value for use later in the scenario
- Get Variable — retrieve a stored variable
- Sleep — pause execution for N seconds
- Ignore — skip processing (useful for error handling branches)
- Compose a string — text template with variable substitution

HTTP MODULE (exact name: "HTTP — Make a request"):
- Methods: GET, POST, PUT, PATCH, DELETE
- Auth: No Auth, Basic, API Key, OAuth 2.0, Client Certificate, AWS Signature
- Parse response: auto-detect, JSON, XML, text, binary
- Advanced: follow redirects, reject unauthorized SSL, timeout, retry count
- Also: "HTTP — Make a Basic Auth request", "HTTP — Make an OAuth 2.0 request" (shortcut modules)

WEBHOOKS:
- "Webhooks — Custom webhook" (trigger): Make gives you a URL → send data to it → scenario runs instantly
- "Webhooks — Custom mailhook": receive emails
- "Webhook response" module: send custom HTTP response (status, headers, body)
- To test: click "Run once" on the webhook module, then send a test request

POPULAR APP MODULES (exact names in Make):
| Service | Trigger Module | Action Module |
|---|---|---|
| Slack | Watch Messages | Create a Message |
| Google Sheets | Watch Changes, Watch New Rows | Add a Row, Update a Row |
| Gmail | Watch Emails | Send an Email |
| Airtable | Watch Records | Create a Record |
| Notion | Watch Database Items | Create a Database Item |
| AI / LLM | — | Create a Completion (Chat) via your chosen provider |
| PostgreSQL | — | Execute a query (Select/Insert/Update/Delete) |
| HubSpot | Watch Contacts/Deals | Create a Contact, Create a Deal |
| Salesforce | Watch Records | Create a Record |
| Microsoft 365 Excel | Watch Rows | Add a Row |
| Jira | Watch Issues | Create an Issue |

DATA REFERENCE SYNTAX:
- Click any input field → mapping panel opens showing outputs from previous modules
- Module number reference: \`{{1.fieldName}}\` — module 1's output field
- Nested: \`{{1.data.nested.field}}\` or \`{{1.body.items[1].name}}\`
- Collection access: \`{{2.value}}\` where module 2 is a Set Variable
- Functions panel: click the function icon (f) to access text, math, date, array functions
- Common functions: \`{{formatDate(1.date; "YYYY-MM-DD")}}\`, \`{{lower(1.name)}}\`, \`{{length(1.items)}}\`, \`{{ifempty(1.field; "default")}}\`, \`{{if(1.status = "active"; "yes"; "no")}}\`, \`{{parseDate(1.dateString; "YYYY-MM-DD")}}\`
- Array access: \`{{1.items[]}}\` maps over array, \`{{1.items[1]}}\` first item (1-indexed)
- Concatenation: \`{{1.firstName}} {{1.lastName}}\` (just place expressions side by side in text)

CREDENTIAL SETUP (Connections):
1. When adding a module, click "Add" next to the Connection dropdown
2. Name the connection (e.g. "My Slack Account")
3. For OAuth: click Authorize → popup → grant access → token stored
4. For API keys: paste in the key/token fields → click Save
5. Connections are reusable across scenarios. Manage at: Organization → Connections (left sidebar)
6. Connection health: Make auto-tests connections. Red dot = broken, needs reauthorization.

ROUTER (conditional branching):
- Add a Router module → creates multiple routes (arrows going to different module chains)
- Each route can have a Filter: click the route line → set conditions (field, operator, value, AND/OR)
- Fallback route: the last route with no filter acts as the "else" branch. Set it via the route's "Set as fallback" option.
- Route order matters: Make evaluates top to bottom, executing the first match (or all matches if not set to "break" after first).
- All matching routes execute in parallel by default.

ITERATOR + AGGREGATOR:
- Iterator: input an array field → outputs individual bundles, one per array item. Connect downstream modules to process each.
- Array Aggregator: after processing, aggregates bundles back into a single array. Set "Source Module" to the Iterator.
- Must pair them: Iterator expands → processing → Aggregator collects. This is how you "loop" in Make.

ERROR HANDLING (per-module):
- Right-click a module → "Add error handler" → adds a special error route
- Error handler directives:
  - **Resume**: provide a substitute output and continue the scenario
  - **Rollback**: stop the scenario and mark as error (triggers rollback of incomplete operations)
  - **Ignore**: suppress the error, skip this module, continue with next
  - **Break**: stop the scenario, store the incomplete execution in the "Incomplete Executions" queue for retry
  - **Commit**: process all modules up to the error, then stop (partial success)
- Auto-retry: Break directive can auto-retry (configure max retries and interval)
- Incomplete Executions: found in Scenario → Incomplete Executions tab. Can replay manually or auto.

SCENARIO SCHEDULING:
- Immediate: runs as soon as trigger fires (webhooks)
- Interval: run every N minutes (minimum 1 minute on free, 15 min minimum on free plan)
- Specific date/time: one-time or recurring with cron-like scheduling
- "Run once" button: manual test execution
- On demand: via webhook trigger

GOTCHAS:
- Operation limits: Free plan 1,000 ops/month. Each module execution = 1 operation. Data transfer limits apply too.
- Execution time: max 40 minutes per scenario execution (hard limit).
- Bundle size: max 50MB per bundle. Large files should be streamed, not loaded entirely.
- Scheduling: free plan minimum interval is 15 minutes. Paid plans: 1 minute minimum.
- Data stores: Make has built-in Data Stores (simple key-value databases). Create at: Organization → Data Stores. Use "Data Store" modules to add/get/search/delete records. Useful for deduplication or state tracking.
- Data structures: define reusable schemas for complex data. Organization → Data Structures.
- Scenario history: kept for 30 days (or more on higher plans). View at Scenario → History.
- Make processes items sequentially by default. For true parallelism, use Router with multiple routes.
- 1-indexed arrays: \`{{1.items[1]}}\` is the FIRST item, not the second.
- Timezone: set per scenario in settings. All date functions respect this.
- If a Search module finds multiple results, it outputs each as a separate bundle — this triggers iteration through all downstream modules (implicit loop). Use a Limit or Aggregator if you only want the first result.
`,

// ═══════════════════════════════════════════════════════════════
// POWER AUTOMATE
// ═══════════════════════════════════════════════════════════════
'Power Automate': `
PLATFORM-SPECIFIC KNOWLEDGE — Microsoft Power Automate (2025)

Use these exact action/connector names, syntax, and patterns when writing the Build Guide.

TERMINOLOGY:
- A workflow is called a "Flow". Cloud flows run in the cloud; Desktop flows run via Power Automate Desktop (RPA).
- Each operation is an "Action" (or "Trigger" for the start event).
- Apps/services are accessed via "Connectors". Each connector has triggers and actions.
- Premium connectors require a paid Power Automate license.

FLOW TYPES:
- **Automated cloud flow**: triggered by an event (e.g., new email, new SharePoint item)
- **Instant cloud flow**: triggered manually (button press, Power Apps, HTTP request)
- **Scheduled cloud flow**: runs on a cron schedule
- **Desktop flow**: RPA automation via Power Automate Desktop (not covered here — focus on cloud flows)

CORE ACTIONS (exact names in the designer):
- **Compose**: create a value (text, object, array) for use downstream
- **Initialize variable**: create a variable (String, Integer, Float, Boolean, Object, Array)
- **Set variable**: update an existing variable
- **Append to string variable** / **Append to array variable**
- **Increment variable** / **Decrement variable**
- **Condition**: if/then/else branching (boolean expression)
- **Switch**: multi-branch based on a value (like switch/case)
- **Apply to each**: loop over an array
- **Do until**: loop until a condition is true (max iterations configurable, default 60)
- **Scope**: group actions into a block (useful for try-catch patterns)
- **Terminate**: end the flow with Succeeded, Failed, or Cancelled status
- **Delay**: wait for a specified duration
- **Delay until**: wait until a specific date/time
- **HTTP**: make raw HTTP requests (Premium connector)
- **Parse JSON**: parse a JSON string into typed dynamic content
- **Select**: transform an array (map operation)
- **Filter array**: filter items in an array
- **Create CSV table** / **Create HTML table**: from array data
- **Join**: join array items into a string
- **Send an HTTP request**: available in some connectors (e.g., SharePoint, Office 365)

POPULAR CONNECTORS (exact names):
| Service | Connector Name | Premium? | Example Triggers/Actions |
|---|---|---|---|
| Outlook / Office 365 | Office 365 Outlook | Standard | When a new email arrives → Send an email (V2) |
| SharePoint | SharePoint | Standard | When an item is created → Create item, Get items |
| Teams | Microsoft Teams | Standard | When a new message is posted → Post message in a chat or channel |
| OneDrive | OneDrive for Business | Standard | When a file is created → Create file, Get file content |
| Excel | Excel Online (Business) | Standard | List rows present in a table → Add a row into a table |
| SQL Server | SQL Server | Premium | — → Execute a SQL query, Get rows (V2) |
| Dataverse | Microsoft Dataverse | Premium | When a row is added/modified → List rows, Add a new row |
| HTTP | HTTP | Premium | — → HTTP (make any REST call) |
| Slack | Slack | Standard | When a new message is posted → Post message |
| Google Sheets | Google Sheets | Standard | When a row is added → Get rows, Insert row |
| AI / LLM | AI connector (or AI Builder) | Premium | — → Get chat completions via your chosen provider |
| AI Builder | AI Builder | Premium | — → Create text with AI, Extract info from documents |
| Custom Connector | Custom | Premium | User-defined triggers/actions for any REST API |

DATA REFERENCE SYNTAX (expressions):
- Dynamic Content panel: click any field → pick from list of outputs from previous actions
- Expressions tab: write formulas using Workflow Definition Language (WDL)
- Trigger output: \`@{triggerOutputs()?['body/field']}\` or \`@{triggerBody()?['field']}\`
- Action output: \`@{body('ActionName')?['field']}\` or \`@{outputs('ActionName')?['body/field']}\`
- Variables: \`@{variables('varName')}\`
- Loop current item: \`@{items('Apply_to_each')?['field']}\`
- Compose output: \`@{outputs('Compose')}\`
- Common functions:
  - String: \`concat()\`, \`substring()\`, \`replace()\`, \`split()\`, \`toLower()\`, \`toUpper()\`, \`trim()\`, \`length()\`
  - Date: \`utcNow()\`, \`addDays()\`, \`formatDateTime(utcNow(), 'yyyy-MM-dd')\`, \`convertFromUtc()\`
  - Logic: \`if(condition, trueValue, falseValue)\`, \`equals()\`, \`and()\`, \`or()\`, \`not()\`, \`empty()\`, \`coalesce()\`
  - Array: \`first()\`, \`last()\`, \`length()\`, \`contains()\`, \`join()\`, \`union()\`, \`intersection()\`
  - JSON: \`json(string)\`, \`string(object)\`
  - Null-safe: \`?()\` operator for safe navigation (e.g., \`body('Action')?['nested']?['field']\`)

CREDENTIAL / CONNECTION SETUP:
1. When adding a connector action for the first time, Power Automate prompts "Sign in"
2. For Microsoft services (Outlook, SharePoint, Teams): signs in via your M365 account — automatic OAuth
3. For third-party OAuth (Slack, Google): redirects to their OAuth page → authorize → token stored
4. For API key services: enter key in connection dialog
5. Manage connections: Power Automate portal → Data → Connections (left sidebar)
6. Connections are per-user by default. In solutions, use Connection References for shared/environment-specific connections.
7. Custom connectors: create at Data → Custom connectors → define from OpenAPI spec, Postman collection, or from blank

CONDITION (if/then/else):
- Add Condition action → configure: value1 [operator] value2
- Operators: is equal to, is not equal to, is greater than, is less than, contains, does not contain, starts with, ends with
- AND/OR groups: click "Add row" for AND, "Add group" for OR
- Has two branches: "If yes" and "If no" — add actions into each branch

SWITCH:
- Switch action → set the "On" value (expression or dynamic content)
- Define Cases (Case 1, Case 2, etc.) each with a specific value to match
- Default case for no match
- Add actions inside each case

APPLY TO EACH (looping):
- Select the array to loop over (from dynamic content)
- Add actions inside the loop body
- Concurrency control: Settings → Concurrency Control → toggle on → set degree of parallelism (1-50, default 20)
- Set to 1 for sequential processing (important when order matters or to avoid rate limits)

DO UNTIL:
- Define loop body actions + condition to check after each iteration
- Settings: Count (max iterations, default 60) and Timeout (e.g., PT1H for 1 hour)

ERROR HANDLING (Configure Run After):
- Click the (...) on any action → Configure run after
- Options: "is successful" (default), "has failed", "is skipped", "has timed out"
- Check "has failed" to create error-handling branches (similar to try-catch)
- **Try-catch pattern**: put risky actions inside a Scope → add another Scope after it configured to "Run after: has failed" → that's your catch block
- Terminate action: use in catch block to mark flow as Failed with a custom error message

GOTCHAS:
- **Premium vs Standard**: HTTP connector, SQL Server, Dataverse, Custom connectors all require Premium license (~$15/user/month or $150/flow/month for Process plan)
- **Workflow limits**: max 500 actions per workflow, 8 nesting levels, 25 cases per Switch, 250 variables per flow.
- **Initialize variable must be at top level** (not inside loops/conditions). Set variable can be used anywhere.
- **Do until**: default max 60 iterations, configurable up to 5,000.
- **Apply to each**: array limit 5,000 items (basic) / 100,000 (premium). Concurrency default 20, set to 1 for sequential.
- **Nesting depth**: max 8 levels of nested actions (loops within conditions within loops, etc.)
- **Flow run duration**: max 30 days for cloud flows. Outbound request timeout: 120 seconds.
- **Pagination**: some "List" actions return paginated results. Enable pagination in action settings → set threshold (up to 100,000).
- **Expression gotcha**: Dynamic content and Expressions are different tabs. Dynamic content gives you point-and-click fields; Expressions tab is for formulas. They can be combined.
- **Null handling**: always use the ?\`[]\` safe navigation. \`body('Action')['field']\` throws on null; \`body('Action')?['field']\` returns null safely.
- **Child flows**: use "Run a Child Flow" action to call solution-aware flows as subroutines. Useful for reusable logic.
- **Environment variables**: available in Solutions → Environment Variables. Use for configurable values across environments (dev/test/prod).
- **AI Builder**: built-in AI capabilities — AI-powered text generation, document processing, entity extraction. No external API key needed if you have AI Builder credits.
- **Approval actions**: built-in "Start and wait for an approval" action — sends approval requests via Teams/email. Very commonly used in business workflows.
`,

// ═══════════════════════════════════════════════════════════════
// AI CODING AGENT (code-based automation)
// ═══════════════════════════════════════════════════════════════
'AI Coding Agent': `
PLATFORM-SPECIFIC KNOWLEDGE — AI Coding Agent

An AI coding agent is a CLI-based or SDK-based AI assistant that writes and executes code.
Build guides for this platform describe scripts, agent loops, or tool-use patterns — not
visual drag-and-drop workflows.

CORE CONCEPTS:
- Entry point: A script file (TypeScript/Python) or a prompt-driven agent session
- Tool calls: The AI agent can call tools (read files, write files, run commands, search, etc.)
- Agent loop: The AI reasons → selects a tool → observes result → repeats until done
- No visual canvas — everything is code or prompt-based

SDK & API:
- Use the SDK or API provided by your chosen LLM provider
- Authentication: Use the API key provided by your LLM provider, stored as an environment variable
- Follow your provider's documentation for model IDs, endpoints, and token limits

TOOL USE PATTERN:
\`\`\`typescript
// Example using a generic LLM SDK (adapt to your chosen provider)
const response = await llmClient.chat({
  model: 'your-chosen-model',
  max_tokens: 4096,
  tools: [{ name: 'tool_name', description: '...', input_schema: { type: 'object', properties: { ... } } }],
  messages: [{ role: 'user', content: '...' }],
});
\`\`\`

AGENT LOOP PATTERN:
1. Send initial message with tools defined
2. If response includes a tool call, execute the tool
3. Send tool result back to the LLM
4. Repeat until the LLM returns a final answer (no more tool calls)

CREDENTIAL SETUP:
- API Key: Generated from your LLM provider's console — use the key approved by your team
- Set as an environment variable (e.g. \`LLM_API_KEY\` or your provider's convention)
- Most SDKs auto-read from the environment variable

DATA REFERENCE:
- Input: Access the text response or tool call arguments from the LLM response object
- Tool results: Return structured data back to the LLM for the next reasoning step
- Streaming: Use your SDK's streaming method for real-time output

GOTCHAS:
- Rate limits: Vary by provider and tier. Check response headers for remaining quota.
- Context window: Varies by model (typically 128K–200K tokens input). Plan for long conversations.
- Tool schemas must be valid JSON Schema. Invalid schemas cause errors.
- \`max_tokens\` is typically required and caps output — set it high enough for your use case.
- Streaming recommended for long outputs to avoid timeout perception.
- Cost: Input tokens are generally cheaper than output tokens. Minimise unnecessary output.

ERROR HANDLING:
- Rate limit errors (429): Back off and retry with exponential delay
- Overloaded errors: Temporary — retry after a few seconds
- Always wrap API calls in try/catch and handle rate limits gracefully

COMMON PATTERNS:
- **Text processing**: Single API call with a detailed system prompt
- **Multi-step agent**: Tool-use loop with file system tools
- **Batch processing**: Process items in sequence or with parallel execution
- **Structured output**: Use tool definitions to force JSON output schema
`,
};
