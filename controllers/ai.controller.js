import User from "../models/User.js";
import aiService from "../services/ai.service.js";

const aiController = {};

aiController.getMealFeedback = async (req, res) => {
  try {
    const meals = req.meals; // 미들웨어에서 세팅됨
    const userId = req.userId;
    const user = await User.findById(userId);
    const goals = {
      goalCalories: user.goalCalories,
      goalWeight: user.goalWeight,
    };
    const feedback = await aiService.getMealFeedback(meals, goals);

    res.status(200).json({ status: "success", feedback });
  } catch (error) {
    res.status(500).json({ status: "fail", error: error.message });
  }
};

export default aiController;
