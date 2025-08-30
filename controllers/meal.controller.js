const mealController = {};
import Meal from "../models/Meal.js";
import { upsertMeal, removeMeal } from "../services/vectorStore.service.js";

/**
 * 식사 추가 (존재하면 foods push)
 */
mealController.createMeal = async (req, res) => {
  try {
    const { userId } = req;
    const { date, type, foods, photo, memo } = req.body;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let meal = await Meal.findOne({
      userId,
      type,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!meal) {
      meal = new Meal({
        userId,
        date,
        type,
        foods,
        photo,
        memo,
      });
    } else {
      meal.foods.push(...foods);
      if (photo) meal.photo = photo;
      if (memo) meal.memo = memo;
    }

    await meal.save();
    upsertMeal(meal);

    res.status(200).json({ status: "success", data: meal });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

/**
 * 내 식사 기록 가져오기
 * 쿼리로 date/type 필터링 가능 (옵션)
 */
mealController.getMyMeal = async (req, res) => {
  try {
    const { userId } = req;
    const { date, type } = req.query;

    const query = { userId };
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    if (type) query.type = type;

    const meals = await Meal.find(query);

    // 합계 초기화
    const totalSummary = {
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      sugar: 0,
      byType: {
        breakfast: { calories: 0 },
        lunch: { calories: 0 },
        dinner: { calories: 0 },
        snack: { calories: 0 },
      },
    };

    meals.forEach((meal) => {
      meal.foods.forEach((food) => {
        const count = food.num || 1; // 기본값 1

        totalSummary.calories += (food.calories || 0) * count;
        totalSummary.carbs += (food.nutrients?.carbs || 0) * count;
        totalSummary.protein += (food.nutrients?.protein || 0) * count;
        totalSummary.fat += (food.nutrients?.fat || 0) * count;
        totalSummary.sugar += (food.nutrients?.sugar || 0) * count;

        // 타입별 칼로리 집계
        if (meal.type && totalSummary.byType[meal.type]) {
          totalSummary.byType[meal.type].calories +=
            (food.calories || 0) * count;
        }
      });
    });

    // 아침, 점심, 저녁, 간식 순서로 정렬
    const order = ["breakfast", "lunch", "dinner", "snack"];
    meals.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));

    res.status(200).json({
      status: "success",
      data: {
        meals,
        totals: totalSummary,
      },
    });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

/**
 * 특정 식사(food) 수정
 */
mealController.updateFood = async (req, res) => {
  try {
    const { userId } = req;
    const { mealId, foodId } = req.params;
    const updateData = req.body;

    // meal 문서 찾고
    const meal = await Meal.findOne({ _id: mealId, userId });
    if (!meal) {
      return res.status(404).json({ status: "fail", error: "Meal not found" });
    }

    // foods 안의 food 찾기
    const food = meal.foods.id(foodId);
    if (!food) {
      return res.status(404).json({ status: "fail", error: "Food not found" });
    }

    // food 업데이트
    Object.assign(food, updateData);

    await meal.save();
    upsertMeal(meal);

    res.status(200).json({ status: "success", data: meal });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

mealController.updateMeal = async (req, res) => {
  try {
    const { userId } = req;
    const { mealId } = req.params;
    const updateData = req.body;

    // meal 문서 찾고
    const meal = await Meal.findOne({ _id: mealId, userId });
    if (!meal) {
      return res.status(404).json({ status: "fail", error: "Meal not found" });
    }

    // food 업데이트
    Object.assign(meal, updateData);

    await meal.save();
    upsertMeal(meal);

    res.status(200).json({ status: "success", data: meal });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

/**
 * 특정 음식(food) 삭제
 */
mealController.deleteMeal = async (req, res) => {
  try {
    const { userId } = req;
    const { mealId } = req.params;

    const meal = await Meal.findOne({ _id: mealId, userId });
    if (!meal) {
      return res.status(404).json({ status: "fail", error: "Meal not found" });
    }

    if (mealId) {
      await removeMeal(meal);
      await Meal.deleteOne({ _id: mealId, userId });
      removeMeal(meal);
      return res
        .status(200)
        .json({ status: "success", message: "Meal deleted" });
    }
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

// AI에게 보낼 일일 식단 불러오기
mealController.loadMeals = async (req, res, next) => {
  try {
    const { userId } = req;
    const { date, type, mode } = req.query;

    const query = { userId };

    if (mode === "weekly") {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      query.date = { $gte: sevenDaysAgo, $lte: today };
    } else if (mode === "daily") {
      // mode=daily일 때, date가 있으면 해당 날짜로, 없으면 오늘
      const targetDate = date ? new Date(date) : new Date();
      targetDate.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      query.date = { $gte: targetDate, $lte: endOfDay };
    } else if (mode === "caht") {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      threeMonthsAgo.setHours(0, 0, 0, 0);

      query.date = { $gte: threeMonthsAgo };
    } else if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (type && type !== "all") {
      query.type = type;
    }

    const meals = await Meal.find(query).lean();

    if (mode === "chat") {
      req.meals = meals;
      req.mode = mode;
      next();
      return;
    }

    if (!meals.length) {
      return res
        .status(404)
        .json({ status: "fail", error: "식단 기록이 없습니다." });
    }

    req.meals = meals;
    req.mode = mode || "daily";
    next();
  } catch (error) {
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

mealController.getMonthlyMealDates = async (req, res) => {
  try {
    const { userId } = req;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        status: "fail",
        error: "년도와 월을 모두 입력해주세요",
      });
    }

    // 해당 월의 시작일과 마지막일 계산
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(
      parseInt(year),
      parseInt(month),
      0,
      23,
      59,
      59,
      999
    );

    // 해당 월에 식단이 있는 날짜들만 조회
    const meals = await Meal.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          mealTypes: { $addToSet: "$type" },
        },
      },
    ]);

    // 날짜 배열로 변환
    const dates = meals.map((meal) => meal._id);

    res.status(200).json({
      status: "success",
      data: {
        year: parseInt(year),
        month: parseInt(month),
        dates,
      },
    });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

mealController.getMealStatistics = async (req, res) => {
  try {
    const { userId } = req;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        status: "fail",
        error: "startDate와 endDate를 모두 입력해주세요",
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 날짜별 칼로리 합계
    const trend = await Meal.aggregate([
      {
        $match: {
          userId,
          date: { $gte: start, $lte: end },
        },
      },
      { $unwind: "$foods" },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalCalories: { $sum: "$foods.calories" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 평균 칼로리
    const avgCalories =
      trend.length > 0
        ? Math.floor(
            trend.reduce((sum, d) => sum + d.totalCalories, 0) / trend.length
          )
        : 0;

    res.status(200).json({
      status: "success",
      data: {
        trend, // [{ date, totalCalories }, ...]
        avgCalories,
        days: trend.length,
      },
    });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};
export default mealController;
