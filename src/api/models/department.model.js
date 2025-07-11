import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    // You could add leads, members, etc. here later
}, { timestamps: true });

export const Department = mongoose.model('Department', departmentSchema);