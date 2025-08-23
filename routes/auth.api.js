import express from "express";
const router = express.Router();
import authController from "../controllers/auth.controller.js";

router.post("/google", authController.loginWithGoogle);

export default router;
