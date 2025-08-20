import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import indexRouter from "./routes/index.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/api", indexRouter);

const mongoURI = process.env.LOCAL_DB_ADDRESS;
