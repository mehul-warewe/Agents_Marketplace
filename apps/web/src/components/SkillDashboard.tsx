'use client';

import React, { useEffect } from 'react';
import { Zap, Bot, ArrowUpRight, Search, Plus, Terminal, Activity, Layers, Play, Settings, Trash2, Globe, List, LayoutGrid, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useSkills, useDeleteSkill } from '@/hooks/useSkills';
import { usePublishAgent, useUpdateSkillFromOriginal, useTools, usePipedreamAppDetails } from '@/hooks/useApi';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { cn } from '@/components/ui/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PublishModal } from './builder/PublishModal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './ui/DropdownMenu';

export default function SkillDashboard() {
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  
  const { data: skills, isLoading: skillsLoading } = useSkills();
  const { mutate: deleteSkill } = useDeleteSkill();
  const { mutate: publishSkill, isPending: isPublishing } = usePublishAgent();
  const { mutate: updateFromOriginal } = useUpdateSkillFromOriginal();
  const { data: toolRegistry = [] } = useTools();

  const [selectedSkillForPublish, setSelectedSkillForPublish] = React.useState<any>(null);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to purge this skill from the library?')) {
      deleteSkill(id);
    }
  };

  const handlePublishClick = (e: React.MouseEvent, skill: any) => {
    e.stopPropagation();
    setSelectedSkillForPublish(skill);
  };

  const onUpdateFromOriginal = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to update this skill to the latest version? Your current logic will be overwritten.')) {
        updateFromOriginal(id);
    }
  };

  const onPublishConfirm = (published: boolean, price: number, category: string) => {
    if (!selectedSkillForPublish) return;
    publishSkill({
        id: selectedSkillForPublish.id,
        published,
        price,
        category
    }, {
        onSuccess: () => {
            setSelectedSkillForPublish(null);
        },
        onError: (err: any) => {
            alert(err.response?.data?.error || "Failed to publish skill. Ensure your logic has both an Input and an Output gateway.");
        }
    });
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 bg-background min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-foreground border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-6 text-muted font-black text-xs uppercase tracking-widest">Accessing Skill Vault...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 text-foreground space-y-3 p-2 lg:p-4 bg-secondary/5">
      <div className="space-y-3">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
           <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-foreground">
                Skill Library
              </h1>
              <p className="text-muted-foreground font-medium text-[11px] uppercase tracking-widest leading-none">
                Deployable vertical logic units
              </p>
           </div>
           <div className="flex items-center gap-3">
            <div className="flex items-center bg-secondary/50 p-1 rounded-xl border border-border/10 mr-2 shadow-inner">
               <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  title="List View"
               >
                  <List size={14} />
               </button>
               <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Grid View"
               >
                  <LayoutGrid size={14} />
               </button>
            </div>
            
            <Button 
               onClick={() => router.push('/skills/builder')}
               size="sm"
               className="h-9 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 border-none transition-all"
            >
               <Plus size={14} strokeWidth={2.5} /> 
               New Skill
            </Button>
         </div>
        </div>


        {/* Skills Grid */}
        {skillsLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                 <div key={i} className="h-40 bg-card rounded-xl border border-border/40 animate-pulse" />
              ))}
           </div>
        ) : !skills || skills.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-24 text-center px-12 border border-border/40 border-dashed rounded-2xl mx-2 bg-card/50">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground/30 mb-6">
                 <Zap size={24} />
              </div>
              <h3 className="text-lg font-bold font-display mb-2 uppercase tracking-tight">Vault Empty</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-[10px] font-medium uppercase tracking-widest">
                No custom capabilities detected in the registry.
              </p>
              <Button onClick={() => router.push('/skills/builder')} size="sm">
                Initialize Skill
              </Button>
           </div>
        ) : (
            <div className={viewMode === 'grid' 
               ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-2"
               : "flex flex-col gap-2 px-2"
            }>
               {skills.map((skill: any) => (
                  <SkillCard 
                     key={skill.id} 
                     skill={skill} 
                     toolRegistry={toolRegistry}
                     viewMode={viewMode}
                     onClick={() => router.push(`/skills/builder?id=${skill.id}`)}
                     onDelete={(e) => handleDelete(e, skill.id)}
                     onPublish={(e) => handlePublishClick(e, skill)}
                     onUpdate={(e) => onUpdateFromOriginal(e, skill.id)}
                  />
               ))}
            </div>
        )}
      </div>

      <AnimatePresence>
        {selectedSkillForPublish && (
            <PublishModal 
                isOpen={!!selectedSkillForPublish}
                onClose={() => setSelectedSkillForPublish(null)}
                name={selectedSkillForPublish.name}
                onNameChange={() => {}} // Read-only in this context or we could allow editing
                description={selectedSkillForPublish.description || ''}
                onDescriptionChange={() => {}}
                onPublish={onPublishConfirm}
                isPublishing={isPublishing}
                isEditMode={true}
                initialPrice={selectedSkillForPublish.price || 0}
                initialPublished={selectedSkillForPublish.isPublished || false}
                initialCategory={selectedSkillForPublish.category || 'Automation'}
            />
        )}
      </AnimatePresence>
    </div>
  );
}

function SkillCard({ skill, toolRegistry, onClick, onDelete, onPublish, onUpdate, viewMode }: { 
   skill: any, 
   toolRegistry: any[],
   onClick: () => void, 
   onDelete: (e: React.MouseEvent) => void, 
   onPublish: (e: React.MouseEvent) => void,
   onUpdate: (e: React.MouseEvent) => void,
   viewMode: 'grid' | 'list'
}) {
  const nodeCount = (skill.workflow?.nodes?.length || skill.nodeCount) || (skill.node_count || 0);
  const inputParams = (skill.inputSchema as any[]) || skill.workflow?.inputSchema || [];

  const rawCredentials = skill.required_credentials || skill.workflow?.requiredCredentials || [];
  const requiredCredentials = typeof rawCredentials === 'string' ? JSON.parse(rawCredentials) : rawCredentials;

  const Icon = () => (
     <div className={`${viewMode === 'grid' ? 'w-10 h-10 rounded-xl' : 'w-8 h-8 rounded-lg'} bg-secondary/50 flex items-center justify-center text-foreground group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm ${skill.isPublished ? 'border border-indigo-500/30' : ''}`}>
        {skill.category === 'Automation' && <Zap size={viewMode === 'grid' ? 20 : 16} />}
        {skill.category === 'Intelligence' && <Bot size={viewMode === 'grid' ? 20 : 16} />}
        {skill.category === 'Analysis' && <Activity size={viewMode === 'grid' ? 20 : 16} />}
        {skill.category === 'Enterprise' && <Layers size={viewMode === 'grid' ? 20 : 16} />}
        {skill.category === 'Social' && <Globe size={viewMode === 'grid' ? 20 : 16} />}
        {!skill.category && <Layers size={viewMode === 'grid' ? 20 : 16} />}
     </div>
  );

  const PlatformIcon = ({ slug, iconUrl, className }: { slug?: string, iconUrl?: string, className?: string }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const { data: toolRegistry = [] } = useTools();
    const { data: appMeta } = usePipedreamAppDetails(slug || '');
    
    const finalIconUrl = useMemo(() => {
      // 1. Use direct iconUrl if provided
      if (iconUrl) return iconUrl;
      if (!slug) return null;

      // 2. Check tool registry
      const tool = toolRegistry.find((t: any) => (t.id.split('.')[0] === slug || t.appKey === slug || t.slug === slug));
      if (tool?.icon) return tool.icon;
      
      // 3. Check Pipedream API metadata
      if (appMeta?.logo_url || appMeta?.icon) return appMeta.logo_url || appMeta.icon;
      
      // 4. Construct direct Pipedream asset URL if we have an app ID
      const appId = appMeta?.id;
      if (appId) return `https://assets.pipedream.net/s.v0/${appId}/logo/orig`;

      // 5. Heuristic Fallbacks
      return `https://assets.pipedream.net/s.v0/app_logo/${slug.replace(/_/g, '-')}/64`;
    }, [slug, iconUrl, toolRegistry, appMeta]);

    return (
      <div className={cn("relative bg-secondary/80 flex items-center justify-center overflow-hidden", className)}>
         <div className="absolute inset-0 flex items-center justify-center text-[7px] font-black uppercase text-muted-foreground/30 select-none">
            {slug?.substring(0, 1) || '?'}
         </div>

         {finalIconUrl && (
            <img 
               src={finalIconUrl} 
               className={cn(
                   "absolute inset-0 w-full h-full object-contain p-0.5 transition-all duration-500 ease-out z-10",
                   isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-90"
               )}
               onLoad={() => setIsLoaded(true)}
               onError={(e) => {
                 if (!isLoaded && slug && !finalIconUrl.includes('pipedream.com')) {
                    (e.target as HTMLImageElement).src = `https://pipedream.com/s.v0/app_logo/${slug}/64`;
                 }
               }}
            />
         )}
      </div>
    );
  };

  const IntegrationLogos = () => {
    const getPlatformMetadata = () => {
        const nodes = skill.workflow?.nodes || [];
        const platforms = nodes.map((n: any) => {
            const data = n.data || {};
            const config = data.config || {};
            
            // Priority 1: Use direct icon if available
            if (data.icon && (data.icon.startsWith('http') || data.icon.startsWith('/'))) {
                return { iconUrl: data.icon, slug: config.platformName?.toLowerCase().replace(/\s+/g, '_') || data.label?.toLowerCase() };
            }

            const toolId = data.toolId || '';
            if (!toolId || toolId === 'skill.input' || toolId === 'skill.output' || toolId.startsWith('trigger')) return null;

            // Handle Pipedream 'pd' nodes
            if (toolId === 'pd' || toolId === 'pipedream') {
                const slug = config.appSlug?.replace('app_', '') || config.actionName?.split('-')[0] || config.platformName?.toLowerCase().replace(/\s+/g, '_');
                return { slug };
            }

            // Handle namespaced toolIds (e.g., llm.gemini, pipedream.slack)
            const parts = toolId.split('.');
            if (parts[0] === 'pipedream' || parts[0] === 'pd') {
                return { slug: parts[1]?.split('_')[0] || parts[1] };
            }

            return { slug: parts[0] };
        }).filter(Boolean);
        
        const credPlatforms = requiredCredentials.map((c: any) => {
             const p = typeof c === 'string' ? c : c.provider;
             if (!p) return null;
             const parts = p.split('.');
             return { slug: (parts[0] === 'pipedream' || parts[0] === 'pd') ? (parts[1] || parts[0]) : parts[0] };
        }).filter(Boolean);

        // Deduplicate by slug or iconUrl
        const unique = [];
        const seen = new Set();
        for (const p of [...platforms, ...credPlatforms]) {
            const key = p.iconUrl || p.slug;
            if (!seen.has(key) && p.slug !== 'llm' && p.slug !== 'ai' && p.slug !== 'utils') {
                unique.push(p);
                seen.add(key);
            }
        }
        return unique.slice(0, 3);
    };

    const platforms = getPlatformMetadata();
    
    if (platforms.length === 0) return (
        <div className="flex items-center gap-1 text-[8px] text-muted-foreground uppercase font-bold opacity-40 py-1">
            Native Logic
        </div>
    );

    return (
      <div className="flex -space-x-1.5 overflow-hidden py-1">
        {platforms.map((p: any, i) => (
          <div key={i} className="w-5 h-5 rounded-full border border-background bg-secondary overflow-hidden ring-1 ring-border/10">
            <PlatformIcon slug={p.slug} iconUrl={p.iconUrl} className="w-full h-full object-contain p-0.5" />
          </div>
        ))}
      </div>
    );
  };

   if (viewMode === 'list') {
      return (
         <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border border-border/40 hover:border-indigo-500/20 transition-all group">
            {/* Icon */}
            <div className="relative shrink-0">
               <Icon />
               {skill.isPublished && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full border-2 border-background" />
               )}
            </div>

            {/* Title + meta */}
            <div className="flex-1 min-w-0 overflow-hidden">
               <h3 className="text-sm font-bold text-foreground truncate tracking-tight leading-tight">
                  {skill.name}
               </h3>
               <div className="flex items-center gap-2 mt-1">
                  <p className="text-[9px] text-muted-foreground/50 font-bold uppercase tracking-widest shrink-0 leading-none">
                     {nodeCount} Nodes
                  </p>
                  <span className="text-muted-foreground/20 text-[8px] shrink-0">•</span>
                  <p className="text-[10px] text-muted-foreground/60 truncate font-medium max-w-[400px]">
                     {skill.description || 'Automated logic unit for high-precision workflow execution.'}
                  </p>
               </div>
            </div>

            {/* Logos – hidden on very small screens */}
            <div className="hidden sm:block shrink-0">
               <IntegrationLogos />
            </div>

            {/* Update badge */}
            {skill.hasUpdate && (
               <span className="shrink-0 hidden md:inline-flex px-2 py-0.5 rounded-full bg-amber-500/10 text-[7px] font-black uppercase text-amber-500 border border-amber-500/20 animate-pulse">
                  Update
               </span>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <button className="w-8 h-8 flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-secondary/80 rounded-lg transition-all">
                        <MoreHorizontal size={16} />
                     </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border/60">
                     <DropdownMenuItem onClick={onClick} className="uppercase text-[9px] font-bold tracking-widest py-2">
                        <Terminal size={12} className="mr-2" /> Edit Skill Logic
                     </DropdownMenuItem>
                     {skill.hasUpdate && (
                        <DropdownMenuItem onClick={onUpdate} className="text-amber-500 uppercase text-[9px] font-bold tracking-widest py-2">
                           <RefreshCw size={12} className="mr-2" /> Sync Update
                        </DropdownMenuItem>
                     )}
                     <DropdownMenuItem onClick={onPublish} className="uppercase text-[9px] font-bold tracking-widest py-2">
                        {skill.isPublished ? 'Marketplace Settings' : 'Publish Skill'}
                     </DropdownMenuItem>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={onDelete} className="text-red-500 uppercase text-[9px] font-bold tracking-widest py-2">
                        <Trash2 size={12} className="mr-2" /> Delete
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
         </div>
      );
   }

  // ── Grid Card ──────────────────────────────────────────────
  return (
    <div 
      className="group flex flex-col bg-card border border-border/40 hover:border-indigo-500/30 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1 relative"
    >
      {/* Decorative Gradient Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />

      {/* Update stripe */}
      {skill.hasUpdate && (
         <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 to-amber-600 animate-pulse z-10" />
      )}

      {/* Card Body */}
      <div className="flex flex-col p-6 gap-5 flex-1 relative z-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
           <div className="flex items-center gap-4 min-w-0">
              <div className="relative shrink-0">
                 <div className="size-11 rounded-2xl bg-secondary border border-border/40 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner group-hover:rotate-3">
                    <Icon />
                 </div>
                 {skill.isPublished && (
                    <div className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-indigo-500 text-[6px] font-black text-white uppercase border border-background shadow-[0_0_12px_rgba(99,102,241,0.4)] leading-tight tracking-[0.05em]">
                       LIVE
                    </div>
                 )}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden pt-1">
                 <h3 className="text-base font-bold text-foreground tracking-tight leading-tight group-hover:text-indigo-400 transition-colors line-clamp-2 break-words font-display">
                    {skill.name}
                 </h3>
              </div>
           </div>

           {/* 3-dot menu */}
           <div className="shrink-0 relative z-20">
              <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                    <button className="w-9 h-9 flex items-center justify-center text-muted-foreground/30 hover:text-foreground hover:bg-secondary/80 rounded-xl transition-all active:scale-90">
                       <MoreHorizontal size={18} strokeWidth={2.5} />
                    </button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-52 bg-card border-border/60 rounded-xl shadow-2xl p-1 animate-in zoom-in-95 duration-200">
                    <DropdownMenuItem onClick={onClick} className="uppercase text-[10px] font-bold tracking-widest py-3 cursor-pointer rounded-lg focus:bg-indigo-500/10 focus:text-indigo-500">
                        <Terminal size={14} className="mr-3" /> Edit Skill Logic
                    </DropdownMenuItem>
                    {skill.hasUpdate && (
                       <DropdownMenuItem onClick={onUpdate} className="text-amber-500 uppercase text-[10px] font-bold tracking-widest py-3 cursor-pointer rounded-lg focus:bg-amber-500/10 focus:text-amber-500">
                          <RefreshCw size={14} className="mr-3" /> Sync Update
                       </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={onPublish} className="uppercase text-[10px] font-bold tracking-widest py-3 cursor-pointer rounded-lg focus:bg-indigo-500/10 focus:text-indigo-500">
                       {skill.isPublished ? 'Marketplace Profile' : 'Publish to Marketplace'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/40 my-1" />
                    <DropdownMenuItem onClick={onDelete} className="text-red-500 uppercase text-[10px] font-bold tracking-widest py-3 cursor-pointer rounded-lg focus:bg-red-500/10 focus:text-red-500">
                       <Trash2 size={14} className="mr-3" /> Delete Skill
                    </DropdownMenuItem>
                 </DropdownMenuContent>
              </DropdownMenu>
           </div>
        </div>

        {/* Description */}
        <p className="text-[12px] text-muted-foreground font-medium line-clamp-2 leading-relaxed min-h-[36px] overflow-hidden break-words whitespace-normal px-1">
           {skill.description || 'Automated logic unit for high-precision workflow execution.'}
        </p>

        {/* Integration Stack */}
        <div className="mt-auto pt-2">
           <IntegrationLogos />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/5 px-6 py-4 bg-secondary/5 flex items-center justify-between relative z-10 transition-colors group-hover:bg-indigo-500/5">
         <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground/20">
            <Globe size={12} /> Unit Logic Verified
         </div>
         <span className="text-[10px] font-bold text-indigo-500/40 uppercase tracking-widest">{nodeCount} Operational Nodes</span>
      </div>
    </div>
  );
}
