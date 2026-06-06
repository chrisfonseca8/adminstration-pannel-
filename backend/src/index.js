import 'dotenv/config';
import express, { urlencoded } from 'express';
import cors from 'cors'
import apiRoutes from '../routes/index.js'
import { StatusCodes } from 'http-status-codes'
import errorJson from '../utils/common/jsonTemplates.js'
import Redis from 'ioredis'

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use('/api', apiRoutes);


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