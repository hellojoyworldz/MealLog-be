import mongoose from "mongoose";
import Meal from "../models/Meal.js";
import { upsertMeal } from "../services/vectorStore.service.js";
import dotenv from "dotenv";

dotenv.config();

async function uploadVectorData(userId = null) {
  try {
    await mongoose.connect(process.env.MONGODB_URL);

    const query = userId
      ? { userId, vectorFileId: { $exists: false } }
      : { vectorFileId: { $exists: false } };

    const mealsWithoutVector = await Meal.find(query);

    if (mealsWithoutVector.length === 0) {
      return;
    }

    for (let i = 0; i < mealsWithoutVector.length; i++) {
      const meal = mealsWithoutVector[i];
      console.log(`식사 ID ${meal._id} (사용자: ${meal.userId}) 업로드 중...`);

      try {
        await upsertMeal(meal);
      } catch (error) {
        console.error(`식사 ID ${meal._id} 업로드 실패:`, error.message);
      }
    }

    const totalMeals = await Meal.countDocuments();
    const mealsWithVector = await Meal.countDocuments({
      vectorFileId: { $exists: true },
    });
    console.log(`전체 식사 데이터: ${totalMeals}개`);
    console.log(`벡터 파일이 있는 데이터: ${mealsWithVector}개`);
  } catch (error) {
    console.error("uploadDummyDataToVectorStore error", error);
  } finally {
    await mongoose.disconnect();
  }
}

// 스크립트 실행
uploadVectorData();
