import { Router } from 'express';
import * as departmentController from '../../controllers/department.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT);

// Program Manager creates a department
router.route('/').post(checkRole(['Program Manager']), departmentController.createDepartment);

// Any user in the program can view its departments
router.route('/program/:programId').get(departmentController.getDepartmentsForProgram);

export default router;