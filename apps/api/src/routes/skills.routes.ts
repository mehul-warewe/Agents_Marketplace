import express from 'express';
import passport from '../middleware/auth.middleware.js';
import { skillsService } from '../services/skills/skills.service.js';
import { architectService } from '../services/architect/architect.service.js';
import { runLimiter } from '../middleware/rateLimit.middleware.js';

import { toolsService } from '../services/skills/tools.service.js';
import { pipedreamService } from '../services/pipedream/pipedream.service.js';
import { pipedreamAppsService } from '../services/pipedream/pipedream-apps.service.js';
import { pipedreamMcpService } from '../services/pipedream/pipedream-mcp.service.js';
import axios from 'axios';

const router: express.Router = express.Router();
router.use(passport.authenticate('jwt', { session: false }));

router.get('/', async (req, res, next) => {
  try { res.json(await skillsService.listPublishedSkills()); } catch (err) { next(err); }
});

router.get('/mine', async (req: any, res, next) => {
  try { res.json(await skillsService.listMySkills(req.user.id)); } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try { res.json(await skillsService.getSkill(req.params.id)); } catch (err) { next(err); }
});

router.post('/', async (req: any, res, next) => {
  try { res.status(201).json(await skillsService.createSkill(req.user.id, req.body)); } catch (err) { next(err); }
});

router.patch('/:id', async (req: any, res, next) => {
  try { res.json(await skillsService.updateSkill(req.params.id, req.user.id, req.body)); } catch (err) { next(err); }
});

router.delete('/:id', async (req: any, res, next) => {
  try { res.json(await skillsService.deleteSkill(req.params.id, req.user.id)); } catch (err) { next(err); }
});

router.post('/:id/run', runLimiter, async (req: any, res, next) => {
  try { res.json(await skillsService.runSkill(req.params.id, req.user.id, req.body)); } catch (err) { next(err); }
});

router.get('/tools/registry', async (req, res, next) => {
    try { res.json(await toolsService.listAvailableTools()); } catch (err) { next(err); }
});

router.post('/:id/clone', async (req: any, res, next) => {
    try { res.json(await skillsService.cloneSkill(req.params.id, req.user.id)); } catch (err) { next(err); }
});

router.post('/:id/publish', async (req: any, res, next) => {
    try { res.json(await skillsService.publishSkill(req.params.id, req.user.id, req.body)); } catch (err) { next(err); }
});

router.post('/:id/update-from-original', async (req: any, res, next) => {
    try { res.json(await skillsService.updateFromOriginal(req.params.id, req.user.id)); } catch (err) { next(err); }
});

// Architect loop (moved from agents/architect)
router.post('/architect', async (req, res, next) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt required' });
        res.json(await architectService.generateWorkflow(prompt));
    } catch (err) { next(err); }
});

// ─── Pipedream Integration ──────────────────────────────────────────────────

/** List all platforms (paginated + searchable) — live from Pipedream in-memory cache */
router.get('/pipedream/apps', async (req, res, next) => {
  try {
    const { q, search, limit, offset, cursor } = req.query;
    const { results, total, next_cursor } = await pipedreamAppsService.searchApps(
      (search as string) || (q as string),
      limit ? parseInt(limit as string, 10) : 100,
      offset ? parseInt(offset as string, 10) : 0
    );
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({ results, total, next_cursor });
  } catch (err) { next(err); }
});

router.get('/pipedream/apps/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
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

router.get('/pipedream/accounts', async (req: any, res, next) => {
  try {
    const rawSlug = req.query.appSlug as string;
    const resolvedSlug = rawSlug ? await pipedreamService.resolveAppSlug(rawSlug) : undefined;
    const accounts = await pipedreamService.getConnectedAccounts(req.user.id, resolvedSlug);
    res.json({ accounts });
  } catch (err) { next(err); }
});

router.delete('/pipedream/accounts/:id', async (req: any, res, next) => {
  try {
    res.json(await pipedreamService.deleteAccount(req.user.id, req.params.id));
  } catch (err) { next(err); }
});

router.post('/pipedream/token', async (req: any, res, next) => {
  try {
    const rawSlug = (req.body.appSlug || req.body.appId) as string;
    const resolvedSlug = await pipedreamService.resolveAppSlug(rawSlug);
    const result = await pipedreamService.generateConnectToken(req.user.id, resolvedSlug);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/pipedream/tools', async (req: any, res, next) => {
  try {
    const rawSlug = req.query.appSlug as string;
    const resolvedSlug = await pipedreamService.resolveAppSlug(rawSlug);
    const accessToken = await pipedreamService.getOAuthToken();
    res.json(await pipedreamMcpService.listToolsForApp(resolvedSlug, req.user.id, accessToken));
  } catch (err) { next(err); }
});

router.get('/pipedream/triggers', async (req: any, res, next) => {
  try {
    const rawSlug = req.query.appSlug as string;
    const resolvedSlug = await pipedreamService.resolveAppSlug(rawSlug);
    const accessToken = await pipedreamService.getOAuthToken();
    res.json(await pipedreamMcpService.listTriggersForApp(resolvedSlug, req.user.id, accessToken));
  } catch (err) { next(err); }
});

export default router;
