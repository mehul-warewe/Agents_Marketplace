import express from 'express';
import passport from '../middleware/auth.middleware.js';
import { skillsService } from '../services/skills/skills.service.js';
import { architectService } from '../services/architect/architect.service.js';
import { runLimiter } from '../middleware/rateLimit.middleware.js';

import { toolsService } from '../services/agents/tools.service.js';

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

export default router;
