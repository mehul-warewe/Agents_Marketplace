'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, Search, Cpu, Zap, Brain, Shield, 
  Check, Globe, Sliders, Server,
  Loader2, AlertTriangle, Coins, Scaling, Database,
  MessageSquare, Bot, Activity, Image as ImageIcon,
  FileText, FileQuestion, Code, Sparkles
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
  const [maxCredits, setMaxCredits] = useState(100);
  const [minContext, setMinContext] = useState(0);
  const [minOutput, setMinOutput] = useState(0);
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([]);

  const filteredModels = useMemo(() => {
    if (!models) return [];
    return models.filter(m => {
      const searchTerms = search.toLowerCase().split(' ');
      const matchSearch = searchTerms.every(term => 
        m.name.toLowerCase().includes(term) || 
        m.id.toLowerCase().includes(term) ||
        m.description.toLowerCase().includes(term)
      );
      
      const providerId = m.id.split('/')[0] || 'unknown';
      const matchProvider = selectedProviders.length === 0 || selectedProviders.includes(providerId);
      const promptPrice = parseFloat(m.pricing?.prompt || '0') * 1000000;
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
      const hasVision = inputModalities.includes('image') || parseFloat(m.pricing?.image || '0') > 0;
      const matchFileTypes = selectedFileTypes.length === 0 || (selectedFileTypes.includes('Images') && hasVision);

      return matchSearch && matchProvider && matchCredits && matchContext && matchOutput && matchCapabilities && matchFileTypes;
    }).sort((a, b) => (b.context_length || 0) - (a.context_length || 0));
  }, [models, search, selectedProviders, maxCredits, minContext, minOutput, selectedCapabilities, selectedFileTypes]);

  const displayedModel = useMemo(() => {
    return models?.find(m => m.id === (hoveredId || selectedId)) || models?.[0];
  }, [models, hoveredId, selectedId]);

  const toggleCapability = (c: string) => setSelectedCapabilities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleFileType = (t: string) => setSelectedFileTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleProvider = (p: string) => setSelectedProviders(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 lg:p-8 font-inter">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-transparent" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.98, y: 10 }} 
        className="relative w-full max-w-7xl h-full bg-card border border-border/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border/10 shrink-0 bg-secondary/5">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Brain size={18} />
             </div>
             <div>
                <h2 className="text-base font-bold tracking-tight text-foreground">Model Library</h2>
                <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">Select the optimal engine for this agent</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 bg-secondary/50 rounded-xl hover:bg-foreground hover:text-background transition-all text-foreground"><X size={16} /></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* LEFT SIDEBAR — Filters */}
          <aside className="w-[260px] border-r border-border/10 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest">Filters</h3>
              <button onClick={resetFilters} className="text-[8px] font-bold text-primary hover:underline uppercase tracking-widest">Reset</button>
            </div>

            <div className="space-y-6">
              {/* Sliders */}
              <div className="space-y-5">
                {[
                  { label: 'Credits / 1M tokens', icon: Coins, value: maxCredits, setter: setMaxCredits, min: 0, max: 100, step: 0.5, display: `$${maxCredits}` },
                  { label: 'Context Window', icon: MessageSquare, value: minContext, setter: setMinContext, min: 0, max: 2000000, step: 1000, display: minContext.toLocaleString() },
                  { label: 'Max Output', icon: Shield, value: minOutput, setter: setMinOutput, min: 0, max: 128000, step: 1000, display: minOutput.toLocaleString() },
                ].map(s => (
                  <div key={s.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <s.icon size={12} className="text-foreground/20" />
                        <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">{s.label}</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-primary">{s.display}</span>
                    </div>
                    <input type="range" min={s.min} max={s.max} step={s.step} value={s.value} onChange={e => s.setter(parseFloat(e.target.value))} className="w-full h-1 bg-primary/20 rounded-full appearance-none cursor-pointer accent-primary" />
                  </div>
                ))}
              </div>

              {/* Capabilities */}
              <div className="space-y-3 pt-4 border-t border-border/10">
                <h4 className="text-[9px] font-bold uppercase tracking-widest text-foreground/20">Capabilities</h4>
                <div className="space-y-1">
                  {[
                    { id: 'Reasoning', icon: Sparkles },
                    { id: 'Tool Usage', icon: Cpu },
                    { id: 'Structured Data', icon: Code },
                  ].map(c => (
                    <button key={c.id} onClick={() => toggleCapability(c.id)} className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all group ${selectedCapabilities.includes(c.id) ? 'bg-primary/10 border border-primary/20 text-primary' : 'hover:bg-foreground/5 border border-transparent text-foreground/30'}`}>
                       <div className="flex items-center gap-2">
                          <c.icon size={12} className={selectedCapabilities.includes(c.id) ? 'text-primary' : 'opacity-40 group-hover:opacity-100'} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{c.id}</span>
                       </div>
                       {selectedCapabilities.includes(c.id) && <Check size={12} strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Providers */}
              <div className="space-y-3 pt-4 border-t border-border/10">
                <h4 className="text-[9px] font-bold uppercase tracking-widest text-foreground/20">Providers</h4>
                <div className="space-y-1">
                  {[
                    { id: 'google', label: 'Google', icon: Bot },
                    { id: 'openai', label: 'OpenAI', icon: Zap },
                    { id: 'anthropic', label: 'Anthropic', icon: Brain },
                    { id: 'x-ai', label: 'xAI', icon: Activity },
                    { id: 'deepseek', label: 'DeepSeek', icon: Cpu },
                    { id: 'openrouter', label: 'OpenRouter', icon: Globe },
                  ].map(p => (
                    <button key={p.id} onClick={() => toggleProvider(p.id)} className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all group ${selectedProviders.includes(p.id) ? 'bg-primary/10 border border-primary/20 text-primary' : 'hover:bg-foreground/5 border border-transparent text-foreground/30'}`}>
                       <div className="flex items-center gap-2">
                          <p.icon size={12} className={selectedProviders.includes(p.id) ? 'text-primary' : 'opacity-40 group-hover:opacity-100'} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{p.label}</span>
                       </div>
                       {selectedProviders.includes(p.id) && <Check size={12} strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN GRID */}
          <main className="flex-1 p-6 overflow-y-auto no-scrollbar flex flex-col gap-6">
            <div className="relative shrink-0">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search models and providers..." className="w-full bg-secondary/30 border border-border/10 rounded-xl pl-10 pr-4 h-11 text-xs font-bold focus:border-primary/40 outline-none transition-all text-foreground placeholder:text-foreground/10" />
            </div>

            {isLoading ? (
               <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-30">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p className="text-[9px] font-bold uppercase tracking-widest">Loading models...</p>
               </div>
            ) : filteredModels.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-30">
                  <FileQuestion size={40} strokeWidth={1} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No models match these filters</p>
                  <button onClick={resetFilters} className="text-[9px] font-bold text-primary underline underline-offset-4">Reset filters</button>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-10">
                  {filteredModels.map(model => {
                    const provider = model.id.split('/')[0];
                    const isHovered = hoveredId === model.id;
                    const isSelected = selectedId === model.id;
                    const inputPrice = (parseFloat(model.pricing?.prompt || '0') * 1000000).toFixed(2);
                    
                    return (
                      <button key={model.id} onMouseEnter={() => setHoveredId(model.id)} onMouseLeave={() => setHoveredId(null)} onClick={() => setSelectedId(model.id)} className={`p-5 rounded-xl border text-left transition-all duration-200 relative flex flex-col gap-3 overflow-hidden group ${isSelected ? 'bg-primary/5 border-primary/50 shadow-lg' : 'bg-card border-border/10 hover:border-primary/20 shadow-sm'}`}>
                         <div className="flex items-center justify-between">
                            <div className={`px-2 py-0.5 rounded-md text-[8px] font-bold border ${isSelected ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-foreground/5 text-foreground/20 border-border/10'}`}>
                              {parseFloat(model.pricing?.prompt || '0') === 0 ? 'Free' : `$${inputPrice}/1M`}
                            </div>
                            {isSelected && <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center"><Check size={12} strokeWidth={3} /></div>}
                         </div>
                         <div>
                            <h4 className={`text-[11px] font-bold transition-all line-clamp-1 ${isSelected ? 'text-primary' : 'text-foreground'}`}>{model.name}</h4>
                            <p className="text-[9px] font-bold text-foreground/20 capitalize uppercase tracking-widest">{provider}</p>
                         </div>
                         <div className="flex flex-wrap gap-2">
                            {model.architecture?.input_modalities?.includes('image') && <div className="text-[8px] font-bold text-emerald-500 flex items-center gap-1"><ImageIcon size={10} /> Vision</div>}
                            {model.supported_parameters?.some(p => p.includes('reasoning')) && <div className="text-[8px] font-bold text-primary flex items-center gap-1"><Sparkles size={10} /> Reasoning</div>}
                            {model.supported_parameters?.includes('tools') && <div className="text-[8px] font-bold text-amber-500 flex items-center gap-1"><Cpu size={10} /> Tools</div>}
                         </div>
                      </button>
                    );
                  })}
               </div>
            )}
          </main>

          {/* RIGHT SIDEBAR — Model Detail */}
          <aside className="w-[360px] border-l border-border/10 p-6 overflow-y-auto no-scrollbar flex flex-col gap-6 shrink-0">
             {displayedModel ? (
               <div className="space-y-6">
                  <header className="space-y-3">
                     <div className="flex items-center gap-3">
                        <Zap size={20} className="text-primary fill-current" />
                        <h3 className="text-base font-bold tracking-tight text-foreground leading-none">{displayedModel.name}</h3>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {hoveredId === displayedModel.id && <div className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[8px] font-bold border border-primary/20">Previewing</div>}
                        {displayedModel.architecture?.input_modalities?.includes('image') && <div className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[8px] font-bold border border-primary/20">Vision</div>}
                        {(displayedModel.id.includes('claude') || displayedModel.id.includes('gpt-4')) ? (
                          <div className="px-2 py-0.5 bg-primary text-primary-foreground rounded-md text-[8px] font-bold">High Performance</div>
                        ) : (
                          <div className="px-2 py-0.5 bg-secondary text-foreground/30 rounded-md text-[8px] font-bold border border-border/10">Standard</div>
                        )}
                     </div>
                  </header>

                  <section className="space-y-4">
                     <h4 className="text-[9px] font-bold uppercase tracking-widest text-foreground/20">Description</h4>
                     <p className="text-[10px] leading-relaxed text-foreground/50 font-medium">
                        {displayedModel.description || "Documentation unavailable for this model."}
                     </p>
                  </section>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="bg-secondary/30 border border-border/10 rounded-xl p-4 space-y-1.5 hover:border-primary/20 transition-all group">
                        <div className="flex items-center gap-2 text-foreground/20 group-hover:text-primary transition-all text-[8px] font-bold uppercase tracking-widest"><Scaling size={12} /> Context</div>
                        <p className="text-base font-bold">{(displayedModel.context_length || 0).toLocaleString()}</p>
                     </div>
                     <div className="bg-secondary/30 border border-border/10 rounded-xl p-4 space-y-1.5 hover:border-primary/20 transition-all group">
                        <div className="flex items-center gap-2 text-foreground/20 group-hover:text-primary transition-all text-[8px] font-bold uppercase tracking-widest"><Globe size={12} /> Output</div>
                        <p className="text-base font-bold">{(displayedModel.top_provider?.max_completion_tokens || 0).toLocaleString()}</p>
                     </div>
                  </div>

                  <section className="space-y-3 pt-4 border-t border-border/10">
                     <h4 className="text-[9px] font-bold uppercase tracking-widest text-foreground/20">Pricing</h4>
                     <div className="space-y-2">
                        <div className="flex justify-between items-center">
                           <span className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest">Input / 1M tokens</span>
                           <span className="text-sm font-bold">${(parseFloat(displayedModel.pricing?.prompt || '0') * 1000000).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest">Output / 1M tokens</span>
                           <span className="text-sm font-bold text-primary">${(parseFloat(displayedModel.pricing?.completion || '0') * 1000000).toFixed(4)}</span>
                        </div>
                     </div>
                  </section>

                  <section className="space-y-3 pt-4 border-t border-border/10">
                     <h4 className="text-[9px] font-bold uppercase tracking-widest text-foreground/20">Model ID</h4>
                     <div className="p-3 bg-secondary/30 border border-border/10 rounded-xl text-[9px] font-mono font-bold text-primary truncate">
                        {displayedModel.id}
                     </div>
                  </section>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-10">
                  <Brain size={40} className="mb-4" />
                  <p className="text-[9px] font-bold uppercase tracking-widest">Select a model to view specs</p>
               </div>
             )}
          </aside>
        </div>

        {/* FOOTER */}
        <div className="px-8 py-5 border-t border-border/10 flex justify-end gap-4 bg-secondary/5 shrink-0">
           <button onClick={onClose} className="h-10 px-6 rounded-xl text-[9px] font-bold uppercase tracking-widest text-foreground/30 hover:bg-foreground/5 transition-all">Cancel</button>
           <button onClick={() => { onChange(selectedId); onClose(); }} disabled={!selectedId} className="h-10 px-10 bg-primary text-primary-foreground rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30">Apply Model</button>
        </div>
      </motion.div>
    </div>
  );
}
