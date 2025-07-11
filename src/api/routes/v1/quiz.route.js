import { Router } from 'express';
import * as quizController from '../../controllers/quiz.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT);

// Facilitator creates a quiz
router.route('/').post(checkRole(['Facilitator']), quizController.createQuiz);

// Trainee gets a quiz to take it
router.route('/:quizId/attempt').get(checkRole(['Trainee']), quizController.getQuizForAttempt);

// Trainee submits their quiz answers
router.route('/:quizId/attempt').post(checkRole(['Trainee']), quizController.submitQuizAttempt);

export default router;