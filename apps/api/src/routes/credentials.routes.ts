import express from 'express';
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

/** List all synced platforms (paginated + searchable) */
router.get('/pipedream/apps', async (req, res, next) => {
  try {
    const { search, limit, offset } = req.query;
    res.json(await pipedreamAppsService.searchApps(
      search as string,
      limit ? parseInt(limit as string, 10) : 100,
      offset ? parseInt(offset as string, 10) : 0
    ));
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
    res.json(await pipedreamMcpService.listToolsForApp(resolvedSlug, req.user.id, accessToken));
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
