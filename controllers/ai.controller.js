import User from "../models/User.js";
import MealFeedback from "../models/MealFeedback.js";
import { parseFeedback } from "../utils/parseFeedback.js";
import aiService from "../services/ai.service.js";

const aiController = {};

aiController.getMealFeedback = async (req, res) => {
  try {
    const meals = req.meals;
    const userId = req.userId;
    const { date, mode = "daily", type } = req.query;

    // 유저 목표 가져오기
    const user = await User.findById(userId);
    const goals = {
      goalCalories: user.goalCalories,
      goalWeight: user.goalWeight,
    };

    // filteredMeals: daily 모드일 때 type 필터 적용
    let filteredMeals = meals;
    if (mode === "daily" && type) {
      filteredMeals = meals.filter((meal) => meal.type === type);
    }

    // 중복 피드백 확인 및 저장할 날짜 계산
    let feedbackDate;
    let existingFeedback;
    if (mode === "daily") {
      feedbackDate = date ? new Date(date) : new Date();
      feedbackDate.setHours(0, 0, 0, 0); // 하루 시작일 기준

      const endOfDay = new Date(feedbackDate);
      endOfDay.setHours(23, 59, 59, 999);

      existingFeedback = await MealFeedback.findOne({
        userId,
        mode,
        date: { $gte: feedbackDate, $lte: endOfDay },
      });
    } else if (mode === "weekly") {
      const today = date ? new Date(date) : new Date();
      const dayOfWeek = today.getDay(); // 일요일=0
      // Calculate Monday as start of week
      const diffToMonday = (dayOfWeek + 6) % 7; // convert Sunday=0 to 6, Monday=1 to 0, etc.
      feedbackDate = new Date(today);
      feedbackDate.setDate(today.getDate() - diffToMonday); // 주 시작일 (Monday)
      feedbackDate.setHours(0, 0, 0, 0);

      const weekEnd = new Date(feedbackDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      existingFeedback = await MealFeedback.findOne({
        userId,
        mode,
        date: { $gte: feedbackDate, $lte: weekEnd },
      });

      if (existingFeedback) {
        // AI 피드백 요청
        const feedbackText = await aiService.getMealFeedback(
          filteredMeals,
          goals,
          mode
        );

        // 응답 텍스트 파싱
        const parsed = parseFeedback(feedbackText);

        existingFeedback.mealIds = filteredMeals.map((m) => m._id);
        existingFeedback.feedback = parsed;
        existingFeedback.updatedAt = new Date();
        await existingFeedback.save();

        return res.status(200).json({
          status: "success",
          message: "기존 피드백이 최신 내용으로 갱신되었습니다.",
          feedback: existingFeedback,
        });
      }
    }

    // AI 피드백 요청
    const feedbackText = await aiService.getMealFeedback(
      filteredMeals,
      goals,
      mode
    );

    // 응답 텍스트 파싱
    const parsed = parseFeedback(feedbackText);

    if (mode === "daily" && existingFeedback) {
      existingFeedback.mealIds = filteredMeals.map((m) => m._id);
      existingFeedback.feedback = parsed;
      existingFeedback.updatedAt = new Date();
      await existingFeedback.save();

      return res.status(200).json({
        status: "success",
        message: "기존 피드백이 최신 내용으로 갱신되었습니다.",
        feedback: existingFeedback,
      });
    }

    // DB 저장 (mode/daily/weekly 기준 date 사용)
    const feedbackDoc = await MealFeedback.create({
      userId,
      mealIds: filteredMeals.map((m) => m._id),
      mode,
      date: feedbackDate,
      feedback: parsed,
    });

    res.status(200).json({ status: "success", feedback: feedbackDoc });
  } catch (error) {
    res.status(500).json({ status: "fail", error: error.message });
  }
};

aiController.getUserMealFeedback = async (req, res) => {
  try {
    const userId = req.userId;
    const { mode = "daily", date, type } = req.query;

    let feedbacks;

    if (mode === "daily") {
      if (!date) {
        return res.status(400).json({
          status: "fail",
          message: "daily 모드에서는 date 값이 필요합니다.",
        });
      }

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const query = {
        userId,
        mode,
        date: { $gte: startOfDay, $lte: endOfDay },
      };
      if (type) query["feedback.type"] = type; // feedback 내부에 type 저장했을 경우

      feedbacks = await MealFeedback.find(query);
    } else if (mode === "weekly") {
      if (!date) {
        return res.status(400).json({
          status: "fail",
          message: "weekly 모드에서는 date 값이 필요합니다.",
        });
      }

      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      // Calculate Monday as start of week
      const diffToMonday = (dayOfWeek + 6) % 7;
      const startOfWeek = new Date(targetDate);
      startOfWeek.setDate(targetDate.getDate() - diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      feedbacks = await MealFeedback.find({
        userId,
        mode,
        date: { $gte: startOfWeek, $lte: endOfWeek },
      });
    } else {
      return res
        .status(400)
        .json({ status: "fail", message: "유효하지 않은 mode 값입니다." });
    }

    if (!feedbacks || feedbacks.length === 0) {
      return res
        .status(404)
        .json({ status: "fail", message: "피드백이 존재하지 않습니다." });
    }

    res.status(200).json({ status: "success", feedbacks });
  } catch (error) {
    res.status(500).json({ status: "fail", error: error.message });
  }
};
export default aiController;
