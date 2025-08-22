import express from "express";
const router = express.Router();
import userController from "../controllers/user.controller.js";

router.post("/", userController.createUser);
router.get("/me", userController.getUser);

export default router;
