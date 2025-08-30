import mongoose from "mongoose";
const Schema = mongoose.Schema;
const MealSchema = new Schema(
  {
    userId: { type: String, required: true },
    date: { type: Date, required: true },
    type: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      required: true,
    },
    foods: [
      {
        num: { type: Number, required: true }, // 음식 수량
        name: { type: String, required: true }, // 음식 이름
        amount: { type: Number, required: true }, // 섭취량 (그램)
        calories: { type: Number, required: true }, // 칼로리
        nutrients: {
          carbs: { type: Number, required: true }, // 탄수화물
          protein: { type: Number, required: true }, // 단백질
          fat: { type: Number, required: true }, // 지방
          sugar: { type: Number, required: true }, // 당류
        },
      },
    ],
    photo: { type: String }, // 이미지 URL주소
    memo: { type: String }, // 식사 메모
    vectorFileId: { type: String }, // 벡터 파일 ID
  },
  { timestamps: true }
);

MealSchema.index({ userId: 1, date: 1 });
MealSchema.index({ userId: 1, date: 1, type: 1 }, { unique: true });

MealSchema.methods.toJSON = function () {
  const obj = this._doc;
  delete obj.__v;
  delete obj.updatedAt;
  delete obj.createdAt;
  return obj;
};

export default mongoose.model("Meal", MealSchema);
