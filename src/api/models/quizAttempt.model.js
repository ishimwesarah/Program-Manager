import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    trainee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [{ type: Number, required: true }], // Array of indices of selected options
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    attemptedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);