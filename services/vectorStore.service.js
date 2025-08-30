import OpenAI from "openai";
import openai from "../utils/openai.js";

export async function getUserVectorStoreId(userId) {
  try {
    const vectorStores = await openai.vectorStores.list();

    if (vectorStores && vectorStores.data) {
      const userVectorStore = vectorStores.data.find(
        (vs) => vs.name === `meal-log-user-${userId}`
      );

      if (userVectorStore) {
        return userVectorStore.id;
      }
    }

    const newVectorStore = await openai.vectorStores.create({
      name: `meal-log-user-${userId}`,
    });

    return newVectorStore.id;
  } catch (error) {
    console.error("getUserVectorStoreId error:", error);
  }
}

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
  const userVectorStoreId = await getUserVectorStoreId(mealDoc.userId);

  try {
    // 파일이 존재하면 제거
    if (mealDoc.vectorFileId) {
      removeMeal(mealDoc);
    }

    // 파일 생성 - 파일명에 사용자 정보 포함
    const text = formatMealToText(mealDoc);
    const file = await openai.files.create({
      file: await OpenAI.toFile(
        Buffer.from(text, "utf-8"),
        `meal-${mealDoc._id}-userId-${mealDoc.userId}-${
          mealDoc.date.toISOString().split("T")[0]
        }.txt`
      ),
      purpose: "assistants",
    });

    // 백스토어에 파일 업로드
    await openai.vectorStores.fileBatches.createAndPoll(userVectorStoreId, {
      file_ids: [file.id],
    });
    console.log("================");
    console.log(mealDoc);
    console.log("================");
    console.log("파일 업로드 완료");

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
    await Meal.findByIdAndUpdate(mealDoc._id, {
      $unset: { vectorFileId: "" },
    });

    console.log("파일 제거", mealDoc.vectorFileId);
    await openai.files.delete(mealDoc.vectorFileId).then((res) => {
      console.log("파일 제거 완료", res);
    });

    const userVectorStoreId = await getUserVectorStoreId(mealDoc.userId);
    await openai.vectorStores.fileBatches.delete(userVectorStoreId, {
      file_ids: [mealDoc.vectorFileId],
    });
  } catch (error) {
    console.error("removeMeal error:", error);
  }
}
