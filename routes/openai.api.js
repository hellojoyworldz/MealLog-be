import express from "express";
import aiController from "../controllers/ai.controller.js";
import mealController from "../controllers/meal.controller.js";
import authController from "../controllers/auth.controller.js";

const router = express.Router();

router.post(
  "/feedback",
  authController.authenticate,
  mealController.loadMeals, // db에서 식단 불러오고
  aiController.getMealFeedback // ai가 분석 및 피드백 반환
);

export default router;
