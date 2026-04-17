import express from 'express';
import passport from '../middleware/auth.middleware.js';
import { employeesService } from '../services/employees/employees.service.js';
import { employeeEngine } from '../services/employees/employee-engine.js';

const router: express.Router = express.Router();
router.use(passport.authenticate('jwt', { session: false }));

// 1. Base Collection Routes
router.get('/', async (req: any, res, next) => {
  try { res.json(await employeesService.listEmployees(req.user.id)); } catch (err) { next(err); }
});

router.post('/', async (req: any, res, next) => {
  try { res.status(201).json(await employeesService.createEmployee(req.user.id, req.body)); } catch (err) { next(err); }
});

// 2. Static / Special Routes (MUST come before /:id)
router.get('/runs/my', async (req: any, res, next) => {
  try { res.json(await employeesService.getMyRuns(req.user.id)); } catch (err) { next(err); }
});

router.get('/dashboard/stats', async (req: any, res, next) => {
  try { res.json(await employeesService.getDashboardStats(req.user.id)); } catch (err) { next(err); }
});

router.get('/directory', async (req, res, next) => {
  try { res.json(await employeesService.listPublicDirectory()); } catch (err) { next(err); }
});

router.post('/draft-prompt', async (req: any, res, next) => {
  try { res.json(await employeesService.draftSystemPrompt(req.body.name, req.body.description, req.body.model)); } catch (err) { next(err); }
});

// 3. Dynamic Run Routes (MUST come before /:id)
// SSE stream endpoint — must come before GET /runs/:runId to avoid route conflicts
router.get('/runs/:runId/stream', async (req: any, res, next) => {
  try {
    const run = await employeesService.getRunDetails(req.params.runId);
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
    const emitter = employeeEngine.getEmitter(req.params.runId);
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

router.get('/runs/:runId', async (req: any, res, next) => {
  try { res.json(await employeesService.getRunDetails(req.params.runId)); } catch (err) { next(err); }
});

// 4. Individual Employee Routes
router.get('/:id', async (req, res, next) => {
  try { res.json(await employeesService.getEmployee(req.params.id)); } catch (err) { next(err); }
});

router.patch('/:id', async (req: any, res, next) => {
  try { res.json(await employeesService.updateEmployee(req.params.id, req.user.id, req.body)); } catch (err) { next(err); }
});

router.patch('/:id/publish', async (req: any, res, next) => {
  try { res.json(await employeesService.publishEmployee(req.params.id, req.user.id, req.body.published)); } catch (err) { next(err); }
});

router.delete('/:id', async (req: any, res, next) => {
  try { res.json(await employeesService.deleteEmployee(req.params.id, req.user.id)); } catch (err) { next(err); }
});

router.get('/:id/runs', async (req: any, res, next) => {
  try { res.json(await employeesService.getRuns(req.params.id, req.user.id)); } catch (err) { next(err); }
});

router.post('/:id/run', async (req: any, res, next) => {
  try { res.json(await employeesService.runEmployee(req.params.id, req.user.id, req.body.task)); } catch (err) { next(err); }
});

router.post('/:id/skills', async (req: any, res, next) => {
  try { res.json(await employeesService.assignSkill(req.params.id, req.user.id, req.body)); } catch (err) { next(err); }
});

router.delete('/:id/skills/:skillId', async (req: any, res, next) => {
  try { res.json(await employeesService.removeSkill(req.params.id, req.user.id, req.params.skillId)); } catch (err) { next(err); }
});

router.post('/:id/knowledge', async (req: any, res, next) => {
  try { res.json(await employeesService.assignKnowledge(req.params.id, req.user.id, req.body.knowledgeId)); } catch (err) { next(err); }
});

router.delete('/:id/knowledge/:knowledgeId', async (req: any, res, next) => {
  try { res.json(await employeesService.removeKnowledge(req.params.id, req.user.id, req.params.knowledgeId)); } catch (err) { next(err); }
});

export default router;
