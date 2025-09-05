import { NextRequest, NextResponse } from "next/server";
import { callChain } from "@/lib/langchain";
import type { Message } from "@/components/ui/chat";

export const runtime = "nodejs";

type ChatRequestBody = {
  message?: string;
  input?: string;
  question?: string;
  messages?: Message[];
  chatHistory?: string;
};

const formatMessage = (m: Message) =>
  `${m.role === "user" ? "Human" : "Assistant"}: ${m.content}`;

export async function POST(req: NextRequest) {
  const rid = Math.random().toString(36).slice(2, 8);
  console.log(`[route:${rid}] incoming`, {
    method: req.method,
    ct: req.headers.get("content-type"),
    NODE_ENV: process.env.NODE_ENV,
    PORT_HINT: process.env.PORT,
  });

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
    console.log("[/api/chat] raw body:", body);
  } catch (err: unknown) {
    console.error(`[route:${rid}] invalid json`, err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : null;

  const lastContent =
    messages?.[messages.length - 1]?.content ??
    (typeof body.message === "string" ? body.message : null) ??
    (typeof body.question === "string" ? body.question : null) ??
    (typeof body.input === "string" ? body.input : null);

  console.log(`[route:${rid}] parsed`, {
    hasMessagesArray: Boolean(messages),
    messagesLen: messages?.length ?? 0,
    lastContentLen: lastContent?.length ?? 0,
  });

  if (!lastContent?.trim()) {
    return NextResponse.json(
      { error: "No question provided. Send { message } or { messages: Message[] }." },
      { status: 400 }
    );
  }

  const chatHistory =
    messages?.slice(0, -1).map(formatMessage).join("\n") ??
    (typeof body.chatHistory === "string" ? body.chatHistory : "");

  try {
    console.log(`[route:${rid}] calling LLM…`, {
      hasOPENAI: Boolean(process.env.OPENAI_API_KEY),
      runtime: process.env.NEXT_RUNTIME ?? "node",
    });

    const res = await callChain({ question: lastContent, chatHistory });

    // Prefer a proper type guard instead of duck-typing with 'any'
    if (res instanceof Response) {
      console.log(`[route:${rid}] LLM stream ok`);
      return res;
    }

    console.log(`[route:${rid}] LLM ok (json)`);
    return NextResponse.json({ answer: res }, { status: 200 });
  } catch (err: unknown) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error(`[route:${rid}] LLM FAILED`, {
      name: e.name,
      message: e.message,
      stack: e.stack,
    });
    return NextResponse.json(
      process.env.NODE_ENV === "development"
        ? { error: "LLM call failed", name: e.name, message: e.message }
        : { error: "LLM call failed" },
      { status: 500 }
    );
  }
}