import User from "../models/User.js";
import MealFeedback from "../models/MealFeedback.js";
import { parseFeedback } from "../utils/parseFeedback.js";
import aiService from "../services/ai.service.js";

const aiController = {};

aiController.getMealFeedback = async (req, res) => {
  try {
    const meals = req.meals; // loadMeals 미들웨어에서 세팅됨
    const userId = req.userId;
    const mode = req.mode; // daily | weekly

    // 유저 목표 가져오기
    const user = await User.findById(userId);
    const goals = {
      goalCalories: user.goalCalories,
      goalWeight: user.goalWeight,
    };

    // 1. AI에게 피드백 요청
    const feedbackText = await aiService.getMealFeedback(meals, goals, mode);

    // 2. 응답 텍스트 파싱
    const parsed = parseFeedback(feedbackText);

    // 3. DB에 저장
    const feedbackDoc = await MealFeedback.create({
      userId,
      mealIds: meals.map((m) => m._id),
      mode,
      feedback: parsed,
    });

    // 4. 응답
    res.status(200).json({ status: "success", feedback: feedbackDoc });
  } catch (error) {
    res.status(500).json({ status: "fail", error: error.message });
  }
};

aiController.getUserMealFeedback = async (req, res) => {
  try {
    const userId = req.userId;
    const { mode, date } = req.query;

    const query = { userId };
    if (mode) query.mode = mode;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    const feedbacks = await MealFeedback.find(query).sort({ createdAt: -1 });
    res.status(200).json({ status: "success", feedbacks });
  } catch (error) {
    res.status(500).json({ status: "fail", error: error.message });
  }
};

export default aiController;
