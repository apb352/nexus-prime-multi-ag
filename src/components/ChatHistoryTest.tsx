import { useEffect } from 'react';
import { ChatMessage } from '@/lib/types';
export function ChatHistoryTest() {

export function ChatHistoryTest() {
  const [chatHistory, setChatHistory] = useKV<Record<string, ChatMessage[]>>('nexus-chat-history', {});

  useEffect(() => {
    console.log('=== CHAT HISTORY TEST ===');
    console.log('Current chat history from KV storage:', chatHistory);
    };
    
      const updated = {
        [testAgentId]: [...(current[t
      console.log('Adding test message
    });

    <div className="f
      <div className="space
        {Object.entries(cha
    };

    </div>
}
      const updated = {





    });


  return (
    <div className="fixed bottom-20 left-4 bg-card p-4 rounded border text-xs max-w-sm z-50">
      <h4 className="font-bold mb-2">Chat History Debug</h4>
      <div className="space-y-1">
        <div>Total agents: {Object.keys(chatHistory).length}</div>
        {Object.entries(chatHistory).map(([agentId, messages]) => (
          <div key={agentId} className="text-muted-foreground">
            {agentId}: {messages.length} messages
          </div>
        ))}
      </div>
    </div>
  );
}