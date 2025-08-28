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
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, lastSources]);

  async function sendToApi(question: string) {
    // POST to your Next.js route that calls callChain()
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, chatHistory: "" }),
    });

    if (!res.body) {
      throw new Error("No response body");
    }

    // stream plain text; parse trailing [SOURCES] JSON if present
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    // add placeholder assistant msg we will append to
    const aiId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: aiId, role: "assistant", content: "" }]);

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;

      // live-update the last assistant message
      setMessages((prev) =>
        prev.map((m) => (m.id === aiId ? { ...m, content: (m.content || "") + chunk } : m))
      );
    }

    // Try to extract trailing sources line: \n\n[SOURCES] [...]
    const match = fullText.match(/\[SOURCES\]\s*(\[[\s\S]*\])\s*$/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]) as Array<{ snippet: string }>;
        setLastSources(parsed.map((p) => p.snippet));
      } catch {
        // ignore parse errors
      }
    }
  }

  async function handleSendMessage() {
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setLastSources([]);

    // push user message
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    try {
      await sendToApi(text);
    } catch (e) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry—something went wrong while contacting the server.",
      };
      setMessages((prev) => [...prev, errMsg]);
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