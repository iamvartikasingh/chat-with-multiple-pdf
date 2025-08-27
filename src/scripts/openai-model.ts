import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function main() {
  try {
    const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
    console.log("🔍 Testing embeddings with model:", model);

    const res = await client.embeddings.create({
      model,
      input: "hello world",
    });

    console.log("✅ Success! Embedding dimension:", res.data[0].embedding.length);
  } catch (e) {
    console.error("❌ Embeddings test failed:", e);
    process.exit(1);
  }
}

main();