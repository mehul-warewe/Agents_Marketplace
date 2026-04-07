'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import { 
  useCredentials, 
  useCredentialSchemas, 
  useCreateCredential, 
  useDeleteCredential, 
  useTestCredential 
} from '@/hooks/useApi';
import { 
  Link2, Plus, Trash2, 
  AlertCircle, ExternalLink, ShieldCheck, 
  Slack, Mail, Globe, RefreshCw, X, Link, ChevronLeft, Shield, Bot, Sparkles
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
  const createCredential = useCreateCredential();
  const deleteCredential = useDeleteCredential();
  const testCredential = useTestCredential();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [credName, setCredName] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);

  // Auto-open modal if credentialType is passed via URL (from node settings)
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !credName) return;

    try {
      const res = await createCredential.mutateAsync({
        name: credName,
        type: selectedType,
        data: formData,
      });

      if (res.testResult && !res.testResult.ok) {
        alert(`Connection established, but connectivity test failed: ${res.testResult.message}`);
      }

      setIsModalOpen(false);
      setSelectedType(null);
      setFormData({});
      setCredName('');
    } catch (err: any) {
      console.error('Failed to create connection:', err);
    }
  };

  const openOAuth = (type: string) => {
    let provider = 'google';
    let toolId = '';

    if (type.includes('slack')) provider = 'slack';
    if (type.includes('github')) provider = 'github';
    if (type.includes('linkedin')) provider = 'linkedin';
    if (type.includes('reddit')) provider = 'reddit';
    
    // Pattern: google_gmail_oauth -> toolId: google.gmail
    if (type.startsWith('google_') && type.includes('_oauth')) {
      const parts = type.split('_');
      if (parts.length >= 3) {
        toolId = `google.${parts[1]}`;
      }
    }

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const authUrl = new URL(`${apiUrl}/credentials/oauth/${provider}`);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    if (token) authUrl.searchParams.set('token', token);
    if (toolId) authUrl.searchParams.set('toolId', toolId);

    window.open(
      authUrl.toString(),
      `Connect ${provider}`,
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  return (
    <SidebarLayout title="Connections">
      <div className="p-6 sm:p-10 lg:p-12 max-w-7xl mx-auto space-y-10 font-inter">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 py-6 px-2">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-foreground leading-none uppercase italic">Connections</h1>
            <p className="text-muted font-bold text-sm max-w-xl opacity-50 uppercase tracking-tight">Manage your secure platform integrations and authorized accounts.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-foreground text-background px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.05] active:scale-[0.95] transition-all shadow-xl shadow-foreground/10 flex items-center justify-center gap-3 shrink-0"
          >
            <Plus size={16} strokeWidth={3} /> Add Connection
          </button>
        </header>

        {/* Connections List */}
        {loadingCreds ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted/5 border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !credentials || credentials?.length === 0 ? (
          <div className="bg-foreground/[0.01] rounded-[3rem] border border-border/40 border-dashed py-32 flex flex-col items-center justify-center text-center space-y-8 px-8 relative overflow-hidden">
            <div className="w-24 h-24 bg-foreground/5 rounded-[2rem] flex items-center justify-center text-muted/20 border border-border/20">
              <Link2 size={48} strokeWidth={1} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tighter italic">No Connections</h3>
              <p className="text-muted font-bold text-xs leading-tight max-w-sm mx-auto uppercase opacity-40">You haven't established any platform bridges yet. Add one to enable autonomous workflows.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-foreground text-background px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:scale-[1.05] transition-all shadow-xl"
            >
              Setup First Connection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {credentials?.map((cred: any) => (
              <div key={cred.id} className="bg-card rounded-[2rem] border border-border/60 p-6 flex flex-col group relative transition-all duration-300 hover:shadow-xl hover:shadow-foreground/5 hover:border-foreground/20">
                
                {/* Header info */}
                <div className="flex items-start justify-between mb-8">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all bg-foreground/[0.02] border-border/40 text-foreground group-hover:bg-foreground group-hover:text-background shadow-inner`}>
                    {iconMap[schemas?.[cred.type]?.icon] || <ShieldCheck size={24} />}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => deleteCredential.mutate(cred.id)}
                      className="w-9 h-9 rounded-lg bg-red-500/5 hover:bg-red-500 hover:text-white flex items-center justify-center text-red-500 transition-all border border-red-500/10"
                      title="Delete Connection"
                    >
                      <Trash2 size={14} strokeWidth={3} />
                    </button>
                  </div>
                </div>

                <div className="space-y-6 flex-1 flex flex-col uppercase">
                  <div className="space-y-1.5">
                     <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] opacity-40">Connection_Alias</p>
                     <h3 className="text-xl font-black italic tracking-tighter truncate leading-tight">{cred.name}</h3>
                  </div>

                  <div className="mt-auto pt-6 border-t border-border/40 flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-muted uppercase tracking-[0.3em] mb-1 opacity-40 italic">Platform</span>
                       <span className="text-[10px] font-black tracking-wider leading-none">
                          {schemas?.[cred.type]?.label || cred.type.replace(/_/g, ' ')}
                       </span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${cred.isValid ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500' : 'bg-red-500/5 border-red-500/10 text-red-500'}`}>
                       <div className={`w-1.5 h-1.5 rounded-full ${cred.isValid ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                       <span className="text-[9px] font-black uppercase tracking-[0.05em]">{cred.isValid ? 'ACTIVE' : 'FAIL'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-background/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
            
            <div className="bg-card w-full max-w-2xl rounded-[3rem] border border-border shadow-2xl overflow-hidden relative z-10 font-inter animate-in fade-in zoom-in-95 duration-400">
              
              <div className="p-10 border-b border-border/40 bg-foreground/[0.01] relative">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-10 right-10 w-10 h-10 rounded-xl bg-foreground/5 hover:bg-foreground hover:text-background flex items-center justify-center text-muted transition-all border border-border/20"
                >
                  <X size={20} strokeWidth={3} />
                </button>
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-2 h-2 rounded-full bg-foreground" />
                   <span className="text-[9px] font-black text-muted uppercase tracking-[0.4em] opacity-40">Configuration</span>
                </div>
                <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">
                  {selectedType ? `Connect_${schemas?.[selectedType]?.label.toUpperCase().replace(/\s+/g, '_')}` : 'New Connection'}
                </h2>
              </div>

              <div className="p-10 max-h-[70vh] overflow-y-auto no-scrollbar">
                {!selectedType ? (
                  // Step 1: Selection
                  <div className="grid grid-cols-2 gap-6">
                    {Object.entries(schemas || {}).map(([key, s]: [string, any]) => (
                      <button 
                        key={key}
                        onClick={() => {
                          if (key.includes('oauth')) {
                            openOAuth(key);
                            setIsModalOpen(false);
                          } else {
                            setSelectedType(key);
                            setCredName(s.label.toUpperCase());
                          }
                        }}
                        className="flex flex-col items-center justify-center p-8 bg-foreground/[0.02] border border-border/40 rounded-[2rem] hover:border-foreground/30 hover:bg-foreground hover:text-background transition-all group overflow-hidden relative"
                      >
                         <div className="absolute top-0 right-0 w-24 h-24 bg-foreground/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                        <div className="w-16 h-16 rounded-[1.25rem] bg-background border border-border flex items-center justify-center text-foreground group-hover:scale-110 transition-all mb-4 shadow-inner relative z-10">
                          {iconMap[s.icon] || <Shield size={24} />}
                        </div>
                        <span className="text-lg font-black italic tracking-tighter uppercase leading-none relative z-10">{s.label}</span>
                        {key.includes('oauth') && (
                          <div className="mt-4 flex items-center gap-1.5 text-[8px] font-black text-foreground bg-foreground/10 px-3 py-1.5 rounded-full uppercase tracking-widest group-hover:bg-background group-hover:text-foreground relative z-10">
                            SECURE_OAUTH <ExternalLink size={10} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  // Step 2: Form
                  <form onSubmit={handleCreate} className="space-y-10">
                     <button 
                        type="button" 
                        onClick={() => setSelectedType(null)}
                        className="flex items-center gap-2 text-[9px] font-black text-muted hover:text-foreground uppercase tracking-[0.2em] -mt-4 mb-6 transition-colors group opacity-40 hover:opacity-100"
                     >
                        <ChevronLeft size={14} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" /> Back to platforms
                     </button>

                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] px-2 opacity-50">Local_Alias</label>
                      <input 
                        required
                        type="text"
                        value={credName}
                        onChange={e => setCredName(e.target.value)}
                        className="w-full bg-foreground/[0.03] border border-border/40 rounded-xl px-6 py-4 text-xs font-black uppercase tracking-widest text-foreground outline-none focus:bg-background focus:border-foreground transition-all shadow-lg"
                        placeholder="e.g. My Account..."
                      />
                    </div>

                    <div className="space-y-6">
                       {schemas?.[selectedType]?.helpUrl && (
                          <a 
                            href={schemas[selectedType].helpUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-[9px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest px-4 py-2 border border-emerald-500/20 bg-emerald-500/5 rounded-full transition-colors"
                          >
                            <ExternalLink size={10} strokeWidth={3} /> Instructions / Docs
                          </a>
                       )}
                       {schemas?.[selectedType]?.fields.map((f: any) => (
                        <div key={f.key} className="space-y-3">
                          <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] px-2 opacity-50">{f.label.toUpperCase()}</label>
                          <input 
                            required
                            type={f.type === 'password' ? 'password' : 'text'}
                            value={formData[f.key] || ''}
                            onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                            className="w-full bg-foreground/[0.03] border border-border/40 rounded-xl px-6 py-4 text-xs font-medium text-foreground outline-none focus:bg-background focus:border-foreground transition-all shadow-lg italic"
                            placeholder={`Enter ${f.label.toLowerCase()}...`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="pt-6">
                      <button 
                        type="submit"
                        disabled={createCredential.isPending}
                        className="w-full bg-foreground text-background px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-foreground/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40"
                      >
                        {createCredential.isPending ? 'Connecting...' : `Establish Bridge`}
                      </button>
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
