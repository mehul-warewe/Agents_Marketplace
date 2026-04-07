'use client';

/**
 * Pipedream Configuration Section Component
 *
 * Handles two scenarios:
 * 1. Pre-configured from sidebar (appSlug + actionName set) → Show credentials + parameters
 * 2. New/empty node → Show platform selection → actions → credentials → parameters
 */

import React, { useState, useMemo } from 'react';
import { Loader2, AlertCircle, Info, LogIn, ChevronLeft } from 'lucide-react';
import { usePipedreamApps, usePipedreamTools, transformAppsToOptions, transformToolsToOptions } from '@/hooks/usePipedreamApps';
import { useCredentials } from '@/hooks/useApi';
import CustomSelect from './CustomSelect';
import DynamicParameterForm from './DynamicParameterForm';

interface PipedreamConfigSectionProps {
  config: Record<string, any>;
  onUpdate: (updates: Record<string, any>) => void;
  onError?: (error: string) => void;
  onRequestAuth?: (credentialType: string, platform: string) => void;
}

const PLATFORM_CREDENTIAL_TYPE_MAP: Record<string, string> = {
  'slack': 'slack_oauth',
  'discord': 'discord_oauth',
  'github': 'github_oauth',
  'stripe': 'stripe_api_key',
  'google-sheets': 'google_oauth',
  'google_sheets': 'google_oauth',
  'twilio': 'twilio_api_key',
  'sendgrid': 'sendgrid_api_key',
  'salesforce': 'salesforce_oauth',
  'airtable': 'airtable_api_key',
  'notion': 'notion_api_key',
};

export default function PipedreamConfigSection({
  config,
  onUpdate,
  onError,
  onRequestAuth
}: PipedreamConfigSectionProps) {
  const [appSearch, setAppSearch] = useState('');

  // ─── DETERMINE IF NODE IS PRE-CONFIGURED FROM SIDEBAR ────────────────
  const isPreConfigured = !!(config.appSlug && config.actionName);

  // ─── LOAD APPS & TOOLS ────────────────────────────────────────────────
  const {
    data: apps,
    isLoading: appsLoading,
    error: appsError
  } = usePipedreamApps(appSearch, 100, 0, !isPreConfigured || !config.appSlug);

  const {
    data: tools,
    isLoading: toolsLoading,
    error: toolsError
  } = usePipedreamTools(config.appSlug, !!config.appSlug);

  const { data: userCredentials = [] } = useCredentials();

  // ─── DERIVE PLATFORM CREDENTIAL TYPE ──────────────────────────────────
  const credentialType = useMemo(() => {
    if (!config.appSlug) return null;
    return PLATFORM_CREDENTIAL_TYPE_MAP[config.appSlug] || `${config.appSlug}_oauth`;
  }, [config.appSlug]);

  // ─── GET CREDENTIALS FOR THIS PLATFORM ────────────────────────────────
  const platformCredentials = useMemo(() => {
    if (!credentialType) return [];
    return userCredentials.filter((cred: any) => cred.type === credentialType);
  }, [credentialType, userCredentials]);

  // ─── GET SELECTED TOOL SCHEMA ─────────────────────────────────────────
  const selectedTool = tools?.find(t => t.name === config.actionName);
  const toolSchema = selectedTool?.inputSchema || null;

  // ─── BUILD DROPDOWN OPTIONS ───────────────────────────────────────────
  const appOptions = useMemo(() => transformAppsToOptions(apps), [apps]);
  const toolOptions = useMemo(() => transformToolsToOptions(tools), [tools]);

  // ─── HANDLERS ─────────────────────────────────────────────────────────
  const handleAppSelect = (appId: string) => {
    onUpdate({
      appSlug: appId,
      credentialId: null,
      actionName: null,
      ...Object.fromEntries(Object.entries(config).map(([k]) => [k, null]))
    });
  };

  const handleCredentialSelect = (credentialId: string) => {
    onUpdate({ credentialId });
  };

  const handleToolSelect = (toolName: string) => {
    onUpdate({ actionName: toolName });
  };

  const handleParameterChange = (params: Record<string, any>) => {
    onUpdate(params);
  };

  React.useEffect(() => {
    if (appsError) onError?.(`Failed to load apps: ${(appsError as Error).message}`);
    if (toolsError) onError?.(`Failed to load tools: ${(toolsError as Error).message}`);
  }, [appsError, toolsError, onError]);

  // ─── RENDER ──────────────────────────────────────────────────────────

  // SCENARIO 1: PRE-CONFIGURED NODE (appSlug + actionName already set from sidebar)
  if (isPreConfigured) {
    return (
      <div className="space-y-4">
        {/* Show which platform/action is selected */}
        <div className="p-3 bg-foreground/[0.03] border border-border/20 rounded-lg">
          <div className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-50 mb-1">Selected Action</div>
          <div className="text-[13px] font-bold text-foreground">
            {config.appSlug.toUpperCase()} → {config.actionName?.replace(/_/g, ' ')}
          </div>
        </div>

        {/* AUTHENTICATION SECTION */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase text-muted/80">
            Authentication
          </label>

          {platformCredentials.length === 0 ? (
            <button
              onClick={() => onRequestAuth?.(credentialType!, config.appSlug)}
              className="w-full px-4 py-3 bg-accent/10 border border-accent/30 rounded-lg text-xs font-semibold text-accent hover:bg-accent/20 transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={14} />
              Connect {config.appSlug.charAt(0).toUpperCase() + config.appSlug.slice(1)}
            </button>
          ) : (
            <select
              value={config.credentialId || ''}
              onChange={(e) => handleCredentialSelect(e.target.value)}
              className="w-full px-3 py-2 bg-foreground/[0.03] border border-border/40 rounded-lg text-xs font-medium outline-none focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20 transition-all"
            >
              <option value="">Select account...</option>
              {platformCredentials.map((cred: any) => (
                <option key={cred.id} value={cred.id}>
                  {cred.name || `Account #${cred.id.slice(0, 8)}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* PARAMETERS SECTION */}
        {config.credentialId && selectedTool && (
          <div className="space-y-2 border-t border-border/20 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="block text-xs font-bold uppercase text-muted/80">
              Parameters
            </label>

            {selectedTool.description && (
              <div className="text-xs text-muted/60 mb-3">
                {selectedTool.description}
              </div>
            )}

            {toolSchema ? (
              <DynamicParameterForm
                schema={toolSchema}
                values={config}
                onChange={handleParameterChange}
              />
            ) : (
              <div className="flex items-start gap-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-blue-500">
                  No additional parameters required for this action
                </span>
              </div>
            )}
          </div>
        )}

        {!config.credentialId && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-yellow-600">
              Connect your account to configure action parameters
            </span>
          </div>
        )}
      </div>
    );
  }

  // SCENARIO 2: PLATFORM SELECTED, ACTION NOT YET SELECTED
  if (config.appSlug && !config.actionName) {
    return (
      <div className="space-y-4">
        {/* Back button to change platform */}
        <button
          onClick={() => onUpdate({ appSlug: null, credentialId: null, actionName: null })}
          className="flex items-center gap-2 text-[10px] font-bold text-muted hover:text-foreground uppercase tracking-widest transition-colors opacity-50 hover:opacity-100"
        >
          <ChevronLeft size={12} /> Change Platform
        </button>

        {/* Show selected platform */}
        <div className="p-3 bg-foreground/[0.03] border border-border/20 rounded-lg">
          <div className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-50 mb-1">Selected Platform</div>
          <div className="text-[13px] font-bold text-foreground">
            {config.appSlug.toUpperCase()}
          </div>
        </div>

        {/* Select action */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase text-muted/80">
            Action
          </label>

          {toolsLoading ? (
            <div className="flex items-center justify-center p-4 bg-foreground/[0.03] border border-border/40 rounded-lg">
              <Loader2 size={16} className="animate-spin text-muted/60" />
              <span className="ml-2 text-xs text-muted/60">Loading actions...</span>
            </div>
          ) : (
            <CustomSelect
              value={config.actionName || ''}
              onChange={handleToolSelect}
              options={toolOptions}
              placeholder="Select an action..."
              disabled={toolsLoading}
            />
          )}

          {toolsError && (
            <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-red-500">{(toolsError as Error).message}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // SCENARIO 3: NEW NODE - SELECT PLATFORM FIRST
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase text-muted/80">
          Platform
        </label>

        <div className="relative">
          <input
            type="text"
            placeholder="Search platforms..."
            value={appSearch}
            onChange={(e) => setAppSearch(e.target.value)}
            className="w-full px-3 py-2 bg-foreground/[0.03] border border-border/40 rounded-lg text-sm outline-none focus:border-foreground/40"
          />
        </div>

        <CustomSelect
          value={config.appSlug || ''}
          onChange={handleAppSelect}
          options={appOptions}
          placeholder="Select a platform..."
          disabled={appsLoading}
          isLoading={appsLoading}
        />

        {appsError && (
          <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-red-500">{(appsError as Error).message}</span>
          </div>
        )}
      </div>

      <div className="p-4 bg-foreground/[0.02] border border-dashed border-border/40 rounded-lg text-center">
        <div className="text-xs text-muted/60">
          Select a platform to view available actions
        </div>
      </div>
    </div>
  );
}
