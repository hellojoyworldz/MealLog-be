import dotenv from "dotenv";
dotenv.config();
import User from "../models/User.js";
// import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const authController = {};

authController.loginWithGoogle = async (req, res) => {
  try {
    const { token } = req.body;
    // const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
    // const ticket = await googleClient.verifyIdToken({
    //   idToken: token,
    //   audience: GOOGLE_CLIENT_ID,
    // });
    // const { email, name } = ticket.getPayload();

    // 구글 로그인 access_token을 받아 검증하는 로직으로 변경
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`
    );
    const userInfo = await userInfoResponse.json();
    const { email, name, picture, verified_email } = userInfo;

    if (!verified_email) {
      throw new Error("구글 이메일이 인증되지 않았습니다.");
    }

    console.log("구글 로그인 성공", email, name);

    let user = await User.findOne({ email });
    if (!user) {
      //유저를 새로 생성
      user = new User({
        email,
        name,
        picture,
      });
      await user.save();
      console.log("새로운 유저 생성", user);
    }

    // 유저 정보 업데이트
    if (user.name !== name || user?.picture !== picture) {
      user.name = name;
      user.picture = picture;
      await user.save();
    }

    //토큰 발행 리턴
    const sessionToken = await user.generateToken();
    res.status(200).json({ status: "success", user, token: sessionToken });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

authController.authenticate = (req, res, next) => {
  try {
    const tokenString = req.headers.authorization;
    if (!tokenString) throw new Error("토큰이 없습니다.");

    const token = tokenString.replace("Bearer ", "");
    const payload = jwt.verify(token, JWT_SECRET_KEY);
    console.log("payload: ", payload);

    req.userId = payload._id; // payload에서 유저 id 꺼내고
    next(); // 인증 성공하면 다음 미들웨어
  } catch (error) {
    res
      .status(401)
      .json({ status: "fail", error: "인증 실패: " + error.message });
  }
};

export default authController;
