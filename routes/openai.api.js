import express from "express";
import aiController from "../controllers/ai.controller.js";
import mealController from "../controllers/meal.controller.js";
import authController from "../controllers/auth.controller.js";

const router = express.Router();

router.post(
  "/feedback",
  authController.authenticate,
  mealController.loadMeals, // mode에 따라 하루치 또는 7일치 식단을 미들웨어에서 처리
  aiController.getMealFeedback // ai가 분석 및 피드백 반환
);

router.get(
  "/feedback",
  authController.authenticate,
  aiController.getUserMealFeedback
);

export default router;
