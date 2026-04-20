'use client';
import React, { useState } from 'react';
import { Bot, Plus, Search, Terminal, Activity, User, ChevronRight, Zap, Target, Share2, MoreHorizontal, Settings, ShieldCheck, UserPlus, Trash2, Globe, Shield } from 'lucide-react';
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
    <div className="flex-1 text-foreground space-y-6 p-6 bg-secondary/5 h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
           <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                    <Bot size={16} />
                 </div>
                 <span className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-[0.3em]">Operative Directory</span>
              </div>
              <h1 className="text-4xl font-bold font-display tracking-tight text-foreground">
                Workforce Registry
              </h1>
              <p className="text-muted-foreground font-medium text-[12px] max-w-xl leading-relaxed">
                Manage and deploy your specialized AI professionals. Each operative can be fine-tuned with custom domain logic and tool access.
              </p>
           </div>
           
           <Button 
              onClick={handleCreateNew}
              disabled={isCreating}
              className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all gap-3"
           >
              {isCreating ? <Activity size={16} className="animate-spin" /> : <UserPlus size={16} strokeWidth={2.5} />} 
              {isCreating ? 'Provisioning...' : 'Provision Operative'}
           </Button>
        </div>

        {/* Employees Grid */}
        {isLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-64 bg-card/50 border border-border/40 rounded-3xl animate-pulse" />)}
           </div>
        ) : !employees || employees.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-32 text-center px-10 border border-border border-dashed rounded-[2.5rem] bg-card/30 backdrop-blur-sm shadow-sm max-w-2xl mx-auto">
               <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 mb-8 shadow-inner">
                  <User size={32} />
               </div>
              <h3 className="text-2xl font-bold font-display mb-3 text-foreground tracking-tight">Registry Empty</h3>
              <p className="text-muted-foreground mb-10 max-w-sm mx-auto text-[13px] font-medium leading-relaxed">
                No active professionals detected in your registry. Start by provisioning a new operative and defining their strategic capabilities.
              </p>
               <Button onClick={handleCreateNew} disabled={isCreating} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest h-11 px-8 shadow-lg shadow-indigo-500/20">
                 {isCreating ? 'Synchronizing Archive...' : 'Provision First Operative'}
               </Button>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  const modelName = employee.model?.split('/').pop() || 'Gemini';
  const skillCount = employee.skillIds?.length || 0;
  
  return (
    <div 
      onClick={onClick}
      className="group bg-card p-6 relative transition-all duration-500 rounded-3xl border border-border/40 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 hover:-translate-y-1 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Decorative Gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

      <div className="flex items-center justify-between shrink-0 mb-6 relative z-10">
         <div className="w-11 h-11 rounded-2xl bg-secondary border border-border/40 flex items-center justify-center text-foreground group-hover:bg-emerald-600 group-hover:text-white group-hover:border-transparent transition-all duration-500 shadow-inner group-hover:rotate-3">
            <Bot size={20} />
         </div>
         <div className="flex items-center gap-2 relative z-10">
            <div className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-widest ${employee.isPublished ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' : 'bg-muted-foreground/10 border-muted-foreground/20 text-muted-foreground'}`}>
               {employee.isPublished ? 'Marketplace Live' : 'Internal Draft'}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); if(confirm('Sync removal of this professional unit?')) onDelete(); }}
              className="p-2 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
            >
               <Trash2 size={15} />
            </button>
         </div>
      </div>

      <div className="space-y-2 mb-6 relative z-10">
         <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold font-display tracking-tight text-foreground truncate group-hover:text-emerald-500 transition-colors">{employee.name}</h3>
            <span className="text-[9px] px-2 py-0.5 bg-secondary border border-border/40 rounded font-mono text-muted-foreground uppercase">{modelName}</span>
         </div>
         <p className="text-[12px] text-muted-foreground font-medium line-clamp-2 leading-relaxed">
            {employee.description || "No strategic operational summary defined for this professional."}
         </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 relative z-10">
         {skillCount > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[10px] font-bold text-emerald-600 shadow-xs uppercase tracking-tight">
               <Zap size={12} strokeWidth={2.5} /> {skillCount} Domain Capabilities
            </div>
         ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-border border-dashed rounded-xl text-[10px] font-bold text-muted-foreground/30 uppercase tracking-tight">
               <Target size={12} /> No capabilities mapped
            </div>
         )}
      </div>

      <div className="pt-5 mt-auto border-t border-border/5 flex items-center justify-between relative z-10">
         <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground/20">
            <Shield size={12} /> Verified Unit
         </div>
         <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
            Architect <ChevronRight size={14} strokeWidth={3} />
         </div>
      </div>
    </div>
  );
}
