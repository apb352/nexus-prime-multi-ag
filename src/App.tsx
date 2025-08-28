import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { AgentGrid } from '@/components/AgentGrid';
import { ChatWindow } from '@/components/ChatWindow';
import { GroupChatWindow } from '@/components/GroupChatWindow';
import { CreateGroupChatDialog } from '@/components/CreateGroupChatDialog';
import { TopNavigation } from '@/components/TopNavigation';
import { DebugPanel } from '@/components/DebugPanel';
import { SimpleTestComponent } from '@/components/SimpleTestComponent';
import { ChatHistoryTest } from '@/components/ChatHistoryTest';
import { VoiceSettingsTest } from '@/components/VoiceSettingsTest';
import { VoiceSettingsDebug } from '@/components/VoiceSettingsDebug';
import { FileShareTest } from '@/components/FileShareTest';
import { useAgents } from '@/hooks/use-agents';
import { windowManager } from '@/lib/window-manager';
import { AIAgent, ChatWindow as ChatWindowType, GroupChat } from '@/lib/types';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const [chatWindows, setChatWindows] = useKV<ChatWindowType[]>('nexus-chat-windows', []);
  const [groupChats, setGroupChats] = useKV<GroupChat[]>('nexus-group-chats', []);
  const [showDebug, setShowDebug] = useState(false);
  const { agents, updateAgentStatus, updateAgent, getAgent } = useAgents();

  const handleAgentSelect = (agent: AIAgent) => {
    // Check if window already exists
    const existingWindow = chatWindows.find(w => w.agentId === agent.id);
    
    if (existingWindow) {
      // Bring to front and unminimize if minimized
      setChatWindows((windows) =>
        windows.map(w =>
          w.id === existingWindow.id
            ? { ...w, isMinimized: false }
            : w
        )
      );
      return;
    }

    // Create new chat window
    const newWindow: ChatWindowType = {
      id: `${agent.id}-${Date.now()}`,
      agentId: agent.id,
      position: {
        x: 100 + (chatWindows.length * 50),
        y: 100 + (chatWindows.length * 50)
      },
      size: { width: 400, height: 600 },
      isMinimized: false,
      selectedModel: 'gpt-4o',
      voiceEnabled: agent.voiceSettings?.enabled ?? false,
      autoSpeak: agent.voiceSettings?.autoSpeak ?? false,
      imageEnabled: agent.imageSettings?.enabled ?? false,
      showCanvas: false
    };

    setChatWindows((windows) => [...windows, newWindow]);
    updateAgentStatus(agent.id, true);
  };

  const handleCloseWindow = (windowId: string) => {
    const window = chatWindows.find(w => w.id === windowId);
    if (window) {
      // Check if this is the last window for this agent
      const agentWindows = chatWindows.filter(w => w.agentId === window.agentId);
      if (agentWindows.length === 1) {
        updateAgentStatus(window.agentId, false);
      }
    }

    setChatWindows((windows) => windows.filter(w => w.id !== windowId));
  };

  const handleMinimizeWindow = (windowId: string) => {
    setChatWindows((windows) =>
      windows.map(w =>
        w.id === windowId ? { ...w, isMinimized: !w.isMinimized } : w
      )
    );
  };

  const handleUpdatePosition = (windowId: string, position: { x: number; y: number }) => {
    setChatWindows((windows) =>
      windows.map(w =>
        w.id === windowId ? { ...w, position } : w
      )
    );
  };

  const handleCreateGroupChat = (groupChat: GroupChat) => {
    setGroupChats((current) => [...current, groupChat]);
  };

  const handleCloseGroupChat = (groupChatId: string) => {
    setGroupChats((current) => current.filter(gc => gc.id !== groupChatId));
  };

  const handleMinimizeGroupChat = (groupChatId: string) => {
    setGroupChats((current) =>
      current.map(gc =>
        gc.id === groupChatId ? { ...gc, isMinimized: !gc.isMinimized } : gc
      )
    );
  };

  const handleUpdateGroupChatPosition = (groupChatId: string, position: { x: number; y: number }) => {
    setGroupChats((current) =>
      current.map(gc =>
        gc.id === groupChatId ? { ...gc, position } : gc
      )
    );
  };

  const handleUpdateGroupChatSize = (groupChatId: string, size: { width: number; height: number }) => {
    setGroupChats((current) =>
      current.map(gc =>
        gc.id === groupChatId ? { ...gc, size } : gc
      )
    );
  };

  const handleUpdateGroupChat = (groupChatId: string, updates: Partial<GroupChat>) => {
    setGroupChats((current) =>
      current.map(gc =>
        gc.id === groupChatId ? { ...gc, ...updates } : gc
      )
    );
  };

  const handleStopAll = () => {
    console.log('Emergency stop all triggered');
    
    // Force stop all ongoing operations in all windows
    windowManager.forceStopAllWindows();
    
    // Update all agents to inactive status using current windows
    setChatWindows((currentWindows) => {
      console.log('Stopping', currentWindows.length, 'windows');
      
      // First update agent statuses
      currentWindows.forEach(window => {
        updateAgentStatus(window.agentId, false);
      });
      // Then clear all windows
      return [];
    });
    
    // Clear all group chats too
    setGroupChats([]);
    
    // Show confirmation toast
    toast.success('Emergency stop activated - all AI operations stopped');
  };

  const handleStopWindow = (windowId: string) => {
    console.log('Emergency stop window triggered for:', windowId);
    
    // Check if it's a regular chat window or group chat
    const isGroupChat = groupChats.some(gc => gc.id === windowId);
    const isChatWindow = chatWindows.some(w => w.id === windowId);
    
    if (isGroupChat) {
      // Force stop operations in specific group chat
      windowManager.forceStopWindow(windowId);
      handleCloseGroupChat(windowId);
      toast.success('Group chat stopped and closed');
    } else if (isChatWindow) {
      // Force stop operations in specific window
      windowManager.forceStopWindow(windowId);
      handleCloseWindow(windowId);
      toast.success('Window stopped and closed');
    }
  };

  const handleUpdateSize = (windowId: string, size: { width: number; height: number }) => {
    setChatWindows((windows) =>
      windows.map(w =>
        w.id === windowId ? { ...w, size } : w
      )
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-primary to-transparent animate-matrix-rain" />
        <div className="absolute top-0 left-1/2 w-1 h-full bg-gradient-to-b from-secondary to-transparent animate-matrix-rain" style={{ animationDelay: '1s' }} />
        <div className="absolute top-0 right-1/4 w-1 h-full bg-gradient-to-b from-accent to-transparent animate-matrix-rain" style={{ animationDelay: '2s' }} />
      </div>

      <TopNavigation
        onStopAll={handleStopAll}
        onStopWindow={handleStopWindow}
        activeWindows={[
          ...chatWindows.map(w => ({
            id: w.id,
            agentName: getAgent(w.agentId)?.name || 'Unknown Agent'
          })),
          ...groupChats.map(gc => ({
            id: gc.id,
            agentName: gc.name
          }))
        ]}
        showDebug={showDebug}
        onToggleDebug={import.meta.env.DEV ? () => setShowDebug(!showDebug) : undefined}
      />
      
      {/* Main content */}
      <div className="relative z-10">
        <AgentGrid onAgentSelect={handleAgentSelect} />
        
        {/* Group Chat Button */}
        <div className="fixed top-20 right-4 z-30">
          <CreateGroupChatDialog 
            agents={agents} 
            onCreateGroupChat={handleCreateGroupChat} 
          />
        </div>
      </div>

      {/* Chat windows */}
      {chatWindows.map((window) => {
        const agent = getAgent(window.agentId);
        if (!agent) return null;

        return (
          <ChatWindow
            key={window.id}
            window={window}
            agent={agent}
            onClose={handleCloseWindow}
            onMinimize={handleMinimizeWindow}
            onUpdatePosition={handleUpdatePosition}
            onUpdateSize={handleUpdateSize}
          />
        );
      })}

      {/* Group Chat windows */}
      {groupChats.map((groupChat) => (
        <GroupChatWindow
          key={groupChat.id}
          groupChat={groupChat}
          agents={agents}
          onClose={handleCloseGroupChat}
          onMinimize={handleMinimizeGroupChat}
          onUpdatePosition={handleUpdateGroupChatPosition}
          onUpdateSize={handleUpdateGroupChatSize}
          onUpdateGroupChat={handleUpdateGroupChat}
        />
      ))}
      
      {/* Test fixes component - only in development */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          <SimpleTestComponent />
          <ChatHistoryTest />
          <FileShareTest />
        </div>
      )}
      
      {/* Voice settings debug - only in development */}
      {import.meta.env.DEV && <VoiceSettingsDebug />}
      
      {/* Debug Panel */}
      {showDebug && <DebugPanel />}
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

export default App;