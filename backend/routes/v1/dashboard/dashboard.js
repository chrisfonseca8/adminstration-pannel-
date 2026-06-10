import express from 'express';

const router = express.Router();
import {check_user_middleware} from '../../../middleware/user_dashBoard/dashboard.js'
import {export_user_data} from '../../../controllers/dashboard/dashboardControler.js'
//get the home page

router.get('/dashboard',check_user_middleware,export_user_data);

export default router;