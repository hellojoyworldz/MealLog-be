// routes/foodRoutes.js
import express from "express";
import foodController from "../controllers/food.controller.js";

const router = express.Router();

router.get("/", foodController.getFoodData);

export default router;
