import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { Program } from '../models/program.model.js';
import { Attendance } from '../models/attendance.model.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Log } from '../models/log.model.js';

// Helper function to count weekdays in a given month and year
function getWeekdaysInMonth(year, month) {
    const date = new Date(year, month, 1);
    let count = 0;
    while (date.getMonth() === month) {
        const day = date.getDay();
        if (day !== 0 && day !== 6) { // 0=Sunday, 6=Saturday
            count++;
        }
        date.setDate(date.getDate() + 1);
    }
    return count;
}

/**
 * @desc    Get a monthly attendance report for a single trainee.
 * @route   GET /api/v1/reports/trainee/{traineeId}/attendance
 * @access  Private (SuperAdmin, ProgramManager)
 */
export const getTraineeMonthlyAttendance = asyncHandler(async (req, res) => {
    const { traineeId } = req.params;
    const { month, year } = req.query; // e.g., month=7, year=2025

    if (!month || !year) {
        throw new ApiError(400, "Both 'month' (1-12) and 'year' are required query parameters.");
    }
    
    // JS months are 0-11, so we adjust.
    const monthIndex = parseInt(month, 10) - 1;
    const yearInt = parseInt(year, 10);
    
    // Define the start and end of the requested month
    const startDate = new Date(yearInt, monthIndex, 1);
    const endDate = new Date(yearInt, monthIndex + 1, 0);

    // Fetch all attendance records for this user within the month
    const attendanceRecords = await Attendance.find({
        user: traineeId,
        createdAt: { $gte: startDate, $lte: endDate }
    });

    const presentCount = attendanceRecords.filter(a => a.status === 'Present').length;
    const excusedCount = attendanceRecords.filter(a => a.status === 'Excused').length;
    
    const totalWeekdays = getWeekdaysInMonth(yearInt, monthIndex);
    const totalRequiredDays = totalWeekdays - excusedCount;
    
    let attendancePercentage = 0;
    if (totalRequiredDays > 0) {
        attendancePercentage = Math.round((presentCount / totalRequiredDays) * 100);
    }

    const shouldBeDismissed = attendancePercentage < 50;

    const report = {
        month: startDate.toLocaleString('default', { month: 'long' }),
        year: yearInt,
        presentCount,
        excusedCount,
        totalWeekdays,
        attendancePercentage,
        dismissalStatus: {
            isBelowThreshold: shouldBeDismissed,
            message: shouldBeDismissed ? "Attendance is below 50%. Dismissal recommended." : "Attendance is satisfactory."
        }
    };

    return res.status(200).json(new ApiResponse(200, report, "Trainee monthly attendance report generated."));
});

export const getMasterLog = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, action, userId, startDate, endDate } = req.query;
    
    let query = {};
    if (action) query.action = action;
    if (userId) query.user = userId;
    if (startDate && endDate) {
        query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 },
        populate: { path: 'user', select: 'name role' } // Populate user details
    };

    const logs = await Log.paginate(query, options);

    return res.status(200).json(new ApiResponse(200, logs, "Master log fetched successfully."));
});