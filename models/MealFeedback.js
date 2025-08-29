import mongoose from "mongoose";
const Schema = mongoose.Schema;

const MealFeedbackSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mealIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Meal" }], // 연결된 식단(하루 또는 일주일치)
    mode: { type: String, enum: ["daily", "weekly"], required: true },
    date: { type: Date, default: null }, // 피드백 생성 시 기본값 null, 필수 아님
    feedback: {
      nutritionBalance: { type: String }, // 영양 밸런스 평가
      goodPoints: { type: String }, // 잘하고 있는 점
      improvementPoints: { type: String }, // 보완할 점
    },
    type: {
      type: String,
      enum: ["all", "breakfast", "lunch", "dinner", "snack"],
      default: "all",
    },
  },
  { timestamps: true }
);

MealFeedbackSchema.methods.toJSON = function () {
  const obj = this._doc;
  delete obj.__v;
  delete obj.updatedAt;
  return obj;
};

export default mongoose.model("MealFeedback", MealFeedbackSchema);
