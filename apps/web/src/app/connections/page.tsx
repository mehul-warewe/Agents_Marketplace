'use client';

import React, { useState } from 'react';
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
  google: <Globe size={20} />,
  link: <Link2 size={20} />,
  webhook: <Globe size={20} />,
  sparkles: <Sparkles size={20} />,
  openai: <img src="/iconSvg/openai.svg" className="w-6 h-6 object-contain group-hover:invert transition-all" />,
  gemini: <img src="/iconSvg/gemini-color.svg" className="w-6 h-6 object-contain" />,
  claude: <img src="/iconSvg/claude-color.svg" className="w-6 h-6 object-contain" />,
  openrouter: <img src="/iconSvg/openrouter.svg" className="w-6 h-6 object-contain group-hover:invert transition-all" />,
  mongodb_atlas: <img src="/iconSvg/mongodb-icon.svg" className="w-6 h-6 object-contain" />,
  redis: <img src="/iconSvg/redis.svg" className="w-6 h-6 object-contain" />,
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
        alert(`Uplink established, but connectivity test failed: ${res.testResult.message}`);
      }

      setIsModalOpen(false);
      setSelectedType(null);
      setFormData({});
      setCredName('');
    } catch (err: any) {
      console.error('Failed to create credential:', err);
    }
  };

  const openOAuth = (type: string) => {
    const provider = type === 'google_oauth' ? 'google' : 'slack';
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    window.open(
      `${apiUrl}/credentials/oauth/${provider}`,
      `Connect ${provider}`,
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    setTimeout(() => {
      window.location.reload();
    }, 5000);
  };

  return (
    <SidebarLayout title="Integration Protocols">
      <div className="p-6 sm:p-10 lg:p-14 max-w-7xl mx-auto space-y-12 font-inter">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-12 py-8 px-4">
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tighter text-foreground leading-none uppercase italic">Uplink_Protocols</h1>
            <p className="text-muted font-bold text-lg max-w-xl opacity-50 uppercase tracking-tight">Manage secure integration relays and authorized communication channels.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-foreground text-background px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.05] active:scale-[0.95] transition-all shadow-2xl shadow-foreground/10 flex items-center justify-center gap-4"
          >
            <Plus size={18} strokeWidth={3} /> Establish_Link
          </button>
        </header>

        {/* Connections List */}
        {loadingCreds ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-muted/5 border border-border rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : !credentials || credentials?.length === 0 ? (
          <div className="bg-foreground/[0.02] rounded-[4rem] border border-border/60 border-dashed py-48 flex flex-col items-center justify-center text-center space-y-10 px-8 relative overflow-hidden">
            <div className="w-32 h-32 bg-foreground/5 rounded-[2.5rem] flex items-center justify-center text-muted/30 border border-border/40">
              <Link2 size={64} strokeWidth={1} />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black uppercase tracking-tighter italic">Relay_Void</h3>
              <p className="text-muted font-bold leading-tight max-w-sm mx-auto uppercase opacity-40">Zero active uplink protocols detected. Establish a bridge to enable cross-system sync.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-foreground text-background px-14 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] hover:scale-[1.05] transition-all shadow-2xl"
            >
              INITIALISE_BRIDGE
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {credentials?.map((cred: any) => (
              <div key={cred.id} className="bg-card rounded-[3rem] border border-border/60 p-10 flex flex-col group relative transition-all duration-500 hover:shadow-2xl hover:shadow-foreground/5 hover:border-foreground/20">
                
                {/* Header info */}
                <div className="flex items-start justify-between mb-10">
                  <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center transition-all bg-foreground/[0.02] border-border/60 text-foreground group-hover:bg-foreground group-hover:text-background shadow-inner`}>
                    {iconMap[schemas?.[cred.type]?.icon] || <ShieldCheck size={32} />}
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      disabled={testingId === cred.id}
                      onClick={async () => {
                        setTestingId(cred.id);
                        await testCredential.mutateAsync(cred.id);
                        setTestingId(null);
                      }}
                      className="w-12 h-12 rounded-[1.25rem] bg-foreground/5 hover:bg-background flex items-center justify-center text-muted hover:text-foreground transition-all border border-transparent hover:border-border"
                      title="Run Diagnostic"
                    >
                      <RefreshCw size={18} strokeWidth={3} className={testingId === cred.id ? 'animate-spin text-foreground' : ''} />
                    </button>
                    <button 
                      onClick={() => deleteCredential.mutate(cred.id)}
                      className="w-12 h-12 rounded-[1.25rem] bg-red-500/5 hover:bg-red-500 hover:text-white flex items-center justify-center text-red-500 transition-all border border-red-500/10 shadow-sm"
                      title="Purge Link"
                    >
                      <Trash2 size={18} strokeWidth={3} />
                    </button>
                  </div>
                </div>

                <div className="space-y-8 flex-1 flex flex-col uppercase">
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] opacity-40">Protocol_Identity</p>
                     <h3 className="text-2xl font-black italic tracking-tighter truncate leading-tight">{cred.name}</h3>
                  </div>

                  <div className="mt-auto pt-8 border-t border-border/60 flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-muted uppercase tracking-[0.4em] mb-2 opacity-40 italic">Relay_Node</span>
                       <span className="text-xs font-black tracking-widest leading-none">
                          {schemas?.[cred.type]?.label || cred.type}
                       </span>
                    </div>
                    <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border ${cred.isValid ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500' : 'bg-red-500/5 border-red-500/10 text-red-500'}`}>
                       <div className={`w-2 h-2 rounded-full ${cred.isValid ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                       <span className="text-[10px] font-black uppercase tracking-[0.1em]">{cred.isValid ? 'ACTIVE' : 'FAIL'}</span>
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
            <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
            
            <div className="bg-card w-full max-w-3xl rounded-[4rem] border border-border shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden relative z-10 font-inter animate-in fade-in zoom-in-95 duration-500">
              
              <div className="p-12 border-b border-border/60 bg-foreground/[0.02] relative">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-12 right-12 w-12 h-12 rounded-[1.5rem] bg-foreground/5 hover:bg-foreground hover:text-background flex items-center justify-center text-muted transition-all border border-border/40"
                >
                  <X size={22} strokeWidth={3} />
                </button>
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
                   <span className="text-[10px] font-black text-muted uppercase tracking-[0.4em] opacity-40">Uplink_Configuration</span>
                </div>
                <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                  {selectedType ? `Bridge_${schemas?.[selectedType]?.label.replace(/\s+/g, '_')}` : 'Initiate_Bridge'}
                </h2>
              </div>

              <div className="p-12 max-h-[75vh] overflow-y-auto no-scrollbar">
                {!selectedType ? (
                  // Step 1: Selection
                  <div className="grid grid-cols-2 gap-8">
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
                        className="flex flex-col items-center justify-center p-12 bg-foreground/[0.02] border border-border/40 rounded-[3rem] hover:border-foreground/30 hover:bg-foreground hover:text-background hover:shadow-2xl transition-all group overflow-hidden relative"
                      >
                         <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        <div className="w-20 h-20 rounded-[1.75rem] bg-background border border-border flex items-center justify-center text-foreground group-hover:scale-110 transition-all mb-8 shadow-inner relative z-10">
                          {iconMap[s.icon] || <Shield size={32} />}
                        </div>
                        <span className="text-xl font-black italic tracking-tighter uppercase leading-none relative z-10">{s.label}</span>
                        {key.includes('oauth') && (
                          <div className="mt-6 flex items-center gap-2 text-[9px] font-black text-foreground bg-foreground/10 px-4 py-2 rounded-full uppercase tracking-widest group-hover:bg-background group-hover:text-foreground relative z-10">
                            SECURE_OAUTH <ExternalLink size={12} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  // Step 2: Form
                  <form onSubmit={handleCreate} className="space-y-12">
                     <button 
                        type="button" 
                        onClick={() => setSelectedType(null)}
                        className="flex items-center gap-3 text-[10px] font-black text-muted hover:text-foreground uppercase tracking-[0.3em] -mt-6 mb-8 transition-colors group opacity-40 hover:opacity-100"
                     >
                        <ChevronLeft size={16} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" /> CANCEL_SELECTION
                     </button>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] px-2 opacity-50">Local_Alias</label>
                      <input 
                        required
                        type="text"
                        value={credName}
                        onChange={e => setCredName(e.target.value)}
                        className="w-full bg-foreground/[0.03] border border-border/60 rounded-2xl px-8 py-5 text-sm font-black uppercase tracking-widest text-foreground outline-none focus:bg-background focus:border-foreground transition-all shadow-xl shadow-foreground/5"
                        placeholder="PROTOCOL_NAME..."
                      />
                    </div>

                    <div className="space-y-8">
                       {schemas?.[selectedType]?.fields.map((f: any) => (
                        <div key={f.key} className="space-y-4">
                          <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] px-2 opacity-50">{f.label.toUpperCase().replace(/\s+/g, '_')}</label>
                          <input 
                            required
                            type={f.type === 'password' ? 'password' : 'text'}
                            value={formData[f.key] || ''}
                            onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                            className="w-full bg-foreground/[0.03] border border-border/60 rounded-2xl px-8 py-5 text-sm font-medium text-foreground outline-none focus:bg-background focus:border-foreground transition-all shadow-xl shadow-foreground/5 italic"
                            placeholder={`PROVIDE_${f.key.toUpperCase()}...`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="pt-8">
                      <button 
                        type="submit"
                        disabled={createCredential.isPending}
                        className="w-full bg-foreground text-background px-12 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-foreground/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40"
                      >
                        {createCredential.isPending ? 'ESTABLISHING_LINK...' : `INITIATE_BRIDGE // ${schemas?.[selectedType]?.label.toUpperCase()}`}
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
