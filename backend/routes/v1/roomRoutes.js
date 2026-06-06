import express from 'express';
const router = express.Router();

import {
    createRoom,
    addUserToRoom,
    getAllRooms,
    getRoomById,
    deleteRoom,
    removeUserFromRoom
} from '../../controllers/rooms/roomController.js';

import catchAsyncError from '../../utils/errorHandling/catchAsyncError.js';

// Room routes
router.post('/rooms', catchAsyncError(createRoom));
router.get('/rooms', catchAsyncError(getAllRooms));
router.get('/rooms/:id', catchAsyncError(getRoomById));
router.delete('/rooms/:id', catchAsyncError(deleteRoom));

// Room details routes
router.post('/room-members', catchAsyncError(addUserToRoom));
router.delete('/room-members/:id', catchAsyncError(removeUserFromRoom));

export default router;
