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
    <div className="flex-1 text-foreground space-y-8 p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
           <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight text-foreground">
                Active Workforce
              </h1>
              <p className="text-muted-foreground font-medium text-sm max-w-md">
                Manage and deploy your specialized AI agents. Each professional can be equipped with custom skills.
              </p>
           </div>
           
           <Button 
              onClick={handleCreateNew}
              disabled={isCreating}
              size="lg"
              className="gap-2"
           >
              {isCreating ? <Activity size={16} className="animate-spin" /> : <UserPlus size={16} />} 
              {isCreating ? 'Creating...' : 'Add Agent'}
           </Button>
        </div>

        {/* Employees Grid */}
        {isLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
              {[1,2,3,4].map(i => <div key={i} className="h-64 bg-muted rounded-[10px] animate-pulse" />)}
           </div>
        ) : !employees || employees.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-32 text-center px-12 border border-border border-dashed rounded-[10px] mx-4 bg-card shadow-sm">
              <div className="w-16 h-16 bg-muted rounded-[10px] flex items-center justify-center text-muted-foreground mb-6">
                 <User size={32} />
              </div>
              <h3 className="text-xl font-bold font-display mb-2">Workforce Empty</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-sm">
                No active professionals detected. Start by creating a new agent and assigning specialized capabilities.
              </p>
              <Button onClick={handleCreateNew} disabled={isCreating}>
                {isCreating ? 'Preparing Workspace...' : 'Create First Agent'}
              </Button>
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
    <Card 
      onClick={onClick}
      className="p-6 flex flex-col gap-6 cursor-pointer group hover:shadow-lg transition-all shadow-md relative overflow-hidden bg-card border-border/40"
    >
      <div className="flex items-center justify-between">
         <div className="w-10 h-10 rounded-lg bg-secondary border border-border/60 flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
            <Bot size={20} />
         </div>
         <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded-md bg-secondary border border-border/60 text-[10px] font-bold uppercase text-muted-foreground shadow-xs">
               Active
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); if(confirm('Remove this agent?')) onDelete(); }}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
            >
               <MoreHorizontal size={14} />
            </button>
         </div>
      </div>

      <div className="space-y-2">
         <div className="flex flex-col">
            <h3 className="text-lg font-bold font-display tracking-tight text-foreground truncate">{employee.name}</h3>
         </div>
         <p className="text-sm text-muted-foreground line-clamp-2">
            {employee.description || "No professional summary defined for this agent."}
         </p>
      </div>

      <div className="flex flex-wrap gap-2 mt-auto">
         {employee.skillIds && employee.skillIds.length > 0 ? (
            employee.skillIds.slice(0, 3).map((s: string, i: number) => (
               <div key={i} className="px-2.5 py-1 bg-secondary border border-border/60 rounded-md text-xs font-semibold text-foreground shadow-xs">
                  Skill {i+1}
               </div>
            ))
         ) : (
            <div className="w-full px-3 py-2 bg-secondary border border-border border-dashed rounded-lg text-xs font-medium text-muted-foreground flex items-center gap-2">
               <Target size={14} /> No skills connected
            </div>
         )}
      </div>

      <div className="pt-4 border-t border-border flex items-center justify-between">
         <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Skills:</span>
            <span className="text-xs font-bold text-foreground">{employee.skillIds?.length || 0}</span>
         </div>
         <div className="flex items-center gap-1 text-primary font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            Configure <ChevronRight size={14} />
         </div>
      </div>
    </Card>
  );
}
