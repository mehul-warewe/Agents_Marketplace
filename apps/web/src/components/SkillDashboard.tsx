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
    <div className="flex-1 text-foreground space-y-8 p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
           <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight text-foreground">
                Skill Library
              </h1>
              <p className="text-muted-foreground font-medium text-sm max-w-md">
                Discrete vertical logic units. Assign these functional blocks to your AI employees to extend their operational capabilities.
              </p>
           </div>
           
           <Button 
              onClick={() => router.push('/skills/builder')}
              size="lg"
              className="gap-2"
           >
              <Plus size={16} /> 
              Create Skill
           </Button>
        </div>


        {/* Skills Grid */}
        {skillsLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                 <div key={i} className="h-48 bg-muted rounded-[10px] animate-pulse" />
              ))}
           </div>
        ) : !skills || skills.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-32 text-center px-12 border border-border border-dashed rounded-[10px] mx-4 bg-card shadow-sm">
              <div className="w-16 h-16 bg-muted rounded-[10px] flex items-center justify-center text-muted-foreground mb-6">
                 <Zap size={32} />
              </div>
              <h3 className="text-xl font-bold font-display mb-2">Registry Empty</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-sm">
                No vertical workflows detected in the vault. Initialise your first capability using the visual builder.
              </p>
              <Button onClick={() => router.push('/skills/builder')}>
                Create First Skill
              </Button>
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
