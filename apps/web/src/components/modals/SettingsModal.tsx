'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, ShieldCheck, Key, Zap, Settings, Globe, Bell, History, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function SettingsModal({ isOpen, onClose, onUpgrade }: SettingsModalProps) {
  const { user, logout } = useAuthStore();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-xl"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-card border border-border shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden flex flex-col md:flex-row h-[700px]"
        >
          {/* Sidebar Nav */}
          <div className="w-full md:w-72 border-r border-border bg-foreground/[0.01] p-8 flex flex-col">
             <div className="flex items-center gap-3 mb-12">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                   <Settings size={22} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-black tracking-tighter uppercase italic">CORE_CFG</h2>
             </div>

             <nav className="space-y-2 flex-1">
                {[
                  { id: 'profile', name: 'Identity_Module', icon: User },
                  { id: 'security', name: 'Security_Layer', icon: ShieldCheck },
                  { id: 'network', name: 'Global_Relay', icon: Globe },
                  { id: 'notifications', name: 'Comms_Sync', icon: Bell },
                  { id: 'history', name: 'Metric_Logs', icon: History },
                ].map((item, i) => (
                  <button 
                    key={item.id}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-left group ${i === 0 ? 'bg-foreground/5 text-foreground' : 'text-muted hover:text-foreground hover:bg-foreground/[0.02]'}`}
                  >
                    <item.icon size={18} strokeWidth={3} className={i === 0 ? 'text-primary' : 'text-muted group-hover:text-primary transition-colors'} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{item.name}</span>
                  </button>
                ))}
             </nav>

             <button 
               onClick={() => {
                 logout();
                 window.location.href = '/';
               }}
               className="mt-auto flex items-center gap-4 px-6 py-5 rounded-2xl text-red-500 hover:bg-red-500/5 transition-all text-left"
             >
                <LogOut size={18} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Terminate_Session</span>
             </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-card relative">
             <button 
                onClick={onClose}
                className="absolute top-8 right-8 p-3 bg-foreground/5 hover:bg-foreground hover:text-background rounded-2xl transition-all z-20"
             >
                <X size={20} strokeWidth={3} />
             </button>

             <div className="flex-1 overflow-y-auto p-12 md:p-16 no-scrollbar">
                <div className="space-y-12">
                   {/* Profile Header */}
                   <div className="flex items-center gap-8">
                      <div className="w-24 h-24 rounded-[2rem] bg-primary text-primary-foreground flex items-center justify-center text-3xl font-black shadow-2xl shadow-primary/20 border-4 border-background overflow-hidden relative group">
                         {user?.name?.charAt(0).toUpperCase()}
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white">Edit</div>
                      </div>
                      <div className="space-y-1">
                         <h3 className="text-3xl font-black tracking-tighter uppercase italic">{user?.name}</h3>
                         <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest italic">{user?.tier}_Entity</span>
                            <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em] opacity-40 italic">Active Since: 2024.Q4</span>
                         </div>
                      </div>
                   </div>

                   {/* Quick Actions / Upgrade Card */}
                   <div className="p-10 rounded-[2.5rem] bg-foreground/[0.03] border-2 border-border/40 relative overflow-hidden group">
                      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-8">
                         <div className="space-y-4 text-center sm:text-left">
                            <h4 className="text-lg font-black uppercase italic tracking-tighter">Protocol_Tier_Elevation</h4>
                            <p className="text-xs font-bold text-muted uppercase opacity-60 max-w-sm tracking-tight leading-relaxed">
                               Insufficient credits for complex neural mapping? Elevate to a premium protocol for infinite scaling.
                            </p>
                         </div>
                         <button 
                           onClick={onUpgrade}
                           className="bg-primary text-primary-foreground px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.4em] hover:scale-[1.05] transition-all shadow-xl shadow-primary/20 shrink-0 italic"
                         >
                            Elevate_Now
                         </button>
                      </div>
                      <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-all pointer-events-none group-hover:scale-110 duration-1000">
                         <Zap size={140} strokeWidth={1} />
                      </div>
                   </div>

                   {/* Input Groups */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-muted uppercase tracking-[0.4em] px-2 italic opacity-40">Alias_Configuration</label>
                         <div className="relative group">
                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
                            <input 
                              type="text" 
                              defaultValue={user?.name}
                              className="w-full bg-foreground/[0.03] border border-border/60 rounded-2xl py-5 pl-16 pr-6 font-bold text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-foreground"
                            />
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-muted uppercase tracking-[0.4em] px-2 italic opacity-40">Relay_Uplink_Email</label>
                         <div className="relative group opacity-60">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-muted" size={18} />
                            <input 
                              type="email" 
                              readOnly
                              defaultValue={user?.email}
                              className="w-full bg-foreground/[0.03] border border-border/60 rounded-2xl py-5 pl-16 pr-6 font-bold text-sm outline-none cursor-default"
                            />
                         </div>
                      </div>
                   </div>

                   {/* Danger Zone */}
                   <div className="pt-8 border-t border-border/40">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                         <div className="space-y-1 text-center sm:text-left">
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">Severe_Action :: Erase_Data</p>
                            <p className="text-[9px] font-bold text-muted uppercase opacity-40">Permanently delete all neural records and fleet history.</p>
                         </div>
                         <button className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] px-8 py-3 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all italic">
                            Purge_Account
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
