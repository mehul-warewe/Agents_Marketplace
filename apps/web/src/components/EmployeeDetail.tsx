'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useEmployee, useAssignSkill, useRemoveSkill,
  useEmployeeRuns, useRunEmployee, useAssignKnowledge, useRemoveKnowledge,
  useUpdateEmployee, useCreateEmployee, usePublishEmployee
} from '@/hooks/useEmployees';
import { useSkills } from '@/hooks/useSkills';
import { useKnowledge, useCreateKnowledge } from '@/hooks/useKnowledge';
import { 
  Bot, ArrowLeft, ShieldCheck, Save, Clock, MoreHorizontal, 
  Home, Share2, Rocket, Hammer, Activity, LayoutGrid
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/Toast';

// Modular Imports
import { LeftSubNav, RightConfigPane } from './employee-builder/TacticalSidebar';
import { BuildTabContent, MonitorTabContent } from './employee-builder/BuilderTabs';
import RunTabContent from './employee-builder/RunTabContent';
import { RunDetailsModal } from './employee-builder/TelemetryView';
import SkillPickerModal from './employee-builder/SkillPickerModal';
import KnowledgeCreatorModal from './employee-builder/KnowledgeCreatorModal';

type TabType = 'build' | 'run' | 'monitor';
type SubTabType = 'prompt' | 'tools' | 'knowledge' | 'triggers' | 'memory' | 'variables';

export default function EmployeeDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('build');
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('prompt');
  
  const [localEmployee, setLocalEmployee] = useState<any>(null);
  const [missionText, setMissionText] = useState('');
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [showKnowledgeCreator, setShowKnowledgeCreator] = useState(false);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [isPaneCollapsed, setIsPaneCollapsed] = useState(false);

  const isNew = id === 'new';
  const { data: employee } = useEmployee(isNew ? null : id);
  const { data: mySkills } = useSkills();
  const allSkills = mySkills || [];
  const { data: myKnowledge } = useKnowledge();
  const { data: runs } = useEmployeeRuns(isNew ? null : id);

  const { mutate: updateEmployee, isPending: isUpdating } = useUpdateEmployee();
  const { mutate: createEmployee, isPending: isCreating } = useCreateEmployee();
  const { mutate: assignSkill } = useAssignSkill();
  const { mutate: removeSkill } = useRemoveSkill();
  const { mutate: runEmployee, isPending: isRunningMission } = useRunEmployee();
  const { mutate: publishEmployee } = usePublishEmployee();
  const { mutate: assignKnowledge } = useAssignKnowledge();
  const { mutate: removeKnowledge } = useRemoveKnowledge();
  const { mutate: createKnowledge } = useCreateKnowledge();

  useEffect(() => {
    if (isNew) {
      setLocalEmployee({ 
        name: '', description: '', systemPrompt: '', 
        skillIds: [], knowledgeIds: [], skillInstructions: {} 
      });
    } else if (employee) {
      setLocalEmployee(employee);
    }
  }, [employee, isNew]);

  const handleSave = () => {
    if (!localEmployee.name) {
      toast.error('Agent requires a name.');
      return;
    }
    if (isNew) {
      createEmployee(localEmployee, {
        onSuccess: (data) => {
          toast.success('Professional onboarding complete.');
          router.replace(`/employees/${data.id}`);
        },
        onError: (err: any) => toast.error(`Onboarding failure: ${err.message}`)
      });
    } else {
      const { id: _, createdAt: __, updatedAt: ___, ...updateData } = localEmployee;
      updateEmployee({ id, data: updateData }, {
        onSuccess: () => toast.success('Agent profile updated.'),
        onError: (err: any) => toast.error(`Sync failure: ${err.message}`)
      });
    }
  };

  const handleRunMission = () => {
    if (!missionText.trim()) return;
    runEmployee({ employeeId: id, task: missionText }, {
      onSuccess: (data: any) => {
        toast.success('Task execution started.');
        setMissionText('');
        setActiveRunId(data.runId);
      },
      onError: (err: any) => toast.error(`Execution failure: ${err.message}`)
    });
  };

  if (!localEmployee && !isNew) {
    return (
      <div className="flex-1 bg-background flex flex-col items-center justify-center p-12 h-full uppercase italic">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-8 text-[10px] font-bold text-muted uppercase tracking-[0.4em]">Loading agent profile...</p>
      </div>
    );
  }

  if (!localEmployee) return null;

  return (
    <div className="flex-1 bg-background flex flex-col h-full overflow-hidden font-inter text-foreground">
      
      {/* ── TOP NAVIGATION BAR (Screenshot 1) ────────────────────────── */}
      <header className="h-[72px] border-b border-border/40 bg-card/10 backdrop-blur-3xl flex items-center justify-between px-8 shrink-0 z-50">
        <div className="flex items-center gap-8">
           {/* Breadcrumbs */}
           <div className="flex items-center gap-4">
              <button onClick={() => router.push('/employees')} className="p-3 bg-foreground/5 rounded-2xl hover:bg-foreground/10 transition-all text-muted">
                 <Home size={18} strokeWidth={2.5} />
              </button>
              <div className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                    <Bot size={18} strokeWidth={2.5} />
                 </div>
                 <div className="flex items-center gap-4">
                    <h1 className="text-sm font-bold tracking-tight text-foreground leading-none">{isNew ? 'New Agent profile' : localEmployee?.name}</h1>
                    {!isNew && (
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider leading-none ${
                        localEmployee?.isPublished
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${localEmployee?.isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                         {localEmployee?.isPublished ? 'Live' : 'Draft'}
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>

        {/* Center Tabs */}
        <nav className="flex items-center bg-foreground/5 rounded-2xl p-1 border border-border/40">
           {[
             { id: 'build', label: 'Build', icon: Hammer },
             { id: 'run', label: 'Run', icon: LayoutGrid },
             { id: 'monitor', label: 'Monitor', icon: Activity }
           ].map(tab => {
             const disabled = false;
             const active = activeTab === tab.id;
             return (
               <button 
                 key={tab.id} 
                 onClick={() => !disabled && setActiveTab(tab.id as TabType)}
                 disabled={disabled}
                 className={`px-10 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3
                   ${active ? 'bg-card text-foreground shadow-2xl border border-border/60' : 'text-muted hover:text-foreground'}
                   ${disabled ? 'opacity-20 cursor-not-allowed' : ''}`}
               >
                 <tab.icon size={14} strokeWidth={2.5} className={active ? 'text-primary' : 'text-muted'} />
                 {tab.label}
               </button>
             );
           })}
        </nav>

        {/* Action Toolbar */}
        <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={isUpdating || isCreating}
              className="px-8 py-3 bg-foreground/5 border border-border/40 hover:bg-foreground/10 text-foreground rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all"
            >
               {isUpdating || isCreating ? (isNew ? 'CREATING...' : 'UPDATING...') : (isNew ? 'Create Agent' : 'Save')}
            </button>
            {!isNew && (
              <button
                onClick={() => publishEmployee({ id, published: !localEmployee?.isPublished })}
                className="px-10 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-indigo-600/20 hover:scale-[1.05] transition-all flex items-center gap-4 italic"
              >
                 {localEmployee?.isPublished ? 'Unpublish' : 'Publish'} <Rocket size={16} strokeWidth={3} />
              </button>
            )}
         </div>
      </header>

      {/* ── MAIN CONTENT AREA ─────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        
        {activeTab === 'build' && (
          <LeftSubNav activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />
        )}

        <main className="flex-1 overflow-y-auto p-12 custom-scrollbar no-scrollbar bg-card/5">
           {activeTab === 'build' && (
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

           {activeTab === 'run' && (
             <RunTabContent
               employee={localEmployee}
               missionText={missionText}
               setMissionText={setMissionText}
               handleRunMission={handleRunMission}
               isRunningMission={isRunningMission}
               activeRunId={activeRunId}
             />
           )}

           {activeTab === 'monitor' && (
             <MonitorTabContent 
               runs={runs}
               setSelectedRun={setSelectedRun}
             />
           )}
        </main>

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

      {/* MODALS */}
      <AnimatePresence>
         {showSkillPicker && (
            <SkillPickerModal 
              skills={allSkills}
              onClose={() => setShowSkillPicker(false)} 
              onSelect={(val: any) => {
                 assignSkill({ employeeId: id, skillId: val.id, instruction: val.instruction }, {
                    onSuccess: () => {
                       setShowSkillPicker(false);
                       toast.success('Skill added.');
                    }
                 });
              }}
            />
         )}
         {showKnowledgeCreator && (
            <KnowledgeCreatorModal 
               onClose={() => setShowKnowledgeCreator(false)} 
               onSave={(val: any) => {
                  createKnowledge(val, {
                     onSuccess: (data) => {
                        assignKnowledge({ employeeId: id, knowledgeId: data.id }, {
                           onSuccess: () => {
                              setShowKnowledgeCreator(false);
                              toast.success('Knowledge base updated.');
                           }
                        });
                     }
                  });
               }}
            />
         )}
         {selectedRun && (
            <RunDetailsModal run={selectedRun} onClose={() => setSelectedRun(null)} />
         )}
      </AnimatePresence>
    </div>
  );
}
