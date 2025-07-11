import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; // You'll need to install uuid: npm install uuid

const certificateSchema = new mongoose.Schema({
    trainee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    issueDate: { type: Date, default: Date.now },
    certificateId: {
        type: String,
        default: () => uuidv4(),
        unique: true
    }
}, { timestamps: true });

export const Certificate = mongoose.model('Certificate', certificateSchema);