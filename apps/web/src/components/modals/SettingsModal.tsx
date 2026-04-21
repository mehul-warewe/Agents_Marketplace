'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, ShieldCheck, Key, Zap, Settings, Globe, Bell, History, LogOut, ChevronRight, Activity } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function SettingsModal({ isOpen, onClose, onUpgrade }: SettingsModalProps) {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  if (!isOpen) return null;

  const navItems = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: ShieldCheck },
    { id: 'network', name: 'Connectivity', icon: Globe },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'history', name: 'Audit Logs', icon: History },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative w-full max-w-4xl bg-card border border-border/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col md:flex-row h-[600px] z-10"
        >
          {/* Sidebar Nav */}
          <div className="w-full md:w-64 border-r border-border/10 bg-secondary/5 p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      <Settings size={14} />
                   </div>
                   <h2 className="text-sm font-bold tracking-tight text-foreground uppercase">Settings</h2>
                </div>

             <nav className="space-y-1 flex-1">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button 
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left group ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground/40 hover:text-foreground hover:bg-foreground/5'}`}
                    >
                      <item.icon size={16} className={isActive ? 'text-primary' : 'text-foreground/20 group-hover:text-foreground transition-colors'} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{item.name}</span>
                    </button>
                  );
                })}
             </nav>

             <button 
               onClick={() => {
                 logout();
                 window.location.href = '/';
               }}
               className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/5 transition-all text-left"
             >
                <LogOut size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Logout</span>
             </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-card relative">
             <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 bg-foreground/5 hover:bg-foreground hover:text-background rounded-xl transition-all z-20"
             >
                <X size={18} />
             </button>

             <div className="flex-1 overflow-y-auto p-8 lg:p-12 no-scrollbar">
                <div className="space-y-8">
                   {/* Profile Header */}
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-lg border-2 border-background overflow-hidden relative group">
                         {user?.name?.charAt(0).toUpperCase()}
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white">Edit</div>
                      </div>
                      <div className="space-y-1">
                         <h3 className="text-xl font-bold tracking-tight text-foreground">{user?.name}</h3>
                         <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[8px] font-bold uppercase tracking-widest">{user?.tier || 'Free'} Plan</span>
                            <span className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">ID: {user?.id?.slice(-8).toUpperCase()}</span>
                         </div>
                      </div>
                   </div>

                   <div className="p-6 rounded-2xl bg-secondary/30 border border-border/10">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                         <div className="space-y-1 text-center sm:text-left">
                            <h4 className="text-sm font-bold text-foreground">Upgrade Plan</h4>
                            <p className="text-[10px] font-medium text-foreground/40 max-w-sm leading-relaxed uppercase tracking-wide">
                               Unlock unlimited concurrent runs and premium LLM configurations.
                            </p>
                         </div>
                         <button 
                           onClick={onUpgrade}
                           className="bg-primary text-primary-foreground h-9 px-6 rounded-lg font-bold text-[9px] uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 shrink-0"
                         >
                            Upgrade Now
                         </button>
                      </div>
                   </div>

                   {/* Configuration Form */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest px-1">Display Name</label>
                         <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" size={14} />
                            <input 
                              type="text" 
                              defaultValue={user?.name}
                              className="w-full h-11 bg-secondary/30 border border-border/10 rounded-xl pl-11 pr-4 font-bold text-xs focus:outline-none focus:border-primary/50 transition-all text-foreground shadow-inner"
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest px-1">Email Address</label>
                         <div className="relative group opacity-50 cursor-not-allowed">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" size={14} />
                            <input 
                              type="email" 
                              disabled
                              defaultValue={user?.email}
                              className="w-full h-11 bg-secondary/20 border border-border/10 rounded-xl pl-11 pr-4 font-bold text-xs outline-none"
                            />
                         </div>
                      </div>
                   </div>

                   {/* Danger Zone */}
                   <div className="pt-6 border-t border-border/10">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                         <div className="space-y-1 text-center sm:text-left">
                            <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Delete Identity</p>
                            <p className="text-[8px] font-medium text-foreground/20 uppercase tracking-widest">Permanently erase all data and agent records.</p>
                         </div>
                         <button className="text-[9px] font-bold text-red-500 uppercase tracking-widest px-6 h-9 rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                            Purge Account
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
