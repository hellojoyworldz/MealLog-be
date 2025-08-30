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
3. 개선할 점 (작은 점이라도 반드시 작성)

JSON 데이터:
${JSON.stringify(payload)}
`;
    console.log("제이슨", JSON.stringify(payload));
  } else {
    prompt = `
아래 JSON 데이터를 참고하여 유저의 하루 식단을 분석해줘 
응답은 다음 세 가지 항목으로 나누어 한국어로 작성해줘.
1. 영양 밸런스 평가 (탄수화물, 단백질, 지방, 당류) 세 문장 내외
2. 잘하고 있는 점
3. 개선할 점 (작은 점이라도 반드시 작성)

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

aiService.getChatResponse = async ({
  message,
  chatHistory,
  userName,
  goals,
  months = 3,
}) => {
  const prompt = `당신은 전문 영양사입니다. 유저의 최근 ${months}개월간의 식단 데이터 위주로 참고하여 상담을 진행합니다.
  실용적인 조언을 제공하세요. 대화는 친근하고 이해하기 쉽게 진행하되, 전문성을 잃지 마세요. 
  상대가 힘들어 한다면 용기를 부여하고 칭찬하는 말을 자주 사용하세요.
  기본은 한국어이며, 상대방의 언어에 따라 대답해주세요.

  유저 이름: ${userName}
  유저 키: ${goals.height}cm
  유저 몸무게: ${goals.weight}kg
  유저 하루 섭취 목표 칼로리: ${goals.goalCalories}kcal
  유저 목표 몸무게: ${goals.goalWeight}kg
  `;

  const chatUserMessages = chatHistory.map(({ role, content }) => ({
    role,
    content,
  }));

  const messages = [
    { role: "system", content: prompt },
    ...chatUserMessages,
    { role: "user", content: message },
  ];

  return await openai.responses.stream({
    model: "gpt-4.1-mini",
    input: messages,
    tools: [
      { type: "file_search", vector_store_ids: [process.env.VECTOR_STORE_ID] },
    ],
  });
};

export default aiService;
