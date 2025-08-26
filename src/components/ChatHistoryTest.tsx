import { useEffect, useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { ChatMessage } from '@/lib/types';

export function ChatHistoryTest() {
  const [chatHistory, setChatHistory] = useKV<Record<string, ChatMessage[]>>('nexus-chat-history', {});
  const [storageKeys, setStorageKeys] = useState<string[]>([]);
  const [forceRefresh, setForceRefresh] = useState(0);

  useEffect(() => {
    console.log('=== CHAT HISTORY TEST ===');
    console.log('Current chat history from KV storage:', chatHistory);
    console.log('Keys in chat history:', Object.keys(chatHistory));
    
    // Check what's actually in the KV storage
    const checkStorage = async () => {
      try {
        const keys = await spark.kv.keys();
        setStorageKeys(keys);
        console.log('All KV storage keys:', keys);
        
        // Check specifically for chat history
        const historyData = await spark.kv.get('nexus-chat-history');
        console.log('Direct KV get result for nexus-chat-history:', historyData);
      } catch (error) {
        console.error('Error checking storage:', error);
      }
    };
    
    checkStorage();
  }, [chatHistory, forceRefresh]);

  const clearAllHistory = async () => {
    try {
      await spark.kv.delete('nexus-chat-history');
      // Also clear all welcome shown flags
      const keys = await spark.kv.keys();
      for (const key of keys) {
        if (key.startsWith('nexus-welcome-shown-')) {
          await spark.kv.delete(key);
        }
      }
      console.log('Cleared all chat history and welcome flags');
      setForceRefresh(prev => prev + 1); // Force refresh
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const refreshHistory = () => {
    setForceRefresh(prev => prev + 1);
  };

  return (
    <div className="fixed bottom-20 left-4 bg-card p-4 rounded border text-xs max-w-sm z-50 max-h-80 overflow-y-auto">
      <h4 className="font-bold mb-2">Chat History Debug</h4>
      <button 
        onClick={clearAllHistory}
        className="mb-2 px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs mr-2"
      >
        Clear All History
      </button>
      <button 
        onClick={refreshHistory}
        className="mb-2 px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
      >
        Refresh
      </button>
      <div className="space-y-1">
        <div>Storage keys: {storageKeys.length}</div>
        <div>Chat agents: {Object.keys(chatHistory).length}</div>
        {Object.entries(chatHistory).map(([agentId, messages]) => (
          <div key={agentId} className="text-muted-foreground">
            {agentId}: {messages.length} messages
            {messages.slice(-1).map(msg => (
              <div key={msg.id} className="ml-2 text-xs truncate">
                "{msg.content.substring(0, 30)}..."
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}