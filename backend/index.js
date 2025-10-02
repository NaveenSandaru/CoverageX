import express, {json} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

//import endpoint routers
import userRouter from './routes/user-routes.js';
import tasksRouter from './routes/tasks-routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const corsOptions = {credentials: true, origin: 'http://localhost:3000'};

app.use(cors(corsOptions));
app.use(json());
app.use(cookieParser());

//configure routers to redirect to endpoints
app.use('/users', userRouter);
app.use('/tasks', tasksRouter);

app.listen(PORT, ()=>console.log(`Server listening on ${PORT}`));