import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const Schema = mongoose.Schema;
const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    picture: { type: String },
    age: { type: Number },
    gender: { type: String, enum: ["male", "female"] },
    height: { type: Number },
    weight: { type: Number },
    muscleMess: { type: Number },
    bodyFat: { type: Number },
    goalWeight: { type: Number },
    goalCalories: { type: Number },
    level: { type: String, default: "customer" }, // customer, admin
    status: {
      type: String,
      enum: ["pending", "active"],
      default: "pending",
    },
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

userSchema.methods.generateToken = function () {
  const token = jwt.sign({ _id: this.id }, JWT_SECRET_KEY, {
    //몽고db에 있는 _id 사용
    expiresIn: "1d",
  });
  return token;
};

export default mongoose.model("User", userSchema);
