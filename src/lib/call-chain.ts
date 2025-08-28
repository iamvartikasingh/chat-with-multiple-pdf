// src/lib/call-chain.ts
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { CallbackManager } from "@langchain/core/callbacks/manager";
import { getVectorStore } from "./vector-store";
import { getPineconeClient } from "./pinecone-client";
import { streamingModel, nonStreamingModel } from "./llm";
import { STANDALONE_QUESTION_TEMPLATE, QA_TEMPLATE } from "./prompt-templates";
import type { Document } from "@langchain/core/documents";
import type { BaseRetrieverInterface } from "@langchain/core/retrievers";

type PdfMeta = {
  source?: string;
  fileName?: string;
  page?: number;
  loc?: { pageNumber?: number };
  namespace?: string;
};
type CallChainArgs = { question: string; chatHistory: string };

export async function callChain({ question, chatHistory }: CallChainArgs) {
  const sanitizedQuestion = question.trim().replace(/\s+/g, " ");

  const pinecone = await getPineconeClient();
  const store = await getVectorStore(pinecone);
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const retriever = store.asRetriever({ k: 6 }) as unknown as BaseRetrieverInterface<Record<string, unknown>>;

  const chain = ConversationalRetrievalQAChain.fromLLM(
    streamingModel,
    retriever,
    {
      qaTemplate: QA_TEMPLATE,
      questionGeneratorTemplate: STANDALONE_QUESTION_TEMPLATE,
      returnSourceDocuments: true,
      questionGeneratorChainOptions: { llm: nonStreamingModel },
    }
  );

  const stream = new ReadableStream({
    async start(controller) {
      const callbacks = CallbackManager.fromHandlers({
        handleLLMNewToken: async (token) => {
          controller.enqueue(new TextEncoder().encode(token));
        },
        handleLLMError: async (e) => controller.error(e),
        handleLLMEnd: async () => {
          // no-op; we’ll close after we append sources below
        },
      });

      try {
        const res = await chain.call(
          { question: sanitizedQuestion, chat_history: chatHistory ?? "" },
          { callbacks: [callbacks] }
        );

        // Append sources as JSON after the answer (adjust to your UI)
        const docs = (res?.sourceDocuments ?? []) as Document<PdfMeta>[];
        const sources = docs.slice(0, 4).map((d, i) => ({
          id: i + 1,
          snippet: d.pageContent,
          meta: {
            source: d.metadata?.source ?? d.metadata?.fileName ?? "pdf",
            page: d.metadata?.page ?? d.metadata?.loc?.pageNumber ?? null,
            namespace: d.metadata?.namespace ?? null,
          },
        }));

        controller.enqueue(
          new TextEncoder().encode(`\n\n[SOURCES] ${JSON.stringify(sources)}\n`)
        );
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  // Return a standard streaming response
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}