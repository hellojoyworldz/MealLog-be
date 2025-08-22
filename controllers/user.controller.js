import User from "../models/User.js";

const userController = {};

userController.createUser = async (req, res) => {
  try {
    let {
      email,
      name,
      level,
      age,
      gender,
      goalWeight,
      goalCalories,
      muscleMass,
      height,
      weight,
    } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      throw new Error("이미 존재하는 사용자입니다.");
    }
    const newUser = new User({
      email,
      name,
      level: level ? level : "customer",
      age,
      gender,
      height,
      weight,
      muscleMass,
      goalWeight,
      goalCalories,
    });
    await newUser.save();

    return res.status(200).json({ status: "success" });
  } catch (error) {
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

userController.getUser = async (req, res) => {
  try {
    const { userId } = req;
    const user = await User.findById(userId);
    if (user) {
      return res.status(200).json({ status: "success", user });
    }
    throw new Error("유효하지 않은 토큰입니다.");
  } catch (error) {
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

export default userController;
