import { Router } from 'express';
import * as userController from '../../controllers/user.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();

// --- SELF-SERVICE ROUTES ---
router.route('/me').get(verifyJWT, userController.getCurrentUser);
router.route('/update-account').patch(verifyJWT, userController.updateAccountDetails);
router.route('/change-password').post(verifyJWT, userController.changeCurrentPassword);

// --- ADMIN & MANAGER ROUTES ---
const manageRouter = Router();
manageRouter.use(verifyJWT); // All management routes require login

// --- SPECIFIC ROUTES FIRST ---
// This route is now checked BEFORE the /:id route, which solves the CastError.
manageRouter.route('/onboarded').get(checkRole(['SuperAdmin', 'Program Manager']), userController.getOnboardedUsers);
manageRouter.route('/list-by-role').get(checkRole(['SuperAdmin']), userController.getUserListByRole);

// --- GENERIC ROUTES LAST ---
// These routes are now checked AFTER the specific ones above.
manageRouter.route('/').get(checkRole(['SuperAdmin']), userController.getAllUsers);
manageRouter.route('/:id').get(checkRole(['SuperAdmin']), userController.getUserById);
manageRouter.route('/:id/status').patch(checkRole(['SuperAdmin']), userController.updateUserStatus);

// Mount all management routes under the /manage path
router.use('/manage', manageRouter);

export default router;