import ExpressError from '../../utils/errorHandling/expressError.js'
import { StatusCodes } from 'http-status-codes'
import {jwtDecode} from 'jwt-decode'
import db from '../../models/index.js';
import { where } from 'sequelize';
const { User } = db

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
        return res.status(StatusCodes.OK).json({
            isNewUser: true,
            email: result.email,
            sub: result.sub
        });
    }

    return res.status(StatusCodes.OK).json({
        isNewUser: false,
        user: response.toJSON()
    });
}

const confirm_new_user = async (req, res, next) => {
    const { sub, email, username } = req.body;

    if (!sub || !email || !username) {
        throw new ExpressError(
            'sub, email, and username are required',
            StatusCodes.BAD_REQUEST
        );
    }

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

    return res.status(StatusCodes.CREATED).json({
        isNewUser: false,
        user: createdUser.toJSON(),
        created: true
    });
}

export default {
    main_auth_fn,
    confirm_new_user
}


