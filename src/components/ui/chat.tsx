"use client";

import { useEffect, useRef, useState } from "react";
import { ChatBubble } from "./chat-bubble";
import { Button } from "./button";

export interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: "Hi! Ask me about your PDF." },
  ]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // sources for the last assistant message
  const [lastSources, setLastSources] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, lastSources]);

  async function sendToApi(question: string) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // send the shape your route expects
      body: JSON.stringify({ message: question, chatHistory: "" }),
    });
  
    const ct = res.headers.get("content-type") || "";
    if (!res.ok || ct.includes("text/html")) {
      throw new Error("API route not found or returned HTML. Check src/app/api/chat/route.ts");
    }
    if (!res.body) {
      throw new Error("No response body (stream). Ensure your API returns a StreamingTextResponse.");
    }
  
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
  
    // placeholder assistant bubble to stream into
    const aiId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: aiId, role: "assistant", content: "" }]);
  
    let fullText = "";
  
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
  
      // live-append tokens
      setMessages((prev) =>
        prev.map((m) => (m.id === aiId ? { ...m, content: (m.content ?? "") + chunk } : m))
      );
    }
  
    // --- cleanup & sources extraction (single block) ---
    let answerText = fullText;
    const sourcesMatch = fullText.match(/\[SOURCES\]\s*(\[[\s\S]*\])\s*$/);
    if (sourcesMatch) {
      // remove the trailing sources JSON from the visible message
      answerText = fullText.replace(sourcesMatch[0], "").trim();
      try {
        const parsed = JSON.parse(sourcesMatch[1]) as Array<{ snippet?: string; meta?: { source?: string } }>;
        setLastSources(parsed.map((p, i) => p?.snippet || p?.meta?.source || `Source ${i + 1}`));
      } catch {
        // ignore parse errors
      }
    }
  
    // finalize the assistant bubble with just the summary text
    setMessages((prev) =>
      prev.map((m) => (m.id === aiId ? { ...m, content: answerText } : m))
    );
  }
  async function handleSendMessage() {
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setLastSources([]);

    // push user message
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
    setInputText("");

    try {
      await sendToApi(text);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry—something went wrong while contacting the server.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  return (
    <div className="rounded-2xl border h-[75vh] flex flex-col justify-between">
      <div ref={containerRef} className="p-6 overflow-auto flex-1">
        {messages.map(({ id, role, content }, idx) => (
          <ChatBubble
            key={id}
            role={role}
            content={content}
            // show sources only on the last assistant message
            sources={role === "assistant" && idx === messages.length - 1 ? lastSources : []}
          />
        ))}
      </div>

      <div className="p-6 border-t border-border">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type to chat with AI..."
            className="flex-1 bg-background text-foreground placeholder-muted-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary border border-border"
          />
          <Button onClick={handleSendMessage} disabled={!inputText.trim() || isSending} className="px-6 py-3">
            {isSending ? "Thinking…" : "Ask"}
          </Button>
        </div>
      </div>
    </div>
  );
}