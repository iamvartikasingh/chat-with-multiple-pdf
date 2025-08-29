// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { callChain } from "@/lib/langchain"; // make sure this path matches your project

// Minimal, SDK-v5-compatible incoming message type
type IncomingMessage = {
  id?: string;
  role: "user" | "assistant" | "system" | "tool";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: string; [k: string]: unknown } // ignore non-text parts
      >;
};

// Convert v5 message content to plain text
/* eslint-disable @typescript-eslint/no-explicit-any */
function toText(m: IncomingMessage) {
    if (typeof m.content === "string") return m.content;
    return m.content.map((p) => (p as any).text).join(" ").trim();
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

const formatMessage = (m: IncomingMessage) =>
  `${m.role === "user" ? "Human" : "Assistant"}: ${toText(m)}`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages: IncomingMessage[] = body.messages ?? [];

  const formattedPrevious = messages.slice(0, -1).map(formatMessage).join("\n");
  const last = messages[messages.length - 1];
  const question = last ? toText(last) : "";

  if (!question) {
    return NextResponse.json("Error: No question in the request", { status: 400 });
  }

  try {
    return await callChain({ question, chatHistory: formattedPrevious });
  } catch (error) {
    console.error("Internal server error", error);
    return NextResponse.json("Error: Something went wrong. Try again!", { status: 500 });
  }
}