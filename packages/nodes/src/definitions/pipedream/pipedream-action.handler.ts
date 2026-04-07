'use server';

/**
 * Generic Pipedream Action Handler
 *
 * Handles ANY Pipedream platform/action combination.
 * Extracts appSlug and actionName from node config,
 * then delegates to the universal pipedreamHandler.
 *
 * This handler enables the "show all Pipedream nodes dynamically" feature.
 *
 * Config shape:
 * {
 *   appSlug: string (platform ID like "slack", "discord")
 *   actionName: string (action name like "post_message", "send_dm")
 *   ... all other fields are action-specific parameters
 * }
 */

import type { ToolHandler, ToolContext } from '../../types.js';
import { pipedreamHandler } from '../../utils/pipedream-universal.js';

export const pipedreamActionHandler: ToolHandler = async (context: ToolContext) => {
  const { config, label, execKey } = context;
  let { appSlug, actionName, ...actionParams } = config;

  // ─── INFER FROM EXECUTION KEY IF MISSING ───────────────────────────────
  // This allows nodes like 'slack_post_message' to work even without explicit config fields
  if ((!appSlug || !actionName) && execKey && execKey.includes('_')) {
    const parts = execKey.split('_');
    if (!appSlug) appSlug = parts[0];
    if (!actionName) actionName = parts.slice(1).join('_');
  }

  // ─── VALIDATE CONFIGURATION ────────────────────────────────────────────

  if (!appSlug) {
    console.error(`[Pipedream] "${label}" - appSlug is required (Key: ${execKey})`);
    return {
      status: 'failed',
      error: 'Platform (appSlug) is required in node configuration'
    };
  }

  if (!actionName) {
    console.error(`[Pipedream] "${label}" - actionName is required (Key: ${execKey})`);
    return {
      status: 'failed',
      error: 'Action (actionName) is required in node configuration'
    };
  }

  console.log(
    `[Pipedream] "${label}" - Executing action "${actionName}" on platform "${appSlug}"`
  );

  // ─── DELEGATE TO UNIVERSAL HANDLER ──────────────────────────────────────

  return pipedreamHandler(context, {
    appSlug,
    actionName,
    actionParams
  });
};
