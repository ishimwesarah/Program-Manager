import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Program } from '../models/program.model.js';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

// --- HELPER FUNCTION ---
const verifyManagerAccess = async (programId, managerId) => {
    const program = await Program.findById(programId);
    if (!program) throw new ApiError(404, "Program not found.");
    
    const isManager = program.programManager.some(id => id.toString() === managerId.toString());
    
    if (!isManager) {
        throw new ApiError(403, "Forbidden: You are not a manager of this program.");
    }
    return program;
};

// --- CONTROLLER FUNCTIONS ---

const createProgram = asyncHandler(async (req, res) => {
    const { name, description, startDate, endDate } = req.body;
    const creator = req.user;

    let programStatus = 'Draft';
    let managers = [];

    if (creator.role === 'SuperAdmin') {
        programStatus = 'PendingApproval';
    } else if (creator.role === 'Program Manager') {
        managers.push(creator._id);
    }

    // Step 1: Create the program document
    const programDoc = await Program.create({
        name,
        description,
        startDate,
        endDate,
        programManagers: managers,
        status: programStatus,
    });

    // --- THIS IS THE FIX ---
    // Step 2: Fetch the newly created program again, but this time populate the manager details.
    const populatedProgram = await Program.findById(programDoc._id).populate('programManagers', 'name email');
    // --- END OF FIX ---

    const message = creator.role === 'SuperAdmin' 
        ? "Program created and is now pending your approval." 
        : "Program created in Draft state.";

    // Step 3: Return the populated program object
    return res.status(201).json(new ApiResponse(201, populatedProgram, message));
});

const requestApproval = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await verifyManagerAccess(id, req.user._id);
    const program = await Program.findByIdAndUpdate(id, { status: 'PendingApproval' }, { new: true });
     await createLog({
        user: req.user._id,
        action: 'PROGRAM_SUBMITTED_FOR_APPROVAL',
        details: `PM ${req.user.name} submitted program '${program.name}' for approval.`,
        entity: { id: program._id, model: 'Program' }
    });
    return res.status(200).json(new ApiResponse(200, program, "Program submitted for approval."));
});

const approveProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const program = await Program.findByIdAndUpdate(id, { status: 'Active', rejectionReason: null }, { new: true });
    if (!program) throw new ApiError(404, "Program not found");
     await createLog({
        user: req.user._id,
        action: 'PROGRAM_APPROVED',
        details: `SuperAdmin ${req.user.name} approved program '${program.name}'.`,
        entity: { id: program._id, model: 'Program' }
    });
    return res.status(200).json(new ApiResponse(200, program, "Program approved and is now Active."));
});

const rejectProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) throw new ApiError(400, "A reason for rejection is required.");
    const program = await Program.findByIdAndUpdate(id, { status: 'Rejected', rejectionReason: reason }, { new: true });
    if (!program) throw new ApiError(404, "Program not found");
     await createLog({
        user: req.user._id,
        action: 'PROGRAM_REJECTED',
        details: `SuperAdmin ${req.user.name} rejected program '${program.name}'. Reason: ${reason}.`,
        entity: { id: program._id, model: 'Program' }
    });
    return res.status(200).json(new ApiResponse(200, program, "Program has been rejected."));
});

const enrollTrainee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { traineeId } = req.body;
    await verifyManagerAccess(id, req.user._id);
    const trainee = await User.findById(traineeId);
    if (!trainee || trainee.role !== 'Trainee') throw new ApiError(404, "Trainee not found or user is not a trainee.");
    const program = await Program.findByIdAndUpdate(id, { $addToSet: { trainees: traineeId } }, { new: true });
    return res.status(200).json(new ApiResponse(200, program, "Trainee enrolled successfully."));
});

const enrollFacilitator = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { facilitatorId } = req.body;
    await verifyManagerAccess(id, req.user._id);
    const facilitator = await User.findById(facilitatorId);
    if (!facilitator || facilitator.role !== 'Facilitator') throw new ApiError(404, "Facilitator not found or user is not a facilitator.");
    const program = await Program.findByIdAndUpdate(id, { $addToSet: { facilitators: facilitatorId } }, { new: true });
    return res.status(200).json(new ApiResponse(200, program, "Facilitator enrolled successfully."));
});

const getAllPrograms = asyncHandler(async (req, res) => {
    let query = {};
    const { role, _id } = req.user;
    if (role === 'Program Manager') query.programManager = _id;
    else if (role === 'Facilitator') query.facilitators = _id;
    else if (role === 'Trainee') query.trainees = _id;
    
    const programs = await Program.find(query).populate('programManager', 'name email');
    return res.status(200).json(new ApiResponse(200, programs, "Programs fetched successfully."));
});

const getProgramById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const program = await Program.findById(id).populate([
        { path: 'programManager', select: 'name email' },
        { path: 'facilitators', select: 'name email' },
        { path: 'trainees', select: 'name email' }
    ]);
    if (!program) throw new ApiError(404, "Program not found");
    return res.status(200).json(new ApiResponse(200, program, "Program details fetched successfully."));
});

const updateProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, startDate, endDate } = req.body;
    if (req.user.role === 'Program Manager') await verifyManagerAccess(id, req.user._id);
    const updatedProgram = await Program.findByIdAndUpdate(id, { $set: { name, description, startDate, endDate } }, { new: true, runValidators: true });
    if (!updatedProgram) throw new ApiError(404, "Program not found");
    return res.status(200).json(new ApiResponse(200, updatedProgram, "Program updated successfully."));
});

const deleteProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const program = await Program.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!program) throw new ApiError(404, "Program not found");

     await createLog({
        user: req.user._id,
        action: 'PROGRAM_DEACTIVATED',
        details: `SuperAdmin ${req.user.name} deactivated program '${program.name}'.`,
        entity: { id: program._id, model: 'Program' }
    });
    return res.status(200).json(new ApiResponse(200, {}, "Program has been deactivated."));
});

const updateProgramManagers = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { managerId, action } = req.body;
    if (!['add', 'remove'].includes(action)) throw new ApiError(400, "Invalid action.");
    const manager = await User.findOne({ _id: managerId, role: { $regex: /program\s*manager/i } });
    if (!manager) throw new ApiError(404, "Not a valid Program Manager.");
    const operator = action === 'add' ? '$addToSet' : '$pull';
    const program = await Program.findByIdAndUpdate(id, { [operator]: { programManager: managerId } }, { new: true }).populate('programManager', 'name email');
    if (!program) throw new ApiError(404, "Program not found.");
    const message = `Program Manager ${action === 'add' ? 'added' : 'removed'}.`;
    return res.status(200).json(new ApiResponse(200, program, message));
});

const generateProgramReport = asyncHandler(async (req, res) => {
    const { generateProgramReportPDF } = await import('../../services/pdf.service.js');
    const { Attendance } = await import('../models/attendance.model.js');
    const { id } = req.params;
    const program = await Program.findById(id).populate('programManager', 'name');
    if (!program) throw new ApiError(404, "Program not found");
    const attendanceRecords = await Attendance.find({ program: id }).populate('user', 'name');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=program-report-${id}.pdf`);
    generateProgramReportPDF(program, attendanceRecords, res);
});

export const assignManager = asyncHandler(async (req, res) => {
    const { id } = req.params; // program id
    const { managerId } = req.body;

    // Handle the case where the manager is being unassigned
    if (!managerId || managerId === '') {
        const program = await Program.findByIdAndUpdate(
            id,
            { $unset: { programManager: "" } }, // Use $unset to completely remove the field
            { new: true }
        );
        if (!program) throw new ApiError(404, "Program not found.");
        return res.status(200).json(new ApiResponse(200, program, "Program Manager unassigned successfully."));
    }

    // --- THE ROBUST FIX ---
    // Validate that the user being assigned is actually a Program Manager, handling the space.
    const manager = await User.findOne({ 
        _id: managerId, 
        role: 'Program Manager' // Use the exact string with the space
    });
    // --- END OF FIX ---

    if (!manager) {
        throw new ApiError(404, "The selected user is not a valid Program Manager.");
    }

    const program = await Program.findByIdAndUpdate(
        id,
        { programManager: managerId }, // Assign to the singular 'programManager' field
        { new: true }
    ).populate('programManager', 'name email'); // Populate the singular field
    
    if (!program) throw new ApiError(404, "Program not found.");

    return res.status(200).json(new ApiResponse(200, program, "Program Manager assigned successfully."));
});

function getWeekdayCount(startDate, endDate) {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    while (curDate <= endDate) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) count++; // 0=Sunday, 6=Saturday
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
}


/**
 * @desc    Get detailed statistics for a single program, including attendance percentage.
 * @route   GET /api/v1/programs/{id}/stats
 * @access  Private (SuperAdmin, ProgramManager)
 */
export const getProgramStats = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const program = await Program.findById(id);
    if (!program) throw new ApiError(404, "Program not found.");

    // --- ATTENDANCE CALCULATION ---
    const attendanceRecords = await Attendance.find({ program: id });

    const presentCount = attendanceRecords.filter(a => a.status === 'Present').length;
    const excusedCount = attendanceRecords.filter(a => a.status === 'Excused').length;
    
    const today = new Date();
    const programStartDate = new Date(program.startDate);
    
    // Only count days from the start of the program up to today.
    const effectiveEndDate = today < new Date(program.endDate) ? today : new Date(program.endDate);
    
    let totalEligibleDays = 0;
    if (programStartDate <= effectiveEndDate) {
        totalEligibleDays = getWeekdayCount(programStartDate, effectiveEndDate);
    }
    
    const totalRequiredDays = totalEligibleDays - excusedCount;
    
    let overallAttendancePercentage = 0;
    if (totalRequiredDays > 0) {
        overallAttendancePercentage = (presentCount / totalRequiredDays) * 100;
    }
    // --- END OF CALCULATION ---

    const stats = {
        totalEnrolled: program.trainees.length,
        totalFacilitators: program.facilitators.length,
        overallAttendancePercentage: Math.round(overallAttendancePercentage * 100) / 100, // Round to 2 decimal places
        totalPresentDays: presentCount,
        totalExcusedDays: excusedCount,
        totalEligibleDays: totalEligibleDays,
    };

    return res.status(200).json(new ApiResponse(200, stats, "Program statistics fetched successfully."));
});



export {
    createProgram,
    requestApproval,
    approveProgram,
    rejectProgram,
    enrollTrainee,
    enrollFacilitator,
    getAllPrograms,
    getProgramById,
    updateProgram,
    deleteProgram,
    updateProgramManagers,
    generateProgramReport
};