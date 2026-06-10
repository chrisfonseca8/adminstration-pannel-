// we are going to write functions over here that on confirm success of logging in new user 
// we will store that user session id in the cookie 
//also we will store in reddis

import { v4 as uuidv4 } from "uuid";
import ExpressError from '../../utils/errorHandling/expressError.js'
import { StatusCodes } from "http-status-codes";
import db from '../../models/index.js'
import { where } from "sequelize";
import { roomRoles } from '../../utils/common/roles.js'
import redis from "../../src/config/redis.js";
import { json } from "express";
import { TTL } from "../../utils/common/extra.js";
//import {TTL} from '../../utils/common/extra.js'
const { JOINED, ADMIN } = roomRoles
//import room_details from "../../models/room_details.js";
const { Room_details, Room } = db

//uuidv4(); // ⇨ 'ab16e731-6cee-424d-81a0-5929e9bdb0cc'

const Store_SessionId_To_Cookie = async (res, req) => {
    const uniqueSessionId = uuidv4();

    try {
        const oldSessionId = req.cookies.Host_session;
        if (oldSessionId) {
            //const user_id = JSON.parse(await redis(`sessionId:${oldSessionId}`)).user_id;
            await redis.del(`sessionId:${oldSessionId}`);
        }
        await res.cookie("Host_session", uniqueSessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "lax",
            path: '/',
            maxAge: TTL * 1000
        });
        return uniqueSessionId;
    } catch (error) {
        throw new ExpressError(
            error.message,
            StatusCodes.CONFLICT
        )
    }
}

const check_db_roomdetails = async (user_id) => {
    //here result will be an array
    try {
        const result = await Room_details.findAll({
            where: {
                user_id: user_id
            },
            include: [
                {
                    model: Room
                }
            ]
        })
        // result array 
        //         [
        //   {
        //     user_id: 1,
        //     room_id: 10,
        //     role: "ADMIN",
        //     Room: {
        //       id: 10,
        //       name: "Gaming Room",
        //       admin: 1
        //     }
        //   }
        // ]
        //console.log(`data from check_db_roomdetails is ${result}`)
        return result;
    } catch (error) {
        console.log(error);
        throw new ExpressError(
            'cannot query room_details for user_id in check_db_roomdetails fn ',
            StatusCodes.INTERNAL_SERVER_ERROR
        )
    }

}
const rebuildSession = async (user_id) => {
    const resultArray = await check_db_roomdetails(user_id);
    const adminRooms = [];
    const joinedRooms = [];

    for (const obj of resultArray) {
        if (!obj.Room) continue;

        const roomData = {
            room_id: obj.Room.id,
            room_name: obj.Room.name
        };

        if (obj.role === ADMIN) {
            adminRooms.push(roomData);
        } else {
            joinedRooms.push(roomData);
        }
    }

    return {
        user_id,
        admin_rooms: adminRooms,
        joined_rooms: joinedRooms
    };
};

// once we check the db for user exist or not 
// we can get details about joined and admin rooms and store in the reddis
const Store_SessionId_to_redis = async (sessionId, user_id, exist) => {
    const customObj = await rebuildSession(user_id);

    await redis.set(
        `sessionId:${sessionId}`,
        JSON.stringify(customObj),
        "EX",
        TTL
    );

    await userId_sessionID_redis(user_id, sessionId);
};

export const userId_sessionID_redis = async (user_id, SessionId) => {
    await redis.set(`userId:${user_id}`, SessionId, 'EX', TTL);
};

export { rebuildSession };

export default {
    Store_SessionId_To_Cookie,
    Store_SessionId_to_redis,
    userId_sessionID_redis,
    rebuildSession
}