import { Router } from 'express';
import * as courseController from '../../controllers/course.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';

const router = Router();
router.use(verifyJWT);

/**
 * @openapi
 * /courses:
 *   post:
 *     tags: [Courses]
 *     summary: Create a new course
 *     description: (Facilitator only) Creates a new course associated with a program and uploads its content document. The course starts in 'PendingApproval' status.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, example: "Module 1: Introduction to Node.js" }
 *               description: { type: string, example: "Covering the basics of Node.js, NPM, and async programming." }
 *               programId: { type: string }
 *               courseDocument:
 *                 type: string
 *                 format: binary
 *                 description: The PDF or document file for the course content.
 *     responses:
 *       201: { description: 'Course created and pending approval.' }
 *       400: { description: 'Bad request, document is required.' }
 */
router.route('/').post(
    checkRole(['Facilitator']), 
    upload.single('courseDocument'), 
    courseController.createCourse
);

/**
 * @openapi
 * /courses/{courseId}/approve:
 *   patch:
 *     tags: [Courses]
 *     summary: Approve a course
 *     description: (Program Manager only) Approves a course, changing its status from 'PendingApproval' to 'Approved', making it visible to trainees.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: courseId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'Course has been approved.' }
 *       404: { description: 'Course not found.' }
 */
router.route('/:courseId/approve').patch(
    checkRole(['Program Manager']), 
    courseController.approveCourse
);

/**
 * @openapi
 * /courses/program/{programId}:
 *   get:
 *     tags: [Courses]
 *     summary: Get all courses for a specific program
 *     description: Retrieves a list of all approved courses for a given program. Accessible to any user enrolled in the program.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: programId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'A list of courses.' }
 */
router.route('/program/:programId').get(courseController.getCoursesForProgram);

/**
 * @openapi
 * /courses/{courseId}/request-approval:
 *   patch:
 *     tags: [Courses]
 *     summary: Request course approval
 *     description: (Facilitator only) Submits a 'Draft' course for review, changing its status to 'PendingApproval'.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: courseId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'Course submitted successfully.' }
 *       403: { description: 'Forbidden, user is not the facilitator of this course.' }
 *       404: { description: 'Course not found.' }
 */
router.route('/:courseId/request-approval').patch(
    checkRole(['Facilitator']),
    courseController.requestCourseApproval
);

export default router;