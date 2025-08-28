export const parseFeedback = (text) => {
  const nutritionMatch = text.match(
    /1\.\s*영양 밸런스 평가[:\s]*(.*?)(?=2\.|$)/s
  );
  const goodMatch = text.match(/2\.\s*잘하고 있는 점[:\s]*(.*?)(?=3\.|$)/s);
  const improveMatch = text.match(/3\.\s*개선할 점[:\s]*(.*)/s);

  return {
    nutritionBalance: nutritionMatch ? nutritionMatch[1].trim() : "",
    goodPoints: goodMatch ? goodMatch[1].trim() : "",
    improvementPoints: improveMatch ? improveMatch[1].trim() : "",
  };
};
