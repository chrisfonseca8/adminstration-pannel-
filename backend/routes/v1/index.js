import express from 'express';
const router = express.Router();
import userRoutes from './userRoutes.js'
import roomRoutes from './roomRoutes.js'
import dashboardRoutes from './dashboard/dashboard.js'
import testRoutes from './test.js'
router.use('/', userRoutes);
router.use('/', roomRoutes);
router.use('/',dashboardRoutes);
router.use('/',testRoutes)
export default router