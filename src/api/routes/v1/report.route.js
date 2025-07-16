import { Router } from 'express';
import * as reportController from '../../controllers/report.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT, checkRole(['SuperAdmin', 'Program Manager']));

/**
 * @openapi
 * /reports/trainee/{traineeId}/attendance:
 *   get:
 *     tags: [Reports]
 *     summary: Get a trainee's monthly attendance report
 *     description: Calculates a specific trainee's attendance percentage for a given month and year, and flags them if it's below 50%.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: traineeId, in: path, required: true, schema: { type: string } }
 *       - { name: month, in: query, required: true, schema: { type: integer, example: 7 }, description: "Month number (1-12)" }
 *       - { name: year, in: query, required: true, schema: { type: integer, example: 2025 } }
 *     responses:
 *       200: { description: 'Monthly report generated successfully.' }
 *       400: { description: 'Missing month or year query parameters.' }
 */
router.route('/trainee/:traineeId/attendance').get(reportController.getTraineeMonthlyAttendance);

// ... existing routes
/**
 * @openapi
 * /reports/master-log:
 *   get:
 *     tags: [Reports]
 *     summary: Get the Master Activity Log
 *     description: (SuperAdmin only) Retrieves a paginated and filterable list of all significant actions taken in the system.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: page, in: query, schema: { type: integer, default: 1 } }
 *       - { name: limit, in: query, schema: { type: integer, default: 20 } }
 *       - { name: action, in: query, schema: { type: string, enum: [USER_LOGIN, USER_CREATED, ...] } }
 *       - { name: userId, in: query, schema: { type: string } }
 *       - { name: startDate, in: query, schema: { type: string, format: 'date' } }
 *       - { name: endDate, in: query, schema: { type: string, format: 'date' } }
 *     responses:
 *       200: { description: 'A paginated list of log entries.' }
 */
router.route('/master-log').get(checkRole(['SuperAdmin']), reportController.getMasterLog);

export default router;