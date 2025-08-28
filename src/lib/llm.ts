// src/lib/llm.ts
import { ChatOpenAI } from "@langchain/openai";

export const streamingModel = new ChatOpenAI({
  modelName: "gpt-4o-mini", // or gpt-4o if you have access
  streaming: true,
  temperature: 0,
});

export const nonStreamingModel = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  streaming: false,
  temperature: 0,
});