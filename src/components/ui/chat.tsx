'use client';

import { useState } from 'react';
import { ChatBubble } from "./chat-bubble";
import { Button } from "./button";

export interface Message {
  role: "assistant" | "user";
  content: string;
  id: string;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "hey I am your AI", id: "1" },
    { role: "user", content: "hey I am the user ", id: "2" },
  ]);
  const [inputText, setInputText] = useState('');

  const sources = ["I am source one", "I am source two "];

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: inputText,
        role: "user"
      };
      setMessages([...messages, newMessage]);
      setInputText('');
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: "I'm processing your question. Please wait while I analyze the information.",
          role: "assistant"
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="rounded-2xl border h-[75vh] flex flex-col justify-between">
      <div className="p-6 overflow-auto flex-1">
        {messages.map(({ id, role, content }: Message) => (
          <ChatBubble
            key={id}
            role={role}
            content={content}
            sources={role !== "assistant" ? [] : sources}
          />
        ))}
      </div>
      
      {/* Input Section */}
      <div className="p-6 border-t border-border">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type to chat with AI..."
            className="flex-1 bg-background text-foreground placeholder-muted-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary border border-border"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="px-6 py-3 bg-muted text-foreground hover:bg-muted/80"
          >
            Ask
          </Button>
        </div>
      </div>
    </div>
  );
}

export { ChatBubble } from "./chat-bubble";
export type { ChatBubbleProps } from "./chat-bubble";
