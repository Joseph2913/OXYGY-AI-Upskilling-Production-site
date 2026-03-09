/**
 * n8n Node Template Library
 *
 * Each entry is keyed by n8nNodeKey and returns a partial n8n node JSON object.
 * The assembler assigns id, name, and position.
 *
 * Compatible with n8n v1.x LTS (as of 2025-01).
 */

export interface N8nNodeTemplate {
  type: string;
  typeVersion: number;
  parameters: Record<string, unknown>;
  credentials?: Record<string, { id: string; name: string }>;
}

export interface N8nNodeMeta {
  template: N8nNodeTemplate;
  service: string;
  credentialType: string | null;
  configLabel: string;
  emoji: string;
}

export const N8N_NODE_TEMPLATES: Record<string, N8nNodeMeta> = {
  webhook: {
    template: {
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      parameters: {
        httpMethod: 'POST',
        path: 'YOUR_WEBHOOK_PATH',
        responseMode: 'onReceived',
      },
    },
    service: 'Webhook Trigger',
    credentialType: null,
    configLabel: 'Copy webhook URL to your app',
    emoji: '🔗',
  },

  schedule: {
    template: {
      type: 'n8n-nodes-base.scheduleTrigger',
      typeVersion: 1.2,
      parameters: {
        rule: { interval: [{ field: 'days', daysInterval: 1 }] },
      },
    },
    service: 'Schedule Trigger',
    credentialType: null,
    configLabel: 'Set schedule frequency',
    emoji: '⏰',
  },

  googleSheetsTrigger: {
    template: {
      type: 'n8n-nodes-base.googleSheetsTrigger',
      typeVersion: 1,
      parameters: {
        pollTimes: { item: [{ mode: 'everyMinute' }] },
        sheetId: { __rl: true, value: 'YOUR_SHEET_ID', mode: 'id' },
      },
      credentials: {
        googleSheetsOAuth2Api: { id: 'YOUR_CREDENTIAL_ID', name: 'Google Sheets account' },
      },
    },
    service: 'Google Sheets (trigger)',
    credentialType: 'googleSheetsOAuth2Api',
    configLabel: 'Connect Google account',
    emoji: '📊',
  },

  googleSheets: {
    template: {
      type: 'n8n-nodes-base.googleSheets',
      typeVersion: 4,
      parameters: {
        operation: 'append',
        sheetId: { __rl: true, value: 'YOUR_SHEET_ID', mode: 'id' },
        columns: { mappingMode: 'autoMapInputData' },
      },
      credentials: {
        googleSheetsOAuth2Api: { id: 'YOUR_CREDENTIAL_ID', name: 'Google Sheets account' },
      },
    },
    service: 'Google Sheets',
    credentialType: 'googleSheetsOAuth2Api',
    configLabel: 'Connect Google account',
    emoji: '📊',
  },

  gmail: {
    template: {
      type: 'n8n-nodes-base.gmail',
      typeVersion: 2.1,
      parameters: {
        resource: 'message',
        operation: 'send',
        sendTo: 'YOUR_RECIPIENT@example.com',
        subject: '={{ $json.subject }}',
        emailType: 'text',
        message: '={{ $json.output }}',
      },
      credentials: {
        gmailOAuth2: { id: 'YOUR_CREDENTIAL_ID', name: 'Gmail account' },
      },
    },
    service: 'Gmail',
    credentialType: 'gmailOAuth2',
    configLabel: 'Connect email account',
    emoji: '✉️',
  },

  emailSend: {
    template: {
      type: 'n8n-nodes-base.emailSend',
      typeVersion: 2.1,
      parameters: {
        fromEmail: 'YOUR_EMAIL@example.com',
        toEmail: 'YOUR_RECIPIENT@example.com',
        subject: '={{ $json.subject }}',
        text: '={{ $json.output }}',
      },
      credentials: {
        smtp: { id: 'YOUR_CREDENTIAL_ID', name: 'SMTP account' },
      },
    },
    service: 'Send Email (SMTP)',
    credentialType: 'smtp',
    configLabel: 'Connect email account',
    emoji: '📧',
  },

  slack: {
    template: {
      type: 'n8n-nodes-base.slack',
      typeVersion: 2.2,
      parameters: {
        resource: 'message',
        operation: 'post',
        channel: 'YOUR_CHANNEL_ID',
        text: '={{ $json.output }}',
      },
      credentials: {
        slackApi: { id: 'YOUR_CREDENTIAL_ID', name: 'Slack account' },
      },
    },
    service: 'Slack',
    credentialType: 'slackApi',
    configLabel: 'Connect Slack workspace',
    emoji: '💬',
  },

  discord: {
    template: {
      type: 'n8n-nodes-base.discord',
      typeVersion: 2,
      parameters: {
        resource: 'message',
        operation: 'send',
        channelId: 'YOUR_CHANNEL_ID',
        content: '={{ $json.output }}',
      },
      credentials: {
        discordApi: { id: 'YOUR_CREDENTIAL_ID', name: 'Discord account' },
      },
    },
    service: 'Discord',
    credentialType: 'discordApi',
    configLabel: 'Connect Discord bot',
    emoji: '🎮',
  },

  telegram: {
    template: {
      type: 'n8n-nodes-base.telegram',
      typeVersion: 1.2,
      parameters: {
        resource: 'message',
        operation: 'sendMessage',
        chatId: 'YOUR_CHAT_ID',
        text: '={{ $json.output }}',
      },
      credentials: {
        telegramApi: { id: 'YOUR_CREDENTIAL_ID', name: 'Telegram account' },
      },
    },
    service: 'Telegram',
    credentialType: 'telegramApi',
    configLabel: 'Connect Telegram bot',
    emoji: '📱',
  },

  microsoftOutlook: {
    template: {
      type: 'n8n-nodes-base.microsoftOutlook',
      typeVersion: 2,
      parameters: {
        resource: 'message',
        operation: 'send',
        toRecipients: 'YOUR_RECIPIENT@example.com',
        subject: '={{ $json.subject }}',
        bodyContent: '={{ $json.output }}',
      },
      credentials: {
        microsoftOutlookOAuth2Api: { id: 'YOUR_CREDENTIAL_ID', name: 'Microsoft Outlook account' },
      },
    },
    service: 'Microsoft Outlook',
    credentialType: 'microsoftOutlookOAuth2Api',
    configLabel: 'Connect Microsoft account',
    emoji: '📬',
  },

  airtable: {
    template: {
      type: 'n8n-nodes-base.airtable',
      typeVersion: 2.1,
      parameters: {
        operation: 'create',
        baseId: 'YOUR_BASE_ID',
        tableId: 'YOUR_TABLE_ID',
        columns: { mappingMode: 'autoMapInputData' },
      },
      credentials: {
        airtableTokenApi: { id: 'YOUR_CREDENTIAL_ID', name: 'Airtable account' },
      },
    },
    service: 'Airtable',
    credentialType: 'airtableTokenApi',
    configLabel: 'Connect Airtable account',
    emoji: '🗃️',
  },

  notion: {
    template: {
      type: 'n8n-nodes-base.notion',
      typeVersion: 2.2,
      parameters: {
        resource: 'page',
        operation: 'create',
        databaseId: 'YOUR_DATABASE_ID',
      },
      credentials: {
        notionApi: { id: 'YOUR_CREDENTIAL_ID', name: 'Notion account' },
      },
    },
    service: 'Notion',
    credentialType: 'notionApi',
    configLabel: 'Connect Notion workspace',
    emoji: '📝',
  },

  googleDrive: {
    template: {
      type: 'n8n-nodes-base.googleDrive',
      typeVersion: 3,
      parameters: {
        operation: 'upload',
        folderId: 'YOUR_FOLDER_ID',
        name: '={{ $json.fileName }}',
      },
      credentials: {
        googleDriveOAuth2Api: { id: 'YOUR_CREDENTIAL_ID', name: 'Google Drive account' },
      },
    },
    service: 'Google Drive',
    credentialType: 'googleDriveOAuth2Api',
    configLabel: 'Connect Google account',
    emoji: '📁',
  },

  dropbox: {
    template: {
      type: 'n8n-nodes-base.dropbox',
      typeVersion: 1,
      parameters: {
        resource: 'file',
        operation: 'upload',
        path: '/YOUR_FOLDER/{{ $json.fileName }}',
      },
      credentials: {
        dropboxApi: { id: 'YOUR_CREDENTIAL_ID', name: 'Dropbox account' },
      },
    },
    service: 'Dropbox',
    credentialType: 'dropboxApi',
    configLabel: 'Connect Dropbox account',
    emoji: '💧',
  },

  hubspot: {
    template: {
      type: 'n8n-nodes-base.hubspot',
      typeVersion: 2,
      parameters: {
        resource: 'contact',
        operation: 'create',
      },
      credentials: {
        hubspotApi: { id: 'YOUR_CREDENTIAL_ID', name: 'HubSpot account' },
      },
    },
    service: 'HubSpot',
    credentialType: 'hubspotApi',
    configLabel: 'Connect HubSpot account',
    emoji: '🟠',
  },

  typeform: {
    template: {
      type: 'n8n-nodes-base.typeformTrigger',
      typeVersion: 1,
      parameters: {
        formId: 'YOUR_FORM_ID',
      },
      credentials: {
        typeformApi: { id: 'YOUR_CREDENTIAL_ID', name: 'Typeform account' },
      },
    },
    service: 'Typeform',
    credentialType: 'typeformApi',
    configLabel: 'Connect Typeform account',
    emoji: '📋',
  },

  postgres: {
    template: {
      type: 'n8n-nodes-base.postgres',
      typeVersion: 2.5,
      parameters: {
        operation: 'executeQuery',
        query: 'SELECT * FROM your_table LIMIT 100',
      },
      credentials: {
        postgres: { id: 'YOUR_CREDENTIAL_ID', name: 'PostgreSQL account' },
      },
    },
    service: 'PostgreSQL',
    credentialType: 'postgres',
    configLabel: 'Connect database',
    emoji: '🐘',
  },

  supabase: {
    template: {
      type: 'n8n-nodes-base.supabase',
      typeVersion: 1,
      parameters: {
        resource: 'row',
        operation: 'create',
        tableId: 'YOUR_TABLE_NAME',
      },
      credentials: {
        supabaseApi: { id: 'YOUR_CREDENTIAL_ID', name: 'Supabase account' },
      },
    },
    service: 'Supabase',
    credentialType: 'supabaseApi',
    configLabel: 'Connect Supabase project',
    emoji: '⚡',
  },

  claudeAi: {
    template: {
      type: '@n8n/n8n-nodes-langchain.lmChatAnthropic',
      typeVersion: 1,
      parameters: {
        model: 'claude-sonnet-4-20250514',
        options: {
          systemPrompt: "YOUR_SYSTEM_PROMPT_HERE — describe the AI's role, what it should do, and the format of its output. Use the Oxygy Prompt Playground (Level 1) or Agent Builder (Level 2) to craft this.",
        },
      },
      credentials: {
        anthropicApi: { id: 'YOUR_CREDENTIAL_ID', name: 'Anthropic API' },
      },
    },
    service: 'Claude (Anthropic)',
    credentialType: 'anthropicApi',
    configLabel: 'Add API key',
    emoji: '🤖',
  },

  openAi: {
    template: {
      type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
      typeVersion: 1,
      parameters: {
        model: 'gpt-4o',
        options: {
          systemPrompt: "YOUR_SYSTEM_PROMPT_HERE — describe the AI's role, what it should do, and the format of its output. Use the Oxygy Prompt Playground (Level 1) or Agent Builder (Level 2) to craft this.",
        },
      },
      credentials: {
        openAiApi: { id: 'YOUR_CREDENTIAL_ID', name: 'OpenAI API' },
      },
    },
    service: 'OpenAI',
    credentialType: 'openAiApi',
    configLabel: 'Add API key',
    emoji: '🧠',
  },

  httpRequest: {
    template: {
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      parameters: {
        method: 'GET',
        url: 'https://YOUR_API_ENDPOINT',
        options: {},
      },
    },
    service: 'HTTP Request',
    credentialType: null,
    configLabel: 'Set endpoint URL',
    emoji: '🌐',
  },

  set: {
    template: {
      type: 'n8n-nodes-base.set',
      typeVersion: 3.4,
      parameters: {
        mode: 'manual',
        fields: { values: [{ name: 'output', value: '={{ $json.output }}' }] },
      },
    },
    service: 'Set / Edit Fields',
    credentialType: null,
    configLabel: 'Review field mappings',
    emoji: '✏️',
  },

  if: {
    template: {
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      parameters: {
        conditions: {
          options: { caseSensitive: true },
          conditions: [{ id: 'condition_1', leftValue: '={{ $json.value }}', rightValue: '', operator: { type: 'string', operation: 'exists' } }],
        },
      },
    },
    service: 'IF Condition',
    credentialType: null,
    configLabel: 'Review condition logic',
    emoji: '🔀',
  },

  filter: {
    template: {
      type: 'n8n-nodes-base.filter',
      typeVersion: 2,
      parameters: {
        conditions: {
          options: { caseSensitive: true },
          conditions: [{ id: 'filter_1', leftValue: '={{ $json.value }}', rightValue: '', operator: { type: 'string', operation: 'exists' } }],
        },
      },
    },
    service: 'Filter',
    credentialType: null,
    configLabel: 'Review filter rules',
    emoji: '🔽',
  },

  merge: {
    template: {
      type: 'n8n-nodes-base.merge',
      typeVersion: 3,
      parameters: {
        mode: 'append',
      },
    },
    service: 'Merge',
    credentialType: null,
    configLabel: 'Review merge mode',
    emoji: '🔗',
  },

  splitInBatches: {
    template: {
      type: 'n8n-nodes-base.splitInBatches',
      typeVersion: 3,
      parameters: {
        batchSize: 10,
      },
    },
    service: 'Split in Batches',
    credentialType: null,
    configLabel: 'Set batch size',
    emoji: '📦',
  },

  code: {
    template: {
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      parameters: {
        jsCode: '// Add your custom JavaScript code here\nreturn items;',
        mode: 'runOnceForAllItems',
      },
    },
    service: 'Code (JS)',
    credentialType: null,
    configLabel: 'Write custom code',
    emoji: '💻',
  },

  wait: {
    template: {
      type: 'n8n-nodes-base.wait',
      typeVersion: 1.1,
      parameters: {
        resume: 'webhook',
      },
    },
    service: 'Wait',
    credentialType: null,
    configLabel: 'Set wait condition',
    emoji: '⏸️',
  },

  respondToWebhook: {
    template: {
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1.1,
      parameters: {
        respondWith: 'json',
        responseBody: '={{ $json }}',
      },
    },
    service: 'Respond to Webhook',
    credentialType: null,
    configLabel: 'Set response format',
    emoji: '↩️',
  },

  stickyNote: {
    template: {
      type: 'n8n-nodes-base.stickyNote',
      typeVersion: 1,
      parameters: {
        content: '',
        width: 400,
        height: 300,
      },
    },
    service: 'Sticky Note',
    credentialType: null,
    configLabel: '',
    emoji: '📌',
  },
};

/**
 * Mapping from the app's internal node IDs to n8n node keys.
 * Used to convert the existing workflow (input/processing/output layers)
 * into n8n-compatible intermediate format.
 */
export const APP_NODE_TO_N8N_KEY: Record<string, string> = {
  // Input layer
  'input-excel': 'httpRequest',
  'input-gsheets': 'googleSheetsTrigger',
  'input-webhook': 'webhook',
  'input-api': 'httpRequest',
  'input-form': 'typeform',
  'input-email': 'gmail',
  'input-schedule': 'schedule',
  'input-database': 'postgres',
  'input-file': 'httpRequest',
  'input-crm': 'hubspot',
  'input-chat': 'slack',
  'input-transcript': 'httpRequest',

  // Processing layer
  'proc-ai-agent': 'claudeAi',
  'proc-ai-loop': 'splitInBatches',
  'proc-text-extract': 'code',
  'proc-code': 'code',
  'proc-mapper': 'set',
  'proc-filter': 'if',
  'proc-merge': 'merge',
  'proc-sentiment': 'claudeAi',
  'proc-classifier': 'claudeAi',
  'proc-summarizer': 'claudeAi',
  'proc-translate': 'claudeAi',
  'proc-validator': 'if',
  'proc-human-review': 'wait',

  // Output layer
  'output-excel': 'httpRequest',
  'output-gsheets': 'googleSheets',
  'output-database': 'postgres',
  'output-email': 'gmail',
  'output-slack': 'slack',
  'output-pdf': 'httpRequest',
  'output-word': 'httpRequest',
  'output-pptx': 'httpRequest',
  'output-api': 'respondToWebhook',
  'output-crm': 'hubspot',
  'output-dashboard': 'httpRequest',
  'output-notification': 'slack',
  'output-calendar': 'httpRequest',
  'output-kb': 'notion',
};

/**
 * n8n node type categories (for NodeTypeBadge colors)
 */
export type N8nNodeType = 'trigger' | 'action' | 'ai' | 'condition' | 'transform' | 'output';

export const N8N_NODE_TYPE_COLORS: Record<N8nNodeType, { text: string; bg: string; border: string }> = {
  trigger:   { text: '#38B2AC', bg: '#E6FFFA', border: '#38B2AC44' },
  action:    { text: '#805AD5', bg: '#FAF5FF', border: '#805AD544' },
  ai:        { text: '#1A7A76', bg: '#E6FFFA', border: '#1A7A7644' },
  condition: { text: '#D69E2E', bg: '#FFFFF0', border: '#D69E2E44' },
  transform: { text: '#2B6CB0', bg: '#EBF8FF', border: '#2B6CB044' },
  output:    { text: '#276749', bg: '#F0FFF4', border: '#27674944' },
};

/**
 * Determine n8n node type from app node layer and n8nNodeKey
 */
export function getN8nNodeType(layer: string, n8nKey: string): N8nNodeType {
  if (layer === 'input') return 'trigger';
  if (['claudeAi', 'openAi'].includes(n8nKey)) return 'ai';
  if (['if', 'filter'].includes(n8nKey)) return 'condition';
  if (['set', 'code', 'merge', 'splitInBatches'].includes(n8nKey)) return 'transform';
  if (layer === 'output') return 'output';
  return 'action';
}