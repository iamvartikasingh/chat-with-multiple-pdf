import Balancer from "react-wrap-balancer";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ReactMarkdown from "react-markdown";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  createdAt: Date;
}

export interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

const ChatBubble = ({ role, content, sources = [] }: ChatBubbleProps) => {
  const isAI = role === "assistant";
  
  return (
    <div className={`flex ${isAI ? "justify-start" : "justify-end"} mb-4`}>
      <Card className={`max-w-xs lg:max-w-md ${
        isAI 
          ? "bg-card border-l-4 border-l-primary" 
          : "bg-primary text-primary-foreground"
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isAI
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary-foreground text-primary"
              }`}
            >
              {isAI ? "AI" : "U"}
            </div>
            <div className="text-sm font-medium">
              {isAI ? "AI Assistant" : "You"}
            </div>
          </div>
          
          <div className="text-sm leading-relaxed">
            {isAI ? (
              <Balancer>
                <ReactMarkdown>
                  {content}
                </ReactMarkdown>
              </Balancer>
            ) : (
              <Balancer>
                {content}
              </Balancer>
            )}
          </div>
          
          {isAI && sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">Sources:</div>
              <Accordion type="multiple" className="w-full">
                {sources.map((source, index) => (
                  <AccordionItem key={index} value={`source-${index}`} className="border-none">
                    <AccordionTrigger className="text-xs text-foreground hover:no-underline py-1">
                      <span className="underline">Source {index + 1}</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                      <div className="text-xs text-foreground bg-muted px-3 py-2 rounded">
                        {source}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { ChatBubble };
