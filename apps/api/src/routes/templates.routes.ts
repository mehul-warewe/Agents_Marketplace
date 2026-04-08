import express from 'express';
import passport from '../middleware/auth.middleware.js';
import { templatesService } from '../services/templates/templates.service.js';

const router: express.Router = express.Router();

router.get('/', (req, res) => res.json(templatesService.getTemplates()));

router.post('/:id/use', passport.authenticate('jwt', { session: false }), async (req: any, res, next) => {
  try { res.status(201).json(await templatesService.useTemplate(req.user.id, req.params.id)); } catch (err) { next(err); }
});

export default router;
