import { useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
export function ChatHistoryTest() {

export function ChatHistoryTest() {
  const [chatHistory, setChatHistory] = useKV<Record<string, ChatMessage[]>>('nexus-chat-history', {});

  useEffect(() => {
    console.log('=== CHAT HISTORY TEST ===');
    console.log('Current chat history from KV storage:', chatHistory);
          </div>

  );







          </div>



  );
