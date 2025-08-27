import User from "../models/User.js";

const userController = {};

userController.createUser = async (req, res) => {
  try {
    let {
      email,
      name,
      level,
      birthDate,
      gender,
      goalWeight,
      goalCalories,
      muscleMass,
      height,
      weight,
      bodyFat,
      picture,
      status,
    } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      throw new Error("이미 존재하는 사용자입니다.");
    }
    const newUser = new User({
      email,
      name,
      level: level ? level : "customer",
      birthDate,
      gender,
      goalWeight,
      goalCalories,
      muscleMass,
      height,
      weight,
      bodyFat,
      picture,
      status: status ? status : "pending",
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

userController.updateUser = async (req, res) => {
  try {
    const { userId } = req;
    const updateFields = {};
    const allowedFields = [
      "gender",
      "goalWeight",
      "goalCalories",
      "muscleMass",
      "height",
      "weight",
      "bodyFat",
      "picture",
    ];

    // body에 들어온 값만 updateFields에 추가
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    //유저 정보 업데이트
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { ...updateFields, status: "active" } },
      { new: true, runValidators: true } // new:true 업데이트된 데이터를 반환, runValidators:true 검증을 강제함
    );

    if (!updatedUser) {
      throw new Error("유저가 존재하지 않습니다");
    }

    return res.status(200).json({ status: "success", user: updatedUser });
  } catch (error) {
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

userController.deleteUser = async (req, res) => {
  try {
    const { userId } = req;
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      throw new Error("유저가 존재하지 않습니다.");
    }
    return res.status(200).json({ status: "success" });
  } catch (error) {
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

export default userController;
