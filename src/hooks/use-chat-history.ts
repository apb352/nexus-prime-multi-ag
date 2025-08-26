import { useKV } from '@github/spark/hooks';
import { ChatMessage } from '@/lib/types';

export function useChatHistory() {
  const [chatHistory, setChatHistory] = useKV<Record<string, ChatMessage[]>>('nexus-chat-history', {});

  const addMessage = (agentId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: Date.now()
    };

    setChatHistory((currentHistory) => ({
      ...currentHistory,
      [agentId]: [...(currentHistory[agentId] || []), newMessage]
    }));

    return newMessage;
  };

  const getAgentHistory = (agentId: string): ChatMessage[] => {
    return chatHistory[agentId] || [];
  };

  const clearAgentHistory = (agentId: string) => {
    setChatHistory((currentHistory) => {
      const newHistory = { ...currentHistory };
      delete newHistory[agentId];
      return newHistory;
    });
  };

  const clearAllHistory = () => {
    setChatHistory({});
  };

  return {
    chatHistory,
    addMessage,
    getAgentHistory,
    clearAgentHistory,
    clearAllHistory
  };
}