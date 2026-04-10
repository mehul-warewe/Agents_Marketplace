import express from 'express';
import passport from '../middleware/auth.middleware.js';
import { agentsService } from '../services/agents/agents.service.js';

const router: express.Router = express.Router();
router.use(passport.authenticate('jwt', { session: false }));

// GET /workers - List all Worker Agents for current user
router.get('/', async (req: any, res, next) => {
  try {
    res.json(await agentsService.listWorkers(req.user.id));
  } catch (err) {
    next(err);
  }
});

// GET /workers/directory - List all published Worker Agents (for Manager discovery)
router.get('/directory', async (req, res, next) => {
  try {
    res.json(await agentsService.listWorkerDirectory());
  } catch (err) {
    next(err);
  }
});

// POST /workers/:id/invoke - Directly invoke a Worker (sync, returns result)
// Note: Actual implementation for sync invocation will be added later
router.post('/:id/invoke', async (req: any, res, next) => {
  try {
    // For now, reuse runAgent but we might need a synchronous version for the Manager loop
    res.json(await agentsService.runAgent(req.params.id, req.user.id, req.body));
  } catch (err) {
    next(err);
  }
});

export default router;
