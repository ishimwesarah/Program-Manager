import { Router } from 'express';
import * as programController from '../../controllers/program.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();

// All program routes require a user to be logged in.
router.use(verifyJWT);

// --- Route for creating a new program or getting a list of programs ---
router.route('/')
    .post(checkRole(['Program Manager', 'SuperAdmin']), programController.createProgram)
    .get(programController.getAllPrograms);

// --- Routes for a specific program, identified by its ID ---
router.route('/:id')
    .get(programController.getProgramById)
    .put(checkRole(['SuperAdmin', 'Program Manager']), programController.updateProgram)
    .delete(checkRole(['SuperAdmin']), programController.deleteProgram); // This is a soft delete

// --- Routes for changing the status and state of a program ---
router.route('/:id/request-approval')
    .patch(checkRole(['Program Manager']), programController.requestApproval);

router.route('/:id/approve')
    .patch(checkRole(['SuperAdmin']), programController.approveProgram);

router.route('/:id/reject')
    .patch(checkRole(['SuperAdmin']), programController.rejectProgram);
    
// --- Routes for managing users within a program ---
router.route('/:id/enroll-trainee')
    .post(checkRole(['Program Manager']), programController.enrollTrainee);

router.route('/:id/enroll-facilitator')
    .post(checkRole(['Program Manager']), programController.enrollFacilitator);

// THIS IS THE ROUTE that was causing the error. It now correctly points to an exported function.
router.route('/:id/manage-managers')
    .patch(checkRole(['SuperAdmin']), programController.updateProgramManagers);

// --- Reporting Route ---
router.route('/:id/report/pdf')
    .get(checkRole(['SuperAdmin', 'Program Manager']), programController.generateProgramReport);

export default router;