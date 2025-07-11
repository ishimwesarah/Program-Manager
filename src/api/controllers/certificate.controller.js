import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Certificate } from '../models/certificate.model.js';
import { ApiResponse } from '../../utils/ApiResponse.js';


const issueCertificate = asyncHandler(async (req, res) => {
    const { programId, traineeId } = req.body;

    const existingCert = await Certificate.findOne({ program: programId, trainee: traineeId });
    if (existingCert) {
        throw new ApiError(409, "A certificate has already been issued to this trainee for this program.");
    }

    const certificate = await Certificate.create({
        program: programId,
        trainee: traineeId,
    });

    return res.status(201).json(new ApiResponse(201, certificate, "Certificate issued successfully."));
});


const getMyCertificates = asyncHandler(async (req, res) => {
    const certificates = await Certificate.find({ trainee: req.user._id })
        .populate('program', 'name');
        
    return res.status(200).json(new ApiResponse(200, certificates, "Your certificates fetched successfully."));
});

export { issueCertificate, getMyCertificates };