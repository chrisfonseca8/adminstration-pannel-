import { StatusCodes } from 'http-status-codes';
import db from '../../models/index.js';
import redis from '../../src/config/redis.js';
import ExpressError from '../../utils/errorHandling/expressError.js'
import services from '../../services/index.js'
const { session } = services
const { Store_SessionId_To_Cookie, Store_SessionId_to_redis } = session

const { Room, Room_details, User } = db;
import { roomRoles } from '../../utils/common/roles.js'
import { TTL } from '../../utils/common/extra.js';
import { where } from 'sequelize';
const { ADMIN, JOINED } = roomRoles




//this is the functions occures when a user after getting a invite to join a room
// will send a write request to the db and update its state in react and in redis 
const add_user_to_roomDetails = async (user_id, room_id, role) => {
    if (role != ADMIN && role != JOINED) {
        return {
            message: 'please give a valid role'
        }
    }
    await Room_details.create({
        user_id,
        room_id,
        role
    })

    return {
        message: 'successfully queried room_details'
    }
}

//create a function to update the state in redis once a user joins a new rooms 
const room_redisUpdate = async (room_id, room_name, sessionId, role) => {
    try {
        const raw = await redis.get(`sessionId:${sessionId}`);

        if (!raw) {
            return {
                status: false,
                error: `Session ${sessionId} not found in Redis`
            };
        }

        const redis_obj = JSON.parse(raw);
        console.log(`redis_obj:${redis_obj}`);

        let new_redis_obj;

        if (role === JOINED) {
            new_redis_obj = {
                user_id: redis_obj.user_id,
                admin_rooms: redis_obj.admin_rooms,
                joined_rooms: [
                    ...redis_obj.joined_rooms,
                    {
                        room_id,
                        room_name
                    }
                ]
            };
        } else {
            new_redis_obj = {
                user_id: redis_obj.user_id,
                admin_rooms: [
                    ...redis_obj.admin_rooms,
                    {
                        room_id,
                        room_name
                    }
                ],
                joined_rooms: redis_obj.joined_rooms,

            };
        }
        console.log(`sessionId:${sessionId}`);
        console.log(`new_redis_obj:${new_redis_obj}`)

        await redis.set(
            `sessionId:${sessionId}`,
            JSON.stringify(new_redis_obj),
            "EX",
            TTL
        );

        return {
            status: true
        };
    } catch (error) {
        console.log(error);

        return {
            status: false,
            error: error.message
        };
    }
};


// Create a new room
export const createRoom = async (req, res, next) => {
    try {
        const { name } = req.body;
        let sessionId = req.cookies.Host_session;

        const session = JSON.parse(
            await redis.get(`sessionId:${sessionId}`)
        );

        const admin = session.user_id;
        // Validate input
        if (!name || !admin) {
            return res.status(400).json({
                success: false,
                message: 'Name and admin ID are required'
            });
        }

        // Check if admin user exists
        const adminUser = await User.findByPk(admin);
        if (!adminUser) {
            return res.status(404).json({
                success: false,
                message: 'Admin user not found'
            });
        }

        // Create the room
        const room = await Room.create({
            name,
            admin
        });
        const obj = await add_user_to_roomDetails(admin, room.id, ADMIN);

        //let sessionId = req.cookies.Host_session;
        // console.log("sessionId from cookie:", sessionId);
        // console.log("All cookies:", req.cookies);
        // console.log("Host_session:", req.cookies.Host_session);

        let rawSession = null;
        if (sessionId) {
            rawSession = await redis.get(`sessionId:${sessionId}`);
            //console.log("Redis session lookup for cookie:", rawSession);
        }

        if (!sessionId || !rawSession) {
            if (sessionId && !rawSession) {
                //console.log("Existing cookie was stale or missing in Redis; recreating session.");
            }
            sessionId = await Store_SessionId_To_Cookie(res, req);
            await Store_SessionId_to_redis(sessionId, admin, true);
        }

        // console.log("sessionId from cookie:", sessionId);
        // console.log("all redis keys:", await redis.keys("*"));
        // console.log(
        //     "session exists:",
        //     await redis.exists(`sessionId:${sessionId}`)
        // );

        const responseobj = await room_redisUpdate(room.id, room.name, sessionId, ADMIN);

        if (responseobj.status === false) {
            return res.status(StatusCodes.BAD_GATEWAY).json({
                status: false,
                error: responseobj.error
            });
        }


        return res.status(201).json({
            success: true,
            message: `Room created successfully + ${obj.message}`,
            data: room
        });
    } catch (error) {
        next(error);
    }
};

// Add user to room (create room_details)
export const addUserToRoom = async (req, res, next) => {
    try {
        const { room_id } = req.body;
        let sessionId = req.cookies.Host_session;

        const session = JSON.parse(
            await redis.get(`sessionId:${sessionId}`)
        );

        const user_id = session.user_id;
        if (!user_id || !room_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id, room_id, are required'
            });
        }

        // Check if user exists
        const user = await User.findByPk(user_id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if room exists
        const room = await Room.findByPk(room_id);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Create room_details entry
        const obj = await add_user_to_roomDetails(user_id, room_id, JOINED)


        //uodate the redis to get fresh data
        // let sessionId = req.cookies.Host_session;

        let rawSession = null;
        if (sessionId) {
            rawSession = await redis.get(`sessionId:${sessionId}`);
            // console.log("Redis session lookup for cookie:", rawSession);
        }

        if (!sessionId || !rawSession) {
            if (sessionId && !rawSession) {
                //console.log("Existing cookie was stale or missing in Redis; recreating session.");
            }
            sessionId = await Store_SessionId_To_Cookie(res, req);
            await Store_SessionId_to_redis(sessionId, user_id, true);
        }
        // console.log("sessionId from cookie:", sessionId);
        // console.log("all redis keys:", await redis.keys("*"));
        // console.log(
        //     "session exists:",
        //     await redis.exists(`sessionId:${sessionId}`)
        // );

        const responseobj = await room_redisUpdate(room_id, room.name, sessionId, JOINED);

        if (responseobj.status === false) {
            return res.status(StatusCodes.BAD_GATEWAY).json({
                status: false,
                error: responseobj.error
            });
        }

        return res.status(201).json({
            success: true,
            message: `${obj.message}`,
        });
    } catch (error) {
        //console.log(error);
        next(error);
    }
};

// Get all rooms
export const getAllRooms = async (req, res, next) => {
    try {
        const rooms = await Room.findAll({
            include: [
                {
                    model: User,
                    attributes: ['id', 'email', 'name'],
                    as: 'User'
                },
                {
                    model: Room_details,
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'email', 'name']
                        }
                    ]
                }
            ]
        });

        return res.status(200).json({
            success: true,
            data: rooms
        });
    } catch (error) {
        next(error);
    }
};

// Get room by ID
export const getRoomById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const room = await Room.findByPk(id, {
            include: [
                {
                    model: User,
                    attributes: ['id', 'email', 'username'],
                    as: 'User'
                },
                {
                    model: Room_details,
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'email', 'username']
                        }
                    ]
                }
            ]
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: room
        });
    } catch (error) {
        next(error);
    }
};

// Delete room
export const deleteRoom = async (req, res, next) => {
    const { id } = req.params;

    const room = await Room.findByPk(id);
    if (!room) {
        return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: 'Room not found'
        });
    }

    const roomMembers = await Room_details.findAll({ where: { room_id: id } });

    await room.destroy(); // CASCADE handles Room_details

    await Promise.all(
        roomMembers.map(async (member) => {
            await redis.set(
                `stale:user:${member.user_id}`,
                '1',
                'EX', TTL
            );
        })
    );

    return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Room deleted'
    });
}

// Remove user from room
export const removeUserFromRoom = async (req, res, next) => {
    try {
        const { id } = req.params;

        const roomDetail = await Room_details.findByPk(id);
        if (!roomDetail) {
            return res.status(404).json({
                success: false,
                message: 'Room detail not found'
            });
        }

        const removedUserId = roomDetail.user_id;
        await roomDetail.destroy();

        await redis.set(`stale:user:${removedUserId}`, '1', 'EX', TTL);


        return res.status(200).json({
            success: true,
            message: 'User removed from room successfully'
        });
    } catch (error) {
        next(error);
    }
};




// important code for remove user form 