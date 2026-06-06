import db from '../../models/index.js';

const { Room, Room_details, User } = db;
import {roomRoles} from '../../utils/common/roles.js'
const {ADMIN,JOINED} = roomRoles

const add_user_to_roomDetails=async(user_id,room_id,role)=>{
    if(role!=ADMIN&&role!=JOINED){
        return {
            message:'please give a valid role'
        }
    }
    await Room_details.create({
        user_id,
        room_id,
        role
    })

    return {
        message:'successfully queried room_details'
    }
}

// Create a new room
export const createRoom = async (req, res, next) => {
    try {
        const { name, admin } = req.body;

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

        const obj = await add_user_to_roomDetails(admin,room.id,ADMIN);
        
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
        const { user_id, room_id} = req.body;

        // Validate input
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
       const obj = await add_user_to_roomDetails(user_id,room_id,JOINED)

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
    try {
        const { id } = req.params;

        const room = await Room.findByPk(id);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        await room.destroy();

        return res.status(200).json({
            success: true,
            message: 'Room deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

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

        await roomDetail.destroy();

        return res.status(200).json({
            success: true,
            message: 'User removed from room successfully'
        });
    } catch (error) {
        next(error);
    }
};
