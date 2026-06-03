import dotenv from "dotenv";
dotenv.config();
import express, { urlencoded } from 'express';
//import { OAuth2Client, UserRefreshClient } from 'google-auth-library'
import cors from 'cors'
import apiRoutes from '../routes/index.js'
import { StatusCodes } from 'http-status-codes'
import  errorJson  from '../utils/common/jsonTemplates.js'
//import db from '../models/index.js
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use('/api', apiRoutes);

// const dummypayload = {
//     id: 10,
//     sub: "123456",
//     username: "chris",
//     email: "chris.fonseca@gmail.com",
// }

// const oAuth2Client = new OAuth2Client(
//     process.env.CLIENT_ID,
//     process.env.CLIENT_SECRET,
//     'postmessage',
// );

// app.post('/add', async (req, res) => {
//     try {
//         await User.create(dummypayload);
//         return res.json({
//             message: "db created ",
//         })
//     } catch (error) {
//         return res.json({
//             message: "error occured ",
//             data: error
//         })
//     }

// })

// app.post('/auth/google', async (req, res) => {
//     const { tokens } = await oAuth2Client.getToken(req.body.code); // exchange code for tokens
//     console.log(tokens);

//     res.json(tokens);
// });

// app.post('/auth/google/refresh-token', async (req, res) => {
//     const user = new UserRefreshClient(
//         process.env.CLIENT_ID,
//         process.env.CLIENT_SECRET,
//         req.body.refreshToken,
//     );
//     const { credentials } = await user.refreshAccessToken(); // optain new tokens
//     res.json(credentials);
// })

app.use((err, req, res, next) => {
    const { status = StatusCodes.INTERNAL_SERVER_ERROR } = err
    errorJson.message = err.message
    errorJson.error = err.error
    console.log(err)
    return res.status(status).json(errorJson)
})

app.listen(process.env.PORT, () => {
    console.log(`listning on port ${process.env.PORT}`);
})