const foodController = async (req, res) => {
  try {
    const SERVICE_KEY =
      "Va8g%2BwrI2rBylM2BYEtI2nMGQz0tlWWqvFNg6SiQlqZaMizJqW9jQ15LoKxKTXWaPCs7eqiADX3QMVswr8DMLQ%3D%3D";
    const url = `https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=10&type=json`;

    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("식품 API 에러:", error);
    res.status(500).json({ error: "API 호출 실패" });
  }
};

export default foodController;
