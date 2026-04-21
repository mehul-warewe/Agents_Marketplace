'use client';
import React, { useState } from 'react';
import { Bot, Plus, Search, Terminal, Activity, User, ChevronRight, Zap, Target, Share2, MoreHorizontal, Settings, ShieldCheck, UserPlus, Trash2, Globe, Shield, Cpu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEmployees, useCreateEmployee, useDeleteEmployee } from '@/hooks/useEmployees';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function WorkforceRegistry() {
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
    <div className="flex-1 text-foreground space-y-6 p-4 lg:p-6 bg-secondary/5 h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                 <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/10 shadow-sm">
                    <Bot size={16} />
                 </div>
                 <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">Professional Registry</span>
              </div>
              <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
                Employee Registry
              </h1>
              <p className="text-muted-foreground font-medium text-[11px] max-w-xl leading-snug uppercase tracking-wide opacity-70">
                Manage your specialized AI professionals to streamline and automate business processes.
              </p>
           </div>
           
           <Button 
              onClick={handleCreateNew}
              disabled={isCreating}
              className="h-10 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all gap-3 shrink-0 border-none"
           >
              {isCreating ? <Activity size={16} className="animate-spin" /> : <UserPlus size={16} strokeWidth={2.5} />} 
              {isCreating ? 'Initializing...' : 'Create Employee'}
           </Button>
        </div>

        {/* Employees Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Active Employees</h2>
             <div className="text-[10px] font-bold text-muted-foreground/40 uppercase">Total: {employees?.length || 0}</div>
          </div>

          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-64 bg-card border border-border/40 rounded-2xl animate-pulse" />)}
             </div>
          ) : !employees || employees.length === 0 ? (
             <Card className="flex flex-col items-center justify-center py-24 text-center px-10 border-border/40 rounded-2xl bg-card shadow-sm max-w-2xl mx-auto">
                 <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center text-muted-foreground mb-6 shadow-sm border border-border/40">
                    <User size={32} />
                 </div>
                <h3 className="text-xl font-bold font-display mb-2 text-foreground tracking-tight">Registry Empty</h3>
                <p className="text-muted-foreground mb-8 max-w-xs mx-auto text-[13px] font-medium leading-relaxed">
                  No active professionals detected. Create your first employee to begin managing tasks.
                </p>
                 <Button onClick={handleCreateNew} disabled={isCreating} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest h-10 px-8 shadow-lg shadow-indigo-500/20 border-none">
                   Create First Employee
                 </Button>
             </Card>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  );
}

function EmployeeCard({ employee, onClick, onDelete }: { employee: any, onClick: () => void, onDelete: () => void }) {
  const modelName = employee.model?.split('/').pop() || 'Gemini';
  const skillCount = employee.skillIds?.length || 0;
  
  return (
    <Card 
      onClick={onClick}
      className="group p-6 relative transition-all duration-300 rounded-2xl border-border/40 shadow-sm hover:shadow-md hover:border-indigo-500/20 flex flex-col overflow-hidden cursor-pointer bg-card"
    >
      <div className="flex items-center justify-between shrink-0 mb-6 relative z-10">
         <div className="w-10 h-10 rounded-xl bg-secondary border border-border/40 flex items-center justify-center text-foreground group-hover:bg-indigo-500 group-hover:text-white group-hover:border-transparent transition-all duration-300 shadow-sm">
            <Bot size={18} />
         </div>
         <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-widest ${employee.isPublished ? 'bg-indigo-500/10 border-indigo-500/10 text-indigo-500' : 'bg-secondary border-border/40 text-muted-foreground'}`}>
               {employee.isPublished ? 'LIVE' : 'DRAFT'}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); if(confirm('Confirm employee removal?')) onDelete(); }}
              className="p-1.5 rounded-lg text-muted-foreground/40 hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
            >
               <Trash2 size={13} />
            </button>
         </div>
      </div>

      <div className="space-y-2 mb-6 relative z-10">
         <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold font-display tracking-tight text-foreground truncate group-hover:text-indigo-500 transition-colors">{employee.name}</h3>
         </div>
         <p className="text-[12px] text-muted-foreground font-medium line-clamp-2 leading-snug">
            {employee.description || "Ready for professional assignment."}
         </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 relative z-10">
         <div className="flex items-center gap-2 px-2.5 py-1 bg-secondary/50 border border-border/40 rounded-lg text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
            <Cpu size={12} /> {modelName}
         </div>
         {skillCount > 0 && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[9px] font-bold text-indigo-500 uppercase tracking-tight">
               <Zap size={12} strokeWidth={2.5} /> {skillCount} SKILLS
            </div>
         )}
      </div>

      <div className="pt-4 mt-auto border-t border-border/40 flex items-center justify-between relative z-10">
         <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
            <Shield size={12} /> ACTIVE
         </div>
         <div className="flex items-center gap-1.5 text-indigo-500 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
            CONFIG <ChevronRight size={14} strokeWidth={3} />
         </div>
      </div>
    </Card>
  );
}
