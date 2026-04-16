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
  usePipedreamAppDetails
} from '@/hooks/useApi';
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

const iconMap: Record<string, any> = {};

function ConnectedAppIcon({ slug, appId, defaultLogo, className }: any) {
  const { data: appMeta } = usePipedreamAppDetails(slug);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  // Pipedream API response can have logo_url or icon depending on which endpoint we hit
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
    <div className={`bg-card rounded-2xl border border-border/40 p-4 flex items-center gap-5 group relative transition-all duration-300 shadow-sm hover:shadow-md hover:border-primary/20 ${isDeleting ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
      
      {/* Big Logo Left */}
      <div className="w-12 h-12 rounded-xl border flex items-center justify-center bg-secondary border-border/40 text-foreground shadow-inner overflow-hidden p-2 shrink-0 relative z-10">
        {isDeleting ? (
           <RefreshCw size={20} className="animate-spin text-primary/40" />
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

      <div className="flex flex-col flex-1 min-w-0 pr-6 relative z-10">
        <h3 className="text-base font-bold font-display tracking-tight truncate leading-tight">
          {(cred.isPipedream ? cred.platformName : (schemas?.[cred.type]?.label || cred.platformName || cred.type.toUpperCase())).split(' ').map((s: string) => (s && s[0]) ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s).join(' ')}
        </h3>

        {cred.name && cred.name.toLowerCase() !== (cred.platformName || '').toLowerCase() && (
          <p className="text-[11px] font-medium text-muted-foreground truncate opacity-70 leading-relaxed mt-0.5">
            {cred.name}
          </p>
        )}
      </div>

      <div className="relative z-20" ref={dropdownRef}>
        <button 
          onClick={() => setShowOptions(!showOptions)}
          className="w-8 h-8 rounded-lg hover:bg-secondary/50 flex items-center justify-center text-muted-foreground/40 hover:text-foreground transition-all active:scale-95"
        >
          <MoreVertical size={16} />
        </button>

        <AnimatePresence>
          {showOptions && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-card border border-border/60 rounded-xl shadow-2xl z-50 overflow-hidden py-1"
            >
               <button 
                 onClick={() => {
                   if (confirm('Are you sure you want to remove this connection?')) {
                     onDelete();
                   }
                   setShowOptions(false);
                 }}
                 className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-500 hover:bg-red-500/5 flex items-center gap-2 transition-colors"
               >
                 <Trash2 size={12} />
                 Remove Connection
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
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="bg-card rounded-3xl border border-border/40 p-6 flex flex-col items-center justify-center text-center group relative transition-all duration-300 shadow-sm hover:shadow-2xl hover:border-primary/30"
    >
      <div className="w-16 h-16 rounded-2xl bg-secondary border border-border/40 flex items-center justify-center text-foreground group-hover:scale-110 transition-all mb-4 relative z-10 p-4 shadow-inner overflow-hidden">
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
                  <Plus size={24} className="text-muted-foreground/20" />
               </div>
             </>
           )}
         </div>
      </div>
      
      <h3 className="text-sm font-bold font-display text-foreground mb-4 relative z-10 truncate w-full px-2">
        {name}
      </h3>

      <div className={`w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl border transition-all ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 opacity-80' : 'bg-secondary border-border/40 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary shadow-sm'}`}>
        {isConnected ? (
          <>
            <CheckCircle2 size={12} className="fill-current" />
            Connected
          </>
        ) : (
          <>
            <Plus size={12} strokeWidth={2.5} />
            Connect
          </>
        )}
      </div>

      {/* Decorative gradient highlight on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
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

  // Merge native and Pipedream accounts
  const unifiedBridges = useMemo(() => {
    // Create a lookup map from marketplace platforms for high-quality logos and accurate names
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
    
    const pd = (pdAccounts || []).map((acc: any) => {
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

  const handlePlatformClick = (key: string, s: any) => {
    if (key.includes('oauth')) {
       const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
       const authUrl = new URL(`${apiUrl}/credentials/oauth/${key.split('_')[0]}`);
       const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
       if (token) authUrl.searchParams.set('token', token);
       window.open(authUrl.toString(), `Connect`, `width=600,height=700`);
    } else {
      setSelectedType(key);
      setCredName(s.label.toUpperCase());
      setIsModalOpen(true);
    }
  };

  return (
    <SidebarLayout title="Integrations">
      <div className="p-6 sm:p-10 lg:p-12 max-w-7xl mx-auto space-y-16 font-inter text-foreground">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-4">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold font-display tracking-tight leading-none text-foreground">Cloud Integrations</h1>
            <p className="text-muted-foreground font-medium text-sm max-w-xl">
              Connect your professional accounts to extend the reach of your digital workforce.
            </p>
          </div>
          
          <button onClick={scrollToExplore} className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
            <Plus size={18} strokeWidth={2.5} /> Browse Marketplace
          </button>
        </header>

        {/* Active Connections */}
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <Activity size={20} className="text-primary/60" />
              <h2 className="text-2xl font-bold font-display tracking-tight text-foreground">Active Integrations</h2>
            </div>
            {unifiedBridges.length > 0 && (
              <span className="text-[10px] font-bold px-3 py-1 bg-primary/5 text-primary border border-primary/20 rounded-full uppercase tracking-wider">
                {unifiedBridges.length} Enabled
              </span>
            )}
          </div>

          {(loadingCreds || loadingPdAccounts) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-secondary/40 border border-border rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : unifiedBridges.length === 0 ? (
            <div className="bg-secondary/40 rounded-3xl border border-border/40 border-dashed py-20 flex flex-col items-center justify-center text-center space-y-6 px-8 group overflow-hidden">
              <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center text-muted-foreground/20 border border-border/20 group-hover:scale-110 transition-transform shadow-sm">
                <Link2 size={32} strokeWidth={1} />
              </div>
              <div className="space-y-1 relative z-10">
                <h3 className="text-xl font-bold font-display text-foreground/40">No connections detected</h3>
                <p className="text-muted-foreground font-medium text-xs max-w-xs">Browse the marketplace below to initiate your first secure account link.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {unifiedBridges.map((cred: any) => (
                <ActiveConnectionCard 
                  key={cred.id} 
                  cred={cred} 
                  schemas={schemas} 
                  onDelete={() => handleDelete(cred.id, cred.isPipedream)} 
                  iconMap={iconMap} 
                  isDeleting={deletingId === cred.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Marketplace */}
        <section ref={exploreRef} className="space-y-12 pb-32">
          <div className="space-y-10">
            <div className="flex flex-col gap-10">
              {/* Marketplace Stats & Search */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2 pt-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                      <Layers size={24} />
                    </div>
                    <div>
                      <h2 className="text-4xl font-black font-display tracking-tight text-foreground">Marketplace</h2>
                      <p className="text-muted-foreground font-medium text-sm flex items-center gap-2 mt-1">
                        Discover & bridge 100+ native agent skills 
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-primary/60">New platforms weekly</span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="relative min-w-full md:min-w-[450px] group">
                   <div className={`absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500`} />
                   <div className="relative">
                    <Search size={20} className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchFocused ? 'text-primary' : 'text-muted-foreground/30'}`} />
                      <input 
                        type="text"
                        value={searchQuery}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search for tools, CRM, AI, or storage..."
                        className="w-full bg-card border border-border/60 rounded-2xl px-16 py-5 text-base font-semibold text-foreground outline-none focus:ring-0 transition-all shadow-xl placeholder:text-muted-foreground/30"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                        >
                          <X size={14} />
                        </button>
                      )}
                   </div>
                </div>
              </div>

              {/* Category Chips */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 px-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all whitespace-nowrap border ${activeCategory === cat ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'bg-secondary/40 text-muted-foreground border-border/40 hover:bg-secondary hover:text-foreground'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Marketplace Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {/* Pipedream Apps */}
              {allPlatforms.map((app: any) => (
                <MarketplaceCard 
                  key={app.id}
                  name={app.name}
                  logoUrl={`https://assets.pipedream.net/s.v0/${app.id}/logo/orig`}
                  isConnected={connectedTypesSet.has(`pd:${app.slug}`)}
                  onClick={() => handlePipedreamConnect(app)}
                />
              ))}

              {/* Loading Skeletons */}
              {isLoadingPd && [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-secondary/20 rounded-3xl border border-border border-dashed animate-pulse" />
              ))}
            </div>

            {hasNextPage && !searchQuery && (
              <div className="flex justify-center py-16">
                <button 
                  onClick={() => fetchNextPage()} 
                  disabled={isFetchingNextPage}
                  className="group relative px-12 py-5 rounded-2xl bg-secondary border border-border/60 overflow-hidden transition-all hover:border-primary/30"
                >
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                  <div className="relative flex items-center gap-3 font-bold text-sm tracking-tight text-foreground">
                    {isFetchingNextPage ? (
                      <>
                        <RefreshCw size={18} className="animate-spin text-primary" />
                        Syncing Ecosystem...
                      </>
                    ) : (
                      <>
                        Discover 1,200+ More Tools
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            )}
          </div>
        </section>

        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-xl" onClick={() => setIsModalOpen(false)} />
            <div className="bg-card w-full max-w-lg rounded-3xl border border-border/60 shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
              <div className="p-10 border-b border-border/40 relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 w-10 h-10 rounded-xl bg-secondary hover:bg-muted flex items-center justify-center text-muted-foreground transition-all">
                  <X size={20} strokeWidth={2.5} />
                </button>
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                   <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Configuration</span>
                </div>
                <h2 className="text-2xl font-bold font-display text-foreground tracking-tight">
                  {selectedType ? `Setup ${schemas?.[selectedType]?.label}` : 'New Connection'}
                </h2>
              </div>
              <div className="p-10 max-h-[70vh] overflow-y-auto no-scrollbar">
                {selectedType && (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    createCredential.mutate({ name: credName, type: selectedType, data: formData });
                    setIsModalOpen(false);
                  }} className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Workspace Alias</label>
                      <input required type="text" value={credName} onChange={e => setCredName(e.target.value)} className="w-full bg-secondary border border-border/40 rounded-xl px-4 py-3 text-sm font-medium text-foreground outline-none focus:ring-4 focus:ring-primary/5 transition-all" placeholder="e.g. Production Account" />
                    </div>
                    <div className="space-y-6">
                       {schemas?.[selectedType]?.fields.map((f: any) => (
                        <div key={f.key} className="space-y-2">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">{f.label}</label>
                          <input required type={f.type === 'password' ? 'password' : 'text'} value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} className="w-full bg-secondary border border-border/40 rounded-xl px-4 py-3 text-sm font-medium text-foreground outline-none focus:ring-4 focus:ring-primary/5 transition-all" placeholder={`Enter your ${f.label.toLowerCase()}...`} />
                        </div>
                      ))}
                    </div>
                    <div className="pt-4">
                      <button type="submit" className="w-full bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all">Enable Integration</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </SidebarLayout>
  );
}
