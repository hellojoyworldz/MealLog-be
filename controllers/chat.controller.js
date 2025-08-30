import Chat from "../models/Chat.js";
const chatController = {};

chatController.getChatHistory = async (req, res) => {
  try {
    const userId = req.userId;

    const chats = await Chat.find({ userId }).sort({ timestamp: -1 }).lean();
    chats.reverse();

    res.status(200).json({ status: "success", data: chats });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

export default chatController;
