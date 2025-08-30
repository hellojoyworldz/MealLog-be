import openai from "../utils/openai.js";
import { getUserVectorStoreId } from "./vectorStore.service.js";

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
  userId,
  userName,
  goals,
  months = 3,
}) => {
  const userVectorStoreId = await getUserVectorStoreId(userId);

  const prompt = `당신은 전문 영양사입니다. 유저의 최근 ${months}개월간의 식단 데이터 위주로 참고하여 상담을 진행합니다.
   매우 중요한 규칙 (반드시 지켜야 함):
  1. 제공된 데이터에만 기반하여 답변하세요. 절대 허구의 정보를 만들어내지 마세요.
  2. 특정 날짜의 식단을 언급할 때는 반드시 실제 데이터가 있는 날짜만 사용하세요.
  3. 데이터가 없는 날짜나 정보는 "해당 날짜의 식단 데이터가 없습니다"라고 명시하세요.
  4. 확실하지 않은 정보는 추측하지 말고 "확실하지 않습니다"라고 답변하세요.
  5. 식단 분석 시 실제 제공된 데이터만을 기준으로 평가하세요.
  
  기존 규칙:
  6. 실용적인 조언을 간단하게 제공하세요
  7. 사용자의 질문이나 요청이 식단/영양과 관련이 없으면 "죄송하지만 저는 영양사로서 식단과 영양에 관한 상담만 도와드릴 수 있습니다."라고 답변하세요
  8. 대화는 친근하고 이해하기 쉽게 진행하되, 전문성을 잃지 마세요
  9. 상대가 힘들어 한다면 용기를 부여하고 칭찬하는 말을 자주 사용하세요
  10. 상대방 질문에 정확하고 관련성 있는 대답을 해주세요
  11. 상대방 말이 이해가 안가거나 이상한말을 하면 "죄송하지만 이해하기 어렵습니다. 명확하게 말씀해주세요."라고 답변하고 끝내세요
  12. 이전 대화를 그대로 반복하지 마세요
  13. 기본은 한국어이며, 상대방의 언어에 따라 대답해주세요
  14. 매번 새로운 질문이나 요청에 대해 적절한 답변을 제공하세요
  15. txt 문서 번호같은거는 노출할 필요가 없습니다. 그런거 노출하지 마세요.
  16. 한국 시간 기준으로 답변해주세요.

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
    model: "gpt-4-turbo",
    input: messages,
    tools: [{ type: "file_search", vector_store_ids: [userVectorStoreId] }],
  });
};

export default aiService;
