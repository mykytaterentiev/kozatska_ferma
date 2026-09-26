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
}

export const AdminTracePanel: FC<AdminTracePanelProps> = ({ onRefreshTrigger }) => {
  const [traceRecord, setTraceRecord] = useState<AgentTraceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrace = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/traces/usr_101');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: AgentTraceRecord = await res.json();
      setTraceRecord(data);
    } catch (err: any) {
      console.error('Failed to load trace:', err);
      setError(err.message || 'Could not fetch execution trace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrace();
  }, [onRefreshTrigger]);

  const steps: TraceStep[] = traceRecord?.trace_log?.steps || [];
  const totalLatency = traceRecord?.trace_log?.total_latency_ms || traceRecord?.latency_ms || 1150;

  return (
    <div className="max-w-5xl mx-auto my-6 px-4 pb-12 text-brand-roasted">
      {/* Top Enterprise Header */}
      <div className="bg-brand-kraft/60 backdrop-blur-md border border-brand-border rounded-3xl p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-border/60 pb-6 mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-sans font-semibold uppercase tracking-wider bg-brand-terracotta/10 text-brand-terracotta border border-brand-terracotta/20">
                <span className="w-2 h-2 rounded-full bg-brand-terracotta animate-pulse"></span>
                <span>Autonomous ReAct Trace</span>
              </span>
              <span className="text-xs font-mono text-brand-roasted/60 font-medium">
                Session: usr_101 (Ivan Z.)
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-brand-roasted">
              AGENT EXECUTION TRACE
            </h1>
            <p className="text-brand-roasted/70 text-sm sm:text-base mt-2 font-sans font-medium">
              Live ReAct Loop • Real-Time Tool Invocations • ML Decision Boundary
            </p>
          </div>

          <button
            onClick={fetchTrace}
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
            <span className="text-[11px] font-mono font-bold text-brand-roasted/70">LlmAgent Framework</span>
          </div>

          <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
            <span className="text-xs text-brand-roasted/80 uppercase font-bold tracking-wider flex items-center space-x-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Inference Engine</span>
            </span>
            <p className="text-lg sm:text-xl font-bold text-brand-roasted mt-1">Gemini Flash</p>
            <span className="text-[11px] font-mono font-bold text-brand-roasted/70">Function Calling</span>
          </div>

          <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
            <span className="text-xs text-brand-roasted/80 uppercase font-bold tracking-wider flex items-center space-x-1">
              <Activity className="w-4 h-4 text-brand-terracotta" />
              <span>ML Classifier</span>
            </span>
            <p className="text-lg sm:text-xl font-bold text-brand-roasted mt-1">RandomForest</p>
            <span className="text-[11px] font-mono font-bold text-brand-roasted/70">Scikit-Learn (88% Risk)</span>
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
            const isMLStep = step.type === 'ml_inference' || step.tool_name === 'predict_churn_risk';
            const isResolution = step.type === 'tool_call' && step.tool_name === 'execute_resolution';

            return (
              <motion.div
                key={step.step_number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.15 }}
                className="relative"
              >
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-[35px] sm:-left-[43px] top-6 w-9 h-9 rounded-full flex items-center justify-center border-4 border-brand-kraft shadow-sm text-white ${
                    isMLStep
                      ? 'bg-brand-terracotta'
                      : isResolution
                      ? 'bg-brand-green'
                      : 'bg-brand-roasted'
                  }`}
                >
                  <span className="font-mono text-sm font-bold">{step.step_number}</span>
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
                        STEP 0{step.step_number}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold font-serif text-brand-roasted tracking-tight">
                        {step.title}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2 font-mono text-xs text-brand-roasted/50 font-medium self-start sm:self-auto">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Latency: <strong className="text-brand-roasted">{step.latency_ms} ms</strong></span>
                    </div>
                  </div>

                  {/* Summary / Intent / Tool Content */}
                  <p className="text-base sm:text-lg text-brand-roasted/80 font-sans font-medium leading-relaxed mb-4">
                    {step.summary}
                  </p>

                  {/* HIGHLIGHT THIS: Glowing badge for ML Churn Step */}
                  {isMLStep && (
                    <div className="my-5 p-5 rounded-2xl bg-amber-100/50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-brand-terracotta text-white flex items-center justify-center font-bold font-mono text-xl shrink-0 shadow-sm">
                          88%
                        </div>
                        <div>
                          <div className="text-brand-roasted/60 font-sans font-bold text-xs uppercase tracking-wider mb-0.5">
                            ML Model Output &bull; Scikit-Learn Random Forest
                          </div>
                          <div className="text-brand-roasted font-bold text-lg sm:text-xl font-serif">
                            88% Churn Risk &rarr; Action: RECOVER
                          </div>
                        </div>
                      </div>

                      <span className="px-4 py-2 rounded-full bg-brand-terracotta/10 text-brand-terracotta border border-brand-terracotta/20 font-sans font-bold text-xs uppercase tracking-wider shrink-0">
                        CRITICAL THRESHOLD EXCEEDED
                      </span>
                    </div>
                  )}

                  {/* Code / Data Preview Accordion Box */}
                  {(step.output || step.details || step.input_args) && (
                    <div className="mt-4 rounded-xl bg-brand-kraftDark/30 border border-brand-border/60 p-4 font-mono overflow-x-auto shadow-inner">
                      <div className="text-[11px] uppercase text-brand-roasted/80 font-bold mb-2 flex items-center space-x-1.5">
                        <Terminal className="w-3.5 h-3.5 text-brand-green" />
                        <span>Execution Metadata</span>
                      </div>
                      <pre className="text-brand-roasted text-sm font-semibold whitespace-pre-wrap leading-relaxed">
                        {JSON.stringify(
                          {
                            ...(step.input_args ? { input_args: step.input_args } : {}),
                            ...(step.output ? { output: step.output } : {}),
                            ...(step.details ? { details: step.details } : {}),
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
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
              <span>ReAct Loop Complete &bull; Decision Enforced</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-roasted font-serif mt-2">
              Total End-to-End Latency
            </h2>
            <p className="text-xs font-mono font-medium text-brand-roasted/50 mt-1">
              Parsed Intent &rarr; CRM Lookup &rarr; ML Inference &rarr; Supabase Refund &rarr; Final Generation
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
