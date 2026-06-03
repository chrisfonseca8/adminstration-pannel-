import express from 'express'
const router = express.Router()
import { googleAuthControllers } from '../../controllers/index.js'
const { main_auth_fn, confirm_new_user } = googleAuthControllers
import catchAsyncError from '../../utils/errorHandling/catchAsyncError.js'

//creating the user login router 
// this route will use google o-auth

router.post('/auth/google', catchAsyncError(main_auth_fn));
router.post('/auth/google/confirm', catchAsyncError(confirm_new_user));

export default router