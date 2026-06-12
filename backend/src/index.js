import dotenv from 'dotenv';

dotenv.config();

// Your code here
console.log(process.env.PORT);
import express, { urlencoded } from 'express';
import cors from 'cors'
import apiRoutes from '../routes/index.js'
import sessionMiddleware from '../middleware/index.js'
import { StatusCodes } from 'http-status-codes'
import http from 'http'
import errorJson from '../utils/common/jsonTemplates.js'
import Redis from 'ioredis'
import {listenForRoomMessages} from './socketServer/redis_connections.js'
import {attachWebsocketServer} from './socketServer/index.js'
import cookieParser from "cookie-parser";



const app = express();
const PORT =  process.env.PORT;
const server = http.createServer(app);

//console.log(server);
const {broadcast_msg} = attachWebsocketServer(server);
listenForRoomMessages(broadcast_msg);

app.use(cookieParser());
app.locals.broadcast_msg = broadcast_msg;

app.use(cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

//app.use(sessionMiddleware);
app.use('/api', apiRoutes);

app.get("/check-session", (req, res) => {
    console.log(req.cookies);
    res.json(req.cookies);
});


app.use((err, req, res, next) => {
    const { status = StatusCodes.INTERNAL_SERVER_ERROR } = err
    errorJson.message = err.message
    errorJson.error = err.error
    console.log(err)
    return res.status(status).json(errorJson)
})



server.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});

app.listen(process.env.PORT, () => {
    console.log(`listning on port ${process.env.PORT}`);
})