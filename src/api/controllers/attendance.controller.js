import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Attendance } from '../models/attendance.model.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { generateNewQRCode, verifyQRCode } from '../../services/qr.service.js';

const markAttendance = asyncHandler(async (req, res) => {
    const { programId, method, data } = req.body;
    const userId = req.user._id;
    const today = new Date().toISOString().split('T')[0];

    
    let isValid = false;
    if (method === 'QRCode') {
        const verificationResult = verifyQRCode(data.qrCodeData); 
        if (verificationResult && verificationResult.programId === programId) isValid = true;
    } else if (method === 'Geolocation') {
        const { latitude, longitude } = data;
        if (latitude && longitude) isValid = true;
    }
    if (!isValid) throw new ApiError(400, "Invalid or expired attendance data.");
    

    const existingRecord = await Attendance.findOne({ user: userId, program: programId, date: today });

    if (!existingRecord) {
        
        const attendanceRecord = await Attendance.create({
            user: userId,
            program: programId,
            date: today,
            checkInTime: new Date(),
            method,
            status: 'Present',
            markedBy: userId
        });
        return res.status(201).json(new ApiResponse(201, attendanceRecord, "Check-in successful."));
    } else {
       
        if (existingRecord.checkOutTime) {
            throw new ApiError(400, "You have already checked out for the day.");
        }
        if (existingRecord.status !== 'Present') {
            throw new ApiError(400, "Cannot check-out for a non-present or excused record.");
        }
        existingRecord.checkOutTime = new Date();
        await existingRecord.save();
        return res.status(200).json(new ApiResponse(200, existingRecord, "Check-out successful."));
    }
});


const markExcusedAbsence = asyncHandler(async (req, res) => {
    const { programId, traineeId, date, reason } = req.body;
    if (!reason || reason.trim() === "") {
        throw new ApiError(400, "A reason for the excused absence is required.");
    }
    if (!date || !traineeId || !programId) {
        throw new ApiError(400, "Program ID, Trainee ID, and Date are required.");
    }
    
    const existingRecord = await Attendance.findOne({ user: traineeId, program: programId, date });
    if (existingRecord) {
        throw new ApiError(409, `An attendance record for this user on ${date} already exists.`);
    }
    
    const excusedRecord = await Attendance.create({
        user: traineeId,
        program: programId,
        date: date,
        status: 'Excused',
        method: 'Manual',
        reason: reason,
        markedBy: req.user._id 
    });
    
    return res.status(201).json(new ApiResponse(201, excusedRecord, "Absence marked as excused."));
});


const getAttendanceReport = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const { startDate, endDate, traineeId, page = 1, limit = 20 } = req.query;

    if (!startDate || !endDate) {
        throw new ApiError(400, "Both 'startDate' and 'endDate' (YYYY-MM-DD) are required.");
    }

    let attendanceQuery = {
        program: programId,
        date: { $gte: startDate, $lte: endDate }
    };

    const requestingUser = req.user;
    
    if (requestingUser.role === 'Trainee') {
        attendanceQuery.user = requestingUser._id;
    } else if (traineeId) {
        
        attendanceQuery.user = traineeId;
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        populate: [{ path: 'user', select: 'name email' }, { path: 'markedBy', select: 'name' }],
        sort: { date: 'desc', checkInTime: 'desc' },
        lean: true
    };
    
    const result = await Attendance.paginate(attendanceQuery, options);

    const responseData = {
        reportRange: { from: startDate, to: endDate },
        data: result.docs,
        pagination: {
            total: result.totalDocs,
            limit: result.limit,
            page: result.page,
            totalPages: result.totalPages,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage
        }
    };
    
    return res.status(200).json(new ApiResponse(200, responseData, "Attendance report fetched successfully."));
});


const getSessionQRCode = asyncHandler(async (req, res) => {
    const { programId } = req.params;
   
    
    const qrCodeImage = await generateNewQRCode(programId);
    return res.status(200).json(new ApiResponse(200, { qrCodeImage }, "QR Code generated for session."));
});
export { markAttendance, getSessionQRCode, getAttendanceReport, markExcusedAbsence };