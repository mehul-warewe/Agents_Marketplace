'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, Wand2, ChevronDown, Send, Bot, User, Info, RotateCcw } from 'lucide-react';

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
      content: 'Hello. I am the Architecture Synthesis engine. Describe the business logic or process you wish to automate, and I will generate the workflow structure for you.',
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

    const history = newMessages
      .filter(m => m.id !== 'welcome')
      .slice(-8)
      .map(m => ({ role: m.role, content: m.content }));

    onGenerate(input.trim(), history);
  };

  const addAssistantMessage = (content: string, type?: 'explanation' | 'error') => {
    setMessages(prev => [...prev, {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content,
      type,
    }]);
  };

  useEffect(() => {
    (window as any).__architectAddMsg = addAssistantMessage;
    return () => { delete (window as any).__architectAddMsg; };
  }, []);

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Context cleared. Please describe a new operational workflow.',
      type: 'explanation',
    }]);
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-40 pointer-events-none">
      <div className={`pointer-events-auto bg-card border border-border rounded-2xl transition-all duration-300 shadow-xl ${isExpanded ? 'ring-1 ring-indigo-500/10' : ''}`}>
        
        {/* Chat History */}
        {isExpanded && (
          <div className="max-h-[320px] overflow-y-auto no-scrollbar p-5 space-y-4 border-b border-border">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border ${msg.role === 'user' ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-muted text-muted-foreground border-border'}`}>
                  {msg.role === 'user' ? <User size={13} strokeWidth={2.5} /> : <Bot size={13} strokeWidth={2.5} />}
                </div>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[12px] leading-relaxed
                  ${msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none font-medium' 
                    : msg.type === 'error'
                      ? 'bg-red-500/5 border border-red-500/10 text-red-500 rounded-tl-none font-medium'
                      : 'bg-muted border border-border text-foreground/80 rounded-tl-none font-medium'
                  }`}
                >
                  {msg.type === 'explanation' && msg.id !== 'welcome' && (
                    <div className="flex items-center gap-1.5 mb-1.5 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                      <Info size={11} strokeWidth={3} />
                      Architecture Generated
                    </div>
                  )}
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Creation HUD */}
            {isGenerating && (
              <div className="p-5 bg-muted/50 border border-border rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                   <div className="flex items-center gap-2">
                     <Sparkles size={14} className="text-indigo-600 animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Synthesis_In_Progress</span>
                   </div>
                   <Loader2 size={12} className="animate-spin text-muted-foreground/40" />
                </div>
                
                <div className="space-y-4">
                   {[
                     { id: 1, label: 'Tactical Intent Mapping', sub: 'Analyzing user objectives...' },
                     { id: 2, label: 'Registry Discovery', sub: 'Locating optimal skills and employees...' },
                     { id: 3, label: 'Schema Connection', sub: 'Aligning data flow contracts...' },
                     { id: 4, label: 'Link Validation', sub: 'Structuring sequential execution paths...' },
                     { id: 5, label: 'Logic Synthesis', sub: 'Finalizing behavioral parameters...' },
                   ].map((step, i) => (
                     <div key={step.id} className="flex gap-4">
                        <div className={`w-1 h-8 rounded-full transition-all duration-700 ${i === 0 ? 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)] animate-pulse' : 'bg-border'}`} />
                        <div className="flex flex-col">
                           <p className={`text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-foreground' : 'text-muted-foreground/30'}`}>{step.label}</p>
                           <p className={`text-[9px] font-medium leading-none mt-1 ${i === 0 ? 'text-muted-foreground' : 'text-muted-foreground/10'}`}>{step.sub}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-center gap-2 p-2.5">
          <button
            onClick={() => setIsExpanded(v => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-all"
          >
            {isExpanded ? <ChevronDown size={16} strokeWidth={2.5} /> : <Wand2 size={16} strokeWidth={2.5} />}
          </button>

          {!isExpanded && (
            <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] select-none ml-1">
              Architect
            </span>
          )}

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
            placeholder={isExpanded ? 'Define your workflow requirements...' : 'Synthesize architecture...'}
            className="flex-1 text-[13px] bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/20 font-medium px-2"
          />

          {isExpanded && messages.length > 1 && (
            <button
              onClick={clearChat}
              className="p-2 text-muted-foreground/20 hover:text-red-500 transition-all"
              title="Clear history"
            >
              <RotateCcw size={14} />
            </button>
          )}

          <button
            onClick={handleSend}
            disabled={isGenerating || !input.trim()}
            className={`
              flex items-center justify-center gap-2 px-6 h-9 rounded-xl
              font-black text-[10px] uppercase tracking-[0.2em] transition-all
              ${isGenerating || !input.trim()
                ? 'opacity-20 cursor-not-allowed text-muted-foreground'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.96] shadow-sm'}
            `}
          >
            {isGenerating ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <><Send size={12} strokeWidth={2.5} /> Build</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
