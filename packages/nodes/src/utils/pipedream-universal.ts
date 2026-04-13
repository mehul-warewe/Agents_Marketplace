/**
 * Universal Pipedream Handler
 *
 * Used by all individual Pipedream node handlers (Slack, Discord, GitHub, etc.)
 * Handles MCP execution, credential validation, parameter cleaning, response parsing
 */

import { ToolContext } from '../types.js';
import {
  initializeMCPClient,
  callPipedreamTool,
  extractMCPResponse,
  getPipedreamClient,
  type MCPConnectionConfig
} from './pipedream-mcp.js';
import {
  cleanParametersForPipedream,
} from './pipedream-validation.js';

export interface PipedreamConfig {
  appSlug: string;
  actionName: string;
  actionParams: Record<string, any>;
}

/**
 * Execute any Pipedream action for any platform
 */
export const pipedreamHandler = async (
  context: ToolContext,
  pipedreamConfig: PipedreamConfig
) => {
  const startTime = Date.now();
  const { userId, render, logNodeStatus, nodeId } = context;
  const { appSlug, actionName, actionParams } = pipedreamConfig;
  const credentialId = actionParams.credentialId;

  // ─── PHASE 1: VALIDATE PIPEDREAM CONFIG ──────────────────────────────

  if (!appSlug || !actionName) {
    const error = 'appSlug and actionName are required';
    if (nodeId && logNodeStatus) await logNodeStatus(nodeId, 'failed', { error });
    return { status: 'failed', error };
  }

  // ─── PHASE 2: VALIDATE ENVIRONMENT ───────────────────────────────────

  const pd = getPipedreamClient();
  if (!pd) {
    const error = 'Pipedream is not configured. Missing environment variables.';
    if (nodeId && logNodeStatus) await logNodeStatus(nodeId, 'failed', { error });
    return { status: 'failed', error };
  }

  // ─── PHASE 4: CLEAN PARAMETERS ──────────────────────────────────────

  const cleanedParams = cleanParametersForPipedream(actionParams, render);

  console.log(`[Pipedream] Executing "${actionName}" on ${appSlug} for user ${userId}`);

  // ─── PHASE 5: INITIALIZE MCP CLIENT ─────────────────────────────────

  let accessToken: string;
  try {
    accessToken = await pd.rawAccessToken;
  } catch (err: any) {
    const error = `Failed to get Pipedream access token: ${err.message}`;
    if (nodeId && logNodeStatus) await logNodeStatus(nodeId, 'failed', { error });
    return { status: 'failed', error };
  }

  const cleanSlug = appSlug.startsWith('app_') ? appSlug.replace('app_', '') : appSlug;

  let mcpClient;
  try {
    const mcpConfig: MCPConnectionConfig = {
      accessToken,
      projectId: process.env.PIPEDREAM_PROJECT_ID!,
      appSlug: cleanSlug,
      environment: process.env.PIPEDREAM_ENVIRONMENT as any,
      externalUserId: userId
    };
    mcpClient = await initializeMCPClient(mcpConfig);
  } catch (err: any) {
    const error = `Failed to initialize MCP client: ${err.message}`;
    if (nodeId && logNodeStatus) await logNodeStatus(nodeId, 'failed', { error });
    return { status: 'failed', error };
  }

  // ─── PHASE 6: EXECUTE TOOL (WITH SMART BRIDGING) ─────────────────

  let mcpResult;
  try {
    if (actionName === '__custom_api_call') {
      const { method, path, body, headers } = cleanedParams;
      const parsedBody = body ? (typeof body === 'string' ? JSON.parse(body) : body) : undefined;
      const parsedHeaders = headers ? (typeof headers === 'string' ? JSON.parse(headers) : headers) : undefined;

      let accountId: string | undefined = undefined;
      try {
        const accountsRes: any = await pd.accounts.list({ externalUserId: userId });
        const match = accountsRes?.data?.find((a: any) => a.app?.name_slug === cleanSlug);
        if (match) accountId = match.id;
      } catch (e: any) {
        console.warn(`[Pipedream] Failed to fetch accountId for ${cleanSlug}:`, e.message);
      }

      if (!accountId && !path.startsWith('http')) {
        throw new Error('Could not resolve your connected account to securely proxy the request.');
      }

      const proxyOpts: any = {
        url: path,
        externalUserId: userId,
        ...(accountId ? { accountId } : {})
      };

      const m = (method || 'GET').toUpperCase();
      let proxyResult: any;
      if (m === 'POST') proxyResult = await pd.proxy.post({ ...proxyOpts, body: parsedBody, headers: parsedHeaders });
      else if (m === 'PUT') proxyResult = await pd.proxy.put({ ...proxyOpts, body: parsedBody, headers: parsedHeaders });
      else if (m === 'PATCH') proxyResult = await pd.proxy.patch({ ...proxyOpts, body: parsedBody, headers: parsedHeaders });
      else if (m === 'DELETE') proxyResult = await pd.proxy.delete({ ...proxyOpts, params: parsedBody, headers: parsedHeaders });
      else proxyResult = await pd.proxy.get({ ...proxyOpts, params: parsedBody, headers: parsedHeaders });

      const duration = Date.now() - startTime;
      if (nodeId && logNodeStatus) await logNodeStatus(nodeId, 'completed', proxyResult.data || proxyResult);
      return {
        status: 'completed',
        data: proxyResult.data || proxyResult,
        text: JSON.stringify(proxyResult.data || proxyResult),
        app: appSlug,
        tool: actionName,
        duration,
        timestamp: new Date().toISOString()
      };
    }

    // PROACTIVE BRIDGING: Handle common naming mismatches before execution
    const needsInstruction = actionName.includes('quick-add') || actionName.includes('smart-');
    if (needsInstruction && !cleanedParams.instruction && (cleanedParams.text || cleanedParams.summary)) {
      console.log(`[Pipedream] Proactively bridging granular fields to 'instruction' for ${actionName}`);
      const details = Object.entries(cleanedParams)
        .filter(([k, v]) => v !== undefined && v !== null && v !== '' && k !== 'platformName')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      cleanedParams.instruction = `${actionName.replace(/-/g, ' ')} with: ${details}`;
    }

    const initialArguments = { 
      ...cleanedParams,
      ...(credentialId ? { accountId: credentialId } : {})
    };

    mcpResult = await callPipedreamTool(mcpClient, {
      name: actionName,
      arguments: initialArguments
    });

  } catch (err: any) {
    const errorMsg = err.message || '';
    const isMissingInstruction = errorMsg.includes('instruction') && errorMsg.includes('Required');

    if (isMissingInstruction) {
      console.warn(`[Pipedream] Action "${actionName}" wants an 'instruction'. Retrying with flattened payload...`);
      const details = Object.entries(cleanedParams)
        .filter(([k, v]) => v !== undefined && v !== null && v !== '' && k !== 'platformName')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');

      const healingArguments = {
        instruction: `${actionName.replace(/-/g, ' ')} with: ${details}`,
        ...(credentialId ? { accountId: credentialId } : {})
      };

      try {
        mcpResult = await callPipedreamTool(mcpClient, {
          name: actionName,
          arguments: healingArguments
        });
        console.log(`[Pipedream] ✓ Self-healing successful for "${actionName}"`);
      } catch (retryErr: any) {
        throw new Error(`Execution failed after self-healing attempt: ${retryErr.message}`);
      }
    } else {
      throw err;
    }
  }

  // ─── PHASE 7: EXTRACT & VALIDATE RESPONSE ───────────────────────────

  const extractedResponse = extractMCPResponse(mcpResult);

  if (extractedResponse.status === 'failed') {
    const error = extractedResponse.error || 'Unknown error';
    if (nodeId && logNodeStatus) await logNodeStatus(nodeId, 'failed', { error });
    return { status: 'failed', error, tool: actionName, app: appSlug };
  }

  // ─── PHASE 8: RETURN SUCCESS RESPONSE ────────────────────────────────

  const duration = Date.now() - startTime;
  const finalData = extractedResponse.data || extractedResponse.raw || { status: 'success' };

  console.log(`[Pipedream] ACCOUNT: ${credentialId || 'Using Default'}`);
  console.log(`[Pipedream] PARAMS: ${JSON.stringify(cleanedParams, null, 2)}`);
  console.log(`[Pipedream] RESPONSE: ${JSON.stringify(finalData, null, 2)}`);
  console.log(`[Pipedream] ✅ "${actionName}" on ${appSlug} completed in ${duration}ms`);

  if (nodeId && logNodeStatus) await logNodeStatus(nodeId, 'completed', finalData);

  return {
    status: 'completed',
    data: finalData,
    text: typeof finalData === 'string' ? finalData : JSON.stringify(finalData),
    app: appSlug,
    tool: actionName,
    duration,
    timestamp: new Date().toISOString()
  };
};

