import express from "express";
import authController from "../controllers/auth.controller.js";
import chatController from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/", authController.authenticate, chatController.getChatHistory);

export default router;
