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
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: employees, isLoading } = useEmployees();
  const { mutate: createEmployee, isPending: isCreating } = useCreateEmployee();
  const { mutate: deleteEmployee } = useDeleteEmployee();

  // Create Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!name || !description) return;
    createEmployee({ name, description }, {
      onSuccess: () => {
        setIsModalOpen(false);
        setName('');
        setDescription('');
        toast.success('New Employee Unit Initialized.');
      }
    });
  };

  return (
    <div className="flex-1 bg-background min-h-full text-foreground p-6 sm:p-10 lg:p-14 overflow-y-auto w-full no-scrollbar font-inter">
      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 px-4">
           <div className="space-y-4">
              <div className="flex items-center gap-4 text-primary">
                 <Bot size={32} strokeWidth={3} className="fill-current" />
                 <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">Personnel_Database</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-none uppercase italic">
                FLEET_<span className="text-muted/20">OPERATIVES</span>
              </h1>
              <p className="text-muted font-bold uppercase text-[10px] tracking-widest max-w-md opacity-40 leading-relaxed">
                Your specialized AI persona workforce. Each operative can be assigned multiple skills to perform complex, multi-step operations autonomously.
              </p>
           </div>
           
           <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-primary-foreground px-12 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-primary/30 group"
           >
              <UserPlus size={20} strokeWidth={3} /> 
              ONBOARD_EMPLOYEE
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
              <h3 className="text-3xl font-black mb-4 italic uppercase tracking-tighter leading-none">Fleet_Inactive</h3>
              <p className="text-muted mb-12 max-w-xs mx-auto font-bold opacity-30 uppercase text-xs leading-relaxed tracking-wider">
                No active personas detected in your regional cluster. Deploy specialized operatives to start scaling.
              </p>
              <button onClick={() => setIsModalOpen(true)} className="bg-foreground text-background px-16 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] hover:scale-[1.05] transition-all">
                INITIALIZE_FLEET
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

      {/* Onboarding Modal */}
      <AnimatePresence>
         {isModalOpen && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                 onClick={() => setIsModalOpen(false)}
              />
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="relative w-full max-w-2xl bg-card border border-border/60 rounded-[3.5rem] shadow-2xl overflow-hidden p-12 space-y-10"
              >
                 <div className="space-y-2">
                    <div className="flex items-center gap-3 text-primary">
                       <ShieldCheck size={20} strokeWidth={3} />
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Authorisation_Granted</span>
                    </div>
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">New_Employee_Unit</h2>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-5">Unit_Designation (Name)</label>
                       <input 
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="E.G. DATA ANALYST OMEGA"
                          className="w-full bg-foreground/[0.03] border border-border/40 rounded-2xl py-6 px-8 text-sm font-bold uppercase focus:outline-none focus:border-primary transition-all"
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-5">Operational_Directives (Role Description)</label>
                       <textarea 
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          placeholder="DESCRIBE THE ROLE AND RESPONSIBILITIES..."
                          rows={4}
                          className="w-full bg-foreground/[0.03] border border-border/40 rounded-3xl py-6 px-8 text-sm font-bold uppercase focus:outline-none focus:border-primary transition-all resize-none"
                       />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button 
                       onClick={() => setIsModalOpen(false)}
                       className="flex-1 py-6 rounded-2xl border border-border/60 font-black text-[10px] uppercase tracking-[0.4em] hover:bg-foreground/5 transition-all"
                    >
                       ABORT
                    </button>
                    <button 
                       onClick={handleCreate}
                       disabled={isCreating || !name || !description}
                       className="flex-[2] py-6 bg-primary text-primary-foreground rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl shadow-primary/20"
                    >
                       {isCreating ? 'INITIALIZING...' : 'ACTIVATE_UNIT'}
                    </button>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
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
            <div className="px-4 py-1.5 rounded-full bg-foreground/[0.03] border border-border/60 text-[8px] font-black uppercase tracking-widest opacity-60">
               UNIT::ACTIVE
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); if(confirm('Deactivate this unit?')) onDelete(); }}
              className="p-2.5 bg-foreground/[0.03] rounded-xl text-muted hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
            >
               <MoreHorizontal size={14} />
            </button>
         </div>
      </div>

      <div className="space-y-4 relative z-10">
         <div className="flex flex-col">
            <span className="text-[8px] font-black text-muted uppercase tracking-[0.4em] mb-1 opacity-40 italic">Designation</span>
            <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none group-hover:text-primary transition-colors truncate">{employee.name}</h3>
         </div>
         <p className="text-muted text-[11px] font-bold uppercase tracking-tight line-clamp-2 opacity-50 leading-relaxed min-h-[4ch] italic">
            {employee.description || "No tactical parameters defined."}
         </p>
      </div>

      <div className="flex flex-wrap gap-2 mt-auto relative z-10">
         {employee.skillIds && employee.skillIds.length > 0 ? (
            employee.skillIds.slice(0, 3).map((s: string, i: number) => (
               <div key={i} className="px-3 py-1.5 bg-foreground/[0.03] border border-border/40 rounded-lg text-[8px] font-black uppercase tracking-wider text-muted group-hover:bg-primary/10 group-hover:text-primary transition-all">
                  SKILL::{i+1}
               </div>
            ))
         ) : (
            <div className="w-full px-4 py-3 bg-red-500/5 border border-red-500/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-red-500/60 italic flex items-center gap-2">
               <Target size={12} /> NO_SKILLS_ASSIGNED
            </div>
         )}
      </div>

      <div className="pt-8 border-t border-border/40 flex items-center justify-between relative z-10">
         <div className="flex flex-col">
            <span className="text-[8px] font-black text-muted uppercase tracking-widest opacity-30 mb-0.5 italic">Assigned_Logic</span>
            <span className="text-[11px] font-black italic uppercase tracking-tighter">{employee.skillIds?.length || 0} Modules</span>
         </div>
         <div className="flex items-center gap-2 text-primary font-black text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 shadow-xl">
            Configure <ChevronRight size={14} strokeWidth={3} />
         </div>
      </div>
    </motion.div>
  );
}
