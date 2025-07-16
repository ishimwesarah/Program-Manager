import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const logSchema = new mongoose.Schema({

    user: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    },
    
    action: {
        type: String,
        required: true,
     
        enum: [
             'USER_LOGIN',
            'USER_CREATED',
            // User Self-Service
            'USER_UPDATED_SELF',
            'USER_CHANGED_PASSWORD',
            // Admin User Management
            'ADMIN_UPDATED_USER_STATUS',
            'ADMIN_ASSIGNED_MANAGER_TO_USER',
            // Program Lifecycle
            'PROGRAM_CREATED',
            'PROGRAM_SUBMITTED_FOR_APPROVAL',
            'PROGRAM_APPROVED',

'PROGRAM_REJECTED',
            'PROGRAM_DEACTIVATED',
            // Course Lifecycle (add these as you build them)
            'COURSE_CREATED',
            'COURSE_SUBMITTED_FOR_APPROVAL',
            'COURSE_APPROVED',
            // Attendance
            'ATTENDANCE_MARKED',
            'ATTENDANCE_EXCUSED'
        ]
    },
    // A human-readable description of the event.
    details: {
        type: String,
        required: true
    },
    // Optional reference to a specific document (e.g., the program that was created)
    entity: {
        id: mongoose.Schema.Types.ObjectId,
        model: String // e.g., 'Program' or 'User'
    }
}, { timestamps: true });

logSchema.plugin(mongoosePaginate);

export const Log = mongoose.model('Log', logSchema);