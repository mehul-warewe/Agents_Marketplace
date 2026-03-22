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
  | 'chat_test';

export interface ConfigField {
  key: string;
  label: string;
  type: ConfigFieldType;
  options?: string[] | { label: string; value: string }[];
  placeholder?: string;
  default?: unknown;
  displayOptions?: unknown;
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
}
