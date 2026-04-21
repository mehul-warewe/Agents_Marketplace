'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Bot, Hammer, Activity, Rocket, ArrowLeft, Loader2, Target,
  Mic, Paperclip, Send, Zap, Play, MessageCircle, HelpCircle, Plus, ChevronRight, MessageSquare
} from 'lucide-react';
import { useEmployee, useUpdateEmployee, useCreateEmployee, usePublishEmployee } from '@/hooks/useEmployees';
import { useSkills } from '@/hooks/useSkills';
import { useKnowledge, useCreateKnowledge } from '@/hooks/useKnowledge';
import { useToast } from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

import { LeftSubNav, RightConfigPane } from './employee-builder/EmployeeSidebar';
import { BuildTabContent, MonitorTabContent } from './employee-builder/BuilderTabs';
import SkillPickerModal from './employee-builder/SkillPickerModal';
import KnowledgeCreatorModal from './employee-builder/KnowledgeCreatorModal';

type TabType = 'train' | 'talk' | 'history';
type SubTabType = 'prompt' | 'tools' | 'knowledge' | 'triggers';

export default function EmployeeDetail() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const isNew = id === 'new';
  const toast = useToast();

  const { data: employee, isLoading: isEmployeeLoading } = useEmployee(isNew ? null : id);
  const { mutateAsync: updateEmployee, isPending: isUpdating } = useUpdateEmployee();
  const { mutateAsync: createEmployee, isPending: isCreating } = useCreateEmployee();
  const { mutateAsync: publishEmployee } = usePublishEmployee();

  const { data: allSkills } = useSkills();
  const { data: myKnowledge } = useKnowledge();

  const [activeTab, setActiveTab] = useState<TabType>('train');
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('prompt');
  const [localEmployee, setLocalEmployee] = useState<any>(null);
  const [isPaneCollapsed, setIsPaneCollapsed] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [showKnowledgeCreator, setShowKnowledgeCreator] = useState(false);

  useEffect(() => {
    if (employee) {
      setLocalEmployee(employee);
    } else if (isNew) {
      setLocalEmployee({
        name: '',
        description: '',
        systemPrompt: '',
        model: 'google/gemini-2.0-flash-001',
        temperature: 0.1,
        skillIds: [],
        knowledgeIds: [],
        avatar: '🤖'
      });
    }
  }, [employee, isNew]);

  const handleSave = async () => {
    if (!localEmployee.name.trim()) {
      toast.error('Agent name is required');
      return;
    }
    
    try {
      if (isNew) {
        const created = await createEmployee(localEmployee);
        toast.success('Agent created successfully');
        router.push(`/employees/${created.id}`);
      } else {
        await updateEmployee({ id, data: localEmployee });
        toast.success('Agent updated successfully');
      }
    } catch (err) {
      toast.error('Failed to save agent configuration');
    }
  };

  const removeSkill = ({ employeeId, skillId }: { employeeId: string, skillId: string }) => {
    const updated = {
      ...localEmployee,
      skillIds: localEmployee.skillIds.filter((s: string) => s !== skillId)
    };
    setLocalEmployee(updated);
  };

  const removeKnowledge = ({ employeeId, knowledgeId }: { employeeId: string, knowledgeId: string }) => {
    const updated = {
      ...localEmployee,
      knowledgeIds: localEmployee.knowledgeIds.filter((k: string) => k !== knowledgeId)
    };
    setLocalEmployee(updated);
  };

  const { mutateAsync: createKnowledge } = useCreateKnowledge();

  if (isEmployeeLoading && !isNew) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Loading workspace...</p>
      </div>
    );
  }

  if (!localEmployee) return null;

  return (
    <div className="flex-1 bg-background flex flex-col h-full overflow-hidden font-inter text-foreground">
      
      {/* ── HEADER ────────────────────────── */}
      <header className="h-11 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push('/employees')} 
                className="p-1 px-2.5 bg-foreground/5 rounded-lg hover:bg-foreground/10 transition-all text-foreground/40 hover:text-foreground border border-border/10"
              >
                 <ArrowLeft size={14} strokeWidth={2.5} />
              </button>
              <div className="flex items-center gap-2.5">
                 <div className="size-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                    <Bot size={14} strokeWidth={2.5} />
                 </div>
                 <div className="flex flex-col">
                     <span className="text-[7px] font-bold uppercase tracking-widest text-foreground/30 leading-none">Configuration</span>
                    <h1 className="text-[11px] font-bold tracking-tight text-foreground leading-none">
                      {isNew ? 'New Employee' : localEmployee?.name}
                    </h1>
                 </div>
              </div>
           </div>
        </div>

        <nav className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/10 relative">
           {[
              { id: 'train', label: 'Configure', icon: Hammer },
             { id: 'talk', label: 'Chat', icon: MessageSquare },
             { id: 'history', label: 'History', icon: Activity }
           ].map(tab => {
             const active = activeTab === tab.id;
             return (
               <button 
                 key={tab.id} 
                 onClick={() => setActiveTab(tab.id as TabType)}
                 className={`relative px-4 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 z-10
                   ${active ? 'text-indigo-500' : 'text-foreground/30 hover:text-foreground/50'}`}
               >
                 {active && (
                   <motion.div 
                     layoutId="activeTab"
                     className="absolute inset-0 bg-card rounded-lg shadow-sm border border-border/5"
                     transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                   />
                 )}
                 <tab.icon size={11} strokeWidth={active ? 2.5 : 2} className="relative z-20" />
                 <span className="relative z-20">{tab.label}</span>
               </button>
             );
           })}
        </nav>

        <div className="flex items-center gap-2">
            <button
               onClick={handleSave}
               disabled={isUpdating || isCreating}
               className="h-7 px-3 bg-card border border-border hover:bg-foreground/5 text-foreground rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-sm"
            >
               {isUpdating || isCreating ? 'Saving...' : 'Save'}
            </button>
            {!isNew && (
              <button
                onClick={() => publishEmployee({ id, published: !localEmployee?.isPublished })}
                className="h-7 px-4 bg-indigo-600 text-white rounded-lg text-[8px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-1.5 border-none"
              >
                 {localEmployee?.isPublished ? 'Draft' : 'Publish'} 
                 <Rocket size={10} strokeWidth={2.5} />
              </button>
            )}
         </div>
      </header>

      {/* ── MAIN WORKSPACE ─────────────────────────────────────────── */}
      <div className="flex-1 flex gap-1.5 p-1.5 overflow-hidden bg-secondary/5">
        
        {activeTab === 'train' && (
          <div className="w-[180px] shrink-0 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
            <LeftSubNav activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />
          </div>
        )}

        <main className={`flex-1 bg-card rounded-xl border border-border overflow-hidden relative shadow-sm flex flex-col ${activeTab === 'talk' ? 'bg-background border-none shadow-none' : ''}`}>
            <div className={`flex-1 overflow-y-auto ${activeTab === 'talk' ? 'p-0' : 'p-4'} no-scrollbar`}>
              {activeTab === 'train' && (
               <BuildTabContent 
                 activeSubTab={activeSubTab}
                 localEmployee={localEmployee}
                 setLocalEmployee={setLocalEmployee}
                 removeSkill={(sid) => removeSkill({ employeeId: id, skillId: sid })}
                 setShowSkillPicker={setShowSkillPicker}
                 removeKnowledge={(kid) => removeKnowledge({ employeeId: id, knowledgeId: kid })}
                 setShowKnowledgeCreator={setShowKnowledgeCreator}
                 allSkills={allSkills}
               />
              )}
              {activeTab === 'talk' && (
                <TalkTabContent localEmployee={localEmployee} />
              )}
              {activeTab === 'history' && (
                <MonitorTabContent runs={[]} setSelectedRun={() => {}} />
              )}
            </div>
        </main>

        {activeTab === 'train' && (
          <div className={`shrink-0 bg-card rounded-xl border border-border overflow-hidden shadow-sm relative transition-all duration-300 ${isPaneCollapsed ? 'w-10' : 'w-[240px]'}`}>
            <RightConfigPane
              localEmployee={localEmployee}
              allSkills={allSkills || []}
              myKnowledge={myKnowledge || []}
              setShowSkillPicker={setShowSkillPicker}
              removeSkill={(sid) => removeSkill({ employeeId: id, skillId: sid })}
              setShowKnowledgeCreator={setShowKnowledgeCreator}
              removeKnowledge={(kid) => removeKnowledge({ employeeId: id, knowledgeId: kid })}
              isPaneCollapsed={isPaneCollapsed}
              setIsPaneCollapsed={setIsPaneCollapsed}
            />
          </div>
        )}
      </div>

      {/* ── MODALS ─────────────────────────────── */}
      {showSkillPicker && (
        <SkillPickerModal
          skills={allSkills || []}
          onClose={() => setShowSkillPicker(false)}
          onSelect={(skill) => {
            const currentSkills = localEmployee.skillIds || [];
            if (!currentSkills.includes(skill.id)) {
              setLocalEmployee({
                ...localEmployee,
                skillIds: [...currentSkills, skill.id],
                skillInstructions: {
                  ...(localEmployee.skillInstructions || {}),
                  [skill.id]: skill.instruction
                }
              });
            }
            setShowSkillPicker(false);
          }}
        />
      )}

      {showKnowledgeCreator && (
        <KnowledgeCreatorModal
          onClose={() => setShowKnowledgeCreator(false)}
          onSave={async (data) => {
            try {
              const created = await createKnowledge(data);
              const currentKnowledge = localEmployee.knowledgeIds || [];
              setLocalEmployee({
                ...localEmployee,
                knowledgeIds: [...currentKnowledge, created.id]
              });
              setShowKnowledgeCreator(false);
              toast.success('Knowledge asset synchronized.');
            } catch (err) {
              toast.error('Failed to sync knowledge asset.');
            }
          }}
        />
      )}
    </div>
  );
}

function TalkTabContent({ localEmployee }: { localEmployee: any }) {
  const { id } = useParams() as { id: string };
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [threadId] = useState(() => {
    // Session-based persistence: memory follows the tab life
    const sessionKey = `thread_session_${id}`;
    const existing = typeof window !== 'undefined' ? sessionStorage.getItem(sessionKey) : null;
    if (existing) return existing;
    const newId = crypto.randomUUID();
    if (typeof window !== 'undefined') sessionStorage.setItem(sessionKey, newId);
    return newId;
  });
  const toast = useToast();

  const handleSend = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const { data } = await api.post(`/employees/${id}/run`, { 
        task: inputValue,
        threadId: threadId 
      });
      const runId = data.runId;
      setCurrentRunId(runId);
      
      const assistantMessageId = Math.random().toString(36).substring(7);
      setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '', steps: [] }]);

      // Establish SSE connection
      const token = localStorage.getItem('workforce_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const eventSource = new EventSource(`${apiUrl}/employees/runs/${runId}/stream?token=${token}`);

      eventSource.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        
        if (payload.type === 'step') {
           setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last.id === assistantMessageId) {
                 return [
                   ...prev.slice(0, -1),
                   { ...last, steps: [...(last.steps || []), payload] }
                 ];
              }
              return prev;
           });
        }

        if (payload.type === 'done') {
           setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last.id === assistantMessageId) {
                  const outputData = payload.output?.data || payload.output;
                  return [
                    ...prev.slice(0, -1),
                    { 
                       ...last, 
                       content: typeof outputData === 'string' ? outputData : JSON.stringify(outputData, null, 2), 
                       status: payload.status 
                    }
                  ];
              }
              return prev;
           });
           setIsProcessing(false);
           eventSource.close();
        }
      };

      eventSource.onerror = () => {
        toast.error('Connection lost.');
        setIsProcessing(false);
        eventSource.close();
      };

    } catch (err: any) {
      toast.error(`Execution failed: ${err.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 no-scrollbar relative z-10 transition-all duration-500 pt-16">
        
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-1000">
             <div className="flex flex-col items-center space-y-3 text-center">
                <div className="size-12 rounded-xl bg-secondary/50 border border-border flex items-center justify-center text-2xl shadow-sm">
                   {localEmployee?.avatar || '🤖'}
                </div>
                    <div className="space-y-1">
                       <h2 className="text-2xl font-bold tracking-tight text-foreground">
                         {localEmployee?.name || 'New Employee'}
                       </h2>
                       <div className="flex flex-col items-center gap-1.5 px-6">
                          <p className="max-w-md text-[9px] font-bold uppercase tracking-widest text-foreground/20 leading-relaxed text-center">
                             {localEmployee?.description || 'Ready for professional assignment.'}
                          </p>
                       </div>
                    </div>
             </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-8 pb-10">
             {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
                   {m.role === 'user' ? (
                     <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-[12px] font-medium text-foreground/90 max-w-[85%] leading-relaxed shadow-sm">
                        {m.content}
                     </div>
                   ) : (
                     <div className="w-full space-y-4">
                        {/* Agent Identity small */}
                        <div className="flex items-center gap-2">
                           <div className="size-6 rounded-md bg-secondary flex items-center justify-center text-[10px] border border-border shadow-sm">{localEmployee?.avatar}</div>
                           <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/10">{localEmployee?.name}</span>
                        </div>

                        {/* Steps (Tool calls etc) */}
                        {m.steps && m.steps.length > 0 && (
                          <div className="space-y-1.5 pl-3 border-l border-border/10">
                             {m.steps.map((step: any, idx: number) => (
                               <div key={idx} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-1 duration-300">
                                  <div className="size-4 rounded-md bg-secondary flex items-center justify-center text-primary border border-border/10">
                                     <Zap size={8} />
                                  </div>
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/20">{step.message || 'Executing...'}</span>
                               </div>
                             ))}
                          </div>
                        )}

                        {/* Final Content */}
                        {m.content && (
                           <div className="bg-card border border-border/10 rounded-xl p-6 text-[13px] font-medium text-foreground/70 leading-relaxed shadow-md animate-in zoom-in-95 duration-500 group">
                              <pre className="whitespace-pre-wrap font-inter italic">{m.content}</pre>
                              
                              <div className="pt-4 mt-4 border-t border-border/5 flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                    <button className="text-[8px] font-bold uppercase tracking-widest text-foreground/10 hover:text-foreground transition-colors">Logs</button>
                                    <button className="text-[8px] font-bold uppercase tracking-widest text-foreground/10 hover:text-foreground transition-colors">Trace</button>
                                 </div>
                                 <div className="size-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                              </div>
                           </div>
                        )}

                        {isProcessing && m.id === messages[messages.length-1].id && !m.content && (
                           <div className="flex items-center gap-1.5 px-6">
                              <div className="size-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <div className="size-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <div className="size-1 bg-primary rounded-full animate-bounce" />
                           </div>
                        )}
                     </div>
                   )}
                </div>
             ))}
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="p-4 lg:p-6 relative z-20">
        <div className="max-w-3xl mx-auto bg-card border border-border/10 rounded-2xl shadow-xl overflow-hidden group/box hover:border-border/20 transition-all duration-700">
           <div className="p-4 lg:p-5 space-y-3">
              <div className="relative group/input flex items-start gap-4">
                 <button className="mt-1 p-1.5 bg-secondary/50 rounded-lg text-foreground/20 hover:bg-primary/10 hover:text-primary transition-all">
                    <Paperclip size={16} />
                 </button>
                 
                 <div className="flex-1 min-h-[32px]">
                    <textarea 
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => {
                         if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                         }
                      }}
                      placeholder={`Interface with ${localEmployee?.name || 'employee'}...`}
                      className="w-full bg-transparent border-none text-[13px] font-medium text-foreground outline-none resize-none pt-1.5 placeholder:text-foreground/5 leading-relaxed no-scrollbar"
                    />
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <button className="p-2 bg-secondary/50 rounded-lg text-foreground/20 hover:bg-primary/10 hover:text-primary transition-all">
                       <Mic size={16} />
                    </button>
                    <button 
                      onClick={handleSend}
                      disabled={!inputValue.trim() || isProcessing}
                      className={`p-2 rounded-lg transition-all shadow-lg ${
                         inputValue.trim() && !isProcessing 
                           ? 'bg-primary text-primary-foreground hover:scale-105 active:scale-95 shadow-primary/20' 
                           : 'bg-foreground/5 text-foreground/5 grayscale cursor-not-allowed'
                      }`}
                    >
                       {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                 </div>
              </div>
           </div>

           <div className="px-6 py-2.5 bg-secondary/10 border-t border-border/5 flex items-center justify-between">
              <button className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-foreground/10 hover:text-foreground transition-colors">
                 <HelpCircle size={10} /> Assist
              </button>
              
              <div className="flex items-center gap-6">
                 <button className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-foreground/10 hover:text-primary transition-colors">
                    <Zap size={10} /> Auto
                 </button>
                 <button className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-primary hover:scale-105 transition-transform">
                    <MessageCircle size={10} /> Chat View
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
