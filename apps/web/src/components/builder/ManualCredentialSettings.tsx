'use client';

import React, { useState, useEffect } from 'react';
import { LogIn, CheckCircle, AlertCircle, Loader2, Key, HelpCircle, Plus } from 'lucide-react';
import api from '@/lib/api';
import CustomSelect from './CustomSelect';

interface Credential {
  id: string;
  name: string;
  type: string;
  isValid: boolean;
}

interface ManualCredentialSettingsProps {
  type: string;
  label: string;
  credentialId?: string;
  onCredentialSelect: (credentialId: string) => void;
}

export default function ManualCredentialSettings({
  type,
  label,
  credentialId,
  onCredentialSelect,
}: ManualCredentialSettingsProps) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchCredentials = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/credentials');
      const filtered = data.filter((c: Credential) => {
        // System Default is universal for model nodes
        if (c.id === 'system_default') return true;
        return c.type === type;
      });
      setCredentials(filtered);
    } catch (err) {
      console.error('Failed to fetch credentials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, [type]);

  const handleCreateAndVerify = async () => {
    if (!newKey) return;
    setIsVerifying(true);
    setError(null);
    setSuccess(false);

    try {
      // name e.g. "Gemini Key 4th April"
      const name = `${label} Key ${new Date().toLocaleDateString()}`;
      
      const { data } = await api.post('/credentials', {
        name,
        type,
        data: { apiKey: newKey }
      });

      setSuccess(true);
      setNewKey('');
      setShowAddForm(false);
      await fetchCredentials();
      onCredentialSelect(data.id);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* List / Select Existing */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <label className="text-[9px] font-bold uppercase text-muted-foreground/60 tracking-widest">
            Stored Keys
          </label>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-[9px] font-bold uppercase text-indigo-500 hover:text-indigo-400 transition-colors flex items-center gap-1"
          >
            {showAddForm ? 'Cancel' : <><Plus size={10} /> Add New</>}
          </button>
        </div>

        {!showAddForm && (
          <CustomSelect
            value={credentialId || ''}
            onChange={onCredentialSelect}
            options={credentials.map(c => ({
              id: c.id,
              label: c.name,
              isValid: c.isValid
            }))}
            placeholder={isLoading ? "Loading keys..." : "Choose a stored key..."}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Add New Key Form */}
      {showAddForm && (
        <div className="space-y-4 p-4 bg-background/50 border border-border/40 rounded-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-foreground uppercase tracking-tight">Register {label} Key</span>
              <HelpCircle size={10} className="text-muted-foreground/30 cursor-help" />
            </div>
            <div className="relative group">
               <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/20 group-focus-within:text-indigo-500 transition-all" size={12} />
               <input
                 type="password"
                 placeholder="sk-..."
                 value={newKey}
                 onChange={(e) => setNewKey(e.target.value)}
                 className="w-full bg-secondary/50 border border-border/40 rounded-lg py-2 pl-9 pr-3 text-[11px] font-medium text-foreground outline-none focus:border-indigo-500/40 focus:bg-background transition-all"
               />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
              <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-500 font-bold">{error}</p>
            </div>
          )}

          <button
            onClick={handleCreateAndVerify}
            disabled={isVerifying || !newKey}
            className="w-full h-10 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2.5"
          >
            {isVerifying ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Verifying Authenticity...
              </>
            ) : (
              <>
                <LogIn size={13} strokeWidth={3} />
                Verify & Save
              </>
            )}
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
           <CheckCircle size={16} className="text-emerald-500" />
           <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Key Validated & Stored</p>
        </div>
      )}
    </div>
  );
}
