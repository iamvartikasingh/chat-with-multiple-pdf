import { env } from "./config";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { Document } from "@langchain/core/documents";

export async function embedAndStoreDocs(
    client: Pinecone,
    docs: Document[]
  ) {
    try {
        const embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-small",   // <-- was ada-002
          });
      const index = client.index(env.PINECONE_INDEX_NAME); // ✅ v2 uses .index()
  
      await PineconeStore.fromDocuments(docs, embeddings, {
        pineconeIndex: index,
        textKey: "text",
      });
    } catch (error) {
      console.error("error", error);
      throw new Error("Failed to load your docs!");
    }
  }
  
  export async function getVectorStore(client: Pinecone) {
    try {
      const embeddings = new OpenAIEmbeddings();
      const index = client.index(env.PINECONE_INDEX_NAME); // ✅
  
      const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex: index,
        textKey: "text",
      });
  
      return vectorStore;
    } catch (error) {
      console.error("error", error);
      throw new Error("Something went wrong while getting vector store!");
    }
  }