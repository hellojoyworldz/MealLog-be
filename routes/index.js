import express from "express";
import foodApi from "./food.api.js";
import authApi from "./auth.api.js";
import userApi from "./user.api.js";

const router = express.Router();

router.use("/food", foodApi);
router.use("/auth", authApi);
router.use("/user", userApi);

export default router;
