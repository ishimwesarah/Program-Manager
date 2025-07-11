import { ApiError } from "../../utils/ApiError.js";

export const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new ApiError(403, "Forbidden: You do not have permission to perform this action.");
        }
        next();
    };
};