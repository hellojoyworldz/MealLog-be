import express from "express";
const router = express.Router();
import userController from "../controllers/user.controller.js";
import authController from "../controllers/auth.controller.js";

router.post("/", userController.createUser);
router.get("/me", authController.authenticate, userController.getUser);
router.put("/", authController.authenticate, userController.updateUser);

export default router;
