import React from 'react';
import { ChatWindow } from '@/components/ChatWindow';
import { AIAgent, ChatWindow as ChatWindowType } from '@/lib/types';
import { defaultImageSettings } from '@/lib/image-service';

// Test component to verify the currentImageSettings fix
const TestChatWindowFix = () => {
  const testAgent: AIAgent = {
    id: 'test-agent',
    name: 'Test Agent',
    mood: 'friendly',
    color: '#00ff00',
    avatar: null,
    isActive: false,
    voiceSettings: { enabled: false, profile: 'female-1', volume: 1, rate: 1, pitch: 1, autoSpeak: false },
    internetSettings: { enabled: false, autoSearch: false },
    imageSettings: defaultImageSettings,
    workingMemory: '',
    lastUpdate: Date.now()
  };

  const testWindow: ChatWindowType = {
    id: 'test-window',
    agentId: 'test-agent',
    position: { x: 100, y: 100 },
    size: { width: 400, height: 600 },
    isMinimized: false,
    selectedModel: 'gpt-4o',
    voiceEnabled: false,
    autoSpeak: false,
    imageEnabled: true,
    showCanvas: false
  };

  const handleClose = () => console.log('Window closed');
  const handleMinimize = () => console.log('Window minimized');
  const handleUpdatePosition = () => console.log('Position updated');
  const handleUpdateSize = () => console.log('Size updated');

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Testing ChatWindow Fix</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        This test verifies that currentImageSettings is properly initialized before use.
        If you see this without errors, the fix is working!
      </p>
      
      {/* This would previously throw "Cannot access 'currentImageSettings' before initialization" */}
      <ChatWindow
        window={testWindow}
        agent={testAgent}
        onClose={handleClose}
        onMinimize={handleMinimize}
        onUpdatePosition={handleUpdatePosition}
        onUpdateSize={handleUpdateSize}
      />
    </div>
  );
};

export default TestChatWindowFix;