import express from 'express';
const router = express.Router();
import userRoutes from './userRoutes.js'
import roomRoutes from './roomRoutes.js'
import dashboardRoutes from './dashboard/dashboard.js'

router.use('/', userRoutes);
router.use('/', roomRoutes);
router.use('/',dashboardRoutes)
export default router