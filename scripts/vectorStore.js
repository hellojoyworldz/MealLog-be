import openai from "../utils/openai.js";

async function createVectorStore() {
  const vs = await openai.vectorStores.create({
    name: "meal-log",
  });

  console.log("Vector Store created:", vs.id);
}

createVectorStore();
