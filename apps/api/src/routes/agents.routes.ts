import express from 'express';
import passport from '../middleware/auth.middleware.js';
import { agentsService } from '../services/agents/agents.service.js';
import { toolsService } from '../services/agents/tools.service.js';
import { architectService } from '../services/architect/architect.service.js';
import { runLimiter } from '../middleware/rateLimit.middleware.js';

const router: express.Router = express.Router();
router.use(passport.authenticate('jwt', { session: false }));

router.get('/', async (req, res, next) => {
  try { res.json(await agentsService.listPublishedAgents()); } catch (err) { next(err); }
});

router.get('/mine', async (req: any, res, next) => {
  try { res.json(await agentsService.listMyAgents(req.user.id)); } catch (err) { next(err); }
});

router.get('/my-runs', async (req: any, res, next) => {
  try { res.json(await agentsService.getMyRuns(req.user.id)); } catch (err) { next(err); }
});

router.get('/dashboard-stats', async (req: any, res, next) => {
  try { res.json(await agentsService.getDashboardStats(req.user.id)); } catch (err) { next(err); }
});

router.get('/tools/available', async (req, res, next) => {
  try { res.json(await toolsService.listAvailableTools()); } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try { res.json(await agentsService.getAgent(req.params.id)); } catch (err) { next(err); }
});

router.post('/', async (req: any, res, next) => {
  try { res.status(201).json(await agentsService.createAgent(req.user.id, req.body)); } catch (err) { next(err); }
});

router.patch('/:id', async (req: any, res, next) => {
  try { res.json(await agentsService.updateAgent(req.params.id, req.user.id, req.body)); } catch (err) { next(err); }
});

router.post('/:id/publish', async (req: any, res, next) => {
  try { res.json(await agentsService.publishAgent(req.params.id, req.user.id, req.body)); } catch (err) { next(err); }
});

router.post('/:id/acquire', async (req: any, res, next) => {
  try { res.json(await agentsService.acquireAgent(req.params.id, req.user.id)); } catch (err) { next(err); }
});

router.delete('/:id', async (req: any, res, next) => {
  try { res.json(await agentsService.deleteAgent(req.params.id, req.user.id)); } catch (err) { next(err); }
});

router.post('/:id/run', runLimiter, async (req: any, res, next) => {
  try { res.json(await agentsService.runAgent(req.params.id, req.user.id, req.body)); } catch (err) { next(err); }
});

router.get('/runs/:id', async (req, res, next) => {
  try { res.json(await agentsService.getAgentRun(req.params.id)); } catch (err) { next(err); }
});

// Architect loop
router.post('/architect', async (req, res, next) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt required' });
        res.json(await architectService.generateWorkflow(prompt));
    } catch (err) { next(err); }
});

export default router;
