import express from 'express';
import passport from '../middleware/auth.middleware.js';
import { knowledgeService } from '../services/knowledge/knowledge.service.js';

const router: express.Router = express.Router();
router.use(passport.authenticate('jwt', { session: false }));

router.get('/', async (req: any, res, next) => {
  try { res.json(await knowledgeService.listKnowledge(req.user.id)); } catch (err) { next(err); }
});

router.post('/', async (req: any, res, next) => {
  try { res.status(201).json(await knowledgeService.createKnowledge(req.user.id, req.body)); } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try { res.json(await knowledgeService.getKnowledge(req.params.id)); } catch (err) { next(err); }
});

export default router;
