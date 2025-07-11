import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Department } from '../models/department.model.js';
import { Program } from '../models/program.model.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

// Helper to verify the requesting manager owns the program
const verifyManagerAccess = async (programId, managerId) => {
    const program = await Program.findById(programId);
    if (!program) throw new ApiError(404, "Program not found.");
    if (program.programManager.toString() !== managerId.toString()) {
        throw new ApiError(403, "Forbidden: You are not the manager of this program.");
    }
    return program;
};

export const createDepartment = asyncHandler(async (req, res) => {
    const { name, description, programId } = req.body;
    const managerId = req.user._id;

    await verifyManagerAccess(programId, managerId);
    
    const department = await Department.create({ name, description, program: programId });
    
    // Add the new department to the program's list
    await Program.findByIdAndUpdate(programId, { $push: { departments: department._id } });
    
    return res.status(201).json(new ApiResponse(201, department, "Department created successfully."));
});

export const getDepartmentsForProgram = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    // Anyone in the program can view departments
    const departments = await Department.find({ program: programId });
    return res.status(200).json(new ApiResponse(200, departments, "Departments fetched successfully."));
});

// You would add updateDepartment and deleteDepartment functions here as well