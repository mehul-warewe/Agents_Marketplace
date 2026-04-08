export const CREDENTIAL_SCHEMAS: Record<string, {
  label: string;
  icon: string;
  helpUrl?: string;
  fields: { key: string; label: string; type: string; placeholder?: string }[];
}> = {
  openai_api_key: {
    label: 'OpenAI API Key',
    icon: 'openai',
    helpUrl: 'https://platform.openai.com/api-keys',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-...' },
    ],
  },
  google_api_key: {
    label: 'Google AI (Gemini) Key',
    icon: 'gemini',
    helpUrl: 'https://aistudio.google.com/app/apikey',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'AIza...' },
    ],
  },
  anthropic_api_key: {
    label: 'Anthropic (Claude) Key',
    icon: 'claude',
    helpUrl: 'https://console.anthropic.com/settings/keys',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-ant-...' },
    ],
  },
  openrouter_api_key: {
    label: 'OpenRouter Key',
    icon: 'openrouter',
    helpUrl: 'https://openrouter.ai/keys',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-or-...' },
    ],
  },
  slack_webhook: {
    label: 'Slack (Webhook)',
    icon: 'slack',
    helpUrl: 'https://api.slack.com/messaging/webhooks',
    fields: [
      { key: 'webhookUrl', label: 'Incoming Webhook URL', type: 'password', placeholder: 'https://hooks.slack.com/services/...' },
    ],
  },
  slack_oauth: {
    label: 'Slack (OAuth / Bot Token)',
    icon: 'slack',
    fields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...' },
      { key: 'teamId',   label: 'Team ID (optional)', type: 'text', placeholder: 'T01234' },
    ],
  },
  smtp_email: {
    label: 'Email (SMTP)',
    icon: 'mail',
    fields: [
      { key: 'host',     label: 'SMTP Host',  type: 'text',     placeholder: 'smtp.gmail.com' },
      { key: 'port',     label: 'Port',        type: 'text',     placeholder: '587' },
      { key: 'user',     label: 'Username',    type: 'text',     placeholder: 'you@gmail.com' },
      { key: 'password', label: 'Password / App Password', type: 'password', placeholder: '' },
      { key: 'from',     label: 'From Address', type: 'text',   placeholder: 'you@gmail.com' },
    ],
  },
  google_oauth: {
    label: 'Google (OAuth)',
    icon: 'google',
    fields: [],
  },
  google_gmail_oauth: {
    label: 'Gmail (OAuth)',
    icon: 'google_gmail',
    fields: [],
  },
  google_calendar_oauth: {
    label: 'Google Calendar (OAuth)',
    icon: 'google_calendar',
    fields: [],
  },
  google_drive_oauth: {
    label: 'Google Drive (OAuth)',
    icon: 'google_drive',
    fields: [],
  },
  google_sheets_oauth: {
    label: 'Google Sheets (OAuth)',
    icon: 'google_sheets',
    fields: [],
  },
  http_bearer: {
    label: 'HTTP (Bearer Token)',
    icon: 'link',
    fields: [
      { key: 'baseUrl', label: 'Base URL',     type: 'text',     placeholder: 'https://api.example.com' },
      { key: 'token',   label: 'Bearer Token', type: 'password', placeholder: 'eyJhbG...' },
    ],
  },
  http_basic: {
    label: 'HTTP (Basic Auth)',
    icon: 'link',
    fields: [
      { key: 'baseUrl',  label: 'Base URL',  type: 'text',     placeholder: 'https://api.example.com' },
      { key: 'username', label: 'Username',  type: 'text',     placeholder: '' },
      { key: 'password', label: 'Password',  type: 'password', placeholder: '' },
    ],
  },
  webhook_relay: {
    label: 'Webhook URL',
    icon: 'webhook',
    fields: [
      { key: 'url',    label: 'Webhook URL', type: 'text',     placeholder: 'https://hooks.example.com/...' },
      { key: 'secret', label: 'Secret (optional)', type: 'password', placeholder: '' },
    ],
  },
  mongodb_atlas: {
    label: 'MongoDB Atlas',
    icon: 'mongodb_atlas',
    fields: [
      { key: 'connectionString', label: 'Connection String', type: 'password', placeholder: 'mongodb+srv://user:pass@cluster.mongodb.net/dbname' },
      { key: 'database', label: 'Database Name', type: 'text', placeholder: 'myDatabase' },
    ],
  },
  redis: {
    label: 'Redis',
    icon: 'redis',
    fields: [
      { key: 'url', label: 'Redis URL', type: 'password', placeholder: 'redis://default:password@host:port' },
    ],
  },
  github_pat: {
    label: 'GitHub (Personal Access Token)',
    icon: 'github',
    helpUrl: 'https://github.com/settings/tokens/new',
    fields: [
      { key: 'accessToken', label: 'Personal Access Token', type: 'password', placeholder: 'ghp_...' },
    ],
  },
  linear_api_key: {
    label: 'Linear (API Key)',
    icon: 'linear',
    helpUrl: 'https://linear.app/settings/api',
    fields: [
      { key: 'apiKey', label: 'Personal API Key', type: 'password', placeholder: 'lin_api_...' },
    ],
  },
  supabase_service_role: {
    label: 'Supabase (Service Role Key)',
    icon: 'supabase',
    helpUrl: 'https://supabase.com/dashboard/project/_/settings/api',
    fields: [
      { key: 'serviceRoleKey', label: 'Service Role Key', type: 'password', placeholder: 'eyJh...' },
      { key: 'supabaseUrl', label: 'Supabase URL', type: 'text', placeholder: 'https://your-project.supabase.co' },
    ],
  },
};

export const getSchema = (type: string) => CREDENTIAL_SCHEMAS[type];
