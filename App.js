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

const mongoURI = process.env.MONGODB_URL;

mongoose.connect(mongoURI, { useNewUrlParser: true }).then(() => {
  console.log("몽구스 연결 성공");
}).catch;
(err) => {
  console.error("몽구스 연결 실패", err);
};

app.listen(process.env.PORT || 6500, () => {
  console.log(`서버가 ${process.env.PORT || 6500}번 포트에서 실행 중입니다.`);
});
