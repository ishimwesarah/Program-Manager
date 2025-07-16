import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Course } from '../models/course.model.js';
import { Program } from '../models/program.model.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

const createCourse = asyncHandler(async (req, res) => {
    const { title, description, programId } = req.body;
    const facilitatorId = req.user._id;

    if (!req.file) {
        throw new ApiError(400, "Course content document is required.");
    }

    
   
    const contentUrl = req.file.path;

    const course = await Course.create({
        title,
        description,
        program: programId,
        facilitator: facilitatorId,
        contentUrl,
        status: 'PendingApproval'
    });

    return res.status(201).json(new ApiResponse(201, course, "Course created and pending approval."));
});

const approveCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const course = await Course.findByIdAndUpdate(courseId, { status: 'Approved' }, { new: true });
    
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    return res.status(200).json(new ApiResponse(200, course, "Course has been approved."));
});

const getCoursesForProgram = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const courses = await Course.find({ program: programId }).populate('facilitator', 'name');
    return res.status(200).json(new ApiResponse(200, courses, "Courses fetched successfully."));
});

const verifyFacilitatorAccess = async (courseId, facilitatorId) => {
    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, "Course not found.");
    if (course.facilitator.toString() !== facilitatorId.toString()) {
        throw new ApiError(403, "Forbidden: You are not the facilitator of this course.");
    }
    return course;
};


/**
 * @desc    A Facilitator requests approval for a course they created.
 * @route   PATCH /api/v1/courses/{courseId}/request-approval
 * @access  Private (Facilitator)
 */
export const requestCourseApproval = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    
    // First, verify the facilitator owns this course
    await verifyFacilitatorAccess(courseId, req.user._id);

    // Update the status from 'Draft' to 'PendingApproval'
    const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        { status: 'PendingApproval' },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, updatedCourse, "Course submitted for approval."));
});


export { createCourse, approveCourse, getCoursesForProgram };