export type SocketType =
  | 'data'
  | 'string'
  | 'json'
  | 'boolean'
  | 'any'
  | 'model'
  | 'memory'
  | 'tool'
  | 'parser';

export type SocketPosition = 'left' | 'right' | 'top' | 'bottom';

export interface NodeSocket {
  name: string;
  type: SocketType;
  position?: SocketPosition;
  color?: string;
  label?: string;
  required?: boolean;
}

export type ConfigFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'credential'
  | 'boolean'
  | 'password'
  | 'notice'
  | 'filter'
  | 'chat_test'
  | 'color'
  | 'hidden';

export interface ConfigField {
  key: string;
  label: string;
  type: ConfigFieldType;
  options?: string[] | { label: string; value: string }[];
  placeholder?: string;
  default?: unknown;
  displayOptions?: unknown;
  dynamicProvider?: string;
  dynamicResource?: string;
}

export type NodeCategory =
  | 'Triggers'
  | 'AI'
  | 'Models'
  | 'Tools'
  | 'Logic'
  | 'Data'
  | 'Databases'
  | 'Output'
  | 'Core';

export type InputType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any' | 'json';

export interface NodeInput {
  key: string;
  label: string;
  type: InputType;
  required: boolean;
  description: string;
  example?: any;
  default?: any;
  placeholder?: string;
  dynamicProvider?: string;
  dynamicResource?: string;
}

export interface NodeOutput {
  key: string;
  type: InputType;
  description?: string;
  example?: any;
}

export interface NodeDefinition {
  id: string;
  label: string;
  name: string;
  category: NodeCategory;
  description: string;
  /**
   * Either a Lucide icon name (e.g. 'Bot', 'Database') that the frontend
   * resolves to a React component, or an SVG path string
   * (e.g. '/iconSvg/google-gmail.svg').
   */
  icon: string;
  color: string;
  bg: string;
  border: string;
  isTrigger: boolean;
  variant?: 'agent' | 'connector' | 'trigger';
  executionKey: string;
  inputs: NodeSocket[];
  outputs: NodeSocket[];
  configFields: ConfigField[];
  resourceFields?: Record<string, ConfigField[]>;
  operationFields?: Record<string, ConfigField[]>;
  credentialTypes?: string[];
  runtime?: { timeout: number; retry: number };
  usableAsTool?: boolean;

  // NEW: Input data contract — what this node expects from upstream (generic)
  requiredInputs?: NodeInput[];

  // NEW: Operation-specific input requirements
  // e.g. { send: [...], reply: [...], search: [...] }
  // Maps operation name to its specific required inputs
  operationInputs?: Record<string, NodeInput[]>;

  // NEW: Operation-specific output definitions
  // e.g. { send: [...outputs...], search: [...outputs...] }
  // Maps operation name to what data it produces
  operationOutputs?: Record<string, NodeOutput[]>;

  // NEW: Output data contract — what this node produces
  outputSchema?: NodeOutput[];
}

export interface ToolContext {
  config: any;
  incomingData: any;
  ctx: any;
  job: any;
  userId: string;
  credentials?: any;
  render: (str: string) => string;
  logNodeStatus: (id: string, status: 'pending' | 'running' | 'completed' | 'failed', result?: any) => Promise<void>;
  
  // Identifying info
  nodeId?: string;
  execKey?: string;
  label?: string;

  // Registry access
  handlers?: Record<string, ToolHandler>;
  resolveCredential?: (id: string, userId: string) => Promise<any>;
  resolveDefaultCredential?: (types: string[], userId: string) => Promise<any>;
}

export type ToolHandler = (context: ToolContext) => Promise<any>;
