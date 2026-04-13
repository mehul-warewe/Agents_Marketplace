'use client';

import React, { useEffect } from 'react';
import { Zap, Bot, ArrowUpRight, Search, Plus, Terminal, Activity, Layers, Play, Settings, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useSkills, useDeleteSkill } from '@/hooks/useSkills';
import { motion } from 'framer-motion';

export default function SkillDashboard() {
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  
  const { data: skills, isLoading: skillsLoading } = useSkills();
  const { mutate: deleteSkill } = useDeleteSkill();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to purge this skill from the library?')) {
      deleteSkill(id);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 bg-background min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-foreground border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-6 text-muted font-black text-xs uppercase tracking-widest">Accessing Skill Vault...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background min-h-full text-foreground p-6 sm:p-10 lg:p-14 overflow-y-auto w-full no-scrollbar font-inter">
      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 px-4">
           <div className="space-y-4">
              <div className="flex items-center gap-4 text-primary">
                 <Zap size={32} strokeWidth={3} className="fill-current" />
                 <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">Knowledge_Cluster</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-none uppercase italic">
                SKILL_<span className="text-muted/20">LIBRARY</span>
              </h1>
              <p className="text-muted font-bold uppercase text-[10px] tracking-widest max-w-md opacity-40 leading-relaxed">
                Discrete vertical logic units. Assign these functional blocks to your AI employees to extend their operational capabilities.
              </p>
           </div>
           
           <button 
              onClick={() => router.push('/skills/builder')}
              className="bg-primary text-primary-foreground px-12 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-primary/30 group"
           >
              <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" /> 
              DEVELOP_SKILL
           </button>
        </div>

        {/* Search & Filter (Placeholder for now) */}
        <div className="relative group mx-4">
           <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none text-muted group-focus-within:text-primary transition-colors">
              <Search size={18} strokeWidth={3} />
           </div>
           <input 
              type="text" 
              placeholder="SEARCH_REGISTRY..." 
              className="w-full bg-card border border-border/60 rounded-[2.5rem] py-8 pl-18 pr-10 text-xs font-black uppercase tracking-widest placeholder:text-muted/20 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all shadow-xl"
           />
        </div>

        {/* Skills Grid */}
        {skillsLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                 <div key={i} className="h-80 bg-card/50 rounded-[3.5rem] animate-pulse border border-border/40" />
              ))}
           </div>
        ) : !skills || skills.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-48 text-center px-12 mx-4 bg-card rounded-[4rem] border border-border/60 border-dashed">
              <div className="w-24 h-24 bg-foreground/[0.03] rounded-[2.5rem] flex items-center justify-center text-muted/20 mb-12 border border-border/40">
                 <Zap size={48} strokeWidth={1} />
              </div>
              <h3 className="text-3xl font-black mb-4 italic uppercase tracking-tighter leading-none">Registry_Empty</h3>
              <p className="text-muted mb-12 max-w-xs mx-auto font-bold opacity-30 uppercase text-xs leading-relaxed tracking-wider">
                No vertical workflows detected in the vault. Initialise your first capability using the visual builder.
              </p>
              <button onClick={() => router.push('/skills/builder')} className="bg-foreground text-background px-16 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] hover:scale-[1.05] transition-all">
                LAUNCH_ENGINE
              </button>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4">
              {skills.map((skill: any) => (
                 <SkillCard 
                    key={skill.id} 
                    skill={skill} 
                    onClick={() => router.push(`/skills/builder?id=${skill.id}`)}
                    onDelete={(e) => handleDelete(e, skill.id)}
                 />
              ))}
           </div>
        )}
      </div>
    </div>
  );
}

function SkillCard({ skill, onClick, onDelete }: { skill: any, onClick: () => void, onDelete: (e: React.MouseEvent) => void }) {
  const nodeCount = skill.workflow?.nodes?.length || 0;
  
  return (
    <motion.div 
      whileHover={{ y: -12, scale: 1.01 }}
      onClick={onClick}
      className="bg-card rounded-[3.5rem] border border-border/60 p-10 flex flex-col gap-8 cursor-pointer group hover:border-primary/40 transition-all duration-500 shadow-xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000 opacity-20" />
      
      <div className="flex items-center justify-between relative z-10">
         <div className="w-14 h-14 bg-foreground/[0.03] border border-border/40 rounded-2xl flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-500 shadow-inner">
            <Layers size={24} strokeWidth={2.5} />
         </div>
         <div className="flex items-center gap-4">
            <button 
               onClick={onDelete}
               className="p-3 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
            >
               <Trash2 size={18} strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-black text-muted group-hover:text-primary transition-colors uppercase tracking-[0.2em]">{skill.category || 'GENERAL'}</span>
               <div className={`w-1.5 h-1.5 rounded-full ${skill.isPublished ? 'bg-primary' : 'bg-muted/30'}`} />
            </div>
         </div>
      </div>

      <div className="space-y-4 relative z-10">
         <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none group-hover:text-primary transition-colors truncate">{skill.name}</h3>
         <p className="text-muted text-[10px] font-bold uppercase tracking-widest line-clamp-2 opacity-40 leading-relaxed min-h-[3ch]">
            {skill.description || 'No capability report provided for this logic unit.'}
         </p>
      </div>

      <div className="pt-8 border-t border-border/40 mt-auto flex items-center justify-between relative z-10">
         <div className="flex items-center gap-6">
            <div className="flex flex-col">
               <span className="text-[8px] font-black text-muted uppercase tracking-widest opacity-30 mb-0.5">Complexity</span>
               <span className="text-xs font-black italic uppercase tracking-tighter">{nodeCount} Nodes</span>
            </div>
            <div className="w-px h-6 bg-border/40" />
            <div className="flex flex-col">
               <span className="text-[8px] font-black text-muted uppercase tracking-widest opacity-30 mb-0.5">Registry_ID</span>
               <span className="text-xs font-black italic uppercase tracking-tighter opacity-60">#{skill.id.slice(0, 4)}</span>
            </div>
         </div>
         <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-muted group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
            <Play size={16} strokeWidth={3} className="ml-0.5" />
         </div>
      </div>
    </motion.div>
  );
}
