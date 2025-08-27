import { Pinecone } from "@pinecone-database/pinecone";
import { env, pineconeRegion } from "./config";
import { delay } from "./utils";

let pineconeClientInstance: Pinecone | null = null;

async function createIndex(client: Pinecone, indexName: string) {
  try {
    await client.createIndex({
      name: indexName,
      dimension: 1536,
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "gcp",
          region: pineconeRegion, // <- e.g., "us-east1"
        },
      },
    });

    console.log(`Waiting ${env.INDEX_INIT_TIMEOUT}ms for index to initialize...`);
    await delay(env.INDEX_INIT_TIMEOUT);
    console.log("Index created ✅");
  } catch (error) {
    console.error("Index creation error:", error);
    throw new Error("Index creation failed");
  }
}

async function initPineconeClient() {
  try {
    const client = new Pinecone({ apiKey: env.PINECONE_API_KEY });

    const indexName = env.PINECONE_INDEX_NAME;
    const existing = await client.listIndexes();
    const exists = existing.indexes?.some((i) => i.name === indexName);

    if (!exists) {
      await createIndex(client, indexName);
    } else {
      console.log("Index already exists ✅");
    }

    return client;
  } catch (error) {
    console.error("Pinecone init error:", error);
    throw new Error("Failed to initialize Pinecone Client");
  }
}

export async function getPineconeClient() {
  if (!pineconeClientInstance) {
    pineconeClientInstance = await initPineconeClient();
  }
  return pineconeClientInstance;
}