import OpenAI from "openai";
import openai from "../utils/openai.js";

function formatMealToText(meal) {
  const foods = meal.foods.map(
    (f) =>
      `- ${f.num}. ${f.name}, ${f.amount}g, kcal:${f.calories}, protein:${f.nutrients.protein}g, carb:${f.nutrients.carbs}g, fat:${f.nutrients.fat}g, sugar:${f.nutrients.sugar}g`
  );

  return `[mealId: ${meal._id}, userId: ${
    meal.userId
  }, date: ${meal.date.toISOString()},  type: ${meal.type} ]
  foods: ${foods}
  memo: ${meal.memo || ""}
  photo: ${meal.photo || ""}
  `.trim();
}

export async function upsertMeal(mealDoc) {
  try {
    // 파일이 존재하면 제거
    if (mealDoc.vectorFileId) {
      try {
        await openai.files.del(mealDoc.vectorFileId);
      } catch (error) {
        console.error("previous file remove error:", error);
      }
    }

    // 파일 생성
    const text = formatMealToText(mealDoc);
    const file = await openai.files.create({
      file: await OpenAI.toFile(
        Buffer.from(text, "utf-8"),
        `meal-${mealDoc._id}.txt`
      ),
      purpose: "assistants",
    });

    // 백스토어에 파일 업로드
    await openai.vectorStores.fileBatches.createAndPoll(
      process.env.VECTOR_STORE_ID,
      {
        file_ids: [file.id],
      }
    );

    // 파일 ID 저장
    mealDoc.vectorFileId = file.id;
    await mealDoc.save();
  } catch (error) {
    console.log("upsertMeal error", error);
  }
}

export async function removeMeal(mealDoc) {
  if (!mealDoc.vectorFileId) return;

  try {
    await openai.files.del(mealDoc.vectorFileId);
  } catch (error) {
    console.error("removeMeal error:", error);
  }
}
