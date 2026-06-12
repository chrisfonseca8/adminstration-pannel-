

import express from 'express';
const router = express.Router();

import { publishToRoom } from '../../src/socketServer/redis_connections.js';

router.post('/commentry', async (req, res) => {
    const { roomId, payload } = req.body;

    await publishToRoom(roomId, payload);

    return res.json({
        success: true
    });
});


export default router