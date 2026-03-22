export interface ToolContext {
  config: any;
  incomingData: any;
  ctx: any;
  job: any;
  userId: string;
  credentials?: any;
  render: (str: string) => string;
  logNodeStatus: (id: string, status: 'pending' | 'running' | 'completed' | 'failed', result?: any) => Promise<void>;
}

export type ToolHandler = (context: ToolContext) => Promise<any>;
