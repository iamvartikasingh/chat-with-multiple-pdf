import { Chat } from '@/components/ui/chat';
import { ThemeToggle } from './components/theme-toggle';

export default function Home() {
  return (
    <main className="relative container flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <span className="font-bold text-2xl">pdf-chat-ai-sdk</span>
          <ThemeToggle />
        </div>
        <Chat />
      </div>
    </main>
  );
}
