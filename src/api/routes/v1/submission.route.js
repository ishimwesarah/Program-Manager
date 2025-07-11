import { Router } from 'express';
import * as submissionController from '../../controllers/submission.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';

const router = Router();
router.use(verifyJWT);

// Trainee uploads a project
router.route('/')
    .post(
        checkRole(['Trainee']), 
        upload.single('projectFile'), 
        submissionController.createSubmission
    );

// Facilitator gets submissions for a course
router.route('/course/:courseId')
    .get(checkRole(['Facilitator']), submissionController.getSubmissionsForCourse);

// Facilitator reviews a submission
router.route('/:submissionId/review')
    .patch(checkRole(['Facilitator']), submissionController.reviewSubmission);

export default router;