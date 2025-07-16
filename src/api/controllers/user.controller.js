import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { Program } from '../models/program.model.js'; // Needed for getOnboardedUsers
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Attendance } from '../models/attendance.model.js';
import { Submission } from '../models/submission.model.js';
/**
 * @desc    Admin gets a list of all active users.
 * @route   GET /api/v1/users/manage
 * @access  Private (SuperAdmin)
 */
const getAllUsers = asyncHandler(async (req, res) => {
    // Get the role from the query parameters (e.g., /users/manage?role=ProgramManager)
    const { role } = req.query; 

    // Start with a base query that all requests will have
    let query = { isActive: true };

    // If a role is provided in the query, add it to our database query
    if (role) {
       
        const roleRegex = new RegExp(role.replace(' ', ''), 'i');
        query.role = { $regex: roleRegex };
    }

    const users = await User.find(query).select('-password');
    
    return res.status(200).json(new ApiResponse(200, users, "Users fetched successfully."));
});


/**
 * @desc    Admin gets a single user by their ID.
 * @route   GET /api/v1/users/manage/:id
 * @access  Private (SuperAdmin)
 */
const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // --- ROBUST DATA FETCHING ---
    // First, find the user. If they don't exist, stop immediately.
    const user = await User.findById(id).select('-password').lean();
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Now, fetch all related data. This is safer than doing it all in one Promise.all
    // when subsequent queries depend on the first one succeeding.
    const programs = await Program.find({ 
        $or: [{ trainees: id }, { facilitators: id }, { programManager: id }] 
    }).select('name').lean();

    const recentAttendance = await Attendance.find({ user: id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('program', 'name') // Populate is fine, we will check for null below
        .lean();

    // In the future, you would add Submissions here as well.
    // const recentSubmissions = await Submission.find({ trainee: id })...

    // --- SAFELY BUILD THE ACTIVITY FEED ---
    const activityFeed = [];

    // Safely map attendance records
    recentAttendance.forEach(a => {
        // This check prevents the crash. If the program was deleted, a.program will be null.
        if (a.program) { 
            activityFeed.push({
                id: a._id.toString(),
                type: 'Attendance',
                text: `Status marked as '${a.status}' for program: ${a.program.name}.`,
                timestamp: a.createdAt
            });
        }
    });
    
    // In the future, you would map submissions here and push to the same `activityFeed` array.
    
    // Sort the combined feed by date
    activityFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // --- COMBINE ALL DATA FOR THE RESPONSE ---
    const userDetails = {
        ...user,
        programs: programs,
        activityFeed: activityFeed.slice(0, 5) // Ensure we only send the top 5 overall
    };

    return res.status(200).json(new ApiResponse(200, userDetails, "User details fetched successfully."));
});


/**
 * @desc    Logged-in user gets their own profile details.
 * @route   GET /api/v1/users/me
 * @access  Private (Any logged-in user)
 */
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
      .status(200)
      .json(new ApiResponse(200, req.user, "Current user data fetched successfully"));
});

/**
 * @desc    Logged-in user updates their own account details (e.g., name).
 * @route   PATCH /api/v1/users/update-account
 * @access  Private (Any logged-in user)
 */
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name || name.trim() === "") {
        throw new ApiError(400, "Name field cannot be empty");
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { name: name.trim() } },
        { new: true }
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));
});

/**
 * @desc    Logged-in user changes their own password.
 * @route   POST /api/v1/users/change-password
 * @access  Private (Any logged-in user)
 */
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required.");
    }
    
    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: true });

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully. Please log in again."));
});

/**
 * @desc    Admin gets a list of users who have logged in at least once.
 * @route   GET /api/v1/users/manage/onboarded
 * @access  Private (SuperAdmin, ProgramManager)
 */
const getOnboardedUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, role } = req.query;

    let query = {
        firstLogin: { $exists: true, $ne: null }
    };

    if (role) {
        query.role = role;
    }
    
    if (req.user.role === 'Program Manager') {
        const programs = await Program.find({ programManager: req.user._id }).select('trainees facilitators');
        let managedUserIds = [];
        programs.forEach(p => {
            managedUserIds.push(...p.trainees, ...p.facilitators);
        });
        query._id = { $in: managedUserIds };
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { firstLogin: 'desc' },
        select: '-password -forgotPasswordToken -forgotPasswordExpiry'
    };
    
    // Manual pagination since we aren't using a plugin here
    const onboardedUsers = await User.find(query)
        .sort(options.sort)
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .select(options.select)
        .lean(); // Use .lean() for faster queries when you don't need Mongoose methods
        
    const totalDocs = await User.countDocuments(query);
    
    const responseData = {
        data: onboardedUsers,
        pagination: {
            total: totalDocs,
            limit: options.limit,
            page: options.page,
            totalPages: Math.ceil(totalDocs / options.limit)
        }
    };
    
    return res.status(200).json(new ApiResponse(200, responseData, "Onboarded users fetched successfully."));
});


// --- THIS IS THE MISSING FUNCTION ---
/**
 * @desc    Admin updates a user's status (activates/deactivates them).
 * @route   PATCH /api/v1/users/manage/:id/status
 * @access  Private (SuperAdmin)
 */
const updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        throw new ApiError(400, "The 'isActive' field must be a boolean (true or false).");
    }

    // A SuperAdmin should not be able to deactivate themselves.
    if (req.user._id.toString() === id) {
        throw new ApiError(400, "You cannot change your own active status.");
    }

    const user = await User.findByIdAndUpdate(
        id,
        { $set: { isActive } },
        { new: true }
    ).select('-password');

    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    const message = user.isActive ? "User account has been reactivated." : "User account has been deactivated.";
    return res.status(200).json(new ApiResponse(200, user, message));
});

const getUserListByRole = asyncHandler(async (req, res) => {
    const { role } = req.query;

    if (!role) {
        throw new ApiError(400, "A 'role' query parameter is required for this endpoint.");
    }

    // --- THE ROBUST FIX ---
    // Create a regular expression that is case-insensitive and ignores spaces.
    // Example: "ProgramManager" becomes a regex that matches "ProgramManager", "Program Manager", "program manager", etc.
    const roleSearchTerm = role.replace(/\s/g, ''); // Remove all spaces from the input
    const roleRegex = new RegExp(`^${roleSearchTerm}$`.replace(' ', '\\s*'), 'i');
    
    // We can't apply the regex directly to the enum field in a simple query.
    // Instead, we will fetch all users and filter them in the application code.
    // This is acceptable because the number of potential managers/admins is small.
    
    // Let's find ALL users first.
    const allUsers = await User.find({}).select('name email role status');
    
    // Now, filter them based on our flexible role check.
    const filteredUsers = allUsers.filter(user => {
        // Remove space from the user's role in the DB for comparison
        const dbRole = user.role.replace(/\s/g, '');
        // Compare them case-insensitively
        return dbRole.toLowerCase() === roleSearchTerm.toLowerCase();
    });
    // --- END OF FIX ---


    return res.status(200).json(new ApiResponse(200, filteredUsers, `User list for role '${role}' fetched successfully.`));
});

export const getArchivedUsers = asyncHandler(async (req, res) => {
    // This query explicitly looks for users where isActive is false.
    // It will bypass the default `pre('find')` middleware on the User model if you have one.
    const users = await User.find({ isActive: false }).select('-password');
    return res.status(200).json(new ApiResponse(200, users, "Archived users fetched successfully."));
});


export {
    getAllUsers, 
    getUserById,
    getCurrentUser,
    updateAccountDetails,
    changeCurrentPassword,
    getOnboardedUsers,
    updateUserStatus,
    getUserListByRole
};