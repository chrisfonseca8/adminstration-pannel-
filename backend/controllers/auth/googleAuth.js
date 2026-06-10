import ExpressError from '../../utils/errorHandling/expressError.js'
import { StatusCodes } from 'http-status-codes'
import { jwtDecode } from 'jwt-decode'
import db from '../../models/index.js';
import { where } from 'sequelize';
// import dotenv from "dotenv";
// dotenv.config({
//     path: '../../.env'
// });
// console.log(process.env.JWT_SECRET);
// console.log(process.cwd());
import jwt from 'jsonwebtoken'
const { User } = db;
import services from '../../services/index.js'
const { session } = services
const { Store_SessionId_To_Cookie, Store_SessionId_to_redis,userId_sessionID_redis } = session

const getting_google_token = async (code) => {
    try {
        if (!code) {
            console.log('got no code')
            throw new ExpressError(
                'unable to get code from client',
                StatusCodes.BAD_REQUEST
            )
        }

        const payload = new URLSearchParams({
            code,
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            redirect_uri: 'postmessage',
            grant_type: 'authorization_code',
        });

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: payload.toString(),
        });

        const tokens = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('Google token error', tokens);
            throw new ExpressError(
                'unable to get token from code',
                StatusCodes.BAD_REQUEST
            )
        }

        return tokens;
    } catch (error) {
        console.error(error);
        throw new ExpressError(
            'unable to get token from code',
            StatusCodes.BAD_REQUEST
        )
    }
}


//creating the function to extract the data from the jwt google token 

const getting_jwt_data = async (token) => {
    try {
        if (!token?.id_token) {
            throw new ExpressError(
                'invalid Google token payload',
                StatusCodes.BAD_REQUEST
            );
        }

        const decoded = jwtDecode(token.id_token);
        return {
            sub: decoded.sub,
            email: decoded.email
        };
    } catch (error) {
        throw new ExpressError(
            'unable to get data from the jwt token',
            StatusCodes.BAD_REQUEST
        );
    }
}


//writing the part to check the db for existing sub or not 
const check_db_sub = async (sub) => {
    const response = await User.findOne({
        where: {
            sub: sub
        }
    });

    return response;
};



//making the base idea of getting the sub and cheking the db for 
//existing or not 
//else not -- function 2

//base middle ware

const main_auth_fn = async (req, res, next) => {
    const code = req.body.code
    if (!code) {
        throw new ExpressError(
            "unable to get code from client",
            StatusCodes.BAD_REQUEST
        )
    }
    const token = await getting_google_token(code);
    const result = await getting_jwt_data(token);

    const response = await check_db_sub(result.sub);

    if (response === null) {
        const pendingToken = jwt.sign(
            { sub: result.sub, email: result.email },
            process.env.JWT_SECRET,
            { expiresIn: '10m' }
        )

        return res.status(StatusCodes.OK).json({
            isNewUser: true,
            email: result.email,
            pendingToken
        })
    }

    const sessionId = await Store_SessionId_To_Cookie(res,req);
    // console.log(`sessionId:${sessionId}`);
    // console.log(`response:${response}`);
    // console.log(`user_id:${response.id}`)
    await Store_SessionId_to_redis(sessionId, response.id, true);
    await userId_sessionID_redis(response.id,sessionId);

    return res.status(StatusCodes.OK).json({
        isNewUser: false,
        user: { username: response.username, email: response.email }
    });
}

const confirm_new_user = async (req, res, next) => {
    const { username, pendingToken } = req.body;

    if (!pendingToken || !username) {
        throw new ExpressError(
            'jwt token, and username are required',
            StatusCodes.BAD_REQUEST
        );
    }

    let decoded;
    try {
        decoded = jwt.verify(pendingToken, process.env.JWT_SECRET);
    } catch (e) {
        throw new ExpressError('Invalid or expired registration token', StatusCodes.UNAUTHORIZED);
    }

    const { email, sub } = decoded

    const existingUser = await User.findOne({
        where: { sub }
    });

    if (existingUser) {
        return res.status(StatusCodes.OK).json({
            isNewUser: false,
            user: existingUser.toJSON(),
            message: 'Existing user found for this account'
        });
    }

    const existingUsername = await User.findOne({
        where: { username }
    });

    if (existingUsername) {
        throw new ExpressError(
            'Username already exists',
            StatusCodes.CONFLICT
        );
    }

    const createdUser = await User.create({
        sub,
        email,
        username,
        admin_rooms: 0,
        joined_rooms: 0,
    });

    const sessionId = await Store_SessionId_To_Cookie(res,req);

    await Store_SessionId_to_redis(sessionId, createdUser.id, false)

    return res.status(StatusCodes.CREATED).json({
        isNewUser: false,
        user: { email: createdUser.email, username: createdUser.username },
        created: true
    });
}

export default {
    main_auth_fn,
    confirm_new_user
}


