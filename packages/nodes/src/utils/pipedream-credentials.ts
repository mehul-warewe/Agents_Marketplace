/**
 * Pipedream Credential Management
 * Handles credential resolution, validation, and secure passing to Pipedream
 */

import { ToolContext } from '../types.js';

export interface PipedreamCredentialConfig {
  appSlug: string;
  userId: string;
  credentials?: any;
  credentialId?: string;
}

/**
 * Validate credential is available for app
 */
export function validateCredentialForApp(
  config: PipedreamCredentialConfig
): { valid: boolean; error?: string } {
  const { appSlug, credentials } = config;

  if (!appSlug) {
    return { valid: false, error: 'appSlug is required' };
  }

  if (!credentials) {
    return {
      valid: false,
      error: `No credential configured for ${appSlug}. User must connect first.`
    };
  }

  if (typeof credentials !== 'object') {
    return {
      valid: false,
      error: 'Credential format is invalid'
    };
  }

  return { valid: true };
}

/**
 * Prepare credential for Pipedream transmission
 * Ensures sensitive data is properly formatted
 */
export function prepareCredentialForPipedream(
  credentials: any,
  appSlug: string
): Record<string, string | number | boolean> {
  if (!credentials) return {};

  // Common credential fields that Pipedream expects
  const credentialMap: Record<string, string[]> = {
    // OAuth tokens
    access_token: ['accessToken', 'token', 'oauth_token'],
    refresh_token: ['refreshToken'],
    token_type: ['tokenType'],
    expires_in: ['expiresIn', 'expiresAt'],

    // API keys
    api_key: ['apiKey', 'key', 'api_key'],
    auth_token: ['authToken', 'auth_token'],

    // Basic auth
    username: ['username', 'user'],
    password: ['password', 'passwd'],

    // URLs
    base_url: ['baseUrl', 'base_url', 'url'],
    webhook_url: ['webhookUrl', 'webhook_url', 'url'],

    // Platform-specific
    bot_token: ['botToken', 'bot_token'],
    team_id: ['teamId', 'team_id'],
    channel_id: ['channelId', 'channel_id'],
    user_id: ['userId', 'user_id'],
  };

  const prepared: Record<string, any> = {};

  // Map known fields
  Object.entries(credentialMap).forEach(([standardKey, aliases]) => {
    for (const alias of aliases) {
      if (alias in credentials) {
        prepared[standardKey] = credentials[alias];
        break;
      }
    }
  });

  // Include any additional fields that don't contain 'password' or 'secret'
  Object.entries(credentials).forEach(([key, value]) => {
    if (!key.toLowerCase().includes('password') &&
        !key.toLowerCase().includes('secret') &&
        !(key in prepared)) {
      prepared[key] = value;
    }
  });

  return prepared;
}

/**
 * Get credential resolution status for error reporting
 */
export function getCredentialErrorMessage(
  context: ToolContext
): string {
  const { config, userId } = context;
  const appSlug = config.appSlug || 'unknown';

  if (config.credentialId) {
    return `Credential "${config.credentialId}" is invalid or expired for ${appSlug}. Please reconnect.`;
  }

  return `No credential found for ${appSlug}. Please connect your account first.`;
}

/**
 * Check if credential needs refresh (for OAuth tokens)
 */
export function shouldRefreshCredential(credentials: any): boolean {
  if (!credentials) return false;

  const expiresAt = credentials.expiresAt || credentials.expires_at;
  if (!expiresAt) return false;

  const expiresTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const bufferMs = 5 * 60 * 1000; // 5 minute buffer

  return (expiresTime - now) < bufferMs;
}

/**
 * Format credential info for logging (sanitized)
 */
export function formatCredentialForLog(
  credentials: any,
  appSlug: string
): string {
  if (!credentials) {
    return `[${appSlug}] No credentials`;
  }

  const type = credentials.tokenType || credentials.token_type || 'unknown';
  const id = (credentials.userId || credentials.user_id || 'N/A').slice(0, 8);

  return `[${appSlug}] Type: ${type}, User: ${id}...`;
}
