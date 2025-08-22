import mongoose from "mongoose";
const Schema = mongoose.Schema;
const userSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number },
    gender: { type: String, enum: ["male", "female"] },
    height: { type: Number },
    weight: { type: Number },
    goalCalories: { type: Number },
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
