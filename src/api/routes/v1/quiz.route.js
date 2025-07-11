// import { Router } from 'express';
// import * as quizController from '../../controllers/quiz.controller.js';
// import { verifyJWT } from '../../middlewares/auth.middleware.js';
// import { checkRole } from '../../middlewares/role.middleware.js';

// const router = Router();
// router.use(verifyJWT);

// // Facilitator creates a quiz
// router.route('/').post(checkRole(['Facilitator']), quizController.createQuiz);

// // Trainee gets a quiz to take it
// router.route('/:quizId/attempt').get(checkRole(['Trainee']), quizController.getQuizForAttempt);

// // Trainee submits their quiz answers
// router.route('/:quizId/attempt').post(checkRole(['Trainee']), quizController.submitQuizAttempt);

// export default router;


import { Router } from 'express';
import * as quizController from '../../controllers/quiz.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT);

/**
 * @openapi
 * /quizzes:
 *   post:
 *     tags: [Quizzes]
 *     summary: Create a new quiz
 *     description: (Facilitator only) Creates a new quiz with questions and answers for a specific course.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               title: "Module 1 Pop Quiz"
 *               courseId: "60c72b2f9b1e8a001c8e4d8e"
 *               programId: "60c72b2f9b1e8a001c8e4d8c"
 *               questions:
 *                 - text: "What is Node.js?"
 *                   options: ["A browser", "A runtime environment", "A database"]
 *                   correctAnswerIndex: 1
 *     responses:
 *       201: { description: 'Quiz created successfully.' }
 */
router.route('/').post(checkRole(['Facilitator']), quizController.createQuiz);

/**
 * @openapi
 * /quizzes/{quizId}/attempt:
 *   get:
 *     tags: [Quizzes]
 *     summary: Get a quiz for attempting
 *     description: (Trainee only) Retrieves a quiz's questions and options, but hides the correct answers.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: quizId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'Quiz fetched successfully.' }
 *       404: { description: 'Quiz not found.' }
 *   post:
 *     tags: [Quizzes]
 *     summary: Submit a quiz attempt
 *     description: (Trainee only) Submits a trainee's answers for a quiz. The backend calculates the score.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: quizId, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: array
 *                 items: { type: number }
 *                 example: [1, 0, 2]
 *     responses:
 *       201: { description: 'Quiz attempt submitted and scored.' }
 */
router.route('/:quizId/attempt')
    .get(checkRole(['Trainee']), quizController.getQuizForAttempt)
    .post(checkRole(['Trainee']), quizController.submitQuizAttempt);

export default router;