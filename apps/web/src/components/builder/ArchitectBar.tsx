'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, Wand2, ChevronDown, ChevronUp, Send, Bot, User, Info, RotateCcw } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'explanation' | 'error';
}

interface ArchitectBarProps {
  onGenerate: (prompt: string, history: {role: string; content: string}[]) => void;
  isGenerating: boolean;
}

export default function ArchitectBar({ onGenerate, isGenerating }: ArchitectBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I\'m the Workflow Architect. Tell me what logic you want to automate and I\'ll build a linear pipeline for you. Try: "Email me daily YouTube analytics summaries"',
      type: 'explanation',
    }
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 200);
    }
  }, [isExpanded, messages]);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    // Build history for API (exclude welcome message, format for API)
    const history = newMessages
      .filter(m => m.id !== 'welcome')
      .slice(-8) // last 4 exchanges
      .map(m => ({ role: m.role, content: m.content }));

    onGenerate(input.trim(), history);
  };

  // Called by parent to add a response message
  const addAssistantMessage = (content: string, type?: 'explanation' | 'error') => {
    setMessages(prev => [...prev, {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content,
      type,
    }]);
  };

  // Expose addAssistantMessage via imperative handle alternative (stored on window for simplicity)
  useEffect(() => {
    (window as any).__architectAddMsg = addAssistantMessage;
    return () => { delete (window as any).__architectAddMsg; };
  }, []);

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Chat cleared! Describe another workflow to build.',
      type: 'explanation',
    }]);
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40 font-inter pointer-events-none">
      <div className={`pointer-events-auto bg-card/70 backdrop-blur-2xl border border-border/40 shadow-2xl shadow-black/30 rounded-2xl transition-all duration-300 ${isExpanded ? 'rounded-2xl' : 'rounded-2xl'}`}>
        
        {/* Chat History — visible when expanded */}
        {isExpanded && (
          <div className="max-h-[320px] overflow-y-auto no-scrollbar p-4 space-y-3 border-b border-border/30">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-foreground text-background' : 'bg-accent/20 text-accent'}`}>
                  {msg.role === 'user' ? <User size={11} /> : <Bot size={11} />}
                </div>
                {/* Bubble */}
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap
                  ${msg.role === 'user' 
                    ? 'bg-foreground text-background rounded-tr-none font-medium' 
                    : msg.type === 'error'
                      ? 'bg-red-500/10 border border-red-500/20 text-red-400 rounded-tl-none'
                      : 'bg-foreground/[0.05] border border-border/30 text-foreground/80 rounded-tl-none'
                  }`}
                >
                  {msg.type === 'explanation' && msg.id !== 'welcome' && (
                    <div className="flex items-center gap-1 mb-1.5 text-accent text-[9px] font-black uppercase tracking-widest">
                      <Info size={10} />
                      Workflow Built
                    </div>
                  )}
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Neural HUD — Visualizing the 5-step Creation Process */}
            {isGenerating && (
              <div className="flex flex-col gap-4 p-4 bg-foreground/[0.03] border border-border/30 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between border-b border-border/20 pb-2 mb-2">
                   <div className="flex items-center gap-2">
                     <Sparkles size={14} className="text-accent animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Neural_Mesh_Architecting</span>
                   </div>
                   <Loader2 size={12} className="animate-spin text-muted/40" />
                </div>
                
                <div className="space-y-3">
                   {[
                     { id: 1, label: 'Goal Analysis & Objective Mapping', sub: 'Analyzing user prompt for intent...' },
                     { id: 2, label: 'Node Discovery & Platform Selection', sub: 'Identifying required tools from registry...' },
                     { id: 3, label: 'Functional Schema Alignment', sub: 'Connecting input/output contracts...' },
                     { id: 4, label: 'Sequential Logic Wiring', sub: 'Building execution paths and edges...' },
                     { id: 5, label: 'Data Flow & Variable Finalization', sub: 'Propagating {{ parameters }} across nodes...' },
                   ].map((step, i) => (
                     <div key={step.id} className="flex gap-3">
                        <div className={`w-1 h-8 rounded-full transition-all duration-700 ${i === 0 ? 'bg-accent shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse' : 'bg-border/20'}`} />
                        <div className="flex flex-col">
                           <p className={`text-[10px] font-bold uppercase tracking-widest ${i === 0 ? 'text-foreground' : 'text-muted/40'}`}>{step.label}</p>
                           <p className={`text-[9px] ${i === 0 ? 'text-muted opacity-80' : 'text-muted/20'}`}>{step.sub}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-center gap-2 p-2">
          {/* Expand/Collapse toggle */}
          <button
            onClick={() => setIsExpanded(v => !v)}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-foreground/[0.05] transition-all"
            title={isExpanded ? 'Collapse' : 'Open Architect'}
          >
            {isExpanded ? <ChevronDown size={15} /> : <Wand2 size={15} />}
          </button>

          {/* Architect label when collapsed */}
          {!isExpanded && (
            <span className="text-[10px] font-black text-muted/50 uppercase tracking-widest select-none">
              Architect
            </span>
          )}

          {/* Input */}
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              if (!isExpanded) setIsExpanded(true);
            }}
            onFocus={() => setIsExpanded(true)}
            disabled={isGenerating}
            placeholder={isExpanded ? 'Describe what you want to automate...' : 'Ask the Architect...'}
            className="flex-1 text-[12px] bg-transparent border-none outline-none text-foreground placeholder:text-muted/30 font-medium"
          />

          {/* Clear chat */}
          {isExpanded && messages.length > 1 && (
            <button
              onClick={clearChat}
              className="p-2 text-muted/40 hover:text-muted transition-all"
              title="Clear chat"
            >
              <RotateCcw size={12} />
            </button>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isGenerating || !input.trim()}
            className={`
              flex items-center justify-center gap-2 px-4 h-9 rounded-xl
              font-black text-[10px] uppercase tracking-widest transition-all
              ${isGenerating || !input.trim()
                ? 'opacity-20 cursor-not-allowed bg-transparent text-muted'
                : 'bg-foreground text-background hover:opacity-90 active:scale-[0.95]'}
            `}
          >
            {isGenerating ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <><Send size={12} /> Build</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
