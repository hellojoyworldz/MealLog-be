import openai from "../utils/openai.js";

const aiService = {};

// ai 호출 JSON 기반 피드백 생성
aiService.getMealFeedback = async (meals, goals, mode = "daily") => {
  // userId, _id 제거한 데이터를 생성하는 함수
  // meal 객체에서 _id와 userId를 꺼내 버리고 나머지는 rest에 담음
  const cleanMeals = meals.map(({ _id, userId, ...rest }) => ({
    ...rest, //나머지 필드들을 복사
    foods: rest.foods?.map(({ _id, ...foodRest }) => foodRest) || [], // foods배열의 각 객체의 _id제거
  }));

  const { _id: goalsId, userId: goalsUserId, ...cleanGoals } = goals || {};

  const payload = {
    meals: cleanMeals,
    goals: cleanGoals,
  };

  let prompt;
  if (mode === "weekly") {
    prompt = `
아래 JSON 데이터를 참고하여 유저의 7일간 식단을 분석해줘 
응답은 다음 세 가지 항목으로 나누어 한국어로 작성해줘.
1. 영양 밸런스 평가 (탄수화물, 단백질, 지방, 당류) 세 문장 내외
2. 잘하고 있는 점
3. 개선할 점

JSON 데이터:
${JSON.stringify(payload)}
`;
    console.log("제이슨", JSON.stringify(payload));
  } else {
    prompt = `
아래 JSON 데이터를 참고하여 유저의 하루 식단을 분석하고, 칼로리와 영양 균형에 대한 피드백을 세 문장 내외로 한국어로 작성해줘.
JSON 데이터:
${JSON.stringify(payload)}
`;
    console.log("제이슨", JSON.stringify(payload));
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content.trim();
};

export default aiService;
