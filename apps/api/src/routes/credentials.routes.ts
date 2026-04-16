import express from 'express';
import axios from 'axios';
import passport from '../middleware/auth.middleware.js';
import { credentialsService } from '../services/credentials/credentials.service.js';
import { pipedreamService } from '../services/pipedream/pipedream.service.js';
import { pipedreamAppsService } from '../services/pipedream/pipedream-apps.service.js';
import { pipedreamMcpService } from '../services/pipedream/pipedream-mcp.service.js';
import { proxyService } from '../services/proxy/proxy.service.js';
import { initiateGoogleOAuth, handleGoogleCallback } from '../services/credentials/oauth/google.oauth.js';
import { initiateSlackOAuth, handleSlackCallback } from '../services/credentials/oauth/slack.oauth.js';
import { CREDENTIAL_SCHEMAS } from '../services/credentials/schema.service.js';

const router: express.Router = express.Router();
router.use(passport.authenticate('jwt', { session: false }));

router.get('/schemas', (req, res) => res.json(CREDENTIAL_SCHEMAS));

router.get('/', async (req: any, res, next) => {
  try { res.json(await credentialsService.listCredentials(req.user.id)); } catch (err) { next(err); }
});

router.post('/', async (req: any, res, next) => {
  try {
    const { name, type, data } = req.body;
    res.status(201).json(await credentialsService.createCredential(req.user.id, name, type, data));
  } catch (err) { next(err); }
});

router.patch('/:id', async (req: any, res, next) => {
  try { res.json(await credentialsService.updateCredential(req.params.id, req.user.id, req.body)); } catch (err) { next(err); }
});

router.delete('/:id', async (req: any, res, next) => {
  try { res.json(await credentialsService.deleteCredential(req.params.id, req.user.id)); } catch (err) { next(err); }
});

router.post('/test/:id', async (req: any, res, next) => {
  try { res.json(await credentialsService.testCredential(req.params.id, req.user.id)); } catch (err) { next(err); }
});

// Proxy
router.get('/proxy/models', async (req: any, res, next) => {
  try { res.json(await proxyService.listModels(req.query.credentialId as string, req.user.id)); } catch (err) { next(err); }
});

// ─── Pipedream ────────────────────────────────────────────────────────────────

/** List all platforms (paginated + searchable) — live from Pipedream in-memory cache */
router.get('/pipedream/apps', async (req, res, next) => {
  try {
    const { search, limit, offset } = req.query;
    const { results, total } = await pipedreamAppsService.searchApps(
      search as string,
      limit ? parseInt(limit as string, 10) : 100,
      offset ? parseInt(offset as string, 10) : 0
    );
    // No-cache: prevent browser from serving stale 304 during cache warm-up
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({ results, total });
  } catch (err) { next(err); }
});

router.get('/pipedream/apps/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    
    // 1. Try Local Redis Registry FIRST (Fast & Permanent)
    const { results } = await pipedreamAppsService.searchApps(id.replace(/[-_]/g, ' '), 5);
    const bestLocalMatch = results.find(a => {
      const normalize = (s: string) => s.toLowerCase().replace(/[-_]/g, '');
      return a.id === id || normalize(a.slug) === normalize(id);
    });
    
    if (bestLocalMatch) {
      return res.json({
        id: bestLocalMatch.id,
        name: bestLocalMatch.name,
        slug: bestLocalMatch.slug,
        logo_url: bestLocalMatch.icon || `https://assets.pipedream.net/s.v0/${bestLocalMatch.id}/logo/orig`
      });
    }

    // 2. Fallback to External API if not in registry
    const accessToken = await pipedreamService.getOAuthToken();
    try {
      const response = await axios.get(`https://api.pipedream.com/v1/apps/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const d = response.data?.data;
      return res.json({
        ...d,
        id: d?.id || d?.app_id || id,
        logo_url: d?.logo_url || d?.icon || `https://assets.pipedream.net/s.v0/${d?.id}/logo/orig`
      });
    } catch (err: any) {
      // If it's a 404 and has a hyphen, try with underscore (Pipedream API style)
      if (err.response?.status === 404) {
        const altId = id.includes('-') ? id.replace(/-/g, '_') : id.replace(/_/g, '-');
        try {
          const retryResponse = await axios.get(`https://api.pipedream.com/v1/apps/${altId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const d = retryResponse.data?.data;
          return res.json({
            ...d,
            id: d?.id || d?.app_id || altId,
            logo_url: d?.logo_url || d?.icon || `https://assets.pipedream.net/s.v0/${d?.id}/logo/orig`
          });
        } catch (retryErr) {
          // Final fallback: Search in-memory cache for a name/slug match
          const { results } = await pipedreamAppsService.searchApps(id.replace(/[-_]/g, ' '), 1);
          const bestMatch = results[0];
          if (bestMatch) {
            return res.json({
              id: bestMatch.id,
              name: bestMatch.name,
              slug: bestMatch.slug,
              logo_url: bestMatch.icon || `https://assets.pipedream.net/s.v0/${bestMatch.id}/logo/orig`
            });
          }
        }
      }
      throw err;
    }
  } catch (err) { next(err); }
});

/**
 * GET /credentials/pipedream/accounts?appSlug=<id-or-slug>
 * Returns connected Pipedream accounts for the current user + app.
 * Response: { accounts: [...] }
 */
router.get('/pipedream/accounts', async (req: any, res, next) => {
  try {
    const rawSlug = req.query.appSlug as string;
    const resolvedSlug = await pipedreamService.resolveAppSlug(rawSlug);
    const accounts = await pipedreamService.getConnectedAccounts(req.user.id, resolvedSlug);
    res.json({ accounts });
  } catch (err) { next(err); }
});

router.delete('/pipedream/accounts/:id', async (req: any, res, next) => {
  try {
    res.json(await pipedreamService.deleteAccount(req.user.id, req.params.id));
  } catch (err) { next(err); }
});

/**
 * POST /credentials/pipedream/token
 * Body: { appSlug: string }
 * Generates a connect token for the user to authenticate a specific platform.
 */
router.post('/pipedream/token', async (req: any, res, next) => {
  try {
    const rawSlug = req.body.appSlug as string;
    const resolvedSlug = await pipedreamService.resolveAppSlug(rawSlug);
    const result = await pipedreamService.generateConnectToken(req.user.id, resolvedSlug);
    res.json(result);
  } catch (err) { next(err); }
});

/**
 * GET /credentials/pipedream/tools?appSlug=<id-or-slug>
 * Lists available MCP tools for a platform.
 */
router.get('/pipedream/tools', async (req: any, res, next) => {
  try {
    const rawSlug = req.query.appSlug as string;
    const resolvedSlug = await pipedreamService.resolveAppSlug(rawSlug);
    const accessToken = await pipedreamService.getOAuthToken();
    
    // Disable caching to prevent 304 Not Modified on stale empty responses
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json(await pipedreamMcpService.listToolsForApp(resolvedSlug, req.user.id, accessToken));
  } catch (err) { next(err); }
});

/**
 * GET /credentials/pipedream/triggers?appSlug=<id-or-slug>
 * Lists available event triggers (sources) for a platform.
 */
router.get('/pipedream/triggers', async (req: any, res, next) => {
  try {
    const rawSlug = req.query.appSlug as string;
    const resolvedSlug = await pipedreamService.resolveAppSlug(rawSlug);
    const accessToken = await pipedreamService.getOAuthToken();
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json(await pipedreamMcpService.listTriggersForApp(resolvedSlug, req.user.id, accessToken));
  } catch (err) { next(err); }
});

// OAuth Fallbacks (Google / Slack native)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

router.get('/oauth/google', (req: any, res) => {
  res.redirect(initiateGoogleOAuth(req.user.id, req.query.toolId as string, API_BASE));
});

router.get('/oauth/google/callback', async (req, res, next) => {
  try {
    await handleGoogleCallback(req.query.code as string, req.query.state as string, API_BASE);
    res.send('<script>window.close();</script>');
  } catch (err) { next(err); }
});

router.get('/oauth/slack', (req: any, res) => {
  res.redirect(initiateSlackOAuth(req.user.id, API_BASE));
});

router.get('/oauth/slack/callback', async (req, res, next) => {
  try {
    await handleSlackCallback(req.query.code as string, req.query.state as string, API_BASE);
    res.send('<script>window.close();</script>');
  } catch (err) { next(err); }
});

export default router;
