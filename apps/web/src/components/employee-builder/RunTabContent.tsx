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
    <div className="flex-1 overflow-y-auto bg-transparent flex flex-col items-center pt-8 pb-32 px-6 no-scrollbar h-full">
      {/* AGENT IDENTITY */}
      <div className="flex flex-col items-center gap-4 mb-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary border border-border/20 text-primary flex items-center justify-center shadow-xl relative group">
          <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all" />
          {employee?.avatar || <Bot size={28} strokeWidth={2.5} />}
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground leading-none">
          {employee?.name || 'Untitled Agent'}
        </h2>
      </div>

      {/* COMMAND CONSOLE */}
      <div className="w-full max-w-3xl">
        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden transition-all hover:border-primary/20">
          {/* MISSION INPUT */}
          <div className="p-8 space-y-6">
            <textarea
              value={missionText}
              onChange={(e) => setMissionText(e.target.value)}
              placeholder={`Describe task for ${employee?.name || 'agent'}...`}
              className="w-full h-32 bg-transparent border-none outline-none text-foreground placeholder:text-foreground/20 font-bold text-xl resize-none tracking-tight no-scrollbar"
            />

            <div className="flex items-center justify-end pt-6 border-t border-border/10">
              <button
                onClick={handleRunMission}
                disabled={isRunningMission || !missionText.trim()}
                className={`h-11 px-8 rounded-xl transition-all flex items-center gap-3 shadow-sm ${missionText.trim() ? 'bg-primary text-primary-foreground hover:scale-[1.05] active:scale-[0.95]' : 'bg-foreground/5 text-foreground/20 cursor-not-allowed'}`}
              >
                {isRunningMission ? <Activity size={18} className="animate-spin" /> : <ArrowUp size={18} strokeWidth={3} />}
                <span className="text-[10px] font-bold uppercase tracking-widest">{isRunningMission ? 'Running' : 'Run Mission'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STREAMING STEPS PANEL */}
      {(isStreaming || steps.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl mt-8 bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Brain size={16} className="text-primary" />
            <h3 className="text-sm font-bold tracking-tight uppercase">Intelligence Stream</h3>
            {isStreaming && <Loader size={14} className="animate-spin text-primary ml-auto" />}
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto no-scrollbar">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-secondary/30 border border-border/10 rounded-xl space-y-2"
              >
                <div className="flex items-center gap-3">
                  {step.type === 'thought' && (
                    <>
                      <Brain size={14} className="text-primary" />
                      <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Reasoning</span>
                    </>
                  )}
                  {step.type === 'observation' && (
                    <>
                      <Eye size={14} className="text-amber-500" />
                      <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Observation</span>
                    </>
                  )}
                  {step.type === 'final' && (
                    <>
                      <CheckCircle size={14} className="text-emerald-500" />
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Synthesis</span>
                    </>
                  )}
                  {step.type === 'error' && (
                    <>
                      <AlertCircle size={14} className="text-red-500" />
                      <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Breach</span>
                    </>
                  )}
                </div>
                <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {step.thought || step.observation || step.content || ''}
                </p>
              </motion.div>
            ))}
          </div>

          {output && (
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                <CheckCircle size={14} className="text-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Protocol Complete</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* STATUS FOOTER */}
      <footer className="mt-auto pt-10 flex items-center gap-3 opacity-30">
        <div className={`w-1 h-1 rounded-full ${isStreaming ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
        <span className="text-[9px] font-bold uppercase tracking-widest text-foreground">
          {isStreaming ? 'STREAMING_CONTEXT...' : 'SYSTEM_READY'}
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
