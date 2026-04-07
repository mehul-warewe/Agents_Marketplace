/**
 * Universal Pipedream Handler
 *
 * Used by all individual Pipedream node handlers (Slack, Discord, GitHub, etc.)
 * Handles MCP execution, credential validation, parameter cleaning, response parsing
 *
 * Individual handlers ONLY do:
 *   1. Validate platform-specific config (e.g., "channel" required for Slack)
 *   2. Check credentials exist
 *   3. Call this handler with appSlug + actionName + params
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
  validateCredentialForApp,
  formatCredentialForLog
} from './pipedream-credentials.js';
import {
  cleanParametersForPipedream,
  validateActionConfig
} from './pipedream-validation.js';

export interface PipedreamConfig {
  appSlug: string;
  actionName: string;
  actionParams: Record<string, any>;
}

/**
 * Execute any Pipedream action for any platform
 *
 * Called by individual node handlers like:
 *   slackPostMessageHandler → pipedreamHandler()
 *   discordSendMessageHandler → pipedreamHandler()
 *
 * 8-Phase Execution:
 *   1. Validate Pipedream config (appSlug, actionName)
 *   2. Validate environment (Pipedream env vars)
 *   3. Validate credentials (user has credential for app)
 *   4. Clean parameters (remove internal fields, render templates)
 *   5. Initialize MCP client (get token, create transport)
 *   6. Execute tool (call Pipedream MCP)
 *   7. Extract response (parse result)
 *   8. Return success (with metadata)
 */
export const pipedreamHandler = async (
  context: ToolContext,
  pipedreamConfig: PipedreamConfig
) => {
  const startTime = Date.now();
  const { credentials, userId, render, logNodeStatus, nodeId, label } = context;
  const { appSlug, actionName, actionParams } = pipedreamConfig;

  // ─── PHASE 1: VALIDATE PIPEDREAM CONFIG ──────────────────────────────

  if (!appSlug) {
    const error = 'appSlug is required';
    console.error(`[Pipedream] ${error}`);
    if (nodeId && logNodeStatus) await logNodeStatus(nodeId, 'failed', { error });
    return { status: 'failed', error };
  }

  if (!actionName) {
    const error = 'actionName is required';
    console.error(`[Pipedream] ${error}`);
    if (nodeId && logNodeStatus) await logNodeStatus(nodeId, 'failed', { error });
    return { status: 'failed', error };
  }

  // ─── PHASE 2: VALIDATE ENVIRONMENT ───────────────────────────────────

  const pd = getPipedreamClient();
  if (!pd) {
    const error = 'Pipedream is not configured. Missing environment variables.';
    console.error(`[Pipedream] ${error}`);
    if (nodeId && logNodeStatus) await logNodeStatus(nodeId, 'failed', { error });
    return { status: 'failed', error, hint: 'Contact support' };
  }

  // ─── PHASE 3: SKIP LOCAL VALIDATION (HANDLED BY PIPEDREAM) ──────────
  // We no longer check local database for user tokens.
  // Pipedream MCP uses the externalUserId (context.userId) to resolve credentials.


  // ─── PHASE 4: CLEAN PARAMETERS ──────────────────────────────────────

  const cleanedParams = cleanParametersForPipedream(actionParams, render);

  console.log(
    `[Pipedream] Executing "${actionName}" on ${appSlug} for user ${userId}`
  );

  // ─── PHASE 5: INITIALIZE MCP CLIENT ─────────────────────────────────

  let accessToken: string;
  try {
    accessToken = await pd.rawAccessToken;
  } catch (err: any) {
    const error = `Failed to get Pipedream access token: ${err.message}`;
    console.error(`[Pipedream] ${error}`);
    if (nodeId && logNodeStatus) await logNodeStatus(nodeId, 'failed', { error });
    return { status: 'failed', error };
  }

  let mcpClient;
  try {
    const mcpConfig: MCPConnectionConfig = {
      accessToken,
      projectId: process.env.PIPEDREAM_PROJECT_ID!,
      appSlug,
      environment: process.env.PIPEDREAM_ENVIRONMENT as any,
      externalUserId: userId
    };

    mcpClient = await initializeMCPClient(mcpConfig);
  } catch (err: any) {
    const error = `Failed to initialize MCP client: ${err.message}`;
    console.error(`[Pipedream] ${error}`);
    if (nodeId && logNodeStatus) await logNodeStatus(nodeId, 'failed', { error });
    return { status: 'failed', error };
  }

  // ─── PHASE 6: EXECUTE TOOL ──────────────────────────────────────────

  let mcpResult;
  try {
    mcpResult = await callPipedreamTool(mcpClient, {
      name: actionName,
      arguments: cleanedParams
    });

    console.log(`[Pipedream] Tool "${actionName}" executed successfully`);
  } catch (err: any) {
    const error = err.message || 'Tool execution failed';
    const isAuthError =
      error.toLowerCase().includes('unauthorized') ||
      error.toLowerCase().includes('not connected') ||
      error.toLowerCase().includes('credential missing');

    console.error(`[Pipedream] Error executing "${actionName}": ${error}`);
    if (nodeId && logNodeStatus) await logNodeStatus(nodeId, 'failed', { error });

    return {
      status: 'failed',
      error,
      requiresAuth: isAuthError,
      tool: actionName,
      app: appSlug
    };
  }


  // ─── PHASE 7: EXTRACT & VALIDATE RESPONSE ───────────────────────────

  const extractedResponse = extractMCPResponse(mcpResult);

  if (extractedResponse.status === 'failed') {
    const error = extractedResponse.error || 'Unknown error';
    console.error(`[Pipedream] Tool returned error: ${error}`);
    if (nodeId && logNodeStatus) await logNodeStatus(nodeId, 'failed', { error });
    return {
      status: 'failed',
      error,
      tool: actionName,
      app: appSlug
    };
  }

  // ─── PHASE 8: RETURN SUCCESS RESPONSE ────────────────────────────────

  const duration = Date.now() - startTime;

  console.log(
    `[Pipedream] ✓ "${actionName}" on ${appSlug} completed in ${duration}ms`
  );

  if (nodeId && logNodeStatus) await logNodeStatus(nodeId, 'completed', extractedResponse.data);

  return {
    status: 'completed',
    data: extractedResponse.data,
    text: typeof extractedResponse.data === 'string'
      ? extractedResponse.data
      : JSON.stringify(extractedResponse.data),
    app: appSlug,
    tool: actionName,
    duration,
    timestamp: new Date().toISOString()
  };
};
