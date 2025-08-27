const mealController = {};
import Meal from "../models/Meal.js";

/**
 * 식사 추가 (존재하면 foods push)
 */
mealController.createMeal = async (req, res) => {
  try {
    const { userId } = req; // 로그인 미들웨어에서 세팅된다고 가정
    const { date, type, foods, photo, memo } = req.body;

    let meal = await Meal.findOne({ userId, date, type });

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
    const userId = 1; // 실제로는 req.user.id 같은 걸로 가져오겠죠
    const { date, type } = req.query;

    const query = { userId };
    if (date) query.date = date;
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
    const { mealId, foodId } = req.params;

    const meal = await Meal.findOne({ _id: mealId, userId });
    if (!meal) {
      return res.status(404).json({ status: "fail", error: "Meal not found" });
    }

    const food = meal.foods.id(foodId);
    if (!food) {
      return res.status(404).json({ status: "fail", error: "Food not found" });
    }

    food.deleteOne(); // 배열에서 제거
    await meal.save();

    res.status(200).json({ status: "success", data: meal });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

mealController.loadMeals = async (req, res, next) => {
  try {
    const { userId } = req;
    const { date, type } = req.query;

    const query = { userId };
    if (date) query.date = date;
    if (type) query.type = type;

    const meals = await Meal.find(query);

    if (!meals.length) {
      return res
        .status(404)
        .json({ status: "fail", error: "식단 기록이 없습니다." });
    }

    req.meals = meals; // 다음 미들웨어/컨트롤러에서 사용
    next();
  } catch (error) {
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

export default mealController;
