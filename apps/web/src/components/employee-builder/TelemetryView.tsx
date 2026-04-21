'use client';

import React from 'react';
import { Activity, CheckCircle, XCircle, Clock, ChevronRight, Brain, Zap, Terminal, X, Download, Eye, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TelemetryStep {
  type: string;
  timestamp: string;
  thought?: string;
  action?: string;
  observation?: string;
}

interface RunRecord {
  id: string;
  status: string;
  startTime: string;
  endTime?: string;
  skillName?: string;
  inputData?: any;
  steps?: TelemetryStep[];
  output?: any;
}

export function TelemetryView({ runs, onSelect }: { runs: RunRecord[], onSelect: (run: RunRecord) => void }) {
  const handleExportActivity = () => {
    const json = JSON.stringify(runs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-runs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!runs || runs.length === 0) {
    return (
      <div className="w-full py-32 flex flex-col items-center justify-center bg-card/30 rounded-[3rem] border-2 border-border/40 border-dashed text-center">
        <div className="w-20 h-20 bg-foreground/[0.03] rounded-[2rem] flex items-center justify-center text-muted/20 mb-10 border border-border/40">
           <Activity size={32} />
        </div>
        <h3 className="text-2xl font-bold tracking-tight mb-4 leading-none">Activity Feed</h3>
        <p className="text-muted max-w-xs mx-auto text-xs font-medium leading-relaxed opacity-60">
          Waiting for the first execution. Start a task to capture live performance data.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-[2.5rem] border border-border/60 overflow-hidden shadow-xl">
      <div className="p-6 border-b border-border/40 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Execution History</h3>
        <button
          onClick={handleExportActivity}
          className="flex items-center gap-2 px-4 py-2 bg-foreground/5 hover:bg-foreground/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
        >
          <Download size={14} /> Export Activity
        </button>
      </div>
      <div className="divide-y divide-border/20">
        {runs.map((run) => (
          <div key={run.id} className="p-8 flex items-center justify-between hover:bg-foreground/[0.01] transition-all group">
            <div className="flex items-center gap-8">
              <div className={`p-4 rounded-xl ${
                run.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                run.status === 'failed' ? 'bg-red-500/10 text-red-500' : 
                'bg-primary/10 text-primary animate-pulse'
              }`}>
                <Activity size={20} strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <span className="font-bold tracking-tight text-sm">Task Execution {run.id.slice(0, 8)}</span>
                  {run.skillName && (
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg border border-primary/20">{run.skillName}</span>
                  )}
                </div>
                <div className="text-[10px] font-medium text-muted/60 uppercase tracking-wider">
                  Started: {new Date(run.startTime).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-10">
              <div className={`flex items-center gap-2 px-5 py-1.5 rounded-full border ${
                run.status === 'completed' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' : 
                run.status === 'failed' ? 'bg-red-500/5 text-red-500 border-red-500/20' : 
                'bg-primary/5 text-primary border-primary/20'
              } text-[10px] font-bold capitalize`}>
                {run.status === 'completed' ? <CheckCircle size={12} strokeWidth={3} /> : 
                 run.status === 'failed' ? <XCircle size={12} strokeWidth={3} /> : 
                 <Clock size={12} strokeWidth={3} className="animate-spin" />}
                {run.status}
              </div>
              <button 
                onClick={() => onSelect(run)} 
                className="flex items-center gap-2 p-3 text-muted hover:text-foreground transition-all hover:bg-foreground/5 rounded-xl text-[11px] font-bold opacity-40 hover:opacity-100"
              >
                View details <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RunDetailsModal({ run, onClose }: { run: RunRecord, onClose: () => void }) {
  const [expandedObservations, setExpandedObservations] = React.useState<Record<number, boolean>>({});

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'thought':
        return <Brain size={12} className="text-indigo-500" />;
      case 'observation':
        return <Eye size={12} className="text-amber-500" />;
      case 'final':
        return <CheckCircle size={12} className="text-emerald-500" />;
      case 'error':
        return <AlertCircle size={12} className="text-red-500" />;
      default:
        return <Activity size={12} className="text-primary" />;
    }
  };

  const getStepColor = (type: string) => {
    switch (type) {
      case 'thought':
        return 'border-indigo-500/20 bg-indigo-500/5 text-indigo-500';
      case 'observation':
        return 'border-amber-500/20 bg-amber-500/5 text-amber-500';
      case 'final':
        return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500';
      case 'error':
        return 'border-red-500/20 bg-red-500/5 text-red-500';
      default:
        return 'border-primary/20 bg-primary/5 text-primary';
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-end p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/90" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="relative w-full max-w-2xl h-full bg-card border-l border-border shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 border-b border-border/40 flex justify-between items-center bg-foreground/[0.02]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-widest">
              <Activity size={14} /> Activity Trace
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Execution details: {run.id.slice(0, 12)}</h3>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-foreground/5 rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 no-scrollbar">
          {/* Input Data */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
              <Terminal size={12} /> Task input
            </h4>
            <div className="bg-background/50 border border-border/40 rounded-2xl p-6 font-medium text-sm leading-relaxed text-foreground/80">
              {run.inputData?.task || 'No input provided'}
            </div>
          </div>

          {/* Reasoning Steps */}
          <div className="space-y-6">
            <h4 className="text-xs font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
              <Brain size={12} /> Agent reasoning process
            </h4>
            <div className="space-y-4">
              {run.steps?.map((step, idx) => (
                <div key={idx} className={`border rounded-2xl p-6 space-y-3 ${getStepColor(step.type)}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {getStepIcon(step.type)}
                      <span className="text-[10px] font-bold uppercase tracking-wider">{step.type}</span>
                    </div>
                    <span className="text-[9px] text-current opacity-60">{new Date(step.timestamp).toLocaleTimeString()}</span>
                  </div>

                  {step.thought && (
                    <p className="text-sm font-medium leading-relaxed text-foreground/90">"{step.thought}"</p>
                  )}

                  {step.action && (
                    <div className="flex items-center gap-3 px-3 py-2 bg-background/50 border border-current/20 rounded-xl text-[10px] font-bold">
                      <Zap size={12} /> Skill: {step.action}
                    </div>
                  )}

                  {step.observation && (
                    <div className="space-y-2">
                      <button
                        onClick={() => setExpandedObservations({ ...expandedObservations, [idx]: !expandedObservations[idx] })}
                        className="flex items-center gap-2 text-[10px] font-bold hover:opacity-80 transition-all"
                      >
                        <Eye size={10} /> Tool Result {expandedObservations[idx] ? '▼' : '▶'}
                      </button>
                      {expandedObservations[idx] && (
                        <pre className="p-4 bg-background/50 rounded-xl border border-current/10 text-[10px] font-medium overflow-x-auto custom-scrollbar no-scrollbar whitespace-pre-wrap max-h-48">
                          {step.observation}
                        </pre>
                      )}
                      {!expandedObservations[idx] && (
                        <p className="text-[10px] text-foreground/60 line-clamp-2 italic">
                          {typeof step.observation === 'string' ? step.observation.slice(0, 100) : JSON.stringify(step.observation).slice(0, 100)}...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {(!run.steps || run.steps.length === 0) && (
                <div className="text-center py-10 opacity-30 italic text-sm">No steps recorded for this sequence.</div>
              )}
            </div>
          </div>

          {/* Final Result */}
          {run.status === 'completed' && (run.output?.data || run.output) && (
            <div className="space-y-4 pt-8 border-t border-emerald-500/20 pb-12">
              <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle size={12} /> Final Output
              </h4>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 text-sm font-medium leading-relaxed">
                {typeof run.output === 'string' ? run.output : run.output?.data || JSON.stringify(run.output)}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
