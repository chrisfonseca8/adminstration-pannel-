import redis from "../../src/config/redis.js";
import db from "../../models/index.js";
const {User} = db
import { StatusCodes } from "http-status-codes";

export const export_user_data=async(req,res)=>{
    const session_id = req.cookies.Host_session;
    const redis_data  = JSON.parse(await redis.get(`sessionId:${session_id}`));
// admin_rooms: adminRooms,
//         joined_rooms: joinedRooms

    const user_id = redis_data.user_id;
    const userDetails = await User.findByPk(user_id);
    const userObj = {
        username : userDetails.username,
        email: userDetails.email
    }
    const room_detailsObj = {
        adminRooms : redis_data.admin_rooms,
        joinedRooms : redis_data.joined_rooms
    }


    return res.status(StatusCodes.OK).json({userObj,room_detailsObj});
}