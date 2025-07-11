import { Router } from 'express';
import { getDashboardStats } from '../../controllers/dashboard.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();

// All dashboard routes require login and should be accessible by admin/manager roles
router.use(verifyJWT, checkRole(['SuperAdmin', 'ProgramManager']));

router.route('/stats').get(getDashboardStats);

export default router;