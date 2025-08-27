import express from "express";
const router = express.Router();
import authController from "../controllers/auth.controller.js";
import mealController from "../controllers/meal.controller.js";

router.post("/", authController.authenticate, mealController.createMeal);
router.get("/", authController.authenticate, mealController.getMyMeal);
router.put("/", authController.authenticate, mealController.updateMeal);
router.delete("/", authController.authenticate, mealController.deleteMeal);

export default router;
