'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Zap, Star, Shield, Activity, CreditCard, ArrowRight, Sparkles, Terminal, Rocket } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const tiers = [
  {
    id: 'free',
    name: 'Starter',
    price: '$0',
    description: 'Individual builders.',
    credits: '100',
    features: ['Basic nodes', 'Standard priority', 'Public access'],
    buttonText: 'Current Plan',
    highlight: false,
    icon: Shield
  },
  {
    id: 'pro',
    name: 'Professional',
    price: '$19',
    description: 'Production-grade tools.',
    credits: '1,500',
    features: ['Premium nodes', 'Elevated priority', 'Private storage', 'Unlimited flows'],
    buttonText: 'Get Pro',
    highlight: true,
    icon: Zap
  },
  {
    id: 'ultra',
    name: 'Enterprise',
    price: '$49',
    description: 'Maximum performance.',
    credits: '5,000',
    features: ['Top-tier priority', 'Dedicated API', 'Team tools', 'Institutional SLA'],
    buttonText: 'Get Enterprise',
    highlight: false,
    icon: Rocket
  }
];

const creditPacks = [
  { id: '500_credits', amount: 500, price: '$5', discount: null },
  { id: '1200_credits', amount: 1200, price: '$10', discount: 'Save 15%' },
  { id: '2500_credits', amount: 2500, price: '$20', discount: 'Save 20%' },
];

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [view, setView] = useState<'plans' | 'credits'>('plans');

  const handleCheckout = async (type: 'subscription' | 'credits', id: string) => {
    if (!token) return;
    setLoading(id);
    
    try {
      const endpoint = type === 'subscription' ? '/billing/checkout/subscription' : '/billing/checkout/credits';
      const body = type === 'subscription' ? { tier: id } : { packId: id };

      const { data } = await api.post(endpoint, body);

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) return null;

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
          className="relative w-full max-w-5xl max-h-[90vh] bg-card border border-border/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col z-10"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-foreground/5 hover:bg-foreground hover:text-background rounded-xl transition-all z-20"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="p-8 md:px-12 border-b border-border/10 bg-secondary/5 shrink-0">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                   <h2 className="text-3xl font-bold tracking-tight text-foreground">Upgrade Plan</h2>
                   <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest max-w-md">
                      Unlock unlimited concurrent runs and specialized functional skills.
                   </p>
                </div>

                <div className="flex bg-foreground/5 p-1 rounded-xl">
                   <button 
                     onClick={() => setView('plans')}
                     className={`px-6 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${view === 'plans' ? 'bg-card text-foreground shadow-sm' : 'text-foreground/30 hover:text-foreground'}`}
                   >
                     Plans
                   </button>
                   <button 
                     onClick={() => setView('credits')}
                     className={`px-6 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${view === 'credits' ? 'bg-card text-foreground shadow-sm' : 'text-foreground/30 hover:text-foreground'}`}
                   >
                     Credits
                   </button>
                </div>
             </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 md:px-12 no-scrollbar">
            {view === 'plans' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tiers.map((tier) => (
                  <div 
                    key={tier.id}
                    className={`relative p-6 rounded-2xl border flex flex-col transition-all duration-500 group ${
                      tier.highlight 
                        ? 'border-primary/50 bg-primary/5 shadow-xl' 
                        : 'border-border/10 bg-card hover:border-primary/20'
                    }`}
                  >
                    <div className="mb-4 flex justify-between items-start">
                       <div className={`p-3 rounded-xl border border-border/10 ${tier.highlight ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-secondary/50 text-foreground/40'}`}>
                          <tier.icon size={20} />
                       </div>
                       {tier.highlight && (
                         <div className="bg-primary text-primary-foreground px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest">Recommended</div>
                       )}
                    </div>

                    <div className="space-y-1 mb-4">
                       <h3 className="text-[9px] font-bold text-foreground/20 uppercase tracking-[0.2em]">{tier.id} Plan</h3>
                       <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold tracking-tight">{tier.price}</span>
                          <span className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">/ MO</span>
                       </div>
                       <p className="text-[10px] font-medium text-foreground/40 italic">{tier.description}</p>
                    </div>

                    <ul className="space-y-2 mb-6 flex-1">
                       {tier.features.map(f => (
                         <li key={f} className="flex items-center gap-2 text-[10px] font-bold text-foreground/50 uppercase tracking-tight">
                           <CheckCircle2 size={12} className="text-primary" />
                           {f}
                         </li>
                       ))}
                    </ul>

                    <button
                      disabled={user?.tier === tier.id || loading !== null}
                      onClick={() => handleCheckout('subscription', tier.id)}
                      className={`w-full py-3 rounded-lg font-bold text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                        user?.tier === tier.id
                          ? 'bg-foreground/5 text-foreground/20 cursor-default border border-border/5'
                          : 'bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20'
                      }`}
                    >
                      {loading === tier.id ? (
                        <Activity size={14} className="animate-spin" />
                      ) : user?.tier === tier.id ? 'Active Plan' : tier.buttonText}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {creditPacks.map((pack) => (
                   <button
                    key={pack.id}
                    disabled={loading !== null}
                    onClick={() => handleCheckout('credits', pack.id)}
                    className="group relative flex flex-col p-6 bg-secondary/30 border border-border/10 rounded-2xl hover:bg-primary transition-all duration-300 text-left overflow-hidden shadow-sm"
                  >
                    {pack.discount && (
                      <div className="w-fit bg-primary text-primary-foreground text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest mb-4 group-hover:bg-card group-hover:text-foreground">
                        {pack.discount}
                      </div>
                    )}
                    
                    <div className="text-[9px] font-bold text-foreground/40 uppercase tracking-[0.2em] mb-1 group-hover:text-card/60">Execution Credits</div>
                    <div className="text-4xl font-bold mb-4 tracking-tight group-hover:text-card">{pack.amount}</div>
                    
                    <div className="mt-auto pt-4 border-t border-border/10 group-hover:border-card/20 w-full flex items-center justify-between">
                      <span className="text-2xl font-bold tracking-tight group-hover:text-card">{pack.price}</span>
                      <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center group-hover:bg-card group-hover:text-foreground shadow-lg transition-all group-hover:scale-110">
                         <ArrowRight size={16} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-6 border-t border-border/10 bg-secondary/5 flex flex-col sm:flex-row items-center justify-between gap-4 px-12">
             <div className="flex items-center gap-2 text-[8px] font-bold text-foreground/20 uppercase tracking-widest">
                <Shield size={12} /> Secure Payments via Stripe
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
