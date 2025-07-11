import { Router } from 'express';
import * as departmentController from '../../controllers/department.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT);

/**
 * @openapi
 * /departments:
 *   post:
 *     tags: [Departments]
 *     summary: Create a department within a program
 *     description: (Program Manager only) Creates a department and associates it with a program they manage.
 *     security: { bearerAuth: [] }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Frontend Track" }
 *               description: { type: string, example: "Focuses on React" }
 *               programId: { type: string }
 *     responses:
 *       201: { description: 'Department created.' }
 */
router.route('/').post(checkRole(['Program Manager']), departmentController.createDepartment);

/**
 * @openapi
 * /departments/program/{programId}:
 *   get:
 *     tags: [Departments]
 *     summary: Get all departments for a program
 *     description: Retrieves a list of all departments for a given program.
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: programId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'List of departments.' }
 */
router.route('/program/:programId').get(departmentController.getDepartmentsForProgram);

export default router;