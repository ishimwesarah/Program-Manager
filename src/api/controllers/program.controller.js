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

    let programStatus;
    let managers = [];

    // --- NEW LOGIC FOR SELF-APPROVAL ---
    if (creator.role === 'SuperAdmin') {
        // A program created by an admin is immediately ready for approval.
        programStatus = 'PendingApproval';
    } 
    else if (creator.role === 'Program Manager') {
        programStatus = 'Draft';
        managers.push(creator._id);
    }
    // --- END NEW LOGIC ---

    const program = await Program.create({
        name,
        description,
        startDate,
        endDate,
        programManagers: managers,
        status: programStatus,
    });
    
    const message = creator.role === 'SuperAdmin' 
        ? "Program created and is now pending your approval." 
        : "Program created in Draft state.";

    return res.status(201).json(new ApiResponse(201, program, message));
});

const requestApproval = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await verifyManagerAccess(id, req.user._id);
    const program = await Program.findByIdAndUpdate(id, { status: 'PendingApproval' }, { new: true });
    return res.status(200).json(new ApiResponse(200, program, "Program submitted for approval."));
});

const approveProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const program = await Program.findByIdAndUpdate(id, { status: 'Active', rejectionReason: null }, { new: true });
    if (!program) throw new ApiError(404, "Program not found");
    return res.status(200).json(new ApiResponse(200, program, "Program approved and is now Active."));
});

const rejectProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) throw new ApiError(400, "A reason for rejection is required.");
    const program = await Program.findByIdAndUpdate(id, { status: 'Rejected', rejectionReason: reason }, { new: true });
    if (!program) throw new ApiError(404, "Program not found");
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



// --- THE EXPORT BLOCK ---
// This block makes all the functions above available to be imported in other files.
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