import express from 'express'
const router = express.Router()
import { googleAuthControllers } from '../../controllers/index.js'
const { main_auth_fn, confirm_new_user } = googleAuthControllers
import catchAsyncError from '../../utils/errorHandling/catchAsyncError.js'
//import {subscribe_to_rooms} from '../../src/socketServer/index.js'
import { sendJson, subscribe_to_rooms } from '../../src/socketServer/index.js'
import redis from '../../src/config/redis.js'
import { StatusCodes } from 'http-status-codes'
//creating the user login router 
// this route will use google o-auth

//we can write a post req to a websocket route from the backend itself 

// const give_websocket_userdata = async (req, res) => {

//     const sessionId = req.cookies.Host_session;
//     const user_id = await redis.get(sessionId);
//     const PORT = process.env.PORT;
//     const ws_url = `ws://localhost:${PORT}/ws`;

//     const response = await fetch(
//         ws_url,
//         {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 userId: user_id
//             })
//         }
//     )

//     return res.status(StatusCodes.OK);
// }


router.post('/auth/google', catchAsyncError(main_auth_fn));
router.post('/auth/google/confirm', catchAsyncError(confirm_new_user));

export default router