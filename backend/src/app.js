import express, { json } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import tasksRouter from "./routes/tasks-routes.js";

const app = express();
const corsOptions = { credentials: true, origin: "http://localhost:3000" };

app.use(cors(corsOptions));
app.use(json());
app.use(cookieParser());

app.use("/api/tasks", tasksRouter);

export default app;