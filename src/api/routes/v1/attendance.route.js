import { Router } from 'express';
import * as attendanceController from '../../controllers/attendance.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();

// All attendance routes require a user to be logged in.
router.use(verifyJWT);

// --- Routes for taking attendance actions ---
router.route('/mark').post(
    checkRole(['Trainee', 'Facilitator']),
    attendanceController.markAttendance
);

router.route('/qr-code/program/:programId').get(
    checkRole(['Facilitator', 'Program Manager']),
    attendanceController.getSessionQRCode
);

router.route('/excuse').post(
    checkRole(['Program Manager', 'Facilitator']),
    attendanceController.markExcusedAbsence
);

// --- Route for fetching attendance reports ---
router.route('/report/program/:programId').get(
    checkRole(['SuperAdmin', 'Program Manager', 'Facilitator', 'Trainee']),
    attendanceController.getAttendanceReport // This is the function that was likely causing the error
);

export default router;