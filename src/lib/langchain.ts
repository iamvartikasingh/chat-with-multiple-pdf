import { ConversationalRetrievalQAChain } from "langchain/chains";
import { CallbackManager } from "@langchain/core/callbacks/manager";
import type { BaseRetrieverInterface } from "@langchain/core/retrievers";
import type { Document } from "@langchain/core/documents";

import { getVectorStore } from "./vector-store";
import { getPineconeClient } from "./pinecone-client";
import { streamingModel, nonStreamingModel } from "./llm";
import { STANDALONE_QUESTION_TEMPLATE, QA_TEMPLATE } from "./prompt-templates";

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
  const pine = await getPineconeClient();
  const store = await getVectorStore(pine);
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

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const callbacks = CallbackManager.fromHandlers({
        handleLLMNewToken: async (t) => controller.enqueue(enc.encode(t)),
        handleLLMError: async (err) => controller.error(err),
      });

      try {
        const res = await chain.call(
          { question: sanitizedQuestion, chat_history: chatHistory ?? "" },
          { callbacks: [callbacks] }
        );

        const docs = (res?.sourceDocuments ?? []) as Document<PdfMeta>[];
        const sources = docs.slice(0, 4).map((d, i) => ({
          id: i + 1,
          snippet: d.pageContent,
          meta: {
            source: d.metadata.source ?? d.metadata.fileName ?? "pdf",
            page: d.metadata.page ?? d.metadata.loc?.pageNumber ?? null,
            namespace: d.metadata.namespace ?? null,
          },
        }));

        controller.enqueue(enc.encode(`\n\n[SOURCES] ${JSON.stringify(sources)}\n`));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}