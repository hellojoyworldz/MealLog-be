import mongoose from "mongoose";
const Schema = mongoose.Schema;
const userSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["male", "female"], required: true },
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    goalCalories: { type: Number, required: true },
    muscleMess: { type: Number },
    bodyFat: { type: Number },
    level: { type: String, default: "customer" }, // customer, admin
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function () {
  const obj = this._doc;
  delete obj.__v;
  delete obj.updatedAt;
  delete obj.createdAt;
  return obj;
};

export default mongoose.model("User", userSchema);
