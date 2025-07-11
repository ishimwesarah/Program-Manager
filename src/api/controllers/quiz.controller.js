import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Quiz } from '../models/quiz.model.js';
import { QuizAttempt } from '../models/quizAttempt.model.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

// Facilitator creates a quiz
const createQuiz = asyncHandler(async (req, res) => {
    const { title, courseId, programId, questions } = req.body;
    const quiz = await Quiz.create({
        title,
        course: courseId,
        program: programId,
        questions,
        createdBy: req.user._id,
    });
    return res.status(201).json(new ApiResponse(201, quiz, "Quiz created successfully."));
});

// Trainee gets a quiz to attempt (answers are hidden)
const getQuizForAttempt = asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId).select('-questions.correctAnswerIndex');
    if (!quiz) {
        throw new ApiError(404, "Quiz not found.");
    }
    return res.status(200).json(new ApiResponse(200, quiz, "Quiz fetched."));
});

// Trainee submits their answers
const submitQuizAttempt = asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const { answers } = req.body; // Array of selected option indices e.g., [0, 2, 1, ...]
    const traineeId = req.user._id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        throw new ApiError(404, "Quiz not found.");
    }

    let score = 0;
    quiz.questions.forEach((question, index) => {
        if (question.correctAnswerIndex === answers[index]) {
            score++;
        }
    });

    const attempt = await QuizAttempt.create({
        quiz: quizId,
        trainee: traineeId,
        answers,
        score,
        totalQuestions: quiz.questions.length,
    });

    return res.status(201).json(new ApiResponse(201, attempt, "Quiz submitted successfully. Your score has been recorded."));
});

export { createQuiz, getQuizForAttempt, submitQuizAttempt };