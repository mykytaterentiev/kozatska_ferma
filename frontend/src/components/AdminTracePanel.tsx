import { useEffect, useState, FC } from 'react';
import { motion } from 'framer-motion';
import {
  Terminal,
  Activity,
  CheckCircle2,
  Clock,
  Database,
  Cpu,
  RefreshCw,
  Zap,
  AlertCircle
} from 'lucide-react';
import { AgentTraceRecord, TraceStep } from '../types';

interface AdminTracePanelProps {
  onRefreshTrigger?: number;
  activeCustomerId?: string;
}

export const AdminTracePanel: FC<AdminTracePanelProps> = ({ onRefreshTrigger = 0, activeCustomerId = 'usr_101' }) => {
  const [traceRecord, setTraceRecord] = useState<AgentTraceRecord | null>(null);
  const [traceList, setTraceList] = useState<{id: number, order_id?: number, user_id?: string, agent_flow?: string, created_at: string}[]>([]);
  const [selectedTraceId, setSelectedTraceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTraceList = async () => {
    try {
      const res = await fetch('/api/traces/list');
      if (res.ok) {
        const data = await res.json();
        setTraceList(data);
      }
    } catch (err) {
      console.error('Failed to load trace list:', err);
    }
  };

  const fetchTrace = async (traceId?: number) => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/traces/${activeCustomerId}`;
      if (traceId) url += `?trace_id=${traceId}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: AgentTraceRecord = await res.json();
      setTraceRecord(data);
      if (data.id) setSelectedTraceId(data.id);
    } catch (err: any) {
      console.error('Failed to load trace:', err);
      setError(err.message || 'Could not fetch execution trace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraceList();
    fetchTrace(selectedTraceId);
  }, [onRefreshTrigger]);

  const steps: TraceStep[] = traceRecord?.trace_log?.steps || [];
  const totalLatency = traceRecord?.trace_log?.total_latency_ms || traceRecord?.latency_ms || 1150;
  const agentFlow = traceRecord?.agent_flow || 'b2c';

  return (
    <div className="max-w-5xl mx-auto my-6 px-4 pb-12 text-brand-roasted">
      {/* Top Enterprise Header */}
      <div className="bg-brand-kraft/60 backdrop-blur-md border border-brand-border rounded-3xl p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-border/60 pb-6 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-sans font-semibold uppercase tracking-wider bg-brand-terracotta/10 text-brand-terracotta border border-brand-terracotta/20">
                <span className="w-2 h-2 rounded-full bg-brand-terracotta animate-pulse"></span>
                <span>
                  {agentFlow === 'marketing' ? 'LoopAgent Workflow' : 
                   agentFlow === 'a2a' ? 'A2A Real-Time Stream' : 
                   'Autonomous ReAct Trace'}
                </span>
              </span>
              
              {/* Dropdown for Historical Runs */}
              <select 
                value={selectedTraceId || ''} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    const id = parseInt(val, 10);
                    setSelectedTraceId(id);
                    fetchTrace(id);
                  }
                }}
                className="text-xs font-mono bg-white border border-brand-border text-brand-roasted rounded-lg px-2 py-1 focus:ring-1 focus:ring-brand-roasted focus:outline-none cursor-pointer"
              >
                <option value="" disabled>Select historical run...</option>
                {traceList.map(t => {
                  const flowLabel = t.agent_flow === 'marketing' ? 'Marketing' : t.agent_flow === 'a2a' ? 'A2A' : 'B2C';
                  const userIdLabel = t.user_id ? ` • ${t.user_id}` : '';
                  return (
                    <option key={t.id} value={t.id}>
                      Run #{t.id} [{flowLabel}]{userIdLabel} • {new Date(t.created_at).toLocaleTimeString()}
                    </option>
                  );
                })}
              </select>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-brand-roasted">
              AGENT EXECUTION TRACE
            </h1>
            <p className="text-brand-roasted/70 text-sm sm:text-base mt-2 font-sans font-medium">
              {agentFlow === 'marketing' ? 'Web Search • ReAct Loop • Market Assessment' : 
               agentFlow === 'a2a' ? 'Storefront vs Consumer • Live Negotiation' : 
               'Live ReAct Loop • Real-Time Tool Invocations • ML Decision Boundary'}
            </p>
          </div>

          <button
            onClick={() => {
                fetchTraceList();
                fetchTrace();
            }}
            disabled={loading}
            className="self-start md:self-auto flex items-center space-x-2 px-5 py-2.5 rounded-full bg-brand-roasted hover:bg-brand-roasted/90 text-white font-sans font-semibold text-sm transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Fetch Latest Trace</span>
          </button>
        </div>

        {/* High-Level Architecture Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-sans">
          <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
            <span className="text-xs text-brand-roasted/80 uppercase font-bold tracking-wider flex items-center space-x-1">
              <Cpu className="w-4 h-4 text-brand-green" />
              <span>Orchestrator</span>
            </span>
            <p className="text-lg sm:text-xl font-bold text-brand-roasted mt-1">Google ADK</p>
            <span className="text-[11px] font-mono font-bold text-brand-roasted/70">
              {agentFlow === 'marketing' ? 'SequentialAgent' : 'LlmAgent Framework'}
            </span>
          </div>

          <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
            <span className="text-xs text-brand-roasted/80 uppercase font-bold tracking-wider flex items-center space-x-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Inference Engine</span>
            </span>
            <p className="text-lg sm:text-xl font-bold text-brand-roasted mt-1">
              {agentFlow === 'marketing' ? 'Gemini 3.1 Flash' : 'Gemini Flash'}
            </p>
            <span className="text-[11px] font-mono font-bold text-brand-roasted/70">Function Calling</span>
          </div>

          <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
            <span className="text-xs text-brand-roasted/80 uppercase font-bold tracking-wider flex items-center space-x-1">
              <Activity className="w-4 h-4 text-brand-terracotta" />
              <span>{agentFlow === 'marketing' ? 'Data Source' : agentFlow === 'a2a' ? 'Constraint' : 'ML Classifier'}</span>
            </span>
            <p className="text-lg sm:text-xl font-bold text-brand-roasted mt-1">
              {agentFlow === 'marketing' ? 'DuckDuckGo API' : agentFlow === 'a2a' ? 'Strict Persona' : 'RandomForest'}
            </p>
            <span className="text-[11px] font-mono font-bold text-brand-roasted/70">
              {agentFlow === 'marketing' ? 'Live Web Search' : agentFlow === 'a2a' ? 'Store vs Consumer' : 'Scikit-Learn (88% Risk)'}
            </span>
          </div>

          <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
            <span className="text-xs text-brand-roasted/80 uppercase font-bold tracking-wider flex items-center space-x-1">
              <Database className="w-4 h-4 text-blue-500" />
              <span>Data Store</span>
            </span>
            <p className="text-lg sm:text-xl font-bold text-brand-roasted mt-1">Supabase</p>
            <span className="text-[11px] font-mono font-bold text-brand-roasted/70">PostgreSQL + JSONB</span>
          </div>
        </div>
      </div>

      {/* Main Execution Timeline */}
      <div className="relative pl-6 sm:pl-10 space-y-8 before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-[1px] before:bg-brand-border">
        {loading && steps.length === 0 ? (
          <div className="bg-brand-kraftDark/20 border border-brand-border rounded-2xl p-8 text-center text-brand-roasted/70 font-sans font-medium">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-roasted/50 mb-2" />
            <p>Loading agent execution trace from Supabase...</p>
          </div>
        ) : error ? (
          <div className="bg-brand-terracotta/10 border border-brand-terracotta/30 rounded-2xl p-6 text-brand-terracotta font-sans font-medium flex items-center space-x-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : (
          steps.map((step, index) => {
            const isMLStep = agentFlow === 'b2c' && (step.type === 'ml_inference' || step.tool_name === 'predict_churn_risk' || step.tool_name === 'ml_risk_agent');
            const isResolution = step.type === 'tool_call' && step.tool_name === 'execute_resolution';
            const isMarketingSearch = agentFlow === 'marketing' && step.tool_name === 'search_web';

            let mlProb = 0.88;
            let mlAction = 'RECOVER';
            if (isMLStep && step.output) {
              if (step.output.churn_prob !== undefined) {
                mlProb = step.output.churn_prob;
                mlAction = step.output.action || 'RECOVER';
              } else if (typeof step.output.result === 'string') {
                const probMatch = step.output.result.match(/Churn Probability:\s*(\d+)%/i);
                if (probMatch) mlProb = parseInt(probMatch[1], 10) / 100;
                
                const actionMatch = step.output.result.match(/Recommended Action:\s*([A-Z_]+)/i) || step.output.result.match(/Action:\s*([A-Z_]+)/i);
                if (actionMatch) mlAction = actionMatch[1];
              }
            }

            return (
              <motion.div
                key={step.step_number || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.15 }}
                className="relative"
              >
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-[35px] sm:-left-[43px] top-6 w-9 h-9 rounded-full flex items-center justify-center border-4 border-brand-kraft shadow-sm text-white ${
                    isMLStep ? 'bg-brand-terracotta' : 
                    isMarketingSearch ? 'bg-blue-500' :
                    isResolution ? 'bg-brand-green' : 
                    'bg-brand-roasted'
                  }`}
                >
                  <span className="font-mono text-sm font-bold">{step.step_number || index + 1}</span>
                </div>

                {/* Step Card */}
                <div
                  className={`rounded-3xl p-6 sm:p-7 border transition-all duration-300 shadow-sm ${
                    isMLStep
                      ? 'bg-amber-50/50 border-amber-200/60 ring-1 ring-amber-500/20'
                      : 'bg-white border-brand-border/60 hover:border-brand-border'
                  }`}
                >
                  {/* Step Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-sans font-bold tracking-wider uppercase bg-brand-roasted/5 text-brand-roasted/70 border border-brand-roasted/10">
                        {agentFlow === 'a2a' && step.agent ? `AGENT: ${step.agent}` : `STEP 0${step.step_number || index + 1}`}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold font-serif text-brand-roasted tracking-tight">
                        {step.title || (agentFlow === 'a2a' ? 'Negotiation Turn' : 'Execution Step')}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2 font-mono text-xs text-brand-roasted/50 font-medium self-start sm:self-auto">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Latency: <strong className="text-brand-roasted">{step.latency_ms || '< 50'} ms</strong></span>
                    </div>
                  </div>

                  {/* Summary / Intent / Tool Content */}
                  <p className="text-base sm:text-lg text-brand-roasted/80 font-sans font-medium leading-relaxed mb-4">
                    {step.summary || step.action || ''}
                  </p>

                  {/* HIGHLIGHT THIS: Glowing badge for ML Churn Step (B2C Only) */}
                  {isMLStep && (
                    <div className={`my-5 p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm ${
                      mlProb > 0.6 
                        ? 'bg-amber-100/50 border-amber-200' 
                        : mlProb < 0.3 
                          ? 'bg-emerald-50/50 border-emerald-200' 
                          : 'bg-yellow-50/50 border-yellow-200'
                    }`}>
                      <div className="flex items-center space-x-4">
                        <div className={`h-12 w-12 rounded-full text-white flex items-center justify-center font-bold font-mono text-lg shrink-0 shadow-sm ${
                          mlProb > 0.6 
                            ? 'bg-brand-terracotta' 
                            : mlProb < 0.3 
                              ? 'bg-brand-green' 
                              : 'bg-yellow-600'
                        }`}>
                          {Math.round(mlProb * 100)}%
                        </div>
                        <div>
                          <div className="text-brand-roasted/60 font-sans font-bold text-xs uppercase tracking-wider mb-0.5">
                            ML Model Output &bull; Scikit-Learn Random Forest
                          </div>
                          <div className="text-brand-roasted font-bold text-lg sm:text-xl font-serif">
                            {Math.round(mlProb * 100)}% Churn Risk &rarr; Action: {mlAction.substring(0, 15).toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <span className={`px-4 py-2 rounded-full border font-sans font-bold text-xs uppercase tracking-wider shrink-0 ${
                        mlProb > 0.6 
                          ? 'bg-brand-terracotta/10 text-brand-terracotta border-brand-terracotta/20' 
                          : mlProb < 0.3 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                      }`}>
                        {mlProb > 0.6 
                          ? 'CRITICAL THRESHOLD EXCEEDED' 
                          : mlProb < 0.3 
                            ? 'LOW RISK DETECTED' 
                            : 'VIP STATUS'}
                      </span>
                    </div>
                  )}

                  {/* Code / Data Preview Accordion Box */}
                  {(() => {
                    const metadata = {
                      ...(step.function_call ? { function_call: step.function_call } : {}),
                      ...(step.input_args && Object.keys(step.input_args).length > 0 ? { input_args: step.input_args } : {}),
                      ...(step.output && Object.keys(step.output).length > 0 ? { output: step.output } : {}),
                      ...(step.details && Object.keys(step.details).length > 0 ? { details: step.details } : {}),
                    };
                    
                    if (Object.keys(metadata).length === 0) return null;

                    return (
                      <div className="mt-4 rounded-xl bg-brand-kraftDark/30 border border-brand-border/60 p-4 font-mono overflow-x-auto shadow-inner">
                        <div className="text-[11px] uppercase text-brand-roasted/80 font-bold mb-2 flex items-center space-x-1.5">
                          <Terminal className="w-3.5 h-3.5 text-brand-green" />
                          <span>{agentFlow === 'a2a' ? 'Agent Action' : 'Execution Metadata'}</span>
                        </div>
                        <pre className="text-brand-roasted text-sm font-semibold whitespace-pre-wrap leading-relaxed">
                          {JSON.stringify(metadata, null, 2)}
                        </pre>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Massive Projector-Ready Bottom Latency Summary Bar */}
      <div className="relative pl-6 sm:pl-10">
        <div className="mt-8 bg-white border border-brand-border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative">
          {/* Connector to timeline */}
          <div className="absolute -left-[35px] sm:-left-[43px] top-1/2 -translate-y-1/2 w-4 h-[1px] bg-brand-border hidden sm:block"></div>
          
          <div>
            <span className="text-xs font-sans font-bold uppercase tracking-widest text-brand-green flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-brand-green" />
              <span>{agentFlow === 'marketing' ? 'Loop Completed &bull; Content Generated' : agentFlow === 'a2a' ? 'Negotiation Concluded &bull; Order Finalized' : 'ReAct Loop Complete &bull; Decision Enforced'}</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-roasted font-serif mt-2">
              Total End-to-End Latency
            </h2>
            <p className="text-xs font-mono font-medium text-brand-roasted/50 mt-1">
              {agentFlow === 'marketing' ? 'Agent Search → Loop Assessment → Final Generation' : 
               agentFlow === 'a2a' ? 'Storefront Generation → Routing → Consumer Generation' :
               'Parsed Intent → CRM Lookup → ML Inference → Supabase Refund → Final Generation'}
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-brand-kraftDark/20 border border-brand-border px-6 py-4 rounded-2xl shadow-inner shrink-0">
            <Clock className="w-8 h-8 text-brand-terracotta" />
            <div>
              <div className="text-4xl sm:text-5xl font-black font-mono text-brand-roasted tracking-tight">
                {totalLatency} <span className="text-2xl font-bold text-brand-terracotta">ms</span>
              </div>
              <span className="text-[10px] font-sans font-bold text-brand-roasted/50 uppercase tracking-wider">
                High-Speed Autonomous Cycle
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
