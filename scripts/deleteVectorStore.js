import openai from "../utils/openai.js";
import dotenv from "dotenv";

// 환경변수 로드
dotenv.config();

async function clearAllVectorStoreFiles() {
  try {
    console.log("백스토어의 모든 파일 삭제 시작...");

    // 방법 1: 파일 배치 조회 시도
    try {
      const fileBatches = await openai.vectorStores.fileBatches.list(
        process.env.VECTOR_STORE_ID
      );

      console.log(`총 ${fileBatches.data.length}개의 파일 배치 발견`);

      // 각 파일 배치의 파일들 삭제
      for (const batch of fileBatches.data) {
        if (batch.file_ids && batch.file_ids.length > 0) {
          console.log(
            `배치 ${batch.id}에서 ${batch.file_ids.length}개 파일 삭제 중...`
          );

          for (const fileId of batch.file_ids) {
            try {
              await openai.files.delete(fileId);
              console.log(`파일 ${fileId} 삭제 완료`);
            } catch (error) {
              console.error(`파일 ${fileId} 삭제 실패:`, error);
            }
          }
        }
      }
    } catch (batchError) {
      console.log("파일 배치 조회 실패, 다른 방법 시도...");

      // 방법 2: 모든 파일 조회 후 백스토어 관련 파일 찾기
      const allFiles = await openai.files.list();
      console.log(`총 ${allFiles.data.length}개의 파일 발견`);

      // 백스토어에 업로드된 파일들 삭제
      let deletedCount = 0;
      for (const file of allFiles.data) {
        try {
          await openai.files.delete(file.id);
          console.log(`파일 ${file.id} (${file.filename}) 삭제 완료`);
          deletedCount++;
        } catch (error) {
          console.error(`파일 ${file.id} 삭제 실패:`, error);
        }
      }

      console.log(`총 ${deletedCount}개 파일 삭제 완료`);
    }

    console.log("백스토어의 모든 파일 삭제 완료");
  } catch (error) {
    console.error("clearAllVectorStoreFiles error:", error);
    throw error;
  }
}

// 스크립트 실행
clearAllVectorStoreFiles()
  .then(() => {
    console.log("스크립트 실행 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("스크립트 실행 실패:", error);
    process.exit(1);
  });
