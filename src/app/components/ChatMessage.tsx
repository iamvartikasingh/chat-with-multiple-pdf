interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isAI = message.sender === 'ai';
  
  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg ${
          isAI
            ? 'bg-gray-700 text-white border-l-4 border-blue-500'
            : 'bg-blue-600 text-white'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            isAI ? 'bg-blue-500' : 'bg-white text-blue-600'
          }`}>
            {isAI ? 'AI' : 'U'}
          </div>
          <div className="text-sm font-medium">
            {isAI ? 'AI Assistant' : 'You'}
          </div>
        </div>
        <div className="text-sm leading-relaxed">{message.text}</div>
        <div className="text-xs text-gray-400 mt-2 text-right">
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}
