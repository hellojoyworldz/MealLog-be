import mongoose from "mongoose";
import Meal from "../models/Meal.js";
import dotenv from "dotenv";

// 환경변수 로드
dotenv.config();

// MongoDB 연결
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB에 성공적으로 연결되었습니다.");
  } catch (error) {
    console.error("MongoDB 연결 실패:", error);
    process.exit(1);
  }
};

// vectorFileId 필드 제거 함수
const removeVectorFileId = async () => {
  try {
    console.log("vectorFileId 필드 제거 작업을 시작합니다...");

    // vectorFileId가 존재하는 문서 수 확인
    const countWithVectorFileId = await Meal.countDocuments({
      vectorFileId: { $exists: true },
    });
    console.log(`vectorFileId 필드가 있는 문서 수: ${countWithVectorFileId}`);

    if (countWithVectorFileId === 0) {
      console.log("vectorFileId 필드가 있는 문서가 없습니다.");
      return;
    }

    // vectorFileId 필드 제거
    const result = await Meal.updateMany(
      { vectorFileId: { $exists: true } },
      { $unset: { vectorFileId: "" } }
    );

    console.log(
      `성공적으로 ${result.modifiedCount}개의 문서에서 vectorFileId 필드를 제거했습니다.`
    );

    // 확인: vectorFileId가 남아있는지 체크
    const remainingCount = await Meal.countDocuments({
      vectorFileId: { $exists: true },
    });
    console.log(
      `제거 후 vectorFileId 필드가 남아있는 문서 수: ${remainingCount}`
    );
  } catch (error) {
    console.error("vectorFileId 필드 제거 중 오류 발생:", error);
  }
};

// 메인 실행 함수
const main = async () => {
  try {
    await connectDB();
    await removeVectorFileId();
    console.log("작업이 완료되었습니다.");
  } catch (error) {
    console.error("스크립트 실행 중 오류 발생:", error);
  } finally {
    // 연결 종료
    await mongoose.connection.close();
    console.log("MongoDB 연결이 종료되었습니다.");
    process.exit(0);
  }
};

// 스크립트 실행
main();
