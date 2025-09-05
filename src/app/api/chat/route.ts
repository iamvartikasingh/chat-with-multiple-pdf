// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { callChain } from "@/lib/langchain";
import type { Message } from "@/components/ui/chat"; // type-only is fine

// If you want to avoid importing from a client file, define Message here or move it to src/types/chat.ts

type ChatRequestBody = {
  message?: string;
  input?: string;
  messages?: Message[];
  chatHistory?: string;
};

const formatMessage = (m: Message) =>
  `${m.role === "user" ? "Human" : "Assistant"}: ${m.content}`;

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : null;

  const lastContent =
    (messages && messages[messages.length - 1]?.content) ??
    (typeof body.message === "string" ? body.message : null) ??
    (typeof body.input === "string" ? body.input : null);

  if (!lastContent || !lastContent.trim()) {
    return NextResponse.json(
      { error: "No question provided. Send { message: string } or { messages: Message[] }." },
      { status: 400 }
    );
  }

  const chatHistory =
    messages?.slice(0, -1).map(formatMessage).join("\n") ??
    (typeof body.chatHistory === "string" ? body.chatHistory : "");

  try {
    const res = await callChain({ question: lastContent, chatHistory });

    // Pass through a Response/stream if callChain returns one
    if (res && typeof res === "object" && "body" in res && "headers" in res) {
      return res as Response;
    }
    return NextResponse.json({ answer: res }, { status: 200 });
  } catch (err) {
    console.error("[/api/chat] error:", err);
    return NextResponse.json({ error: "Something went wrong. Try again!" }, { status: 500 });
  }
}