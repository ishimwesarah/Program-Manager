import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { sendRegistrationEmail } from '../../services/email.service.js';

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, role } = req.body;
    
    
    const generatedPassword = Math.random().toString(36).slice(-8);

    if (!name || !email || !role) {
        throw new ApiError(400, "Name, email, and role are required fields.");
    }

    
    if (req.user) { 
        
        if (req.user.role === 'Program Manager') {
            
            if (role !== 'Facilitator' && role !== 'Trainee') {
                throw new ApiError(403, "Forbidden: Program Managers can only register Facilitators or Trainees.");
            }
        }
       
    } else {
       
        const userCount = await User.countDocuments();
        if (userCount > 0 && role !== 'Trainee') { 
             throw new ApiError(403, "Forbidden: Only an existing admin or manager can create new users.");
        }
    }
    

    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    const user = await User.create({ name, email, password: generatedPassword, role });
    const createdUser = await User.findById(user._id).select("-password");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    sendRegistrationEmail(email, name, generatedPassword)
        .catch(err => console.error("Email sending failed after user creation:", err));

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully. Login credentials have been sent to their email.")
    );
});


const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email, isActive: true });
    if (!user) {
        throw new ApiError(404, "User does not exist or has been deactivated.");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // --- ROBUST LOGIC: UPDATE STATUS & LOGIN TIMESTAMPS ---
    const now = new Date();
    let needsSave = false; // A flag to check if we need to save the user document

    // Set firstLogin if it has never been set before
    if (!user.firstLogin) {
        user.firstLogin = now;
        needsSave = true;
    }
    
    // If the status is 'Pending', change it to 'Active'.
    // This will fix any user who logs in, regardless of their firstLogin status.
    if (user.status === 'Pending') {
        user.status = 'Active';
        needsSave = true;
    }
    
    // Always update the last login time
    user.lastLogin = now;
    needsSave = true;
    
    // Only hit the database if a change was actually made
    if (needsSave) {
        await user.save({ validateBeforeSave: false });
    }
    // --- END OF ROBUST LOGIC ---

    const accessToken = user.generateAccessToken();
    const loggedInUser = await User.findById(user._id).select("-password");

    return res.status(200).json(
        new ApiResponse(
            200,
            { user: loggedInUser, accessToken },
            "User logged in successfully"
        )
    );
});

export { registerUser, loginUser };