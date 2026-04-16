'use client';

import React, { useEffect } from 'react';
import { Zap, Bot, ArrowUpRight, Search, Plus, Terminal, Activity, Layers, Play, Settings, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useSkills, useDeleteSkill } from '@/hooks/useSkills';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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
    <div className="flex-1 text-foreground space-y-3 p-2 lg:p-4 bg-secondary/5">
      <div className="space-y-3">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
           <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-foreground">
                Skill Library
              </h1>
              <p className="text-muted-foreground font-medium text-[11px] uppercase tracking-widest leading-none">
                Deployable vertical logic units
              </p>
           </div>
           
           <Button 
              onClick={() => router.push('/skills/builder')}
              size="sm"
              className="h-9 px-6 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
           >
              <Plus size={14} strokeWidth={2.5} /> 
              New Skill
           </Button>
        </div>


        {/* Skills Grid */}
        {skillsLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                 <div key={i} className="h-40 bg-card rounded-xl border border-border/40 animate-pulse" />
              ))}
           </div>
        ) : !skills || skills.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-24 text-center px-12 border border-border/40 border-dashed rounded-2xl mx-2 bg-card/50">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground/30 mb-6">
                 <Zap size={24} />
              </div>
              <h3 className="text-lg font-bold font-display mb-2 uppercase tracking-tight">Vault Empty</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-[10px] font-medium uppercase tracking-widest">
                No custom capabilities detected in the registry.
              </p>
              <Button onClick={() => router.push('/skills/builder')} size="sm">
                Initialize Skill
              </Button>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-2">
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
    <Card 
      onClick={onClick}
      className="p-6 flex flex-col gap-6 cursor-pointer group hover:shadow-lg transition-all shadow-md relative overflow-hidden bg-card border-border/40"
    >
      <div className="flex items-center justify-between">
         <div className="w-10 h-10 rounded-[10px] bg-card border border-border flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
            <Layers size={20} />
         </div>
         <div className="flex items-center gap-2">
            <button 
               onClick={onDelete}
               className="p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-all"
            >
               <Trash2 size={16} />
            </button>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-card border border-border shadow-sm">
               <span className="text-[10px] font-bold text-muted-foreground uppercase">{skill.category || 'GENERAL'}</span>
               <div className={`w-1.5 h-1.5 rounded-full ${skill.isPublished ? 'bg-primary' : 'bg-muted-foreground'}`} />
            </div>
         </div>
      </div>

      <div className="space-y-2">
         <h3 className="text-lg font-bold font-display tracking-tight text-foreground truncate">{skill.name}</h3>
         <p className="text-sm text-muted-foreground line-clamp-2">
            {skill.description || 'No capability report provided for this logic unit.'}
         </p>
      </div>

      <div className="pt-4 border-t border-border mt-auto flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="flex flex-col">
               <span className="text-[10px] font-medium text-muted-foreground uppercase">Nodes</span>
               <span className="text-sm font-bold text-foreground">{nodeCount}</span>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex flex-col">
               <span className="text-[10px] font-medium text-muted-foreground uppercase">ID</span>
               <span className="text-sm font-bold text-muted-foreground">#{skill.id.slice(0, 4)}</span>
            </div>
         </div>
         <div className="w-8 h-8 rounded-md bg-card border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
            <Play size={14} className="ml-0.5" />
         </div>
      </div>
    </Card>
  );
}
