import express from 'express';
import passport from '../middleware/auth.middleware.js';
import { modelsService } from '../services/models/models.service.js';

const router: express.Router = express.Router();

// Publicly available models or restricted to authenticated? 
// Usually better to authenticate to prevent abuse.
router.use(passport.authenticate('jwt', { session: false }));

router.get('/', async (req, res, next) => {
  try {
    const models = await modelsService.listModels();
    res.json(models);
  } catch (err) {
    next(err);
  }
});

export default router;
