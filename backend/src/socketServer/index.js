import { WebSocket, WebSocketServer } from 'ws';
import redis from '../config/redis.js';
import { subscribeToRoomsRedis } from './redis_connections.js';

const room_socket_map = new Map();
const user_socket_map = new Map();

export const subscribe_to_rooms = (room_id, socket) => {
    if (!room_socket_map.has(room_id)) {
        room_socket_map.set(room_id, new Set());
    }

    socket.subscriptions.add(room_id);
    room_socket_map.get(room_id).add(socket);
};

const unsubscribe = (room_id, socket) => {
    if (!room_socket_map.has(room_id)) {
        return;
    }

    room_socket_map.get(room_id).delete(socket);

    if (room_socket_map.get(room_id).size === 0) {
        room_socket_map.delete(room_id);
    }
};

const clean_up = (socket) => {
    for (const room_id of socket.subscriptions) {
        unsubscribe(room_id, socket);
    }

    if (socket.userId) {
        user_socket_map.delete(socket.userId);
    }
};

export const sendJson = (socket, payload) => {
    if (socket.readyState !== WebSocket.OPEN) {
        return;
    }

    socket.send(JSON.stringify(payload));
};

const broadcast_msg_to_room = (room_id, payload) => {
    const room_sockets = room_socket_map.get(room_id);

    if (!room_sockets || room_sockets.size === 0) {
        return;
    }

    for (const socket of room_sockets) {
        sendJson(socket, payload);
    }
};

export const attachWebsocketServer = (server) => {
    const wss = new WebSocketServer({
        server,
        path: '/ws',
        maxPayload: 1024 * 1024
    });

 wss.on('connection', async (socket, req) => {
    try {
        console.log('WebSocket connected');

        socket.subscriptions = new Set();

        const cookies = req.headers.cookie || '';
        console.log('Cookies:', cookies);

        const sessionCookie = cookies
            .split(';')
            .find(cookie =>
                cookie.trim().startsWith('Host_session=')
            );

        if (!sessionCookie) {
            console.log('No session cookie found');
            socket.close(1008, 'No session cookie');
            return;
        }
        console.log(`sessionCookie:${sessionCookie}`);
        const sessionId = sessionCookie.split('=')[1];
        console.log('Session ID:', sessionId);

        const sessionData = await redis.get(`sessionId:${sessionId}`);
        console.log('Session Data:', sessionData);

        if (!sessionData) {
            console.log('Session not found in Redis');
            socket.close(1008, 'Invalid session');
            return;
        }

        const userObj = JSON.parse(sessionData);
        console.log('User Object:', userObj);

        const userId = userObj.user_id;
        const admin_rooms = userObj.admin_rooms || [];
        const joined_rooms = userObj.joined_rooms || [];

        socket.userId = userId;
        user_socket_map.set(userId, socket);

        const totalRooms = [];

        for (const roomObj of admin_rooms) {
            subscribe_to_rooms(roomObj.room_id, socket);
            totalRooms.push(roomObj.room_id);
        }

        for (const roomObj of joined_rooms) {
            subscribe_to_rooms(roomObj.room_id, socket);
            totalRooms.push(roomObj.room_id);
        }

        console.log('Rooms:', totalRooms);

        if (totalRooms.length > 0) {
            await subscribeToRoomsRedis(totalRooms);
        }

        console.log('Authentication successful');

        sendJson(socket, {
            type: 'authenticated',
            userId
        });

        socket.on('message', (data) => {
            console.log('Message:', data.toString());
        });

        socket.on('error', (err) => {
            console.error('Socket error:', err);
        });

        socket.on('close', (code, reason) => {
            console.log('Socket closed');
            console.log('Code:', code);
            console.log('Reason:', reason.toString());

            clean_up(socket);
        });

    } catch (error) {
        console.error('Connection error:', error);

        socket.close(1011, 'Internal server error');
    }
});

    wss.on('error', (error) => {
        console.error(error);
    });

    function broadcast_msg(room_id, payload) {
        broadcast_msg_to_room(room_id, payload);
    }

    return { broadcast_msg };
};