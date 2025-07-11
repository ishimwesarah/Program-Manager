import { Router } from 'express';
import * as programUserController from '../../controllers/programUser.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();


router.use(verifyJWT, checkRole(['Program Manager']));


router.route('/program/:programId').get(programUserController.getUsersInProgram);

// UPDATE a user's details (like their name).
router.route('/:userId').patch(programUserController.updateUserInProgram);

// REMOVE a user from a specific program (does not delete the user account)
router.route('/program/:programId/remove/:userId').patch(programUserController.removeUserFromProgram);

export default router;