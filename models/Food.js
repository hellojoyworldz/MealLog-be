import mongoose from "mongoose";
const Schema = mongoose.Schema;
const FoodSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    calories: { type: Number, required: true },
    nutrients: {
      carbs: { type: Number, required: true },
      protein: { type: Number, required: true },
      fat: { type: Number, required: true },
      sugar: { type: Number, required: true },
    },
    amount: { type: Number }, // grams
  },
  { timestamps: true }
);

foodSchema.methods.toJSON = function () {
  const obj = this._doc;
  delete obj.__v;
  delete obj.updatedAt;
  delete obj.createdAt;
  return obj;
};

export default mongoose.model("Food", FoodSchema);
