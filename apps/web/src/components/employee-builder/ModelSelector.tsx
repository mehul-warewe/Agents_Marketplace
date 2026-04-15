'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, Search, Filter, Cpu, Zap, Brain, Shield, 
  ChevronRight, Check, Globe, Sliders, Info, Server,
  Loader2, AlertTriangle, Coins, Scaling, Database,
  MessageSquare, ChevronDown, Bot, Activity, Image as ImageIcon,
  FileText, Music, Video, Table, FileQuestion, Code, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModels, OpenRouterModel } from '@/hooks/useModels';

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

export default function ModelSelector({ value, onChange, onClose }: ModelSelectorProps) {
  const { data: models, isLoading, isError } = useModels();
  const [selectedId, setSelectedId] = useState(value);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  
  // ── FILTER STATES ────────────────────────────────────────────────
  const [maxCredits, setMaxCredits] = useState(100);
  const [minContext, setMinContext] = useState(0);
  const [minOutput, setMinOutput] = useState(0);
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([]);

  // ── DATA NORMALIZATION & FILTERING ───────────────────────────────
  const filteredModels = useMemo(() => {
    if (!models) return [];
    return models.filter(m => {
      const searchTerms = search.toLowerCase().split(' ');
      const matchSearch = searchTerms.every(term => 
        m.name.toLowerCase().includes(term) || 
        m.id.toLowerCase().includes(term) ||
        m.description.toLowerCase().includes(term)
      );
      
      const providerId = m.id.split('/')[0];
      const matchProvider = selectedProviders.length === 0 || selectedProviders.includes(providerId);
      const promptPrice = parseFloat(m.pricing.prompt) * 1000000;
      const matchCredits = promptPrice <= maxCredits;
      const matchContext = (m.context_length || 0) >= minContext;
      const outputLimit = m.top_provider?.max_completion_tokens || 0;
      const matchOutput = outputLimit >= minOutput;

      const hasThinking = m.supported_parameters?.some(p => p.includes('reasoning'));
      const hasTools = m.supported_parameters?.includes('tools');
      const hasStructured = m.supported_parameters?.includes('structured_outputs');
      
      const matchCapabilities = selectedCapabilities.length === 0 || (
        (selectedCapabilities.includes('Reasoning') && hasThinking) ||
        (selectedCapabilities.includes('Tool Usage') && hasTools) ||
        (selectedCapabilities.includes('Structured Data') && hasStructured)
      );

      const inputModalities = m.architecture?.input_modalities || [];
      const hasVision = inputModalities.includes('image') || parseFloat(m.pricing.image || '0') > 0;
      const matchFileTypes = selectedFileTypes.length === 0 || (selectedFileTypes.includes('Images') && hasVision);

      return matchSearch && matchProvider && matchCredits && matchContext && matchOutput && matchCapabilities && matchFileTypes;
    }).sort((a, b) => (b.context_length || 0) - (a.context_length || 0));
  }, [models, search, selectedProviders, maxCredits, minContext, minOutput, selectedCapabilities, selectedFileTypes]);

  const displayedModel = useMemo(() => {
    return models?.find(m => m.id === (hoveredId || selectedId)) || models?.[0];
  }, [models, hoveredId, selectedId]);

  const toggleCapability = (c: string) => {
    setSelectedCapabilities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const toggleFileType = (t: string) => {
    setSelectedFileTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const toggleProvider = (p: string) => {
    setSelectedProviders(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const resetFilters = () => {
    setSelectedProviders([]);
    setSearch('');
    setMaxCredits(100);
    setMinContext(0);
    setMinOutput(0);
    setSelectedCapabilities([]);
    setSelectedFileTypes([]);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 lg:p-12 font-inter">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/90 backdrop-blur-xl" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.98, y: 10 }} 
        className="relative w-full max-w-7xl h-full bg-card border border-border/60 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-10 py-6 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <Brain size={20} strokeWidth={2} />
             </div>
             <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">Intelligence Library</h2>
                <p className="text-xs text-muted mt-0.5">Explore and select the optimal model for your agent</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-foreground/5 rounded-2xl hover:bg-foreground/10 transition-all active:scale-95 text-foreground"><X size={20} /></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* LEFT SIDEBAR */}
          <aside className="w-[320px] border-r border-border/40 p-8 flex flex-col gap-10 overflow-y-auto no-scrollbar shrink-0 bg-card/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Filters</h3>
              <button onClick={resetFilters} className="text-xs font-medium text-primary hover:underline">Reset all</button>
            </div>

            <div className="space-y-12">
              <div className="space-y-10">
                <div className="space-y-5">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Coins size={14} className="text-muted" />
                         <span className="text-[11px] font-medium text-foreground/80">Credits per 1M tokens</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-primary">${maxCredits}</span>
                   </div>
                   <input type="range" min="0" max="100" step="0.5" value={maxCredits} onChange={e => setMaxCredits(parseFloat(e.target.value))} className="w-full h-1.5 bg-primary/20 rounded-full appearance-none cursor-pointer accent-primary" />
                </div>

                <div className="space-y-5">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <MessageSquare size={14} className="text-muted" />
                         <span className="text-[11px] font-medium text-foreground/80">Context Window</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-primary">{minContext.toLocaleString()}</span>
                   </div>
                   <input type="range" min="0" max="2000000" step="1000" value={minContext} onChange={e => setMinContext(parseInt(e.target.value))} className="w-full h-1.5 bg-primary/20 rounded-full appearance-none cursor-pointer accent-primary" />
                </div>

                <div className="space-y-5">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Shield size={14} className="text-muted" />
                         <span className="text-[11px] font-medium text-foreground/80">Max Output Tokens</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-primary">{minOutput.toLocaleString()}</span>
                   </div>
                   <input type="range" min="0" max="128000" step="1000" value={minOutput} onChange={e => setMinOutput(parseInt(e.target.value))} className="w-full h-1.5 bg-primary/20 rounded-full appearance-none cursor-pointer accent-primary" />
                </div>
              </div>

              <div className="space-y-6 pt-10 border-t border-border/10">
                 <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Core Capabilities</h4>
                 <div className="space-y-1.5">
                    {[
                      { id: 'Reasoning', icon: Sparkles },
                      { id: 'Tool Usage', icon: Cpu },
                      { id: 'Structured Data', icon: Code },
                    ].map(c => (
                      <button key={c.id} onClick={() => toggleCapability(c.id)} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${selectedCapabilities.includes(c.id) ? 'bg-primary/10 border border-primary/20 text-primary' : 'hover:bg-foreground/5 border border-transparent text-muted'}`}>
                         <div className="flex items-center gap-3">
                            <c.icon size={14} className={selectedCapabilities.includes(c.id) ? 'text-primary' : 'opacity-40 group-hover:opacity-100'} />
                            <span className="text-xs font-medium">{c.id}</span>
                         </div>
                         {selectedCapabilities.includes(c.id) && <Check size={12} strokeWidth={3} />}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-6 pt-10 border-t border-border/10">
                 <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Providers</h4>
                 <div className="space-y-1.5">
                    {[
                      { id: 'google', label: 'Gemini', icon: Bot },
                      { id: 'openai', label: 'OpenAI', icon: Zap },
                      { id: 'anthropic', label: 'Anthropic', icon: Brain },
                      { id: 'x-ai', label: 'xAI', icon: Activity },
                      { id: 'deepseek', label: 'DeepSeek', icon: Cpu },
                      { id: 'openrouter', label: 'OpenRouter', icon: Globe },
                    ].map(p => (
                      <button key={p.id} onClick={() => toggleProvider(p.id)} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${selectedProviders.includes(p.id) ? 'bg-primary/10 border border-primary/20 text-primary' : 'hover:bg-foreground/5 border border-transparent text-muted'}`}>
                         <div className="flex items-center gap-3">
                            <p.icon size={14} className={selectedProviders.includes(p.id) ? 'text-primary' : 'opacity-40 group-hover:opacity-100'} />
                            <span className="text-xs font-medium">{p.label}</span>
                         </div>
                         {selectedProviders.includes(p.id) && <Check size={12} strokeWidth={3} />}
                      </button>
                    ))}
                 </div>
              </div>
            </div>
          </aside>

          {/* MAIN GRID */}
          <main className="flex-1 p-10 overflow-y-auto custom-scrollbar no-scrollbar bg-card/10 flex flex-col gap-10">
            <div className="flex items-center gap-6 shrink-0">
               <div className="flex-1 relative">
                  <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted opacity-40" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for models and providers..." className="w-full bg-card border border-border/40 rounded-2xl pl-16 pr-6 h-16 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-lg text-foreground" />
               </div>
            </div>

            {isLoading ? (
               <div className="flex-1 flex flex-col items-center justify-center gap-6 opacity-40">
                  <Loader2 size={48} className="animate-spin text-primary" />
                  <p className="text-xs font-medium">Loading Intelligence Library...</p>
               </div>
            ) : filteredModels.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center gap-6 opacity-40">
                  <FileQuestion size={64} strokeWidth={1} />
                  <p className="text-sm font-medium">No results found for your active filters.</p>
                  <button onClick={resetFilters} className="text-xs font-bold text-primary underline underline-offset-4">Reset all filters</button>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                  {filteredModels.map(model => {
                    const provider = model.id.split('/')[0];
                    const isHovered = hoveredId === model.id;
                    const isSelected = selectedId === model.id;
                    const inputPrice = (parseFloat(model.pricing.prompt) * 1000000).toFixed(2);
                    
                    return (
                      <button key={model.id} onMouseEnter={() => setHoveredId(model.id)} onMouseLeave={() => setHoveredId(null)} onClick={() => setSelectedId(model.id)} className={`p-6 rounded-[2.5rem] border-2 text-left transition-all duration-300 relative flex flex-col gap-4 overflow-hidden group ${isSelected ? 'bg-primary/5 border-primary shadow-xl shadow-primary/5' : isHovered ? 'bg-foreground/[0.02] border-foreground/30' : 'bg-card border-border/40 hover:border-foreground/20'}`}>
                         <div className="flex items-center justify-between">
                            <div className="px-3 py-1 rounded-full text-[10px] font-bold bg-foreground/5 text-muted border border-border/40">
                              {parseFloat(model.pricing.prompt) === 0 ? 'Free to use' : `$${inputPrice}/1M`}
                            </div>
                            {isSelected && <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg transform scale-110"><Check size={14} strokeWidth={4} /></div>}
                         </div>
                         <div>
                            <h4 className={`text-sm font-bold transition-all line-clamp-1 ${isSelected || isHovered ? 'text-primary' : 'text-foreground'}`}>{model.name}</h4>
                            <p className="text-[11px] font-medium text-muted capitalize">{provider}</p>
                         </div>
                         <div className="flex flex-wrap gap-2 pt-2">
                            {model.architecture?.input_modalities?.includes('image') && <div className="text-[10px] font-bold text-emerald-500 flex items-center gap-1.5"><ImageIcon size={12} /> Vision</div>}
                            {model.supported_parameters?.some(p => p.includes('reasoning')) && <div className="text-[10px] font-bold text-indigo-500 flex items-center gap-1.5"><Sparkles size={12} /> Reasoning</div>}
                            {model.supported_parameters?.includes('tools') && <div className="text-[10px] font-bold text-amber-500 flex items-center gap-1.5"><Cpu size={12} /> Tools</div>}
                         </div>
                         <div className={`absolute bottom-0 right-0 p-4 transition-all duration-500 ${isHovered ? 'opacity-20 translate-y-0' : 'opacity-0 translate-y-4'}`}><Activity size={80} className="text-primary" /></div>
                      </button>
                    );
                  })}
               </div>
            )}
          </main>

          {/* RIGHT SIDEBAR */}
          <aside className="w-[450px] border-l border-border/40 p-10 overflow-y-auto no-scrollbar flex flex-col gap-10 shrink-0 bg-card/20 shadow-[-20px_0_40px_rgba(0,0,0,0.1)]">
             {displayedModel ? (
               <div className="space-y-12">
                  <header className="space-y-6">
                     <div className="flex items-center gap-4 text-primary">
                        <Zap size={32} className="fill-current" />
                        <h3 className="text-2xl font-bold tracking-tight text-foreground">{displayedModel.name}</h3>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {hoveredId === displayedModel.id && <div className="px-4 py-1.5 bg-indigo-500 text-white rounded-full text-[10px] font-bold animate-pulse shadow-lg shadow-indigo-500/20">Previewing</div>}
                        {displayedModel.architecture?.input_modalities?.includes('image') && <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold border border-emerald-500/20">Vision Support</div>}
                        {(displayedModel.id.includes('claude') || displayedModel.id.includes('gpt-4')) ? (
                          <div className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-[10px] font-bold border border-primary/20 shadow-lg shadow-primary/10">High Performance</div>
                        ) : (
                          <div className="px-4 py-1.5 bg-foreground/5 text-muted rounded-full text-[10px] font-bold border border-border/40">Standard Fleet</div>
                        )}
                     </div>
                  </header>

                  <section className="space-y-8">
                     <div className="space-y-4">
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted">Model Description</h4>
                        <div className="text-sm leading-relaxed text-muted/80 custom-scrollbar max-h-[250px] overflow-y-auto pr-2 font-medium">
                           {displayedModel.description || "Detailed technical documentation is currently unavailable for this model."}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-card border border-border/40 rounded-3xl p-6 space-y-2 hover:border-primary/40 transition-all group">
                           <div className="flex items-center gap-3 text-muted group-hover:text-primary transition-all font-bold text-[10px] uppercase"> <Scaling size={16} /> Context Length </div>
                           <p className="text-xl font-bold italic">{(displayedModel.context_length || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-3xl p-6 space-y-2 hover:border-primary/40 transition-all group">
                           <div className="flex items-center gap-3 text-muted group-hover:text-primary transition-all font-bold text-[10px] uppercase"> <Globe size={16} /> Max Output </div>
                           <p className="text-xl font-bold italic">{(displayedModel.top_provider?.max_completion_tokens || 0).toLocaleString()}</p>
                        </div>
                     </div>
                  </section>

                  <section className="space-y-8 pt-10 border-t border-border/40">
                     <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted">Pricing Details</h4>
                     <div className="space-y-6">
                        <div className="flex justify-between items-center group">
                           <span className="text-xs font-medium text-muted/60 group-hover:text-foreground">Input (Per 1M tokens)</span>
                           <span className="text-lg font-bold">${(parseFloat(displayedModel.pricing.prompt) * 1000000).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between items-center group">
                           <span className="text-xs font-medium text-muted/60 group-hover:text-foreground">Output (Per 1M tokens)</span>
                           <span className="text-lg font-bold text-primary">${(parseFloat(displayedModel.pricing.completion) * 1000000).toFixed(4)}</span>
                        </div>
                     </div>
                  </section>

                  <footer className="pt-10 border-t border-border/40">
                     <div className="bg-foreground/5 rounded-3xl p-8 border border-border/40 space-y-4">
                        <div className="flex items-center gap-4 text-muted"> <Database size={20} /> <span className="text-[11px] font-bold uppercase tracking-widest italic">Technical ID</span> </div>
                        <div className="p-3 bg-card rounded-xl border border-border/40 text-[11px] font-mono font-bold text-primary truncate">
                           {displayedModel.id}
                        </div>
                     </div>
                  </footer>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <Brain size={64} className="mb-6" />
                  <p className="text-sm font-bold uppercase tracking-widest">Select a model to view specs</p>
               </div>
             )}
          </aside>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-10 py-8 border-t border-border/40 flex justify-end gap-6 bg-background/50 shrink-0">
           <button onClick={onClose} className="px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-muted hover:bg-foreground/5 transition-all">Cancel selection</button>
           <button onClick={() => { onChange(selectedId); onClose(); }} disabled={!selectedId} className="px-20 py-5 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-[0.5em] shadow-2xl hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50">Apply model</button>
        </div>
      </motion.div>
    </div>
  );
}

function LayoutGrid(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
