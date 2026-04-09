'use client';

/**
 * PipedreamNodeSettings
 *
 * Handles:
 *  1. Connect button → opens Pipedream Connect popup for the correct platform
 *  2. Polls for connected accounts after popup closes
 *  3. Lets user select which connected account to use for this node
 */

import React, { useEffect, useRef, useState } from 'react';
import { LogIn, CheckCircle, AlertCircle, Loader2, RefreshCw, ExternalLink, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import CustomSelect from './CustomSelect';

interface PipedreamAccount {
  id: string;
  name: string;
  external_id?: string;
  app?: { id: string; name: string; slug: string };
  created_at?: string;
}

interface PipedreamNodeSettingsProps {
  appSlug: string;
  platformName?: string;
  actionName: string;
  credentialId?: string;
  onCredentialConnect?: (platform: string) => void;
  onCredentialSelect: (credentialId: string) => void;
}

export default function PipedreamNodeSettings({
  appSlug,
  platformName: injectedPlatformName,
  actionName,
  credentialId,
  onCredentialSelect,
}: PipedreamNodeSettingsProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetchingAccounts, setIsFetchingAccounts] = useState(false);
  const [accounts, setAccounts] = useState<PipedreamAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resolvedSlug, setResolvedSlug] = useState<string>(appSlug);

  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derive a display name
  const platformName = injectedPlatformName || 
    (resolvedSlug ? resolvedSlug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Platform');

  /** Fetch connected accounts from the backend */
  const fetchAccounts = async (slug: string) => {
    if (!slug) return;
    setIsFetchingAccounts(true);
    setError(null);
    try {
      const res = await api.get('/credentials/pipedream/accounts', {
        params: { appSlug: slug },
      });
      // Backend returns { accounts: [...] }
      setAccounts(res.data?.accounts ?? []);
    } catch (err: any) {
      console.error('[pipedream] Failed to fetch accounts:', err);
    } finally {
      setIsFetchingAccounts(false);
    }
  };

  // On mount (or when appSlug changes), fetch existing accounts
  useEffect(() => {
    setAccounts([]); // Clear stale accounts immediately
    if (appSlug) fetchAccounts(appSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appSlug]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Backend resolves appSlug → correct platform slug and returns connect URL
      const response = await api.post('/credentials/pipedream/token', { appSlug });

      if (!response.data?.connectLinkUrl) {
        throw new Error('No connect URL returned from server');
      }

      const { connectLinkUrl, resolvedAppSlug } = response.data;

      // Update the displayed platform name once we know the resolved slug
      if (resolvedAppSlug) setResolvedSlug(resolvedAppSlug);

      console.log('[pipedream] Opening Connect URL:', connectLinkUrl, 'for app:', resolvedAppSlug);

      // Open centered popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        connectLinkUrl,
        'ConnectPipedream',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`,
      );
      popupRef.current = popup;

      // Poll until popup closes, then refresh accounts
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        if (!popupRef.current || popupRef.current.closed) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setIsConnecting(false);
          // Give Pipedream a moment to persist the account
          await new Promise(r => setTimeout(r, 1500));
          const updatedSlug = resolvedAppSlug || appSlug;
          
          setIsFetchingAccounts(true);
          try {
            const res = await api.get('/credentials/pipedream/accounts', {
              params: { appSlug: updatedSlug },
            });
            const newAccounts = res.data?.accounts ?? [];
            setAccounts(newAccounts);
            
            // Auto-select if nothing was selected yet
            if (!credentialId && newAccounts.length > 0) {
              onCredentialSelect(newAccounts[0].id);
            }
          } catch (e) {
            console.error('[pipedream] Auto-refresh failed:', e);
          } finally {
            setIsFetchingAccounts(false);
          }
        }
      }, 500);
    } catch (err: any) {
      console.error('[pipedream] Connection failed:', err);
      setError(err.response?.data?.error || err.message || 'Failed to open authentication');
      setIsConnecting(false);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return (
    <div className="space-y-4 pt-2">
      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-500 font-bold">{error}</p>
        </div>
      )}

      {/* Connected Accounts */}
      <div className="space-y-3">
        <label className="block text-[10px] font-black uppercase text-muted/60 tracking-widest pl-1">
          Select {platformName} Account
        </label>

        <CustomSelect
          value={credentialId || ''}
          onChange={onCredentialSelect}
          options={accounts.map(a => ({
            id: a.id,
            label: `${a.name || a.app?.name || a.id} (${a.id.slice(0, 8)})`
          }))}
          placeholder={isFetchingAccounts ? "Searching..." : "Select account..."}
          isLoading={isFetchingAccounts}
        />

        {/* Connect Button */}
        <button
          onClick={handleConnect}
          disabled={isConnecting || !appSlug}
          className="w-full px-4 py-3.5 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2.5"
        >
          {isConnecting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <LogIn size={15} strokeWidth={3} />
              Connect {platformName}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
