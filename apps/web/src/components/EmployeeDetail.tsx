'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEmployee, useUpdateEmployee, useAssignSkill, useRemoveSkill, useEmployeeRuns } from '@/hooks/useEmployees';
import { usePublishedSkills } from '@/hooks/useSkills';
import { 
  Bot, Zap, Settings, Plus, X, ArrowLeft, Target, Terminal, Activity, 
  Layers, CheckCircle, Clock, XCircle, Play, MoreHorizontal, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/Toast';

export default function EmployeeDetail() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [skillInstruction, setSkillInstruction] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  const { data: employee, isLoading: empLoading } = useEmployee(id as string);
  const { data: allSkills, isLoading: skillsLoading } = usePublishedSkills();
  const { data: runs } = useEmployeeRuns(id as string);

  const { mutate: assignSkill, isPending: isAssigning } = useAssignSkill();
  const { mutate: removeSkill } = useRemoveSkill();
  const { mutate: updateEmployee } = useUpdateEmployee();

  const handleAssign = () => {
    if (!selectedSkillId) return;
    assignSkill({ 
      employeeId: id as string, 
      skillId: selectedSkillId, 
      instruction: skillInstruction 
    }, {
      onSuccess: () => {
        setShowSkillPicker(false);
        setSkillInstruction('');
        setSelectedSkillId(null);
        toast.success('Skill logical-link established.');
      }
    });
  };

  const handleRemove = (skillId: string) => {
    removeSkill({ employeeId: id as string, skillId }, {
      onSuccess: () => toast.success('Logic module decoupled.')
    });
  };

  if (empLoading) {
    return (
      <div className="flex-1 bg-background flex flex-col items-center justify-center p-12">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-8 text-muted font-black text-[10px] uppercase tracking-[0.4em]">Syncing Operative Stream...</p>
      </div>
    );
  }

  if (!employee) return <div>Employee not found</div>;

  return (
    <div className="flex-1 bg-background min-h-full text-foreground p-6 sm:p-10 lg:p-14 overflow-y-auto w-full no-scrollbar font-inter">
      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* Breadcrumbs & Actions */}
        <div className="flex justify-between items-center px-4">
           <button 
             onClick={() => router.push('/employees')}
             className="flex items-center gap-3 text-muted hover:text-foreground transition-all group"
           >
              <div className="p-2 bg-foreground/5 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                 <ArrowLeft size={16} strokeWidth={3} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Fleet_Registry</span>
           </button>
           
           <div className="flex gap-4">
              <button 
                className="p-4 bg-foreground/5 rounded-2xl text-muted hover:text-foreground transition-all border border-border/40"
              >
                 <Settings size={20} />
              </button>
           </div>
        </div>

        {/* Hero Section */}
        <section className="bg-card rounded-[4rem] border border-border/60 p-12 md:p-16 relative overflow-hidden shadow-2xl mx-4">
           <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03] pointer-events-none">
              <Bot size={500} className="translate-x-1/2 -translate-y-1/4" />
           </div>
           
           <div className="relative z-10 flex flex-col md:flex-row justify-between gap-12 items-start">
              <div className="space-y-8 max-w-2xl">
                 <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-primary/20 text-primary border border-primary/20 rounded-3xl flex items-center justify-center shadow-xl shadow-primary/10">
                       <Bot size={36} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-1">
                       <div className="flex items-center gap-2 text-emerald-500">
                          <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-[0.4em]">Operative_Active</span>
                       </div>
                       <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">{employee.name}</h1>
                    </div>
                 </div>
                 
                 <p className="text-muted text-sm font-bold uppercase tracking-wider leading-relaxed opacity-60">
                    {employee.description}
                 </p>
                 
                 <div className="flex gap-8 pt-4">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-muted uppercase tracking-[0.4em] opacity-40 mb-2">Cluster_Status</span>
                       <div className="flex items-center gap-2 text-primary">
                          <ShieldCheck size={16} />
                          <span className="text-sm font-black italic uppercase italic tracking-tighter">Verified_Agent</span>
                       </div>
                    </div>
                    <div className="w-px h-12 bg-border/40" />
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-muted uppercase tracking-[0.4em] opacity-40 mb-2">Personnel_ID</span>
                       <span className="text-sm font-black italic uppercase italic tracking-tighter opacity-60">AH-OPS-{employee.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col gap-4 w-full md:w-auto">
                 <button 
                   onClick={() => setShowSkillPicker(true)}
                   className="bg-primary text-primary-foreground px-12 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] hover:scale-[1.05] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-primary/30"
                 >
                    <Plus size={20} strokeWidth={3} /> ASSIGN_LOGIC
                 </button>
              </div>
           </div>
        </section>

        {/* Assigned Skills Grid */}
        <section className="space-y-10 px-4">
           <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black tracking-tighter italic uppercase text-foreground/80">Assigned_Capabilities</h2>
              <span className="px-4 py-1.5 bg-foreground/5 rounded-full text-[10px] font-black text-muted uppercase tracking-[0.2em]">{employee.skillIds?.length || 0} MODULES</span>
           </div>

           {!employee.skillIds || employee.skillIds.length === 0 ? (
              <div className="py-32 flex flex-col items-center justify-center bg-card rounded-[4rem] border-2 border-border/60 border-dashed text-center">
                 <div className="w-20 h-20 bg-foreground/[0.03] rounded-3xl flex items-center justify-center text-muted/20 mb-8">
                    <Zap size={32} />
                 </div>
                 <h3 className="text-xl font-black italic uppercase tracking-tighter text-muted">Tabula_Rasa</h3>
                 <p className="text-[10px] text-muted/40 font-bold uppercase tracking-widest mt-4">No skills assigned to this operative yet.</p>
              </div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {employee.skillIds.map((sid: string) => {
                    const skill = allSkills?.find((s: any) => s.id === sid);
                    return (
                       <SkillAssignmentCard 
                          key={sid} 
                          skill={skill} 
                          onRemove={() => handleRemove(sid)}
                       />
                    );
                 })}
              </div>
           )}
        </section>

        {/* Execution Logs (Coming soon / Basic display) */}
        <section className="space-y-10 px-4">
           <h2 className="text-3xl font-black tracking-tighter italic uppercase text-foreground/80">Operative_Telemetry</h2>
           <div className="bg-card rounded-[3rem] border border-border/60 overflow-hidden shadow-xl">
              {runs && runs.length > 0 ? (
                 <div className="divide-y divide-border/20">
                    {runs.map((run: any) => (
                       <div key={run.id} className="p-8 flex items-center justify-between hover:bg-foreground/[0.01] transition-all">
                          <div className="flex items-center gap-6">
                             <div className={`p-4 rounded-2xl ${run.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-foreground/5 text-muted'}`}>
                                <Activity size={20} strokeWidth={2.5} />
                             </div>
                             <div>
                                <div className="font-black italic uppercase tracking-tighter text-sm mb-1">RUN::{run.id.slice(0, 8)}</div>
                                <div className="text-[10px] font-bold text-muted uppercase tracking-widest opacity-40">
                                   {new Date(run.createdAt).toLocaleString()}
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-8">
                             <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${run.status === 'completed' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' : 'bg-red-500/5 text-red-500 border-red-500/10'} text-[9px] font-black uppercase tracking-widest`}>
                                {run.status === 'completed' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                {run.status}
                             </div>
                             <button className="p-2 text-muted hover:text-foreground transition-all">
                                <ChevronRight size={18} />
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
              ) : (
                 <div className="py-24 text-center">
                    <span className="text-[10px] font-black text-muted uppercase tracking-[0.4em] italic opacity-20">Waiting_for_trigger_signals...</span>
                 </div>
              )}
           </div>
        </section>
      </div>

      {/* Skill Picker Modal */}
      <AnimatePresence>
         {showSkillPicker && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                  onClick={() => setShowSkillPicker(false)}
               />
               <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative w-full max-w-4xl max-h-[80vh] bg-card border border-border/60 rounded-[4rem] shadow-2xl overflow-hidden flex flex-col"
               >
                  <div className="p-12 border-b border-border/40 flex justify-between items-center shrink-0">
                     <div className="space-y-2">
                        <div className="flex items-center gap-3 text-primary">
                           <Layers size={20} strokeWidth={3} />
                           <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Knowledge_Access_Point</span>
                        </div>
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Select_Logic_Module</h2>
                     </div>
                     <button onClick={() => setShowSkillPicker(false)} className="p-4 bg-foreground/5 rounded-2xl hover:bg-foreground/10 transition-all">
                        <X size={24} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {allSkills?.map((skill: any) => (
                           <div 
                              key={skill.id}
                              onClick={() => setSelectedSkillId(skill.id)}
                              className={`p-10 rounded-[2.5rem] border-2 transition-all cursor-pointer relative group ${selectedSkillId === skill.id ? 'bg-primary/10 border-primary' : 'bg-foreground/[0.02] border-border/40 hover:border-primary/40'}`}
                           >
                              <div className="flex items-center justify-between mb-6">
                                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${selectedSkillId === skill.id ? 'bg-primary text-primary-foreground' : 'bg-foreground/5 text-muted group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                    <Zap size={20} strokeWidth={2.5} />
                                 </div>
                                 {selectedSkillId === skill.id && <CheckCircle className="text-primary" size={24} strokeWidth={3} />}
                              </div>
                              <h4 className="text-xl font-black italic uppercase tracking-tighter mb-3 truncate">{skill.name}</h4>
                              <p className="text-[10px] text-muted font-bold uppercase opacity-40 line-clamp-2 leading-relaxed tracking-wider">{skill.description}</p>
                           </div>
                        ))}
                     </div>
                     
                     {selectedSkillId && (
                        <motion.div 
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="mt-12 space-y-6 bg-foreground/[0.03] p-10 rounded-[2.5rem] border border-primary/20"
                        >
                           <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary block ml-4">Deployment_Instructions</label>
                           <textarea 
                              placeholder="HOW SHOULD THE EMPLOYEE USE THIS SKILL? (E.G. ALWAYS TRANSLATE OUTPUT TO SPANISH)"
                              className="w-full bg-background border border-border/60 rounded-2xl p-6 text-sm font-bold uppercase focus:outline-none focus:border-primary transition-all resize-none"
                              rows={3}
                              value={skillInstruction}
                              onChange={e => setSkillInstruction(e.target.value)}
                           />
                        </motion.div>
                     )}
                  </div>

                  <div className="p-12 border-t border-border/40 shrink-0">
                     <button 
                       onClick={handleAssign}
                       disabled={!selectedSkillId || isAssigning}
                       className="w-full h-20 bg-primary text-primary-foreground rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl shadow-primary/20 flex items-center justify-center gap-4"
                     >
                        {isAssigning ? 'DEPLOYING...' : 'CONFIRM_DEPLOYMENT'}
                        <Target size={20} strokeWidth={3} />
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}

function SkillAssignmentCard({ skill, onRemove }: { skill: any, onRemove: () => void }) {
  if (!skill) return null;
  
  return (
    <div className="bg-card rounded-[3.5rem] border border-border/60 p-10 flex flex-col gap-8 group hover:border-primary/40 transition-all duration-500 shadow-xl overflow-hidden relative">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
               <Zap size={24} strokeWidth={2.5} className="fill-current" />
            </div>
            <div>
               <h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none group-hover:text-primary transition-colors">{skill.name}</h4>
               <span className="text-[8px] font-black text-muted uppercase tracking-[0.4em] opacity-40">MODULE_LOADED</span>
            </div>
         </div>
         <button 
           onClick={(e) => { e.stopPropagation(); onRemove(); }}
           className="p-4 bg-foreground/5 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all"
         >
            <X size={18} strokeWidth={3} />
         </button>
      </div>
      
      <p className="text-muted text-[10px] font-bold uppercase tracking-widest line-clamp-2 opacity-40 leading-relaxed min-h-[3ch]">
         {skill.description}
      </p>

      <div className="pt-8 border-t border-border/40 mt-auto flex items-center justify-between">
         <div className="flex flex-col">
            <span className="text-[8px] font-black text-muted uppercase tracking-widest opacity-30 mb-0.5">Logic_Density</span>
            <span className="text-xs font-black italic uppercase tracking-tighter">{skill.workflow?.nodes?.length || 0} Nodes</span>
         </div>
         <div className="px-4 py-2 bg-foreground/5 rounded-xl flex items-center gap-2 group-hover:bg-primary/5 transition-all">
            <ShieldCheck size={14} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted group-hover:text-primary">Secured</span>
         </div>
      </div>
    </div>
  );
}
