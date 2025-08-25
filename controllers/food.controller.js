const foodController = {};

foodController.getFoodData = async (req, res) => {
  try {
    const { page = 1, name, menu } = req.query;
    const SERVICE_KEY =
      "Va8g%2BwrI2rBylM2BYEtI2nMGQz0tlWWqvFNg6SiQlqZaMizJqW9jQ15LoKxKTXWaPCs7eqiADX3QMVswr8DMLQ%3D%3D";

    const url = `https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02?serviceKey=${SERVICE_KEY}&pageNo=${page}&numOfRows=10&type=json`;

    const response = await fetch(url);
    const data = await response.json();

    // 변환 로직
    const transformedItems = data.body.items.map((item) => {
      const servingSize = parseFloat(item.Z10500 || "0"); // 1인분(g)
      if (!servingSize || isNaN(servingSize)) return item;

      const factor = servingSize / 100; // 100g → 1인분 변환 비율
      const nutritionPerServing = {};

      // AMT_NUM1~AMT_NUM157 반복 변환
      for (let i = 1; i <= 157; i++) {
        const key = `AMT_NUM${i}`;
        if (item[key] !== undefined && item[key] !== null) {
          nutritionPerServing[key] = (parseFloat(item[key]) * factor).toFixed(
            2
          );
        }
      }

      return {
        ...item,
        nutritionPerServing,
      };
    });

    res.json({
      ...data,
      body: {
        ...data.body,
        items: transformedItems,
      },
    });
  } catch (error) {
    console.error("식품 API 에러:", error);
    res.status(500).json({ error: "API 호출 실패" });
  }
};

export default foodController;
