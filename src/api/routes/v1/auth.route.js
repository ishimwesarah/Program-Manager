import { Router } from 'express';
import { loginUser, registerUser } from '../../controllers/auth.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();

router.route('/login').post(loginUser);


router.route('/register').post(verifyJWT, checkRole(['SuperAdmin', 'Program Manager']), registerUser);

export default router;