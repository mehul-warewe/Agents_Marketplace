'use client';

import React from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { useTools } from '@/hooks/useApi';
import { Terminal, Search, Scissors, FileText, Mail, Plus, ChevronRight, Cpu, Bot, Sparkles } from 'lucide-react';

const iconMap: any = {
  'Agent':      <Bot />,
  'OpenAI':     <img src="/iconSvg/openai.svg" alt="OpenAI" className="w-10 h-10 object-contain group-hover:invert transition-all" />,
  'Gemini':     <img src="/iconSvg/gemini-color.svg" alt="Gemini" className="w-10 h-10 object-contain" />,
  'Claude':     <img src="/iconSvg/claude-color.svg" alt="Claude" className="w-10 h-10 object-contain" />,
  'OpenRouter': <img src="/iconSvg/openrouter.svg" alt="OpenRouter" className="w-10 h-10 object-contain group-hover:invert transition-all" />,
};

const placeholderTools: any[] = [
  { name: 'Agent', description: 'Autonomous core for processing and action.', category: 'Intelligence' },
];

export default function ToolsPage() {
  const { data: dbTools, isLoading } = useTools();
  const displayTools = dbTools && dbTools.length > 0 ? dbTools : placeholderTools;

  return (
    <SidebarLayout title="LIBRARY // CORE_PROTOCOL">
      <div className="p-8 sm:p-12 lg:p-16 max-w-7xl mx-auto space-y-16 font-inter border-x border-border min-h-screen">
        
        {/* Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-12 py-8 px-4 border-b border-border/60 pb-12">
          <div className="space-y-4">
             <div className="flex items-center gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-foreground shadow-[0_0_10px_rgba(0,0,0,0.2)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground opacity-40">SYSTEM: ACTIVE_REPOSITORY_V01</span>
             </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none italic">Protocol_Library</h1>
            <p className="text-muted font-bold text-lg max-w-xl opacity-40 uppercase tracking-tight leading-tight italic">Synthesize specialized capability modules into your entity chain matrix.</p>
          </div>
          <button className="bg-foreground text-background px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.05] active:scale-[0.95] transition-all shadow-2xl shadow-foreground/10 flex items-center justify-center gap-4 border border-foreground/10">
            <Plus size={18} strokeWidth={3} /> REGISTER_MODULE
          </button>
        </header>

        {/* Tools Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-60 opacity-20">
            <div className="w-12 h-12 border-2 border-accent border-t-transparent animate-spin mb-8" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">Inventory_Sync_Active</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {displayTools.map((tool: any, idx: number) => (
              <div key={idx} className="bg-card p-12 transition-all duration-500 group relative overflow-hidden flex flex-col hover:shadow-2xl hover:shadow-foreground/10 hover:border-foreground/20 rounded-[3.5rem] border border-border/60 shadow-2xl shadow-foreground/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000 opacity-20" />
                
                {/* Module Icon */}
                <div className="w-20 h-20 border border-border/60 bg-foreground/[0.03] flex items-center justify-center text-foreground mb-12 group-hover:bg-foreground group-hover:text-background transition-all duration-700 transform group-hover:scale-110 shadow-inner group-hover:shadow-2xl rounded-[1.75rem] relative z-10">
                  {React.cloneElement(iconMap[tool.name] || <Terminal size={28} />, { strokeWidth: 2.5, size: 36 })}
                </div>

                {/* Metadata */}
                <div className="space-y-8 mb-12 flex-grow relative z-10">
                  <div className="space-y-4">
                    <span className="text-[9px] font-black text-foreground uppercase tracking-[0.4em] bg-foreground/10 px-4 py-1.5 rounded-full italic">{tool.category || 'Base Module'}</span>
                    <h3 className="text-3xl font-black tracking-tighter uppercase leading-none italic group-hover:text-foreground transition-colors">{tool.name}</h3>
                  </div>
                  <p className="text-[12px] font-bold text-muted uppercase tracking-tight line-clamp-3 leading-tight opacity-40 group-hover:opacity-100 transition-opacity italic">{tool.description}</p>
                </div>

                {/* Footer and Docs */}
                <div className="flex items-center justify-between border-t border-border/40 pt-10 mt-auto relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Signal_Stable</span>
                  </div>
                  <button className="text-[10px] font-black uppercase tracking-[0.3em] text-muted hover:text-foreground transition-all flex items-center gap-2 group/link italic">
                    TECH_DOCS <ChevronRight size={16} strokeWidth={3} className="group-hover/link:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
