import { Router } from 'express';
import * as attendanceController from '../../controllers/attendance.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT);

/**
 * @openapi
 * /attendance/mark:
 *   post:
 *     tags: [Attendance]
 *     summary: Mark attendance (check-in/check-out)
 *     description: A user (Trainee/Facilitator) marks their attendance. First call of the day is check-in, second is check-out.
 *     security: { bearerAuth: [] }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               programId: { type: string }
 *               method: { type: string, enum: [QRCode, Geolocation] }
 *               data: { type: object, example: { qrCodeData: "...", latitude: "..." } }
 *     responses:
 *       200: { description: 'Check-out successful.' }
 *       201: { description: 'Check-in successful.' }
 */
router.route('/mark').post(checkRole(['Trainee', 'Facilitator']), attendanceController.markAttendance);

/**
 * @openapi
 * /attendance/qr-code/program/{programId}:
 *   get:
 *     tags: [Attendance]
 *     summary: Generate a session QR code
 *     description: (Facilitator or Program Manager) Generates a time-sensitive QR code image for a specific program that trainees can scan.
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: programId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'Returns a base64 encoded QR code image.' }
 */
router.route('/qr-code/program/:programId').get(checkRole(['Facilitator', 'Program Manager']), attendanceController.getSessionQRCode);

/**
 * @openapi
 * /attendance/excuse:
 *   post:
 *     tags: [Attendance]
 *     summary: Mark an excused absence
 *     description: (Program Manager or Facilitator) Manually creates an 'Excused' attendance record for a user on a specific date.
 *     security: { bearerAuth: [] }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               programId: { type: string }
 *               traineeId: { type: string }
 *               date: { type: string, format: 'date', example: '2025-10-20' }
 *               reason: { type: string, example: 'Doctor appointment' }
 *     responses:
 *       201: { description: 'Absence marked as excused.' }
 */
router.route('/excuse').post(checkRole(['Program Manager', 'Facilitator']), attendanceController.markExcusedAbsence);

/**
 * @openapi
 * /attendance/report/program/{programId}:
 *   get:
 *     tags: [Attendance]
 *     summary: Get a paginated attendance report
 *     description: Retrieves attendance records for a given program within a specific date range.
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: programId, in: path, required: true, schema: { type: string } }
 *       - { name: startDate, in: query, required: true, schema: { type: string, format: 'date' } }
 *       - { name: endDate, in: query, required: true, schema: { type: string, format: 'date' } }
 *       - { name: page, in: query, schema: { type: integer, default: 1 } }
 *       - { name: limit, in: query, schema: { type: integer, default: 20 } }
 *     responses:
 *       200: { description: 'A paginated list of attendance records.' }
 */
router.route('/report/program/:programId').get(checkRole(['SuperAdmin', 'Program Manager', 'Facilitator', 'Trainee']), attendanceController.getAttendanceReport);

export default router;