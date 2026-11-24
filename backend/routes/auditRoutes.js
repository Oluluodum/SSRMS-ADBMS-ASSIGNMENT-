import { Router } from 'express';
import { listAuditLogs } from '../controllers/auditController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.get('/', authenticate, authorize('ADMINISTRATOR'), listAuditLogs);
export default router;
