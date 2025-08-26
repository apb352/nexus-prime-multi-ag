import { useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { ChatMessage } from '@/lib/types';

export function ChatHistoryTest() {
  const [chatHistory, setChatHistory] = useKV<Record<string, ChatMessage[]>>('nexus-chat-history', {});

  useEffect(() => {
    console.log('=== CHAT HISTORY TEST ===');
    console.log('Current chat history from KV storage:', chatHistory);
  }, [chatHistory]);

  return (
    <div className="bg-card p-2 rounded border text-xs">
      <div className="text-card-foreground">Chat History Test</div>
      <div className="text-muted-foreground">
        Keys: {Object.keys(chatHistory).length}
      </div>
    </div>
  );
}