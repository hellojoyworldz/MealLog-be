const mealController = {};
import Meal from "../models/Meal.js";

/**
 * 식사 추가 (존재하면 foods push)
 */
mealController.createMeal = async (req, res) => {
  try {
    const { userId } = req; // 로그인 미들웨어에서 세팅된다고 가정
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
        totalSummary.calories += food.calories || 0;
        totalSummary.carbs += food.nutrients?.carbs || 0;
        totalSummary.protein += food.nutrients?.protein || 0;
        totalSummary.fat += food.nutrients?.fat || 0;
        totalSummary.sugar += food.nutrients?.sugar || 0;
        // 타입별 칼로리 집계
        if (meal.type && totalSummary.byType[meal.type]) {
          totalSummary.byType[meal.type].calories += food.calories || 0;
        }
      });
    });

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
mealController.updateMeal = async (req, res) => {
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
    const { mealId, foodId } = req.query;

    const meal = await Meal.findOne({ _id: mealId, userId });
    if (!meal) {
      return res.status(404).json({ status: "fail", error: "Meal not found" });
    }

    if (foodId) {
      // foodId가 있으면 meal의 food 하나만 삭제
      const food = meal.foods.id(foodId);
      if (!food) {
        return res
          .status(404)
          .json({ status: "fail", error: "Food not found" });
      }
      food.deleteOne();
      await meal.save();
      return res.status(200).json({ status: "success", data: meal });
    } else {
      // foodId 없으면 meal 전체 삭제
      await Meal.deleteOne({ _id: mealId, userId });
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
      today.setHours(23, 59, 59, 999); // 오늘 끝 시각
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0); // 7일 전 시작 시각

      query.date = {
        $gte: sevenDaysAgo,
        $lte: today,
      };
    } else if (mode === "daily") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      query.date = { $gte: todayStart, $lte: todayEnd };
    } else if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    if (type) query.type = type;

    const meals = await Meal.find(query).lean();

    if (!meals.length) {
      return res
        .status(404)
        .json({ status: "fail", error: "식단 기록이 없습니다." });
    }

    req.meals = meals; // 다음 미들웨어/컨트롤러에서 사용
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

export default mealController;
