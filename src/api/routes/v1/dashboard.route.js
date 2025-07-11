import { Router } from 'express';
import { getDashboardStats } from '../../controllers/dashboard.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT, checkRole(['SuperAdmin', 'Program Manager']));

/**
 * @openapi
 * /dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard summary statistics
 *     description: Retrieves key statistics for the dashboard homepage, such as total users, active programs, etc.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: An object containing dashboard statistics.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPrograms: { type: integer }
 *                 activeTrainees: { type: integer }
 *                 totalUsers: { type: integer }
 *                 pendingApprovals: { type: integer }
 */
router.route('/stats').get(getDashboardStats);

export default router;