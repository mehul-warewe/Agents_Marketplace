'use client';

import React from 'react';
import { LayoutGrid, ArrowRight, Zap, Bot, Share2, Sparkles, Loader2 } from 'lucide-react';
import SidebarLayout from '@/components/SidebarLayout';
import { useTemplates, useUseTemplate } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

const iconMap: Record<string, any> = {
  Bot: Bot,
  Sparkles: Sparkles,
  Share2: Share2,
  Zap: Zap,
};

export default function TemplatesPage() {
  const { data: templates, isLoading } = useTemplates();
  const { mutate: useTemplate, isPending: isUsing } = useUseTemplate();
  const router = useRouter();
  const toast = useToast();

  const handleUseTemplate = (templateId: string) => {
    useTemplate(templateId, {
      onSuccess: (data: any) => {
        toast.success('Template initialized! Redirecting to builder...');
        router.push(`/skills/builder?id=${data.id}`);
      },
      onError: (err: any) => {
        toast.error('Failed to initialize template: ' + (err?.response?.data?.error || err.message));
      }
    });
  };

  return (
    <SidebarLayout title="TEMPLATES // PROTOCOLS">
      <div className="p-10 space-y-10">
        {/* Hero Section */}
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-foreground">
            Workflow <span className="text-primary">Templates</span>
          </h1>
          <p className="text-muted text-sm font-medium max-w-2xl leading-relaxed uppercase tracking-[0.05em] opacity-60">
            Deploy ready-made high-performance agent workflows in seconds. Select a protocol below to initialize and customize for your core infrastructure.
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          /* Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates?.map((template: any) => {
              const Icon = iconMap[template.icon] || LayoutGrid;
              return (
                <div 
                  key={template.id}
                  className="group relative bg-sidebar border border-border/60 rounded-[2rem] p-6 flex flex-col gap-6 transition-all duration-500 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 overflow-hidden"
                >
                  {/* Background Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] group-hover:bg-primary/10 transition-colors duration-500" />
                  
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 bg-foreground/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                      <Icon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-[10px] font-black text-muted uppercase tracking-widest opacity-40">{template.category}</span>
                      <span className="text-[9px] font-black px-2 py-0.5 bg-primary/10 text-primary rounded-lg uppercase italic">{template.complexity}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <h3 className="text-xl font-black italic tracking-tight text-foreground group-hover:text-primary transition-colors uppercase">
                      {template.title}
                    </h3>
                    <p className="text-sm text-muted font-medium leading-relaxed opacity-60 uppercase tracking-tight line-clamp-2">
                      {template.description}
                    </p>
                  </div>

                  <button 
                    onClick={() => handleUseTemplate(template.id)}
                    disabled={isUsing}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-foreground/5 text-xs font-black uppercase tracking-widest text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 group/btn disabled:opacity-50"
                  >
                    {isUsing ? (
                      <div className="flex items-center gap-2">
                         <Loader2 size={16} className="animate-spin" />
                         Initializing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Use Template
                        <ArrowRight size={16} strokeWidth={3} className="group-hover/btn:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </button>
                </div>
              );
            })}

            {/* Create New Template Placeholder */}
            <button className="group border-2 border-dashed border-border/60 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 transition-all duration-500 hover:border-primary/40 hover:bg-primary/5">
              <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-muted group-hover:text-primary transition-colors">
                <LayoutGrid size={20} strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <span className="text-sm font-black uppercase tracking-widest text-muted group-hover:text-foreground">Coming Soon</span>
                <p className="text-[10px] font-bold text-muted/40 uppercase tracking-widest mt-1">More High-Performance Protocols</p>
              </div>
            </button>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
