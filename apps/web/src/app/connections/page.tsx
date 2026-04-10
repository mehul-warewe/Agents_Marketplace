'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  usePipedreamAccounts
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
  ArrowRight
} from 'lucide-react';

const iconMap: Record<string, any> = {
  slack: <Slack size={20} />,
  mail: <Mail size={20} />,
  google: <img src="/iconSvg/google-gmail.svg" className="w-5 h-5 object-contain" />,
  google_gmail: <img src="/iconSvg/google-gmail.svg" className="w-5 h-5 object-contain" />,
  google_calendar: <img src="/iconSvg/google-calendar.svg" className="w-5 h-5 object-contain" />,
  google_drive: <img src="/iconSvg/google-drive.svg" className="w-5 h-5 object-contain" />,
  google_sheets: <img src="/iconSvg/google-sheets-icon.svg" className="w-5 h-5 object-contain" />,
  youtube: <img src="/iconSvg/youtube-icon.svg" className="w-5 h-5 object-contain" />,
  link: <Link2 size={20} />,
  webhook: <Globe size={20} />,
  sparkles: <Sparkles size={20} />,
  openai: <img src="/iconSvg/openai.svg" className="w-5 h-5 object-contain invert" />,
  gemini: <img src="/iconSvg/gemini-color.svg" className="w-5 h-5 object-contain" />,
  claude: <img src="/iconSvg/claude-color.svg" className="w-5 h-5 object-contain" />,
  openrouter: <img src="/iconSvg/openrouter.svg" className="w-5 h-5 object-contain invert" />,
  mongodb_atlas: <img src="/iconSvg/mongodb-icon.svg" className="w-5 h-5 object-contain" />,
  redis: <img src="/iconSvg/redis.svg" className="w-5 h-5 object-contain" />,
  github: <img src="/iconSvg/github.svg" className="w-5 h-5 object-contain invert" />,
  notion: <img src="/iconSvg/notion.svg" className="w-5 h-5 object-contain invert" />,
  linear: <img src="/iconSvg/linear.svg" className="w-5 h-5 object-contain invert" />,
  supabase: <img src="/iconSvg/supabase.svg" className="w-5 h-5 object-contain" />,
  linkedin: <img src="/iconSvg/linkedin.svg" className="w-5 h-5 object-contain" />,
  reddit: <img src="/iconSvg/reddit.svg" className="w-5 h-5 object-contain" />,
};

export default function ConnectionsPage() {
  const { data: credentials, isLoading: loadingCreds } = useCredentials();
  const { data: schemas } = useCredentialSchemas();
  const { data: pdAccounts, isLoading: loadingPdAccounts } = usePipedreamAccounts();
  const createCredential = useCreateCredential();
  const deleteCredential = useDeleteCredential();
  const testCredential = useTestCredential();
  const generateToken = usePipedreamToken();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [credName, setCredName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  
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
    const native = (credentials || []).map((c: any) => ({
      ...c,
      isPipedream: false
    }));
    
    const pd = (pdAccounts || []).map((acc: any) => ({
      id: acc.id,
      // Pipedream usually returns name, slug, and sometimes an internal app id
      name: acc.name || `Pipedream ${acc.app_slug}`,
      type: `pd:${acc.app_slug}`,
      isValid: true,
      isPipedream: true,
      appSlug: acc.app_slug,
      // For connected accounts, we use slug-based logo as ID is often not provided in the same object
      logoUrl: `https://pipedream.com/s.v0/app_logo/${acc.app_slug}/64`
    }));

    return [...native, ...pd];
  }, [credentials, pdAccounts]);

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
    <SidebarLayout title="Connections">
      <div className="p-6 sm:p-10 lg:p-12 max-w-7xl mx-auto space-y-16 font-inter text-foreground">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <div className="w-8 h-[2px] bg-foreground/20" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted">Integrations</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter leading-none uppercase italic">Connections</h1>
            <p className="text-muted font-bold text-sm max-w-xl opacity-50 uppercase tracking-tight">MANAGE YOUR SECURE ACCOUNTS.</p>
          </div>
          
          <button onClick={scrollToExplore} className="bg-foreground text-background px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.05] transition-all flex items-center gap-3">
            <Plus size={16} strokeWidth={3} /> Browse Marketplace
          </button>
        </header>

        {/* Active Bridges */}
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <Activity size={20} className="text-foreground opacity-50" />
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">Active Connections</h2>
            </div>
            {unifiedBridges.length > 0 && (
              <span className="text-[10px] font-black px-4 py-1.5 bg-foreground/5 border border-border/40 rounded-full uppercase tracking-wider">
                {unifiedBridges.length} ACTIVE
              </span>
            )}
          </div>

          {(loadingCreds || loadingPdAccounts) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-muted/5 border border-border rounded-[2rem] animate-pulse" />
              ))}
            </div>
          ) : unifiedBridges.length === 0 ? (
            <div className="bg-foreground/[0.01] rounded-[3rem] border border-border/40 border-dashed py-24 flex flex-col items-center justify-center text-center space-y-8 px-8 group overflow-hidden">
              <div className="w-20 h-20 bg-foreground/5 rounded-[2rem] flex items-center justify-center text-muted/20 border border-border/20 group-hover:scale-110 transition-transform">
                <Link2 size={40} strokeWidth={1} />
              </div>
              <div className="space-y-2 relative z-10">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic opacity-40">Zero Connectivity</h3>
                <p className="text-muted font-bold text-[10px] uppercase opacity-30 tracking-widest">BRIDGE SEARCH MARKETPLACE TO INITIATE AUTHORIZATION.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {unifiedBridges.map((cred: any) => (
                <div key={cred.id} className="bg-card rounded-[2rem] border border-border/60 p-6 flex flex-col group relative transition-all duration-300 hover:shadow-2xl hover:shadow-foreground/5 hover:border-foreground/30 overflow-hidden min-h-[220px]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/[0.02] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                  
                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div className="w-14 h-14 rounded-2xl border flex items-center justify-center transition-all bg-foreground/[0.02] border-border/40 text-foreground group-hover:bg-foreground group-hover:text-background shadow-inner overflow-hidden p-3">
                      {cred.isPipedream ? (
                        <img 
                          src={cred.logoUrl} 
                          className="w-full h-full object-contain filter group-hover:invert transition-all" 
                          onError={(e: any) => { e.target.src = 'https://pipedream.com/s.v0/app_logo/pipedream/64'; }}
                        />
                      ) : (
                        iconMap[schemas?.[cred.type]?.icon] || <Shield size={24} />
                      )}
                    </div>
                    {!cred.isPipedream && (
                      <button 
                        onClick={() => confirm('Sever this bridge?') && deleteCredential.mutate(cred.id)}
                        className="w-9 h-9 rounded-lg bg-red-500/5 hover:bg-red-500 hover:text-white flex items-center justify-center text-red-500 transition-all border border-red-500/10 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-6 flex-1 flex flex-col uppercase relative z-10">
                    <div className="space-y-1.5">
                       <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] opacity-40">Alias / Device</p>
                       <h3 className="text-xl font-black italic tracking-tighter truncate leading-tight">{cred.name}</h3>
                    </div>

                    <div className="mt-auto pt-6 border-t border-border/40 flex items-center justify-between">
                      <div className="flex flex-col">
                         <span className="text-[8px] font-black text-muted uppercase tracking-[0.3em] mb-1 opacity-40">Protocol</span>
                         <span className="text-[10px] font-black tracking-wider leading-none">
                            {cred.isPipedream ? 'PIPEDREAM MCP' : (schemas?.[cred.type]?.label || cred.type.toUpperCase())}
                         </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-emerald-500/5 border-emerald-500/10 text-emerald-500">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                         <span className="text-[9px] font-black uppercase tracking-[0.05em]">SYNCED</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Marketplace */}
        <section ref={exploreRef} className="space-y-12">
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2 pt-8">
              <div className="flex items-center gap-4">
                <Layers size={20} className="text-foreground opacity-50" />
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">Marketplace</h2>
              </div>
              
              <div className="relative min-w-[300px] md:min-w-[400px]">
                 <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted opacity-40" />
                   <input 
                     type="text"
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     placeholder="Search platforms..."
                     className="w-full bg-foreground/[0.02] border border-border/40 rounded-2xl px-14 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-foreground outline-none focus:bg-background transition-all shadow-xl"
                   />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {searchQuery && Object.entries(schemas || {})
                .filter(([k, s]: [string, any]) => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(([key, s]: [string, any]) => (
                <button 
                  key={key}
                  onClick={() => handlePlatformClick(key, s)}
                  className="bg-card rounded-[2.5rem] border border-border/60 p-8 flex flex-col items-center justify-center text-center group relative transition-all duration-500 hover:border-foreground/40 overflow-hidden"
                >
                  <div className="w-20 h-20 rounded-[1.5rem] bg-foreground/[0.02] border border-border/40 flex items-center justify-center text-foreground group-hover:scale-110 transition-all shadow-inner mb-6 relative z-10">
                    {iconMap[s.icon] || <Shield size={32} strokeWidth={1.5} />}
                  </div>
                  <h3 className="text-sm font-black italic tracking-tighter uppercase mb-4 relative z-10">{s.label}</h3>
                  <div className={`flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border ${connectedTypesSet.has(key) ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-foreground/5 border-border/20 text-muted'}`}>
                    {connectedTypesSet.has(key) ? 'SYNCED' : 'DIRECT'} <Zap size={10} className="fill-current" />
                  </div>
                </button>
              ))}

              {allPlatforms.map((app: any) => (
                <button 
                  key={app.id}
                  onClick={() => handlePipedreamConnect(app)}
                  className="bg-card rounded-[2.5rem] border border-border/60 p-8 flex flex-col items-center justify-center text-center group relative transition-all duration-500 hover:border-foreground/40 overflow-hidden"
                >
                  <div className="w-20 h-20 rounded-[1.5rem] bg-foreground/[0.02] border border-border/40 flex items-center justify-center text-foreground group-hover:scale-110 transition-all shadow-inner mb-6 relative z-10 p-5 overflow-hidden">
                     <img 
                       src={`https://assets.pipedream.net/s.v0/${app.id}/logo/orig`} 
                       className="w-full h-full object-contain filter group-hover:grayscale-0 transition-all" 
                       onError={(e: any) => { e.target.src = 'https://pipedream.com/s.v0/app_logo/pipedream/64'; }}
                     />
                  </div>
                  <h3 className="text-sm font-black italic tracking-tighter uppercase mb-4 relative z-10 truncate w-full">{app.name}</h3>
                  <div className={`flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border ${connectedTypesSet.has(`pd:${app.slug}`) ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-foreground/5 border-border/20 text-muted'}`}>
                    {connectedTypesSet.has(`pd:${app.slug}`) ? 'CONNECTED' : 'CONNECT'} <Zap size={10} className="fill-current" />
                  </div>
                </button>
              ))}
            </div>

            {hasNextPage && (
              <div className="flex justify-center py-12">
                <button onClick={() => fetchNextPage()} className="bg-foreground text-background px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:scale-105 transition-all">
                  {isFetchingNextPage ? 'SYNCING...' : 'LOAD MORE PLATFORMS'}
                </button>
              </div>
            )}
          </div>
        </section>

        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-xl" onClick={() => setIsModalOpen(false)} />
            <div className="bg-card w-full max-w-xl rounded-[3rem] border border-border shadow-2xl overflow-hidden relative z-10 font-inter animate-in fade-in zoom-in-95 duration-500">
              <div className="p-10 border-b border-border/40 bg-foreground/[0.01] relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 w-10 h-10 rounded-xl bg-foreground/5 hover:bg-foreground hover:text-background flex items-center justify-center text-muted transition-all border border-border/20">
                  <X size={20} strokeWidth={3} />
                </button>
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-2 h-2 rounded-full bg-foreground" />
                   <span className="text-[9px] font-black text-muted uppercase tracking-[0.4em] opacity-40">Configuration</span>
                </div>
                <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">
                  {selectedType ? `Setup_${schemas?.[selectedType]?.label.toUpperCase().replace(/\s+/g, '_')}` : 'New Bridge'}
                </h2>
              </div>
              <div className="p-10 max-h-[70vh] overflow-y-auto no-scrollbar">
                {selectedType && (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    createCredential.mutate({ name: credName, type: selectedType, data: formData });
                    setIsModalOpen(false);
                  }} className="space-y-10">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] px-2 opacity-50">Local_Alias</label>
                      <input required type="text" value={credName} onChange={e => setCredName(e.target.value)} className="w-full bg-foreground/[0.03] border border-border/40 rounded-xl px-6 py-4 text-xs font-black uppercase tracking-widest text-foreground outline-none focus:bg-background focus:border-foreground transition-all shadow-lg" placeholder="e.g. My Workspace..." />
                    </div>
                    <div className="space-y-6">
                       {schemas?.[selectedType]?.fields.map((f: any) => (
                        <div key={f.key} className="space-y-3">
                          <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] px-2 opacity-50">{f.label.toUpperCase()}</label>
                          <input required type={f.type === 'password' ? 'password' : 'text'} value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} className="w-full bg-foreground/[0.03] border border-border/40 rounded-xl px-6 py-4 text-xs font-medium text-foreground outline-none focus:bg-background focus:border-foreground transition-all shadow-lg italic" placeholder={`Enter ${f.label.toLowerCase()}...`} />
                        </div>
                      ))}
                    </div>
                    <div className="pt-6">
                      <button type="submit" className="w-full bg-foreground text-background px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] transition-all">ESTABLISH BRIDGE</button>
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
