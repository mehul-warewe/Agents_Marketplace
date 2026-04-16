'use client';

import React, { useState } from 'react';
import { Bot, Plus, Search, Terminal, Activity, User, ChevronRight, Zap, Target, Share2, MoreHorizontal, Settings, ShieldCheck, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEmployees, useCreateEmployee, useDeleteEmployee } from '@/hooks/useEmployees';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function EmployeeDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  const { data: employees, isLoading } = useEmployees();
  const { mutate: createEmployee, isPending: isCreating } = useCreateEmployee();
  const { mutate: deleteEmployee } = useDeleteEmployee();

  const handleCreateNew = () => {
    router.push('/employees/new');
  };

  return (
    <div className="flex-1 text-foreground space-y-3 p-2 lg:p-4 bg-secondary/5">
      <div className="space-y-4">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 px-1">
           <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-foreground">
                Active Workforce
              </h1>
              <p className="text-muted-foreground font-medium text-[11px] max-w-md">
                Manage and deploy your specialized AI agents. Each professional can be equipped with custom skills.
              </p>
           </div>
           
           <Button 
              onClick={handleCreateNew}
              disabled={isCreating}
              size="sm"
              className="gap-2 h-9 px-5 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
           >
              {isCreating ? <Activity size={14} className="animate-spin" /> : <UserPlus size={14} strokeWidth={2.5} />} 
              {isCreating ? 'Creating...' : 'Add Agent'}
           </Button>
        </div>

        {/* Employees Grid */}
        {isLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-2">
              {[1,2,3,4].map(i => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
           </div>
        ) : !employees || employees.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center px-10 border border-border border-dashed rounded-2xl mx-2 bg-card shadow-sm">
              <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center text-muted-foreground mb-4">
                 <User size={28} />
              </div>
              <h3 className="text-lg font-bold font-display mb-1 uppercase tracking-tight">Workforce Empty</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-[11px] font-medium leading-relaxed">
                No active professionals detected. Start by creating a new agent and assigning specialized capabilities.
              </p>
              <Button onClick={handleCreateNew} disabled={isCreating} size="sm" className="rounded-xl font-bold text-[10px] uppercase tracking-widest h-9 px-6">
                {isCreating ? 'Preparing Workspace...' : 'Create First Agent'}
              </Button>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-2">
              {employees.map((emp: any) => (
                 <EmployeeCard 
                    key={emp.id} 
                    employee={emp} 
                    onClick={() => router.push(`/employees/${emp.id}`)}
                    onDelete={() => deleteEmployee(emp.id)}
                 />
              ))}
           </div>
        )}
      </div>
    </div>
  );
}

function EmployeeCard({ employee, onClick, onDelete }: { employee: any, onClick: () => void, onDelete: () => void }) {
  return (
    <Card 
      onClick={onClick}
      className="p-4 flex flex-col gap-4 cursor-pointer group hover:shadow-xl transition-all shadow-md relative overflow-hidden bg-card border-border/40 hover:-translate-y-1 duration-300 rounded-2xl"
    >
      <div className="flex items-center justify-between shrink-0">
         <div className="w-9 h-9 rounded-xl bg-secondary border border-border/60 flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
            <Bot size={16} />
         </div>
         <div className="flex items-center gap-1.5">
            <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold uppercase text-emerald-500 shadow-xs tracking-widest">
               Active
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); if(confirm('Remove this agent?')) onDelete(); }}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
            >
               <MoreHorizontal size={14} />
            </button>
         </div>
      </div>

      <div className="space-y-1 min-h-[60px]">
         <h3 className="text-sm font-bold font-display tracking-tight text-foreground truncate">{employee.name}</h3>
         <p className="text-[10px] text-muted-foreground font-medium line-clamp-2 leading-relaxed">
            {employee.description || "No professional summary defined for this agent."}
         </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
         {employee.skillIds && employee.skillIds.length > 0 ? (
            employee.skillIds.slice(0, 3).map((s: string, i: number) => (
               <div key={i} className="px-2 py-0.5 bg-secondary/80 border border-border/60 rounded-md text-[9px] font-bold text-foreground/50 shadow-xs uppercase tracking-tighter">
                  Skill {i+1}
               </div>
            ))
         ) : (
            <div className="w-full px-2 py-1.5 bg-secondary/50 border border-border border-dashed rounded-lg text-[9px] font-bold text-muted-foreground/30 flex items-center gap-2 uppercase tracking-widest">
               <Target size={12} /> No skills
            </div>
         )}
      </div>

      <div className="pt-3 mt-auto border-t border-border/5 flex items-center justify-between">
         <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/20">Skills</span>
            <span className="text-[10px] font-bold text-primary">{employee.skillIds?.length || 0}</span>
         </div>
         <div className="flex items-center gap-1 text-primary font-bold text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            Config <ChevronRight size={12} strokeWidth={3} />
         </div>
      </div>
    </Card>
  );
}
