import { Router } from 'express';
import * as certController from '../../controllers/certificate.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT);

// Program Manager issues a certificate
router.route('/issue').post(checkRole(['Program Manager']), certController.issueCertificate);

// Trainee gets their certificates
router.route('/my-certificates').get(checkRole(['Trainee']), certController.getMyCertificates);

export default router;