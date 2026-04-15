'use client';

import React, { useState } from 'react';
import { Bot, Plus, Search, Terminal, Activity, User, ChevronRight, Zap, Target, Share2, MoreHorizontal, Settings, ShieldCheck, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEmployees, useCreateEmployee, useDeleteEmployee } from '@/hooks/useEmployees';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/Toast';

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
    <div className="flex-1 bg-background min-h-full text-foreground p-6 sm:p-10 lg:p-14 overflow-y-auto w-full no-scrollbar font-inter">
      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 px-4">
           <div className="space-y-4">
              <div className="flex items-center gap-4 text-primary">
                 <Bot size={32} strokeWidth={2.5} className="fill-current" />
                 <span className="text-[11px] font-bold uppercase tracking-wider">Agent Database</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-none">
                Active <span className="text-muted/20">Workforce</span>
              </h1>
              <p className="text-muted font-medium text-sm max-w-md opacity-60 leading-relaxed italic">
                Manage and deploy your specialized AI agents. Each professional can be equipped with custom skills to perform complex operations autonomously.
              </p>
           </div>
           
           <button 
              onClick={handleCreateNew}
              disabled={isCreating}
              className="bg-primary text-primary-foreground px-12 py-5 rounded-[2rem] font-bold text-xs uppercase tracking-widest hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-primary/30 group disabled:opacity-50"
           >
              {isCreating ? <Activity size={20} className="animate-pulse" /> : <UserPlus size={20} strokeWidth={2.5} />} 
              {isCreating ? 'Creating...' : 'Add Agent'}
           </button>
        </div>

        {/* Employees Grid */}
        {isLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-4">
              {[1,2,3,4].map(i => <div key={i} className="h-96 bg-card/50 rounded-[3.5rem] animate-pulse border border-border/40" />)}
           </div>
        ) : !employees || employees.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-48 text-center px-12 mx-4 bg-card rounded-[4rem] border border-border/60 border-dashed">
              <div className="w-24 h-24 bg-foreground/[0.03] rounded-[2.5rem] flex items-center justify-center text-muted/20 mb-12 border border-border/40">
                 <User size={48} strokeWidth={1} />
              </div>
              <h3 className="text-3xl font-bold mb-4 tracking-tight">Workforce Empty</h3>
              <p className="text-muted mb-12 max-w-xs mx-auto text-sm font-medium opacity-60 leading-relaxed italic">
                No active professionals detected. Start by creating a new agent and assign specialized capabilities.
              </p>
              <button onClick={handleCreateNew} disabled={isCreating} className="bg-foreground text-background px-16 py-6 rounded-[2rem] font-bold text-xs uppercase tracking-widest hover:scale-[1.05] transition-all disabled:opacity-50">
                {isCreating ? 'Preparing Workspace...' : 'Create First Agent'}
              </button>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-4">
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
    <motion.div 
      whileHover={{ y: -6, scale: 1.01 }}
      className="bg-card rounded-[2.5rem] border border-border/60 p-10 flex flex-col gap-8 cursor-pointer group hover:border-primary/30 transition-all duration-500 shadow-xl hover:shadow-2xl relative overflow-hidden"
      onClick={onClick}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000 opacity-0 group-hover:opacity-100" />
      
      <div className="flex items-center justify-between relative z-10">
         <div className="w-14 h-14 rounded-2xl bg-foreground/[0.03] border border-border/40 flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner group-hover:shadow-lg group-hover:scale-105">
            <Bot size={24} strokeWidth={2.5} />
         </div>
         <div className="flex items-center gap-3">
            <div className="px-4 py-1.5 rounded-full bg-foreground/[0.03] border border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted/60">
               Active
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); if(confirm('Remove this agent?')) onDelete(); }}
              className="p-2.5 bg-foreground/[0.03] rounded-xl text-muted hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
            >
               <MoreHorizontal size={14} />
            </button>
         </div>
      </div>

      <div className="space-y-4 relative z-10">
         <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 opacity-40">Designation</span>
            <h3 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors truncate">{employee.name}</h3>
         </div>
         <p className="text-muted text-xs font-medium leading-relaxed min-h-[4ch] line-clamp-2 italic opacity-60">
            {employee.description || "No professional summary defined for this agent."}
         </p>
      </div>

      <div className="flex flex-wrap gap-2 mt-auto relative z-10">
         {employee.skillIds && employee.skillIds.length > 0 ? (
            employee.skillIds.slice(0, 3).map((s: string, i: number) => (
               <div key={i} className="px-3 py-1.5 bg-foreground/[0.03] border border-border/40 rounded-lg text-[10px] font-bold text-muted group-hover:bg-primary/10 group-hover:text-primary transition-all">
                  Skill {i+1}
               </div>
            ))
         ) : (
            <div className="w-full px-4 py-3 bg-red-500/5 border border-red-500/10 rounded-xl text-[10px] font-bold text-red-500/60 italic flex items-center gap-2">
               <Target size={12} /> No skills connected
            </div>
         )}
      </div>

      <div className="pt-8 border-t border-border/40 flex items-center justify-between relative z-10">
         <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest opacity-30 mb-0.5">Connected Skills</span>
            <span className="text-xs font-bold">{employee.skillIds?.length || 0} Professional Modules</span>
         </div>
         <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
            Configure <ChevronRight size={14} strokeWidth={3} />
         </div>
      </div>
    </motion.div>
  );
}
