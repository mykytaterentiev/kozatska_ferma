export interface TraceStep {
  step_number?: number;
  type?: string;
  tool_name?: string;
  title?: string;
  status?: string;
  latency_ms?: number;
  summary?: string;
  agent?: string;
  action?: string;
  function_call?: string;
  highlight?: boolean;
  badge?: string;
  input_args?: Record<string, any>;
  output?: Record<string, any>;
  details?: Record<string, any>;
}

export interface TraceLog {
  user_id: string;
  order_id: number;
  user_prompt: string;
  agent_response: string;
  total_latency_ms: number;
  steps: TraceStep[];
}

export interface AgentTraceRecord {
  id: number;
  order_id?: number;
  agent_flow?: 'b2c' | 'a2a' | 'marketing';
  timestamp?: string;
  latency_ms: number;
  trace_log: TraceLog;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  orderId?: number;
  refunded?: boolean;
  voucher?: string;
  traceId?: number;
}
