import { Router } from 'express';
import * as programController from '../../controllers/program.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT);

/**
 * @openapi
 * /programs:
 *   get:
 *     tags: [Programs]
 *     summary: Get all accessible programs
 *     description: Retrieves programs based on user role. SuperAdmin sees all. Program Manager sees programs they manage. Facilitators/Trainees see programs they are enrolled in.
 *     security: { bearerAuth: [] }
 *     responses:
 *       200: { description: 'List of programs.' }
 *   post:
 *     tags: [Programs]
 *     summary: Create a new program
 *     description: (Program Manager or SuperAdmin) Creates a new program. PM-created are 'Draft', SuperAdmin-created are 'PendingApproval'.
 *     security: { bearerAuth: [] }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, startDate, endDate]
 *             properties:
 *               name: { type: string, example: 'New Web Dev Program' }
 *               description: { type: string, example: 'A program for learning web development.' }
 *               startDate: { type: string, format: 'date', example: '2025-10-01' }
 *               endDate: { type: string, format: 'date', example: '2026-01-31' }
 *     responses:
 *       201: { description: 'Program created successfully.' }
 */
router.route('/')
    .get(programController.getAllPrograms)
    .post(checkRole(['Program Manager', 'SuperAdmin']), programController.createProgram);

/**
 * @openapi
 * /programs/{id}:
 *   get:
 *     tags: [Programs]
 *     summary: Get a single program by ID
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'Program details with populated users.' }
 *       404: { description: 'Program not found.' }
 *   put:
 *     tags: [Programs]
 *     summary: Update program details
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       200: { description: 'Program updated successfully.' }
 *   delete:
 *     tags: [Programs]
 *     summary: Deactivate (soft delete) a program
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'Program deactivated successfully.' }
 */
router.route('/:id')
    .get(programController.getProgramById)
    .put(checkRole(['SuperAdmin', 'Program Manager']), programController.updateProgram)
    .delete(checkRole(['SuperAdmin']), programController.deleteProgram);

/**
 * @openapi
 * /programs/{id}/request-approval:
 *   patch:
 *     tags: [Programs]
 *     summary: Request program approval
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'Program submitted for approval.' }
 */
router.route('/:id/request-approval').patch(checkRole(['Program Manager']), programController.requestApproval);

/**
 * @openapi
 * /programs/{id}/approve:
 *   patch:
 *     tags: [Programs]
 *     summary: Approve a program
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'Program approved.' }
 */
router.route('/:id/approve').patch(checkRole(['SuperAdmin']), programController.approveProgram);

/**
 * @openapi
 * /programs/{id}/reject:
 *   patch:
 *     tags: [Programs]
 *     summary: Reject a program
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { properties: { reason: { type: string, example: 'Budget not approved.' } } }
 *     responses:
 *       200: { description: 'Program rejected.' }
 */
router.route('/:id/reject').patch(checkRole(['SuperAdmin']), programController.rejectProgram);
    
/**
 * @openapi
 * /programs/{id}/enroll-trainee:
 *   post:
 *     tags: [Programs]
 *     summary: Enroll a trainee in a program
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { properties: { traineeId: { type: string } } }
 *     responses:
 *       200: { description: 'Trainee enrolled.' }
 */
router.route('/:id/enroll-trainee').post(checkRole(['Program Manager']), programController.enrollTrainee);

/**
 * @openapi
 * /programs/{id}/enroll-facilitator:
 *   post:
 *     tags: [Programs]
 *     summary: Enroll a facilitator in a program
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { properties: { facilitatorId: { type: string } } }
 *     responses:
 *       200: { description: 'Facilitator enrolled.' }
 */
router.route('/:id/enroll-facilitator').post(checkRole(['Program Manager']), programController.enrollFacilitator);

/**
 * @openapi
 * /programs/{id}/manage-managers:
 *   patch:
 *     tags: [Programs]
 *     summary: Add or remove a Program Manager (Multi-Manager Support)
 *     description: (SuperAdmin only) Adds/removes a PM from the program's list of managers. This is the new, preferred endpoint for managing multiple managers.
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               managerId: { type: string }
 *               action: { type: string, enum: [add, remove] }
 *     responses:
 *       200: { description: 'Manager list updated.' }
 */
router.route('/:id/manage-managers').patch(checkRole(['SuperAdmin']), programController.updateProgramManagers);


// --- THIS IS THE MISSING ROUTE, NOW ADDED BACK ---
/**
 * @openapi
 * /programs/{id}/assign-manager:
 *   patch:
 *     tags: [Programs]
 *     summary: Assign a single Program Manager (Legacy)
 *     description: (SuperAdmin only) Assigns a single PM to a program. This overwrites the previous manager. It is recommended to use the `/manage-managers` endpoint instead.
 *     deprecated: true
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               managerId: { type: string, description: "Send empty string to unassign" }
 *     responses:
 *       200: { description: 'Manager assignment updated.' }
 */
router.route('/:id/assign-manager').patch(checkRole(['SuperAdmin']), programController.assignManager);
// --- END OF ADDED ROUTE ---


/**
 * @openapi
 * /programs/{id}/report/pdf:
 *   get:
 *     tags: [Programs]
 *     summary: Generate a PDF report for a program
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: A downloadable PDF file.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.route('/:id/report/pdf').get(checkRole(['SuperAdmin', 'Program Manager']), programController.generateProgramReport);

/**
 * @openapi
 * /programs/{id}/stats:
 *   get:
 *     tags: [Programs]
 *     summary: Get statistics for a specific program
 *     description: (SuperAdmin or Program Manager only) Retrieves key performance indicators (KPIs) for a single program, including overall attendance percentage, enrollment numbers, and more.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the program to get stats for.
 *     responses:
 *       200:
 *         description: Successfully retrieved program statistics.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEnrolled:
 *                   type: integer
 *                   example: 45
 *                 totalFacilitators:
 *                   type: integer
 *                   example: 3
 *                 overallAttendancePercentage:
 *                   type: number
 *                   format: float
 *                   example: 92.5
 *                 totalPresentDays:
 *                   type: integer
 *                   example: 370
 *                 totalExcusedDays:
 *                   type: integer
 *                   example: 10
 *                 totalEligibleDays:
 *                   type: integer
 *                   example: 400
 *       403:
 *         description: Forbidden, user does not have permission to view stats for this program.
 *       404:
 *         description: Program not found.
 */
router.route('/:id/stats')
    .get(checkRole(['SuperAdmin', 'Program Manager']), programController.getProgramStats);

export default router;