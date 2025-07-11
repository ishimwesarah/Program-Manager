import { Router } from 'express';
import * as userController from '../../controllers/user.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [User (Self-Service)]
 *     summary: Get current user's profile
 *     description: Retrieves the profile details of the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile.
 *       401:
 *         description: Unauthorized, token is missing or invalid.
 */
router.route('/me').get(verifyJWT, userController.getCurrentUser);

/**
 * @openapi
 * /users/update-account:
 *   patch:
 *     tags: [User (Self-Service)]
 *     summary: Update own account details
 *     description: Allows the currently authenticated user to update their own profile information, such as their name.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: { name: { type: string, example: 'John Doe Updated' } }
 *     responses:
 *       200:
 *         description: Account updated successfully.
 */
router.route('/update-account').patch(verifyJWT, userController.updateAccountDetails);

/**
 * @openapi
 * /users/change-password:
 *   post:
 *     tags: [User (Self-Service)]
 *     summary: Change own password
 *     description: Allows the currently authenticated user to change their password by providing their old and new passwords.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *       401:
 *         description: Invalid old password.
 */
router.route('/change-password').post(verifyJWT, userController.changeCurrentPassword);


// --- Admin & Manager Routes ---
const manageRouter = Router();
manageRouter.use(verifyJWT);

/**
 * @openapi
 * /users/manage:
 *   get:
 *     tags: [User Management (Admin)]
 *     summary: Get all active users
 *     description: (SuperAdmin only) Retrieves a list of all active users in the system.
 *     security: { bearerAuth: [] }
 *     responses:
 *       200: { description: 'A list of users.' }
 */
manageRouter.route('/').get(checkRole(['SuperAdmin']), userController.getAllUsers);

/**
 * @openapi
 * /users/manage/list-by-role:
 *   get:
 *     tags: [User Management (Admin)]
 *     summary: Get all users of a specific role
 *     description: (SuperAdmin only) Retrieves a list of ALL users (including pending/inactive) filtered by a specific role. Useful for populating dropdowns.
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: role, in: query, required: true, schema: { type: string, example: 'Program Manager' } }
 *     responses:
 *       200: { description: 'A list of users matching the role.' }
 */
manageRouter.route('/list-by-role').get(checkRole(['SuperAdmin']), userController.getUserListByRole);

/**
 * @openapi
 * /users/manage/onboarded:
 *   get:
 *     tags: [User Management (Admin)]
 *     summary: Get onboarded users
 *     description: (SuperAdmin & Program Manager) Retrieves a paginated list of users who have logged in at least once.
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: limit, in: query, schema: { type: integer, default: 10 } }
 *       - { name: page, in: query, schema: { type: integer, default: 1 } }
 *     responses:
 *       200: { description: 'A paginated list of onboarded users.' }
 */
manageRouter.route('/onboarded').get(checkRole(['SuperAdmin', 'Program Manager']), userController.getOnboardedUsers);

/**
 * @openapi
 * /users/manage/{id}:
 *   get:
 *     tags: [User Management (Admin)]
 *     summary: Get a single user by ID
 *     description: (SuperAdmin only) Retrieves the full details of a single user, including their assigned programs and recent activity feed.
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, description: 'The ID of the user.' }
 *     responses:
 *       200: { description: 'User details fetched successfully.' }
 *       404: { description: 'User not found.' }
 */
manageRouter.route('/:id').get(checkRole(['SuperAdmin']), userController.getUserById);

/**
 * @openapi
 * /users/manage/{id}/status:
 *   patch:
 *     tags: [User Management (Admin)]
 *     summary: Activate or deactivate a user
 *     description: (SuperAdmin only) Updates a user's `isActive` status. Setting to `false` prevents them from logging in.
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: { isActive: { type: boolean, example: false } }
 *     responses:
 *       200: { description: 'User status updated successfully.' }
 */
manageRouter.route('/:id/status').patch(checkRole(['SuperAdmin']), userController.updateUserStatus);

// /**
//  * @openapi
//  * /users/manage/{id}/assign-manager:
//  *   patch:
//  *     tags: [User Management (Admin)]
//  *     summary: Assign a manager to a user
//  *     description: (SuperAdmin only) Assigns a specific Program Manager to a user (e.g., a Trainee or Facilitator).
//  *     security: { bearerAuth: [] }
//  *     parameters:
//  *       - { name: id, in: path, required: true, schema: { type: string, description: "ID of the user to be managed" } }
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               managerId:
//  *                 type: string
//  *                 description: "ID of the Program Manager to assign. Send empty string to unassign."
//  *     responses:
//  *       200: { description: 'Manager assigned successfully.' }
//  */
// manageRouter.route('/:id/assign-manager').patch(checkRole(['SuperAdmin']), userController.assignManagerToUser);

router.use('/manage', manageRouter);

export default router;