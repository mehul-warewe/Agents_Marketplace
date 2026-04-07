'use client';

/**
 * Pipedream Individual Node Configuration
 *
 * For specific Pipedream nodes like slack_post_message, discord_send_dm, etc.
 * Shows credential selection and platform-specific parameters
 */

import React, { useMemo } from 'react';
import { AlertCircle, Lock, LogIn } from 'lucide-react';
import { useCredentials } from '@/hooks/useApi';

interface PipedreamIndividualConfigProps {
  executionKey: string;
  tool: any;
  config: Record<string, any>;
  onUpdate: (updates: Record<string, any>) => void;
  onRequestAuth?: (credentialType: string) => void;
}

export default function PipedreamIndividualConfig({
  executionKey,
  tool,
  config,
  onUpdate,
  onRequestAuth
}: PipedreamIndividualConfigProps) {
  const { data: allCredentials = [] } = useCredentials();

  // Get credentials for this node's required credential types
  const availableCredentials = useMemo(() => {
    if (!tool.credentialTypes || tool.credentialTypes.length === 0) return [];

    return allCredentials.filter((cred: any) =>
      tool.credentialTypes.includes(cred.type)
    );
  }, [allCredentials, tool.credentialTypes]);

  const selectedCredential = useMemo(() => {
    return availableCredentials.find((c: any) => c.id === config.credentialId);
  }, [availableCredentials, config.credentialId]);

  // Map credential type to display name
  const getCredentialTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'slack_oauth': 'Slack Workspace',
      'discord_oauth': 'Discord Server',
      'github_oauth': 'GitHub Account',
      'stripe_api_key': 'Stripe Account',
      'google_oauth': 'Google Account',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* CREDENTIAL SELECTION */}
      {tool.credentialTypes && tool.credentialTypes.length > 0 && (
        <div className="space-y-2 border-b border-border/20 pb-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest opacity-50">
            <Lock size={12} />
            Authentication
          </div>

          <div className="space-y-2">
            {tool.credentialTypes.map((credType: string) => (
              <div key={credType} className="space-y-1">
                <label className="block text-xs font-semibold text-foreground/80">
                  {getCredentialTypeLabel(credType)}
                </label>

                {availableCredentials.length === 0 ? (
                  <button
                    onClick={() => onRequestAuth?.(credType)}
                    className="w-full px-3 py-2.5 bg-accent/10 border border-accent/30 rounded-lg text-xs font-semibold text-accent hover:bg-accent/20 transition-all flex items-center justify-center gap-2"
                  >
                    <LogIn size={12} />
                    Connect {getCredentialTypeLabel(credType)}
                  </button>
                ) : (
                  <select
                    value={config.credentialId || ''}
                    onChange={(e) => onUpdate({ credentialId: e.target.value })}
                    className="w-full px-3 py-2 bg-foreground/[0.03] border border-border/40 rounded-lg text-xs font-medium outline-none focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20 transition-all"
                  >
                    <option value="">Select {getCredentialTypeLabel(credType)}</option>
                    {availableCredentials.map((cred: any) => (
                      <option key={cred.id} value={cred.id}>
                        {cred.name || `${getCredentialTypeLabel(credType)} #${cred.id.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                )}

                {config.credentialId && !selectedCredential && (
                  <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <AlertCircle size={12} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-[10px] text-yellow-600">
                      Selected credential was removed. Please choose another.
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PLATFORM-SPECIFIC PARAMETERS */}
      {tool.configFields && tool.configFields.length > 0 && (
        <div className="space-y-4">
          {tool.configFields
            .filter((f: any) => f.type !== 'credential' && f.type !== 'notice')
            .map((field: any) => (
              <div key={field.key} className="space-y-1">
                <label className="flex items-center gap-1 text-xs font-semibold text-foreground/80">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.description && (
                  <p className="text-[10px] text-muted/60">{field.description}</p>
                )}

                {field.type === 'textarea' ? (
                  <textarea
                    value={config[field.key] || ''}
                    onChange={(e) => onUpdate({ [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 bg-foreground/[0.03] border border-border/40 rounded-lg text-xs font-medium outline-none focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20 transition-all resize-none"
                    rows={3}
                  />
                ) : field.type === 'text' ? (
                  <input
                    type="text"
                    value={config[field.key] || ''}
                    onChange={(e) => onUpdate({ [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 bg-foreground/[0.03] border border-border/40 rounded-lg text-xs font-medium outline-none focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20 transition-all"
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={config[field.key] || ''}
                    onChange={(e) => onUpdate({ [field.key]: e.target.value })}
                    className="w-full px-3 py-2 bg-foreground/[0.03] border border-border/40 rounded-lg text-xs font-medium outline-none focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20 transition-all"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map((opt: any) => (
                      <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                        {typeof opt === 'string' ? opt : opt.label}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {(!tool.configFields || tool.configFields.filter((f: any) => f.type !== 'credential').length === 0) && (
        <div className="p-4 bg-foreground/[0.02] border border-dashed border-border/40 rounded-lg text-center">
          <div className="text-xs text-muted/60">
            No configuration needed for this action
          </div>
        </div>
      )}
    </div>
  );
}
