import openai from "../utils/openai.js";

const aiService = {};

// 끼니별 총합 계산 + 프롬프트 생성
function buildMealPrompt(meals, goals) {
  let totalCalories = 0,
    totalCarbs = 0,
    totalProtein = 0,
    totalFat = 0;

  const mealSummaries = meals.map((meal, idx) => {
    let mealCalories = 0,
      mealCarbs = 0,
      mealProtein = 0,
      mealFat = 0;
    meal.foods.forEach((food) => {
      mealCalories += food.calories || 0;
      mealCarbs += food.nutrients?.carbs || 0;
      mealProtein += food.nutrients?.protein || 0;
      mealFat += food.nutrients?.fat || 0;
    });
    totalCalories += mealCalories;
    totalCarbs += mealCarbs;
    totalProtein += mealProtein;
    totalFat += mealFat;

    return `${idx + 1}. ${
      meal.name
    }: 칼로리 ${mealCalories}kcal, 탄수화물 ${mealCarbs}g, 단백질 ${mealProtein}g, 지방 ${mealFat}g`;
  });

  return `
유저의 하루 식단 요약:
${mealSummaries.join("\n")}
총 섭취량: 칼로리 ${totalCalories}kcal, 탄수화물 ${totalCarbs}g, 단백질 ${totalProtein}g, 지방 ${totalFat}g
유저 목표: 칼로리 ${goals.goalCalories}kcal, 목표 체중 ${goals.goalWeight}kg

위 정보를 바탕으로 식단의 칼로리와 영양 균형을 분석하고, 건강한 개선 피드백을 세 문장 내외로 한국어로 제공해줘.
  `;
}

// ai 호출
aiService.getMealFeedback = async (meals, goals) => {
  const prompt = buildMealPrompt(meals, goals);

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content.trim();
};

export default aiService;
