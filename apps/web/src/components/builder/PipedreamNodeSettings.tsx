'use client';

/**
 * Pipedream Node Settings Component
 *
 * Full connect flow:
 * 1. User clicks "Connect Account"
 * 2. Popup opens with Pipedream Connect
 * 3. When popup closes, we poll Pipedream API for connected accounts
 * 4. Display connected accounts and let user select one
 * 5. Node is updated with the selected Pipedream account ID
 */

import React, { useEffect, useRef, useState } from 'react';
import { LogIn, CheckCircle, AlertCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import api from '@/lib/api';

interface PipedreamAccount {
  id: string;
  name: string;
  external_id?: string;
  app?: { id: string; name: string; slug: string };
  created_at?: string;
}

interface PipedreamNodeSettingsProps {
  appSlug: string;
  actionName: string;
  credentialId?: string;
  onCredentialConnect?: (platform: string) => void;
  onCredentialSelect: (credentialId: string) => void;
}

export default function PipedreamNodeSettings({
  appSlug,
  actionName,
  credentialId,
  onCredentialSelect
}: PipedreamNodeSettingsProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetchingAccounts, setIsFetchingAccounts] = useState(false);
  const [accounts, setAccounts] = useState<PipedreamAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const platformName = appSlug
    ? appSlug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Platform';

  // Fetch connected accounts from Pipedream for this user + app
  const fetchAccounts = async (slug?: string) => {
    setIsFetchingAccounts(true);
    setError(null);
    try {
      const res = await api.get('/credentials/pipedream/accounts', {
        params: { appSlug: slug || appSlug }
      });
      setAccounts(res.data?.accounts || []);
    } catch (err: any) {
      console.error('[pipedream] Failed to fetch accounts:', err);
      // Don't show error on initial load if there are no accounts yet
    } finally {
      setIsFetchingAccounts(false);
    }
  };

  // Fetch accounts on mount (to show any already-connected accounts)
  useEffect(() => {
    if (appSlug) fetchAccounts(appSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appSlug]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Send appSlug so backend can resolve/validate it
      const response = await api.post('/credentials/pipedream/token', { appSlug });

      if (!response.data.token || !response.data.connectLinkUrl) {
        throw new Error('No connect URL returned from server');
      }

      // Use the resolved slug that the backend validated
      const finalAppSlug = (response.data.resolvedAppSlug || appSlug).toLowerCase();

      // IMPORTANT: Use the backend-generated connectLinkUrl but we must append the 'app' 
      // and 'connectLink' params for Pipedream Connect Link flow to work.
      const connectUrl = new URL(response.data.connectLinkUrl);
      connectUrl.searchParams.set('app', finalAppSlug);
      connectUrl.searchParams.set('connectLink', 'true');

      console.log('[pipedream] Launching Connect URL:', connectUrl.toString(), '| App:', finalAppSlug);

      // Open centered popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        connectUrl.toString(),
        `Connect ${finalAppSlug}`,
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
      );
      popupRef.current = popup;

      // Poll until popup closes, then fetch accounts
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        if (!popupRef.current || popupRef.current.closed) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setIsConnecting(false);
          // Wait a moment for Pipedream to finish saving the account
          await new Promise(r => setTimeout(r, 1500));
          await fetchAccounts(finalAppSlug);
        }
      }, 500);

    } catch (err: any) {
      console.error('[pipedream] Failed to connect:', err);
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
    <div className="space-y-4">
      {/* Platform Info */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase text-muted/80">
          Platform Connection
        </label>
        <div className="p-3 bg-foreground/[0.03] border border-border/20 rounded-lg">
          <div className="text-[12px] font-bold text-foreground">
            {platformName}{actionName ? ` — ${actionName.replace(/_/g, ' ')}` : ''}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
          <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-500 font-medium">{error}</p>
        </div>
      )}

      {/* Connected Accounts Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase text-muted/80">Authentication</label>
          <button
            onClick={() => fetchAccounts()}
            disabled={isFetchingAccounts}
            className="p-1 hover:bg-foreground/10 rounded transition-colors"
            title="Refresh accounts"
          >
            <RefreshCw size={11} className={`text-muted/50 ${isFetchingAccounts ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isFetchingAccounts ? (
          <div className="flex items-center gap-2 p-3 bg-foreground/[0.03] border border-border/20 rounded-lg">
            <Loader2 size={12} className="animate-spin text-muted/60" />
            <span className="text-[10px] text-muted/60">Loading connected accounts...</span>
          </div>
        ) : accounts.length > 0 ? (
          <div className="space-y-2">
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => onCredentialSelect(account.id)}
                className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                  credentialId === account.id
                    ? 'border-indigo-500/50 bg-indigo-500/10'
                    : 'border-border/30 bg-foreground/[0.03] hover:border-border/60'
                }`}
              >
                <CheckCircle
                  size={14}
                  className={credentialId === account.id ? 'text-indigo-500' : 'text-muted/20'}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-foreground truncate">
                    {account.name || account.id}
                  </div>
                  <div className="text-[9px] text-muted/50 font-mono truncate">{account.id}</div>
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {/* Connect Button */}
        <button
          onClick={handleConnect}
          disabled={isConnecting || !appSlug}
          className="w-full px-4 py-3 bg-indigo-500 text-white border border-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          {isConnecting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Waiting for connection...
            </>
          ) : (
            <>
              <LogIn size={14} />
              {accounts.length > 0 ? `Add Another ${platformName} Account` : `Connect ${platformName} Account`}
            </>
          )}
        </button>

        <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-3">
          <AlertCircle size={13} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-blue-500/80 font-medium leading-relaxed">
            In development mode, you must be signed into{' '}
            <a href="https://pipedream.com" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-0.5">
              pipedream.com <ExternalLink size={9} />
            </a>{' '}
            in your browser before connecting.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-border/10">
        <div className="p-3 bg-foreground/[0.03] border border-border/10 rounded-lg text-center">
          <p className="text-[9px] text-muted/60 font-medium uppercase tracking-widest">
            Security Powered by Pipedream Connect
          </p>
        </div>
      </div>
    </div>
  );
}
