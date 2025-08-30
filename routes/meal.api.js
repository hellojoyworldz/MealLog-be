import express from "express";
const router = express.Router();
import authController from "../controllers/auth.controller.js";
import mealController from "../controllers/meal.controller.js";

router.post("/", authController.authenticate, mealController.createMeal);
router.get("/", authController.authenticate, mealController.getMyMeal);
router.put("/", authController.authenticate, mealController.updateFood);
router.put("/:mealId", authController.authenticate, mealController.updateMeal);
router.delete(
  "/:mealId",
  authController.authenticate,
  mealController.deleteMeal
);
router.get(
  "/dates",
  authController.authenticate,
  mealController.getMonthlyMealDates
);

router.get(
  "/statistics",
  authController.authenticate,
  mealController.getMealStatistics
);

export default router;
