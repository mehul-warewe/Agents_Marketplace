'use client';

import React from 'react';
import {
  ArrowUp, Activity, Brain, Loader, Eye, CheckCircle, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEmployeeStream } from '@/hooks/useEmployees';

interface RunTabContentProps {
  employee: any;
  missionText: string;
  setMissionText: (val: string) => void;
  handleRunMission: () => void;
  isRunningMission: boolean;
  activeRunId?: string | null;
}

export default function RunTabContent({
  employee,
  missionText,
  setMissionText,
  handleRunMission,
  isRunningMission,
  activeRunId
}: RunTabContentProps) {
  const { steps, status, output, isStreaming } = useEmployeeStream(activeRunId || null);

  return (
    <div className="flex-1 overflow-y-auto bg-transparent flex flex-col items-center pt-8 pb-32 px-6 no-scrollbar">
      {/* AGENT IDENTITY */}
      <div className="flex flex-col items-center gap-6 mb-20 text-center">
        <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center text-5xl shadow-2xl shadow-indigo-500/5 relative group">
          <div className="absolute inset-0 bg-indigo-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all" />
          {employee?.avatar || <Bot size={44} strokeWidth={2.5} />}
        </div>
        <h2 className="text-5xl font-bold tracking-tight text-foreground leading-none">
          {employee?.name || 'Untitled Agent'}
        </h2>
      </div>

      {/* COMMAND CONSOLE */}
      <div className="w-full max-w-4xl">
        <div className="bg-card border border-border/60 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] overflow-hidden transition-all hover:border-border">
          {/* MISSION INPUT */}
          <div className="p-10 space-y-10">
            <textarea
              value={missionText}
              onChange={(e) => setMissionText(e.target.value)}
              placeholder={`Describe task for ${employee?.name || 'Untitled agent'} to work on...`}
              className="w-full h-48 bg-transparent border-none outline-none text-foreground placeholder:text-muted/20 font-semibold text-2xl resize-none tracking-tight no-scrollbar selection:bg-primary/20"
            />

            <div className="flex items-center justify-end pt-6 border-t border-border/10">
              <button
                onClick={handleRunMission}
                disabled={isRunningMission || !missionText.trim()}
                className={`px-12 py-5 rounded-2xl transition-all flex items-center gap-4 shadow-2xl ${missionText.trim() ? 'bg-primary text-primary-foreground shadow-primary/20 hover:scale-[1.05] active:scale-[0.95]' : 'bg-foreground/5 text-muted cursor-not-allowed opacity-20'}`}
              >
                {isRunningMission ? <Activity size={24} className="animate-spin" /> : <ArrowUp size={24} strokeWidth={3} />}
                <span className="text-[11px] font-bold uppercase tracking-[0.4em]">{isRunningMission ? 'Running' : 'Run Task'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STREAMING STEPS PANEL */}
      {isStreaming || steps.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mt-12 bg-card border border-border/60 rounded-[2.5rem] p-8 space-y-6"
        >
          <div className="flex items-center gap-3">
            <Brain size={20} className="text-primary" />
            <h3 className="text-lg font-bold tracking-tight">Execution Steps</h3>
            {isStreaming && <Loader size={16} className="animate-spin text-primary ml-auto" />}
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto no-scrollbar">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-foreground/5 border border-border/40 rounded-xl space-y-2"
              >
                <div className="flex items-center gap-3">
                  {step.type === 'thought' && (
                    <>
                      <Brain size={16} className="text-indigo-500" />
                      <span className="text-[11px] font-bold text-indigo-500 uppercase">Reasoning</span>
                    </>
                  )}
                  {step.type === 'observation' && (
                    <>
                      <Eye size={16} className="text-amber-500" />
                      <span className="text-[11px] font-bold text-amber-500 uppercase">Tool Result</span>
                    </>
                  )}
                  {step.type === 'final' && (
                    <>
                      <CheckCircle size={16} className="text-emerald-500" />
                      <span className="text-[11px] font-bold text-emerald-500 uppercase">Final Answer</span>
                    </>
                  )}
                  {step.type === 'error' && (
                    <>
                      <AlertCircle size={16} className="text-red-500" />
                      <span className="text-[11px] font-bold text-red-500 uppercase">Error</span>
                    </>
                  )}
                  {step.timestamp && (
                    <span className="text-[9px] text-muted/60 ml-auto">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {step.thought || step.observation || step.content || ''}
                </p>
                {step.action && (
                  <div className="text-[10px] text-muted/60 italic">
                    Action: {step.action}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {output && (
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                <CheckCircle size={16} className="text-emerald-500" />
                <span className="text-[11px] font-bold text-emerald-500 uppercase">Completed</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
              </p>
            </div>
          )}
        </motion.div>
      ) : null}

      {/* STATUS FOOTER */}
      <footer className="mt-20 flex items-center gap-4 opacity-20 group hover:opacity-100 transition-all cursor-default">
        <div className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
        <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted">
          {isStreaming ? 'Running task...' : 'Agent ready for execution'}
        </span>
      </footer>
    </div>
  );
}

function Bot(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );
}
