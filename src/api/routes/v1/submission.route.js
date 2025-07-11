import { Router } from 'express';
import * as submissionController from '../../controllers/submission.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';

const router = Router();
router.use(verifyJWT);

/**
 * @openapi
 * /submissions:
 *   post:
 *     tags: [Submissions]
 *     summary: Submit a project file
 *     description: (Trainee only) Uploads a project file for a specific course within a program.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               courseId: { type: string }
 *               programId: { type: string }
 *               projectFile:
 *                 type: string
 *                 format: binary
 *                 description: The project file (e.g., .zip, .pdf).
 *     responses:
 *       201: { description: 'Project submitted successfully.' }
 */
router.route('/').post(
    checkRole(['Trainee']), 
    upload.single('projectFile'), 
    submissionController.createSubmission
);

/**
 * @openapi
 * /submissions/course/{courseId}:
 *   get:
 *     tags: [Submissions]
 *     summary: Get all submissions for a course
 *     description: (Facilitator only) Retrieves all project submissions for a specific course they manage.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: courseId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'A list of submissions.' }
 */
router.route('/course/:courseId').get(
    checkRole(['Facilitator']), 
    submissionController.getSubmissionsForCourse
);

/**
 * @openapi
 * /submissions/{submissionId}/review:
 *   patch:
 *     tags: [Submissions]
 *     summary: Review a submission
 *     description: (Facilitator only) Adds a grade, feedback, and status to a trainee's submission.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: submissionId, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [Reviewed, NeedsRevision], example: "Reviewed" }
 *               feedback: { type: string, example: "Excellent work, but please add more comments." }
 *               grade: { type: string, example: "A-" }
 *     responses:
 *       200: { description: 'Submission reviewed successfully.' }
 *       404: { description: 'Submission not found.' }
 */
router.route('/:submissionId/review').patch(
    checkRole(['Facilitator']), 
    submissionController.reviewSubmission
);

export default router;