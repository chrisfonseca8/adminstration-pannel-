//first we will make a redis cluster that will handel 
// subcribing the user after logiin to the rooms he blongs
// we will handel this in memor

import dotenv from 'dotenv';
import Redis from "ioredis";

dotenv.config();

const redisHost = process.env.REDIS_HOST || 'redis';
const redisPort = Number(process.env.REDIS_PORT || 6379);
const redisOptions = process.env.REDIS_URL
    ? process.env.REDIS_URL
    : { host: redisHost, port: redisPort };

const redisPub = new Redis(redisOptions);
const redisSub = new Redis(redisOptions);

redisPub.on('error', (error) => {
    console.error('RedisPub error:', error);
});
redisSub.on('error', (error) => {
    console.error('RedisSub error:', error);
});

// Subscribe this server to all rooms it currently has users for
const subscribedRooms = new Set();

export const subscribeToRoomsRedis = async (roomsList) => {
    for (const roomId of roomsList) {

        if (subscribedRooms.has(roomId)) {
            continue;
        }

        await redisSub.subscribe(`room_id:${roomId}`);

        subscribedRooms.add(roomId);
    }
};

// Publish a message to a room
const publishToRoom = async (roomId, payload) => {
    await redisPub.publish(
        `room_id:${roomId}`,
        JSON.stringify(payload)
    );
};

// Listen for messages from Redis
const listenForRoomMessages = (broadcast_msg_to_room) => {
    redisSub.on("message", (channel, message) => {
        try {
            const payload = JSON.parse(message);

            const roomId = Number(
                channel.replace("room_id:", "")
            );

            broadcast_msg_to_room(roomId, payload);
        } catch (error) {
            console.error(
                "Error processing Redis message:",
                error
            );
        }
    });
};

export {
    //subscribeToRoomsRedis,
    publishToRoom,
    listenForRoomMessages
};