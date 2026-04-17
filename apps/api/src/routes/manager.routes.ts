import express from 'express';
import passport from '../middleware/auth.middleware.js';
import { managerService } from '../services/manager/manager.service.js';
import { managerEngine } from '../services/manager/manager-engine.js';

const router: express.Router = express.Router();
router.use(passport.authenticate('jwt', { session: false }));

// GET /managers/directory - Marketplace route for Managers
router.get('/directory', async (req, res, next) => {
  try { res.json(await managerService.listPublicManagers()); } catch (err) { next(err); }
});

// GET /managers - List user's Managers
router.get('/', async (req: any, res, next) => {
  try {
    res.json(await managerService.listManagers(req.user.id));
  } catch (err) {
    next(err);
  }
});

// POST /managers - Create a Manager
router.post('/', async (req: any, res, next) => {
  try {
    res.status(201).json(await managerService.createManager(req.user.id, req.body));
  } catch (err) {
    next(err);
  }
});

// GET /managers/runs/:runId/stream - SSE stream for Manager run
// This MUST come before /runs/:runId to prevent Express from matching /stream as :runId
router.get('/runs/:runId/stream', async (req: any, res, next) => {
  try {
    const run = await managerService.getManagerRun(req.params.runId);
    if (!run) return res.status(404).json({ error: 'Run not found' });
    if (run.userId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Send connection heartbeat
    res.write('data: {"type":"connected"}\n\n');

    // If run is already completed/failed, stream stored steps and close
    if (run.status === 'completed' || run.status === 'failed') {
      if (run.steps && Array.isArray(run.steps)) {
        for (const step of run.steps) {
          res.write(`data: ${JSON.stringify(step)}\n\n`);
        }
      }
      res.write(`data: {"type":"done","status":"${run.status}","output":${JSON.stringify(run.output)}}\n\n`);
      res.end();
      return;
    }

    // Otherwise, subscribe to live events
    const emitter = managerEngine.getEmitter(req.params.runId);
    if (emitter) {
      const stepHandler = (step: any) => {
        res.write(`data: ${JSON.stringify(step)}\n\n`);
      };
      const doneHandler = (data: any) => {
        res.write(`data: ${JSON.stringify({ type: 'done', ...data })}\n\n`);
        res.end();
      };

      emitter.on('step', stepHandler);
      emitter.on('done', doneHandler);

      // Clean up on client disconnect
      req.on('close', () => {
        emitter.removeListener('step', stepHandler);
        emitter.removeListener('done', doneHandler);
      });
    } else {
      // Emitter not found (run not started or already completed)
      res.write(`data: {"type":"done","status":"${run.status}","output":${JSON.stringify(run.output)}}\n\n`);
      res.end();
    }
  } catch (err) {
    next(err);
  }
});

// GET /managers/runs/:runId - Get Manager run status (with polling support)
router.get('/runs/:runId', async (req: any, res, next) => {
  try {
    const run = await managerService.getManagerRun(req.params.runId);
    if (!run) return res.status(404).json({ error: 'Run not found' });
    res.json(run);
  } catch (err) {
    next(err);
  }
});

// GET /managers/:id - Get Manager details
router.get('/:id', async (req: any, res, next) => {
  try {
    res.json(await managerService.getManager(req.params.id));
  } catch (err) {
    next(err);
  }
});

// PATCH /managers/:id - Update Manager
router.patch('/:id', async (req: any, res, next) => {
  try {
    res.json(await managerService.updateManager(req.params.id, req.user.id, req.body));
  } catch (err) {
    next(err);
  }
});

// DELETE /managers/:id - Delete Manager
router.delete('/:id', async (req: any, res, next) => {
  try {
    res.json(await managerService.deleteManager(req.params.id, req.user.id));
  } catch (err) {
    next(err);
  }
});

// POST /managers/:id/run - Start a Manager run
router.post('/:id/run', async (req: any, res, next) => {
  try {
    const { input } = req.body;
    if (!input) return res.status(400).json({ error: 'Input required' });

    const runId = await managerEngine.runManager(req.params.id, req.user.id, input, (step) => {
       // Optional: Log or broadcast step
    });

    res.json({ runId, status: 'started' });
  } catch (err) {
    next(err);
  }
});

// GET /managers/:id/runs - List Manager runs (for history tab)
router.get('/:id/runs', async (req: any, res, next) => {
  try {
    res.json(await managerService.getManagerRuns(req.params.id, req.user.id));
  } catch (err) {
    next(err);
  }
});

export default router;
