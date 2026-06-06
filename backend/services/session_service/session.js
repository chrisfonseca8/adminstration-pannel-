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
const { JOINED, ADMIN } = roomRoles
//import room_details from "../../models/room_details.js";
const { Room_details, Room } = db

//uuidv4(); // ⇨ 'ab16e731-6cee-424d-81a0-5929e9bdb0cc'

const Store_SessionId_To_Cookie = async (res) => {
    const uniqueSessionId = uuidv4();

    try {
        await res.cookie("Host_session", uniqueSessionId, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        //console.log(`uniqueSessionId create in cookie`)
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
// once we check the db for user exist or not 
// we can get details about joined and admin rooms and store in the reddis
const Store_SessionId_to_redis = async (sessionId, user_id, exist) => {
    const AdminArray = [];
    const JoinedArray = [];
    //console.log(`user_id got in Store_SessionId_to_redis is ${user_id}`)
    if (exist===true) {
        const resultArray = await check_db_roomdetails(user_id);
        for (const obj of resultArray) {
            if (obj.role == ADMIN) {
                AdminArray.push({
                    room_id: obj.room_id,
                    room_name: obj.Room.name
                });
            } else {
                JoinedArray.push({
                    room_id: obj.room_id,
                    room_name: obj.Room.name
                });
            }
        }
    }

    const customObj = {
        "user_id":user_id,
        "admin_rooms":AdminArray,
        "joined_rooms":JoinedArray
    }

    await redis.set(
        `sessionId:${sessionId}`,
        JSON.stringify(customObj)
    )

}

export default {
    Store_SessionId_To_Cookie,
    Store_SessionId_to_redis
}