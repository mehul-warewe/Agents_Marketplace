'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import { 
  useCredentials, 
  useCredentialSchemas, 
  useCreateCredential, 
  useDeleteCredential, 
  useTestCredential,
  useInfinitePipedreamApps,
  usePipedreamToken,
  usePipedreamAccounts,
  useDeletePdAccount,
} from '@/hooks/useApi';
import { usePipedreamAppDetails } from '@/hooks/useSkills';
import { 
  Link2, Plus, Trash2, 
  ExternalLink, ShieldCheck, 
  Slack, Mail, Globe, RefreshCw, X, Link, ChevronLeft, Shield, Bot, Sparkles,
  Search,
  Zap,
  CheckCircle2,
  Activity,
  Layers,
  ArrowRight,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const iconMap: Record<string, any> = {};

function ConnectedAppIcon({ slug, appId, defaultLogo, className }: any) {
  const { data: appMeta } = usePipedreamAppDetails(slug);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  const finalLogo = appMeta?.logo_url || appMeta?.icon || defaultLogo;
  const finalAppId = appMeta?.id || appId;

  const logoFallbacks = [
    finalLogo,
    finalAppId ? `https://assets.pipedream.net/s.v0/${finalAppId}/logo/orig` : null,
    `https://assets.pipedream.net/s.v0/app_logo/${slug}/64`,
    `https://pipedream.com/s.v0/app_logo/${slug}/64`,
    `https://unavatar.io/${slug}`,
  ].filter(Boolean) as string[];

  if (fallbackIndex >= logoFallbacks.length) {
    return <Link2 size={16} className="text-muted-foreground/30 animate-pulse" />;
  }

  return (
    <img 
      key={fallbackIndex}
      src={logoFallbacks[fallbackIndex]} 
      className={className} 
      onError={() => setFallbackIndex(i => i + 1)}
    />
  );
}

function ActiveConnectionCard({ cred, schemas, onDelete, iconMap, isDeleting }: any) {
  const [showOptions, setShowOptions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const slug = cred.appSlug || cred.type.replace('pd:', '').replace('_oauth', '').replace(/_/g, '-');
  const mappedIcon = iconMap[slug];

  return (
    <div className={`group bg-card p-4 relative transition-all duration-500 rounded-3xl border border-border/40 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1 flex items-center gap-4 overflow-hidden ${isDeleting ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
      {/* Decorative Gradient */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
      
      {/* App Logo */}
      <div className="size-10 rounded-xl border flex items-center justify-center bg-secondary border-border/40 text-foreground shadow-inner overflow-hidden p-2 shrink-0 relative z-10 group-hover:rotate-3 transition-transform duration-500">
        {isDeleting ? (
           <RefreshCw size={14} className="animate-spin text-indigo-500/40" />
        ) : mappedIcon ? (
           React.cloneElement(mappedIcon as any, { className: 'w-full h-full object-contain' })
        ) : (
          <div className="w-full h-full relative flex items-center justify-center">
            <ConnectedAppIcon 
              slug={slug} 
              appId={cred.appId} 
              defaultLogo={cred.logoUrl} 
              className="w-full h-full object-contain relative z-10" 
            />
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 min-w-0 relative z-10">
        <h3 className="text-[12px] font-bold font-display tracking-tight truncate leading-tight group-hover:text-indigo-500 transition-colors">
          {(cred.isPipedream ? cred.platformName : (schemas?.[cred.type]?.label || cred.platformName || cred.type.toUpperCase())).split(' ').map((s: string) => (s && s[0]) ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s).join(' ')}
        </h3>

        {cred.name && cred.name.toLowerCase() !== (cred.platformName || '').toLowerCase() && (
          <p className="text-[10px] font-medium text-muted-foreground truncate opacity-70 leading-relaxed">
            {cred.name}
          </p>
        )}
      </div>

      <div className="relative z-20 shrink-0" ref={dropdownRef}>
        <button 
          onClick={() => setShowOptions(!showOptions)}
          className="w-9 h-9 rounded-xl hover:bg-secondary flex items-center justify-center text-muted-foreground/30 hover:text-foreground transition-all active:scale-90"
        >
          <MoreVertical size={16} strokeWidth={2.5} />
        </button>

        <AnimatePresence>
          {showOptions && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-card border border-border/60 rounded-xl shadow-2xl z-50 overflow-hidden py-1 p-1"
            >
               <button 
                 onClick={() => {
                   if (confirm('Sync removal of this integration node?')) {
                     onDelete();
                   }
                   setShowOptions(false);
                 }}
                 className="w-full px-4 py-3 text-left text-[10px] font-bold text-red-500 hover:bg-red-500/5 flex items-center gap-3 transition-colors rounded-lg uppercase tracking-widest"
               >
                 <Trash2 size={14} />
                 Remove Bridge
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MarketplaceCard({ id, name, icon, logoUrl, isConnected, onClick, type = 'platform' }: any) {
  return (
    <motion.button 
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group bg-card rounded-[2rem] border border-border/40 p-5 flex flex-col items-center justify-center text-center relative transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 overflow-hidden"
    >
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="size-14 rounded-2xl bg-secondary border border-border/40 flex items-center justify-center text-foreground group-hover:rotate-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 mb-4 relative z-10 p-3 shadow-inner overflow-hidden">
         <div className="w-full h-full relative flex items-center justify-center">
            {icon ? (
              React.cloneElement(icon as any, { className: 'w-full h-full object-contain' })
            ) : (
             <>
               <img 
                 src={logoUrl} 
                 className="w-full h-full object-contain transition-all relative z-10" 
                 onError={(e: any) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
               />
               <div className="absolute inset-0 items-center justify-center bg-secondary hidden">
                  <Plus size={20} className="text-muted-foreground/20" />
               </div>
             </>
           )}
         </div>
      </div>
      
      <h3 className="text-[11px] font-bold font-display text-foreground mb-4 relative z-10 truncate w-full px-1 uppercase tracking-tight group-hover:text-indigo-500 transition-colors">
        {name}
      </h3>

      <div className={`w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.05em] px-4 py-2 relative z-10 rounded-xl border transition-all duration-300 ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-secondary border-border/40 text-muted-foreground group-hover:bg-indigo-600 group-hover:text-white group-hover:border-transparent group-hover:shadow-lg group-hover:shadow-indigo-500/20 shadow-inner'}`}>
        {isConnected ? (
          <>
            <CheckCircle2 size={12} strokeWidth={3} />
            Connected
          </>
        ) : (
          <>
            <Link2 size={12} strokeWidth={3} />
            Connect
          </>
        )}
      </div>
    </motion.button>
  );
}

export default function ConnectionsPage() {
  const { data: credentials, isLoading: loadingCreds } = useCredentials();
  const { data: schemas } = useCredentialSchemas();
  const { data: pdAccounts, isLoading: loadingPdAccounts } = usePipedreamAccounts();
  const createCredential = useCreateCredential();
  const deleteCredential = useDeleteCredential();
  const deletePdAccount = useDeletePdAccount();
  const testCredential = useTestCredential();
  const generateToken = usePipedreamToken();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, isPipedream: boolean) => {
    setDeletingId(id);
    try {
      if (isPipedream) {
        await deletePdAccount.mutateAsync(id);
      } else {
        await deleteCredential.mutateAsync(id);
      }
    } catch (err) {
      console.error('Failed to delete connection:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [credName, setCredName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = [
    'All', 'Popular', 'AI', 'Communication', 'Database', 'CRM', 'DevTools', 'Social'
  ];
  
  const exploreRef = useRef<HTMLDivElement>(null);

  const { 
    data: pdPages, 
    isLoading: isLoadingPd, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfinitePipedreamApps(searchQuery, 40);

  const allPlatforms = pdPages?.pages.flatMap(page => page.results) || [];

  const unifiedBridges = useMemo(() => {
    const platformMetaMap: Record<string, { logoUrl: string, name: string, icon?: string }> = {};
    allPlatforms.forEach((app: any) => {
      platformMetaMap[app.slug] = {
        logoUrl: `https://assets.pipedream.net/s.v0/${app.id}/logo/orig`,
        name: app.name,
        icon: app.icon
      };
    });
    const native = (credentials || []).map((c: any) => {
      const slug = c.type.replace('_oauth', '').replace(/_/g, '-');
      const meta = platformMetaMap[slug] || platformMetaMap[c.type.replace('_oauth', '')];
      
      const platformLabel = schemas?.[c.type]?.label || meta?.name || slug
        .split('-')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return {
        ...c,
        isPipedream: false,
        platformName: platformLabel,
        appSlug: slug,
        logoUrl: meta?.logoUrl || meta?.icon || `https://pipedream.com/s.v0/app_logo/${slug}/64`
      };
    });
    
    const pd = (pdAccounts?.accounts || []).map((acc: any) => {
      const rawSlug = acc.app_slug || (acc.app?.slug) || 'app';
      const normalizedSlug = rawSlug.replace(/_/g, '-');
      const meta = platformMetaMap[rawSlug] || platformMetaMap[normalizedSlug];

      const platformLabel = meta?.name || rawSlug
        .split('_')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      let displayName = acc.name || platformLabel;
      if (displayName.toLowerCase().startsWith('pipedream')) {
        displayName = displayName.replace(/^pipedream\s+/i, '') || platformLabel;
      }

      const appId = acc.app_id || acc.app?.id || acc.oauth_app_id || acc.app?.app_id;
      const logoUrl = acc.logo_url || acc.app?.logo_url || meta?.logoUrl || meta?.icon || (appId 
        ? `https://assets.pipedream.net/s.v0/${appId}/logo/orig`
        : `https://pipedream.com/s.v0/app_logo/${normalizedSlug}/64`);

      return {
        id: acc.id,
        name: displayName,
        platformName: platformLabel,
        type: `pd:${rawSlug}`,
        isValid: true,
        isPipedream: true,
        appSlug: normalizedSlug,
        appId: appId,
        logoUrl: logoUrl
      };
    });
 
    return [...native, ...pd];
  }, [credentials, pdAccounts, allPlatforms, schemas]);

  const connectedTypesSet = useMemo(() => {
    return new Set(unifiedBridges.map((b: any) => b.type));
  }, [unifiedBridges]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const credentialType = searchParams.get('credentialType');
    const platform = searchParams.get('platform');
    if (credentialType && schemas?.[credentialType]) {
      setSelectedType(credentialType);
      setCredName(platform ? `${platform} Workspace` : '');
      setIsModalOpen(true);
    }
  }, [schemas]);

  const handlePipedreamConnect = async (app: any) => {
    try {
      const result = await generateToken.mutateAsync(app.id);
      const url = result.connectLinkUrl || result.url;
      if (!url) return;

      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(url, `Connect ${app.name}`, `width=${width},height=${height},left=${left},top=${top}`);
    } catch (err) {
      console.error('Failed to generate connect token:', err);
    }
  };

  const scrollToExplore = () => {
    exploreRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <SidebarLayout title="Integrations">
       <div className="flex-1 text-foreground space-y-6 p-6 bg-secondary/5 h-full overflow-y-auto no-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
             <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 font-display">
                      <Link size={16} />
                   </div>
                   <span className="text-[10px] font-bold text-indigo-500/60 uppercase tracking-[0.3em]">Authentication Hub</span>
                </div>
                <h1 className="text-4xl font-bold font-display tracking-tight text-foreground">
                  Control Center
                </h1>
                <p className="text-muted-foreground font-medium text-[12px] max-w-xl leading-relaxed">
                   Manage and monitor secure authenticated bridges to external platforms and internal workforce services.
                </p>
             </div>
             
             <Button
                onClick={scrollToExplore}
                className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all gap-3"
             >
                <Plus size={16} strokeWidth={2.5} /> Marketplace
             </Button>
          </div>

          {/* Active Connections */}
          <section className="space-y-5">
             <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                   <ShieldCheck size={16} className="text-emerald-500/60" />
                   <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40">Active Integration Nodes</h2>
                </div>
                {unifiedBridges.length > 0 && (
                   <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                      {unifiedBridges.length} Secure Bridges
                   </div>
                )}
             </div>

             {loadingCreds || loadingPdAccounts ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-card/40 border border-border/40 rounded-3xl animate-pulse" />)}
               </div>
             ) : unifiedBridges.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-center px-10 border border-border border-dashed rounded-3xl bg-card/30 max-w-lg mx-auto">
                   <div className="w-12 h-12 bg-secondary/50 rounded-2xl flex items-center justify-center text-muted-foreground/30 border border-border/40 mb-6 font-display">
                      <Link size={24} />
                   </div>
                   <h3 className="text-lg font-bold font-display mb-2 text-foreground uppercase tracking-tight">Node Registry Empty</h3>
                   <p className="text-muted-foreground mb-8 text-[11px] font-medium leading-relaxed max-w-xs mx-auto">
                      No secure bridges have been established. Browse the integration marketplace below to authorize external platforms.
                   </p>
                   <Button onClick={scrollToExplore} variant="outline" className="text-[10px] font-bold uppercase tracking-widest h-9 px-6 rounded-xl border-border/60">
                      Explore Marketplace
                   </Button>
               </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {unifiedBridges.map((cred: any) => (
                    <ActiveConnectionCard 
                      key={cred.id} 
                      cred={cred} 
                      schemas={schemas} 
                      iconMap={iconMap}
                      isDeleting={deletingId === cred.id}
                      onDelete={() => handleDelete(cred.id, cred.isPipedream)} 
                    />
                  ))}
                </div>
             )}
          </section>

          {/* Marketplace section */}
          <section ref={exploreRef} className="space-y-8 pt-10 pb-20 border-t border-border/5">
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 font-display">
                        <Layers size={16} />
                     </div>
                     <span className="text-[10px] font-bold text-indigo-500/60 uppercase tracking-[0.3em]">Module Registry</span>
                  </div>
                  <h2 className="text-3xl font-bold font-display tracking-tight text-foreground">Platform Marketplace</h2>
                  <p className="text-muted-foreground font-medium text-[12px] flex items-center gap-2 mt-0.5 leading-relaxed">
                    Bridge over 100+ native agent tools and cloud services.
                  </p>
                </div>
                
                <div className="relative min-w-full md:min-w-[400px] group">
                   <div className="relative">
                    <Search size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchFocused ? 'text-indigo-500' : 'text-muted-foreground/30'}`} />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search integration catalog..."
                        className="w-full h-11 bg-card border border-border/60 rounded-2xl px-12 text-[12px] font-bold text-foreground outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm group-hover:shadow-lg placeholder:text-muted-foreground/30"
                      />
                   </div>
                </div>
              </div>

               <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all whitespace-nowrap border ${activeCategory === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20' : 'bg-card text-muted-foreground border-border/40 hover:bg-secondary hover:text-foreground'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {allPlatforms.map((app: any) => (
                  <MarketplaceCard 
                    key={app.id}
                    name={app.name}
                    logoUrl={`https://assets.pipedream.net/s.v0/${app.id}/logo/orig`}
                    isConnected={connectedTypesSet.has(`pd:${app.slug}`)}
                    onClick={() => handlePipedreamConnect(app)}
                  />
                ))}

                {isLoadingPd && [1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-44 bg-card/40 rounded-[2rem] border border-border/40 border-dashed animate-pulse" />
                ))}
              </div>

              {hasNextPage && !searchQuery && (
                <div className="flex justify-center py-12">
                  <Button 
                    onClick={() => fetchNextPage()} 
                    disabled={isFetchingNextPage}
                    variant="outline"
                    className="h-12 px-10 rounded-2xl font-bold text-[11px] uppercase tracking-widest border-border/60 hover:bg-secondary hover:text-white transition-all shadow-xl shadow-black/5"
                  >
                    {isFetchingNextPage ? <Activity size={14} className="animate-spin mr-3" /> : <RefreshCw size={14} className="mr-3" />}
                    {isFetchingNextPage ? 'Retrieving Protocols...' : 'Show More Tools'}
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80" 
              onClick={() => setIsModalOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-lg rounded-[2.5rem] border border-border/40 shadow-2xl overflow-hidden relative z-10 duration-500"
            >
              <div className="p-10 border-b border-border/40 relative bg-secondary/30">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 w-10 h-10 rounded-xl bg-card hover:bg-foreground hover:text-background flex items-center justify-center transition-all border border-border/40 shadow-sm">
                  <X size={20} strokeWidth={2.5} />
                </button>
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 font-display">
                      <Sparkles size={16} />
                   </div>
                   <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Authorization Bridge</span>
                </div>
                <h2 className="text-3xl font-bold font-display text-foreground tracking-tight uppercase tracking-tight">
                  {selectedType ? (schemas?.[selectedType]?.label || selectedType) : 'Platform'}
                </h2>
              </div>
              <div className="p-10 max-h-[70vh] overflow-y-auto no-scrollbar">
                {selectedType && (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!credName) return;
                    createCredential.mutate({ name: credName, type: selectedType, data: formData });
                    setIsModalOpen(false);
                  }} className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">Alias Identifier</label>
                      <input required type="text" value={credName} onChange={e => setCredName(e.target.value)} className="w-full bg-secondary border border-border/40 rounded-2xl px-6 py-4 text-[13px] font-bold text-foreground outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner" placeholder="e.g. Master Production Key" />
                    </div>
                    <div className="space-y-6">
                       {schemas?.[selectedType]?.fields.map((f: any) => (
                        <div key={f.key} className="space-y-3">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">{f.label}</label>
                          <input required type={f.type === 'password' ? 'password' : 'text'} value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} className="w-full bg-secondary border border-border/40 rounded-2xl px-6 py-4 text-[13px] font-bold text-foreground outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner" placeholder={`Enter ${f.label.toLowerCase()}...`} />
                        </div>
                      ))}
                    </div>
                    <div className="pt-6">
                       <Button type="submit" className="w-full bg-indigo-600 text-white h-14 rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all border-none">
                          Establish secure bridge
                          <ArrowRight size={16} className="ml-3" strokeWidth={3} />
                       </Button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SidebarLayout>
  );
}
