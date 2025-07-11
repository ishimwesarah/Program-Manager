import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // For forgot password token

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['Trainee', 'Facilitator', 'Program Manager', 'SuperAdmin'],
        required: true,
    },
     status: {
        type: String,
        enum: ['Pending', 'Active'],
        default: 'Pending' 
    },
    isActive: { type: Boolean, default: true },
    firstLogin: { type: Date }, // Will be set once on the very first login
    lastLogin: { type: Date },
    // Fields for password reset
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { _id: this._id, email: this.email, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY }
    );
};

// Method to generate a password reset token
userSchema.methods.getResetPasswordToken = function() {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to forgotPasswordToken field
    this.forgotPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set token expiry (e.g., 10 minutes)
    this.forgotPasswordExpiry = Date.now() + 10 * 60 * 1000;

    return resetToken; // Return the unhashed token to be sent via email
}

export const User = mongoose.model('User', userSchema);