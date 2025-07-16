import { Router } from 'express';
import * as programUserController from '../../controllers/programUser.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();

// Protect all routes in this file. Only a logged-in ProgramManager can access them.
router.use(verifyJWT, checkRole(['Program Manager']));

/**
 * @openapi
 * /program-users/program/{programId}:
 *   get:
 *     tags: [Program User Management (PM)]
 *     summary: Get all users in a specific program
 *     description: (Program Manager only) Retrieves a list of all facilitators and trainees enrolled in a specific program that the requesting PM manages.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: programId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         description: The ID of the program to fetch users from.
 *     responses:
 *       200:
 *         description: A list of users in the program.
 *       403:
 *         description: Forbidden, if the user is not a manager of this program.
 *       404:
 *         description: Program not found.
 */
router.route('/program/:programId').get(programUserController.getUsersInProgram);

/**
 * @openapi
 * /program-users/{userId}:
 *   patch:
 *     tags: [Program User Management (PM)]
 *     summary: Update a user's details
 *     description: (Program Manager only) Allows a PM to update the details (e.g., name) of a user who is part of a program they manage.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         description: The ID of the user to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Doe Updated"
 *     responses:
 *       200:
 *         description: User details updated successfully.
 *       403:
 *         description: Forbidden, if the user is not in one of the PM's programs.
 *       404:
 *         description: User not found.
 */
router.route('/:userId').patch(programUserController.updateUserInProgram);

/**
 * @openapi
 * /program-users/program/{programId}/remove/{userId}:
 *   patch:
 *     tags: [Program User Management (PM)]
 *     summary: Remove a user from a program
 *     description: (Program Manager only) Removes a user (trainee or facilitator) from the enrollment list of a specific program. This action does NOT delete the user's account.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: programId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         description: The ID of the program.
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         description: The ID of the user to remove from the program.
 *     responses:
 *       200:
 *         description: User removed from the program successfully.
 *       403:
 *         description: Forbidden, if the requester is not the manager of this program.
 */
router.route('/program/:programId/remove/:userId').patch(programUserController.removeUserFromProgram);
/**
 * @openapi
 * /program-users/my-trainees:
 *   get:
 *     tags: [Program User Management (PM)]
 *     summary: Get all trainees managed by the logged-in PM
 *     description: (Program Manager only) Retrieves a detailed list of all trainees across all programs managed by the requester, including calculated performance stats.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: 'A list of trainees with their stats.' }
 */
router.route('/my-trainees').get(programUserController.getMyManagedTrainees);

export default router;