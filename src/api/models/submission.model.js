import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    trainee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: true }, // URL to the uploaded project file
    submittedAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['Submitted', 'Reviewed', 'NeedsRevision'],
        default: 'Submitted'
    },
    feedback: { type: String },
    grade: { type: String }
}, { timestamps: true });

export const Submission = mongoose.model('Submission', submissionSchema);