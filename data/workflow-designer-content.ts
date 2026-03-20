import type { NodeDefinition } from '../types';
import {
  FileSpreadsheet, Sheet, Globe, Plug, ClipboardList, Mail, Clock, Database,
  Upload, Users, MessageSquare, Mic, Bot, Repeat, FileText, Code, GitBranch,
  Filter, Merge, Heart, Tag, AlignLeft, Languages, ShieldCheck, UserCheck,
  Send, File, Presentation, BarChart3, Bell, Calendar, BookOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Icon lookup map ───────────────────────────────────────────────
export const ICON_MAP: Record<string, LucideIcon> = {
  FileSpreadsheet, Sheet, Globe, Plug, ClipboardList, Mail, Clock, Database,
  Upload, Users, MessageSquare, Mic, Bot, Repeat, FileText, Code, GitBranch,
  Filter, Merge, Heart, Tag, AlignLeft, Languages, ShieldCheck, UserCheck,
  Send, File, Presentation, BarChart3, Bell, Calendar, BookOpen,
};

// ─── Layer colors ──────────────────────────────────────────────────
export const LAYER_COLORS = {
  input:      { band: '#A8F0E0', dark: '#2BA89C', bg: 'rgba(168,240,224,0.2)', border: '#A8F0E0' },
  processing: { band: '#C3D0F5', dark: '#5B6DC2', bg: 'rgba(195,208,245,0.2)', border: '#C3D0F5' },
  output:     { band: '#FBE8A6', dark: '#C4A934', bg: 'rgba(251,232,166,0.2)', border: '#FBE8A6' },
} as const;

// ─── Node Library (39 nodes) ──────────────────────────────────────

export const NODE_LIBRARY: NodeDefinition[] = [
  // DATA INPUT (12)
  { nodeId: 'input-excel', name: 'Excel / CSV Upload', icon: 'FileSpreadsheet', layer: 'input', description: 'Receives data from uploaded spreadsheet files. Use when your workflow starts with structured tabular data \u2014 survey exports, financial reports, HR records, or any data currently living in spreadsheets.' },
  { nodeId: 'input-gsheets', name: 'Google Sheets', icon: 'Sheet', layer: 'input', description: 'Pulls data from a connected Google Sheets document. Ideal for teams already collaborating in Google Workspace \u2014 the workflow triggers when the sheet is updated or on a schedule.' },
  { nodeId: 'input-webhook', name: 'HTTP Webhook', icon: 'Globe', layer: 'input', description: 'Triggered by an incoming HTTP request from another system. Use when an external tool (CRM, form platform, custom app) needs to push data into your workflow in real time.' },
  { nodeId: 'input-api', name: 'API Endpoint', icon: 'Plug', layer: 'input', description: 'Pulls data from an external API on a schedule or trigger. Use when you need to fetch data from a third-party service (e.g., pulling analytics data, retrieving records from a SaaS platform).' },
  { nodeId: 'input-form', name: 'Form / Survey', icon: 'ClipboardList', layer: 'input', description: 'Receives responses from a form, survey, or questionnaire. Common starting point for feedback analysis, intake processes, and registration workflows.' },
  { nodeId: 'input-email', name: 'Email Trigger', icon: 'Mail', layer: 'input', description: 'Triggered when a specific email is received (e.g., from a certain sender, with a certain subject). Use for email-driven processes like approval requests, report submissions, or support tickets.' },
  { nodeId: 'input-schedule', name: 'Scheduled Trigger', icon: 'Clock', layer: 'input', description: 'Runs the workflow on a recurring schedule (hourly, daily, weekly, monthly). Use for periodic tasks like daily report generation, weekly data syncs, or monthly analytics runs.' },
  { nodeId: 'input-database', name: 'Database Query', icon: 'Database', layer: 'input', description: 'Pulls data from an existing SQL or NoSQL database. Use when your source data lives in a structured database and needs to be processed or analyzed.' },
  { nodeId: 'input-file', name: 'File Upload', icon: 'Upload', layer: 'input', description: 'Receives uploaded documents (PDF, Word, images). Use when the workflow starts with unstructured documents that need to be read, extracted, or analyzed.' },
  { nodeId: 'input-crm', name: 'CRM Record', icon: 'Users', layer: 'input', description: 'Triggered when a record is created or updated in your CRM (Salesforce, HubSpot, etc.). Use for sales-driven workflows like lead scoring, account updates, or pipeline reporting.' },
  { nodeId: 'input-chat', name: 'Chat / Message', icon: 'MessageSquare', layer: 'input', description: 'Triggered by a message in Slack, Teams, or a chatbot interface. Use for conversational workflows where a team member\'s message kicks off a process.' },
  { nodeId: 'input-transcript', name: 'Transcript', icon: 'Mic', layer: 'input', description: 'Receives audio/video transcripts from meetings or recordings. Use for post-meeting analysis, interview processing, or content extraction from recorded sessions.' },

  // PROCESSING (13)
  { nodeId: 'proc-ai-agent', name: 'AI Agent', icon: 'Bot', layer: 'processing', description: 'Sends data to an AI agent (like a Level 2 custom GPT) for analysis, summarization, or generation. The core processing node \u2014 use whenever you need AI to interpret, analyze, or create content from your data.' },
  { nodeId: 'proc-ai-loop', name: 'AI Loop', icon: 'Repeat', layer: 'processing', description: 'Processes multiple items through an AI agent one at a time. Use when you have a batch of items (e.g., 50 survey responses) that each need individual AI analysis \u2014 the loop handles them sequentially.' },
  { nodeId: 'proc-text-extract', name: 'Text Extraction', icon: 'FileText', layer: 'processing', description: 'Extracts structured text from PDFs, images, or documents using OCR or parsing. Use when your input is an unstructured document and you need to pull out specific fields, tables, or content.' },
  { nodeId: 'proc-code', name: 'Code Transform', icon: 'Code', layer: 'processing', description: 'Runs custom code to clean, format, or restructure data. Use for data standardization \u2014 converting date formats, cleaning text, normalizing values, or applying business rules that don\'t need AI.' },
  { nodeId: 'proc-mapper', name: 'Data Mapper', icon: 'GitBranch', layer: 'processing', description: 'Maps fields from one format to another (e.g., rename columns, restructure JSON, reformat for a destination system). Use when the data structure from your input doesn\'t match what your output needs.' },
  { nodeId: 'proc-filter', name: 'Filter / Router', icon: 'Filter', layer: 'processing', description: 'Routes data down different paths based on conditions (e.g., "if rating < 3, route to urgent queue"). Use when different types of input need different processing or different destinations.' },
  { nodeId: 'proc-merge', name: 'Merge / Combine', icon: 'Merge', layer: 'processing', description: 'Combines data from multiple sources into a single dataset. Use when your workflow has multiple inputs that need to be joined before processing (e.g., combining survey data with employee records).' },
  { nodeId: 'proc-sentiment', name: 'Sentiment Analysis', icon: 'Heart', layer: 'processing', description: 'Analyzes text for positive, negative, or neutral sentiment. A specialized AI node \u2014 use when you need to score or categorize emotional tone across text responses, reviews, or feedback.' },
  { nodeId: 'proc-classifier', name: 'Classifier / Tagger', icon: 'Tag', layer: 'processing', description: 'Categorizes or tags data based on AI or rule-based logic. Use for sorting items into predefined categories (e.g., tagging support tickets by type, classifying feedback by theme).' },
  { nodeId: 'proc-summarizer', name: 'Summarizer', icon: 'AlignLeft', layer: 'processing', description: 'Condenses long text into key points or executive summaries. Use when your input is lengthy (transcripts, reports, email threads) and the output needs to be concise.' },
  { nodeId: 'proc-translate', name: 'Translation', icon: 'Languages', layer: 'processing', description: 'Translates text between languages. Use for multilingual workflows where inputs arrive in different languages and outputs need to be standardized.' },
  { nodeId: 'proc-validator', name: 'Validator', icon: 'ShieldCheck', layer: 'processing', description: 'Checks data quality, flags errors, and applies validation rules. Use as a quality gate \u2014 ensuring data meets certain standards before being processed further or sent to output.' },
  { nodeId: 'proc-human-review', name: 'Human Review', icon: 'UserCheck', layer: 'processing', description: 'Pauses the workflow for a human to review and approve before continuing. The critical accountability node \u2014 use whenever AI output needs human verification before reaching its final destination.' },

  // DATA OUTPUT (14)
  { nodeId: 'output-excel', name: 'Excel / CSV Export', icon: 'FileSpreadsheet', layer: 'output', description: 'Writes results to a spreadsheet file. Use when the recipient expects data in tabular format for further analysis, reporting, or manual review.' },
  { nodeId: 'output-gsheets', name: 'Google Sheets', icon: 'Sheet', layer: 'output', description: 'Writes results to a Google Sheets document. Ideal for shared, collaborative output \u2014 team members can view and work with results in real time.' },
  { nodeId: 'output-database', name: 'Database Insert', icon: 'Database', layer: 'output', description: 'Stores results in a SQL or NoSQL database. Use when outputs need to be persisted for long-term storage, queried later, or fed into dashboards and applications.' },
  { nodeId: 'output-email', name: 'Email Send', icon: 'Send', layer: 'output', description: 'Sends formatted results via email to specified recipients. Use for report delivery, notifications, or any output that needs to reach a person\'s inbox.' },
  { nodeId: 'output-slack', name: 'Slack / Teams Message', icon: 'MessageSquare', layer: 'output', description: 'Posts results to a Slack channel or Microsoft Teams chat. Use for real-time team notifications, quick summaries, or alerts that need immediate visibility.' },
  { nodeId: 'output-pdf', name: 'PDF Report', icon: 'FileText', layer: 'output', description: 'Generates a formatted PDF report from the processed data. Use when the output needs to be professional, printable, and shareable as a standalone document.' },
  { nodeId: 'output-word', name: 'Word Document', icon: 'File', layer: 'output', description: 'Creates or updates a Word document. Use for deliverables like proposals, meeting notes, or reports that need to be editable by the recipient.' },
  { nodeId: 'output-pptx', name: 'PowerPoint', icon: 'Presentation', layer: 'output', description: 'Generates presentation slides from results. Use when the output feeds into a presentation \u2014 executive summaries, project updates, or data visualizations.' },
  { nodeId: 'output-api', name: 'API Response', icon: 'Plug', layer: 'output', description: 'Sends results back as an HTTP/API response to an external system. Use when the workflow is triggered by a webhook and needs to return data to the calling system.' },
  { nodeId: 'output-crm', name: 'CRM Update', icon: 'Users', layer: 'output', description: 'Creates or updates records in your CRM. Use for sales and customer workflows where AI analysis needs to flow back into the system of record.' },
  { nodeId: 'output-dashboard', name: 'Dashboard Feed', icon: 'BarChart3', layer: 'output', description: 'Pushes data to a dashboard or visualization tool. Use when results need to be visualized in real time \u2014 this connects directly to Level 4 (Interactive Dashboards).' },
  { nodeId: 'output-notification', name: 'Notification', icon: 'Bell', layer: 'output', description: 'Sends a push notification or alert. Use for time-sensitive outputs that need immediate attention \u2014 flagged anomalies, urgent categorizations, or threshold breaches.' },
  { nodeId: 'output-calendar', name: 'Calendar Event', icon: 'Calendar', layer: 'output', description: 'Creates or updates calendar entries. Use when the workflow produces scheduling actions \u2014 follow-up meetings, deadline reminders, or recurring check-ins.' },
  { nodeId: 'output-kb', name: 'Knowledge Base', icon: 'BookOpen', layer: 'output', description: 'Stores results in an internal knowledge base or wiki. Use when AI outputs should become searchable, referenceable organizational knowledge.' },
];

// ─── Filtered arrays & lookup ─────────────────────────────────────
export const INPUT_NODES = NODE_LIBRARY.filter(n => n.layer === 'input');
export const PROCESSING_NODES = NODE_LIBRARY.filter(n => n.layer === 'processing');
export const OUTPUT_NODES = NODE_LIBRARY.filter(n => n.layer === 'output');

export const NODE_MAP: Record<string, NodeDefinition> = {};
NODE_LIBRARY.forEach(n => { NODE_MAP[n.nodeId] = n; });

// ─── Pre-loaded examples ──────────────────────────────────────────
export const WORKFLOW_EXAMPLES = [
  {
    name: 'Learning Programme Reporting',
    task: 'At the end of each training cohort, I want completion data, assessment scores, and learner feedback automatically pulled together into a programme effectiveness report. The report should flag underperforming modules and learners at risk of disengagement, and be sent to the L&D lead and relevant line managers.',
    tools: 'Learning data is in our LMS (Cornerstone or equivalent). Feedback is collected via Microsoft Forms. We use SharePoint for document storage and Outlook for distribution.',
  },
  {
    name: 'Recruitment Pipeline Automation',
    task: 'When a candidate reaches the final interview stage in our ATS, I want an AI agent to automatically compile a candidate summary — pulling their CV, assessment scores, and interview notes — and generate a structured hiring recommendation for the panel. A recruiter should review before it is shared.',
    tools: 'We use Workday as our ATS. Interview notes are in a shared Teams folder. Assessment scores come from a third-party tool via email export.',
  },
  {
    name: 'Employee Relations Case Tracker',
    task: 'When a new ER case is logged, I want key details automatically extracted, the relevant policy sections surfaced, a timeline started, and a case summary drafted for the HR Business Partner. Updates should be logged automatically as the case progresses.',
    tools: 'Cases are currently logged via a Microsoft Forms intake form. Policy documents are in SharePoint. We communicate via Outlook and track cases in a shared Excel file.',
  },
] as const;
