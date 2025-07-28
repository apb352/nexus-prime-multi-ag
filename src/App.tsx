import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { AgentGrid } from '@/components/AgentGrid';
import { ChatWindow } from '@/components/ChatWindow';
import { ThemeSelector } from '@/components/ThemeSelector';
import { DebugPanel } from '@/components/DebugPanel';
import { EmergencyStop } from '@/components/EmergencyStop';
import { DiscordStatus } from '@/components/DiscordStatus';
import { TestFixes } from '@/test-fixes';
import { useAgents } from '@/hooks/use-agents';
import { AIAgent, ChatWindow as ChatWindowType } from '@/lib/types';

function App() {
  const [chatWindows, setChatWindows] = useKV<ChatWindowType[]>('nexus-chat-windows', []);
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
      autoSpeak: agent.voiceSettings?.autoSpeak ?? false
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

  const handleStopAll = () => {
    // Close all chat windows
    setChatWindows([]);
    // Update all agents to inactive status
    chatWindows.forEach(window => {
      updateAgentStatus(window.agentId, false);
    });
  };

  const handleStopWindow = (windowId: string) => {
    handleCloseWindow(windowId);
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

      <ThemeSelector />
      
      {/* Discord Status */}
      <DiscordStatus className="fixed top-16 right-4 z-50" />
      
      {/* Emergency Stop */}
      <EmergencyStop
        onStopAll={handleStopAll}
        onStopWindow={handleStopWindow}
        activeWindows={chatWindows.map(w => ({
          id: w.id,
          agentName: getAgent(w.agentId)?.name || 'Unknown Agent'
        }))}
      />
      
      {/* Debug toggle - hidden in production */}
      {import.meta.env.DEV && (
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="fixed top-4 right-40 z-50 bg-primary text-primary-foreground px-2 py-1 rounded text-xs"
        >
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </button>
      )}
      
      {/* Main content */}
      <div className="relative z-10">
        <AgentGrid onAgentSelect={handleAgentSelect} />
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
      
      {/* Test fixes component - only in development */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 z-50">
          <TestFixes />
        </div>
      )}
      
      {/* Debug Panel */}
      {showDebug && <DebugPanel />}
    </div>
  );
}

export default App;