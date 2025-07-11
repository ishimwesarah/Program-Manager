import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const attendanceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD format for easy querying
    checkInTime: { type: Date }, // No longer required on creation for excused absences
    checkOutTime: { type: Date },
    method: { type: String, enum: ['Geolocation', 'QRCode', 'Manual'], required: true },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Excused'],
        required: true,
    },
    reason: { type: String }, // Reason for excused absence
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Who marked this?
}, { timestamps: true });

// Ensure a user can only have one record per day for a program
attendanceSchema.index({ user: 1, program: 1, date: 1 }, { unique: true });
attendanceSchema.plugin(mongoosePaginate); 

export const Attendance = mongoose.model('Attendance', attendanceSchema);