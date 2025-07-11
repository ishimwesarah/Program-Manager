import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { Program } from '../models/program.model.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

// Helper function to verify if a manager has authority over a program
const verifyManagerAccess = async (programId, managerId) => {
    const program = await Program.findById(programId);
    if (!program) {
        throw new ApiError(404, "Program not found.");
    }
    if (program.programManager.toString() !== managerId.toString()) {
        throw new ApiError(403, "Forbidden: You are not the manager of this program.");
    }
    return program;
};

/**
 * @desc    Get all users (trainees and facilitators) associated with a specific program.
 * @route   GET /api/v1/program-users/program/:programId
 * @access  Private (ProgramManager)
 */
const getUsersInProgram = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const managerId = req.user._id;

    const program = await verifyManagerAccess(programId, managerId);

    // Find all users whose IDs are in the program's trainees or facilitators arrays
    const userIds = [...program.trainees, ...program.facilitators];
    const users = await User.find({ _id: { $in: userIds } }).select('-password -forgotPasswordToken -forgotPasswordExpiry');

    return res.status(200).json(new ApiResponse(200, users, "Users in program fetched successfully."));
});

/**
 * @desc    Program Manager updates a user's details (e.g., name).
 * @route   PATCH /api/v1/program-users/:userId
 * @access  Private (ProgramManager)
 */
const updateUserInProgram = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { name } = req.body;
    const managerId = req.user._id;

    // First, verify the user to be updated exists
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
        throw new ApiError(404, "User not found.");
    }
    
    // Now, verify that this user is part of ANY program managed by the requesting manager.
    // This prevents a manager from editing a user who isn't on their team.
    const program = await Program.findOne({ 
        programManager: managerId,
        $or: [{ trainees: userId }, { facilitators: userId }]
    });

    if (!program) {
        throw new ApiError(403, "Forbidden: You can only update users within your own programs.");
    }

    if (name) userToUpdate.name = name.trim();
    // Add other editable fields here if needed (but never 'role' or 'email')

    await userToUpdate.save({ validateBeforeSave: false });

    const updatedUser = await User.findById(userId).select('-password');
    return res.status(200).json(new ApiResponse(200, updatedUser, "User details updated successfully."));
});


/**
 * @desc    Remove a user (trainee or facilitator) from a specific program. This does NOT delete the user.
 * @route   PATCH /api/v1/program-users/program/:programId/remove/:userId
 * @access  Private (ProgramManager)
 */
const removeUserFromProgram = asyncHandler(async (req, res) => {
    const { programId, userId } = req.params;
    const managerId = req.user._id;

    const program = await verifyManagerAccess(programId, managerId);
    
    // Pull (remove) the userId from both the trainees and facilitators arrays
    const updatedProgram = await Program.findByIdAndUpdate(programId, 
        { 
            $pull: { 
                trainees: userId, 
                facilitators: userId 
            } 
        },
        { new: true }
    );
    
    return res.status(200).json(new ApiResponse(200, updatedProgram, "User removed from program successfully."));
});

const assignManager = asyncHandler(async (req, res) => {
    const { id } = req.params; // program id
    const { managerId } = req.body;

    // Validate that the user being assigned is actually a Program Manager
    const manager = await User.findOne({ _id: managerId, role: 'Program Manager' });
    if (!manager) {
        throw new ApiError(404, "The selected user is not a valid Program Manager.");
    }

    const program = await Program.findByIdAndUpdate(
        id,
        { programManager: managerId },
        { new: true }
    ).populate('program Manager', 'name email');
    
    if (!program) throw new ApiError(404, "Program not found.");

    return res.status(200).json(new ApiResponse(200, program, "Program Manager assigned successfully."));
});


export {
    getUsersInProgram,
    updateUserInProgram,
    removeUserFromProgram,
    assignManager
};