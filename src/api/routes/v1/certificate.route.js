import { Router } from 'express';
import * as certController from '../../controllers/certificate.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT);

/**
 * @openapi
 * /certificates/issue:
 *   post:
 *     tags: [Certificates]
 *     summary: Issue a new certificate
 *     description: (Program Manager only) Issues a certificate of completion to a trainee for a specific program.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               programId: { type: string }
 *               traineeId: { type: string }
 *     responses:
 *       201: { description: 'Certificate issued successfully.' }
 *       409: { description: 'Certificate already exists for this user and program.' }
 */
router.route('/issue').post(checkRole(['Program Manager']), certController.issueCertificate);

/**
 * @openapi
 * /certificates/my-certificates:
 *   get:
 *     tags: [Certificates]
 *     summary: Get my certificates
 *     description: (Trainee only) Retrieves a list of all certificates earned by the currently logged-in trainee.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: 'A list of earned certificates.' }
 */
router.route('/my-certificates').get(checkRole(['Trainee']), certController.getMyCertificates);

export default router;