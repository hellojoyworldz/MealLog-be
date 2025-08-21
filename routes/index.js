
import express from "express";
import foodApi from "./food.api.js";  

const router = express.Router();

router.use("/food", foodApi);

export default router;   
