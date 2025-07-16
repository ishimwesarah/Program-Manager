import { Router } from 'express';
import authRouter from './auth.route.js';
import programRouter from './program.route.js';
import userRouter from './user.route.js';
import courseRouter from './course.route.js';
import attendanceRouter from './attendance.route.js';
import submissionRouter from './submission.route.js'; 
import quizRouter from './quiz.route.js';             
import certificateRouter from './certificate.route.js';
import programUserRouter from './programUser.route.js'; 
import dashboardRouter from './dashboard.route.js';
import reportRouter from './report.route.js';
const router = Router();

const defaultRoutes = [
    { path: '/auth', route: authRouter },
    { path: '/users', route: userRouter },
    { path: '/programs', route: programRouter },
    { path: '/courses', route: courseRouter },
    { path: '/attendance', route: attendanceRouter },
    { path: '/submissions', route: submissionRouter }, 
    { path: '/quizzes', route: quizRouter },           
    { path: '/certificates', route: certificateRouter }, 
    { path: '/program-users', route: programUserRouter },
    { path: '/reports', route: reportRouter },
     { path: '/dashboard', route: dashboardRouter },
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

export default router;