import { Router } from 'express';
import * as courseController from '../../controllers/course.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';

const router = Router();
router.use(verifyJWT);

// Facilitator creates a course (uploads content)
router.route('/')
    .post(
        checkRole(['Facilitator']), 
        upload.single('courseDocument'), 
        courseController.createCourse
    );

// Program Manager approves a course
router.route('/:courseId/approve')
    .patch(checkRole(['Program Manager']), courseController.approveCourse);

// Get all courses for a specific program (accessible to all roles in the program)
router.route('/program/:programId').get(courseController.getCoursesForProgram);


export default router;