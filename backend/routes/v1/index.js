import express from 'express';
const router = express.Router();
import userRoutes from './userRoutes.js'
import roomRoutes from './roomRoutes.js'

router.use('/', userRoutes);
router.use('/', roomRoutes);

export default router