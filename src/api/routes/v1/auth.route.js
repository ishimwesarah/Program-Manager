import { Router } from 'express';
import { loginUser, registerUser } from '../../controllers/auth.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Allows a logged-in SuperAdmin or Program Manager to create a new user. The password is auto-generated and sent via email. Program Managers can only create Trainees and Facilitators.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, role]
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'New Trainee'
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'trainee.new@klab.com'
 *               role:
 *                 type: string
 *                 enum: [Trainee, Facilitator, "Program Manager", SuperAdmin]
 *                 example: 'Trainee'
 *     responses:
 *       201:
 *         description: User created successfully.
 *       400:
 *         description: Bad request, missing required fields.
 *       403:
 *         description: Forbidden, user does not have permission to register this role.
 *       409:
 *         description: Conflict, a user with this email already exists.
 */
router.route('/register').post(verifyJWT, checkRole(['SuperAdmin', 'Program Manager']), registerUser);


/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Log in a user
 *     description: Authenticates a user with their email and password, returning a JWT access token and user details. On first login, the user's status is changed from 'Pending' to 'Active'.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'superadmin@klab.com'
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 'password123'
 *     responses:
 *       200:
 *         description: Successful login, returns user object and access token.
 *       401:
 *         description: Invalid credentials.
 *       404:
 *         description: User not found or is deactivated.
 */
router.route('/login').post(loginUser);

export default router;