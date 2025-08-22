import express from "express";
import foodApi from "./food.api.js";
import authApi from "./auth.api.js"; // Assuming you have an auth.api.js file

const router = express.Router();

router.use("/food", foodApi);
router.use("/auth", authApi);

export default router;
