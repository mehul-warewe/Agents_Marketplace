import express from 'express';
import passport from '../middleware/auth.middleware.js';
import { employeesService } from '../services/employees/employees.service.js';

const router: express.Router = express.Router();
router.use(passport.authenticate('jwt', { session: false }));

router.get('/', async (req: any, res, next) => {
  try { res.json(await employeesService.listEmployees(req.user.id)); } catch (err) { next(err); }
});

router.post('/', async (req: any, res, next) => {
  try { res.status(201).json(await employeesService.createEmployee(req.user.id, req.body)); } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try { res.json(await employeesService.getEmployee(req.params.id)); } catch (err) { next(err); }
});

router.patch('/:id', async (req: any, res, next) => {
  try { res.json(await employeesService.updateEmployee(req.params.id, req.user.id, req.body)); } catch (err) { next(err); }
});

router.delete('/:id', async (req: any, res, next) => {
  try { res.json(await employeesService.deleteEmployee(req.params.id, req.user.id)); } catch (err) { next(err); }
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

router.post('/:id/run', async (req: any, res, next) => {
  try { res.json(await employeesService.runEmployee(req.params.id, req.user.id, req.body.task)); } catch (err) { next(err); }
});

router.get('/:id/runs', async (req: any, res, next) => {
  try { res.json(await employeesService.getRuns(req.params.id, req.user.id)); } catch (err) { next(err); }
});

export default router;
