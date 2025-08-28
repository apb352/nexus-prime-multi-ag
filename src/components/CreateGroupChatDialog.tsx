import { useState } from 'react';
import { AIAgent, GroupChat } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, MessageCircle, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface CreateGroupChatDialogProps {
  agents: AIAgent[];
  onCreateGroupChat: (groupChat: GroupChat) => void;
  children?: React.ReactNode;
}

export function CreateGroupChatDialog({ agents, onCreateGroupChat, children }: CreateGroupChatDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [turnBasedMode, setTurnBasedMode] = useState(true);
  const [autoAdvanceTurn, setAutoAdvanceTurn] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');

  const availableAgents = agents.filter(agent => agent.id !== 'user');

  const presetTemplates = [
    {
      name: "AI Council Meeting",
      description: "All agents participate in structured discussion",
      agentCount: availableAgents.length,
      turnBased: true,
      autoAdvance: false
    },
    {
      name: "Creative Brainstorm",
      description: "Free-flowing creative collaboration",
      agentCount: Math.min(4, availableAgents.length),
      turnBased: false,
      autoAdvance: false
    },
    {
      name: "Debate Club",
      description: "Turn-based structured debate",
      agentCount: Math.min(3, availableAgents.length),
      turnBased: true,
      autoAdvance: true
    }
  ];

  const applyTemplate = (template: typeof presetTemplates[0]) => {
    setName(template.name);
    setTurnBasedMode(template.turnBased);
    setAutoAdvanceTurn(template.autoAdvance);
    
    // Select first N agents
    const agentsToSelect = availableAgents.slice(0, template.agentCount).map(a => a.id);
    setSelectedAgents(agentsToSelect);
  };

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents(current => 
      current.includes(agentId)
        ? current.filter(id => id !== agentId)
        : [...current, agentId]
    );
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('Please enter a group chat name');
      return;
    }

    if (selectedAgents.length < 2) {
      toast.error('Please select at least 2 agents');
      return;
    }

    const newGroupChat: GroupChat = {
      id: `group-${Date.now()}`,
      name: name.trim(),
      participants: selectedAgents,
      position: { x: 200 + Math.random() * 100, y: 150 + Math.random() * 100 },
      size: { width: 500, height: 650 },
      isMinimized: false,
      selectedModel,
      turnBasedMode,
      currentTurn: 0,
      autoAdvanceTurn
    };

    onCreateGroupChat(newGroupChat);
    
    // Reset form
    setName('');
    setSelectedAgents([]);
    setTurnBasedMode(true);
    setAutoAdvanceTurn(false);
    setSelectedModel('gpt-4o');
    setOpen(false);

    toast.success(`Created group chat "${newGroupChat.name}"`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button 
            variant="outline" 
            className="flex items-center gap-2 glass-nav nav-button shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <MessageCircle size={16} weight="fill" />
            Group Chat
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="text-primary" />
            Create Group Chat
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Quick Templates */}
          <div>
            <Label className="mb-3 block">Quick Start Templates</Label>
            <div className="grid grid-cols-1 gap-2">
              {presetTemplates.map((template, index) => (
                <Card
                  key={index}
                  className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => applyTemplate(template)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground">{template.description}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {template.agentCount} agents
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Basic Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="chat-name">Group Chat Name</Label>
              <Input
                id="chat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., AI Council Meeting, Creative Brainstorm..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>AI Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chat Mode Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Turn-based mode</Label>
                <p className="text-sm text-muted-foreground">
                  Agents take turns responding in order
                </p>
              </div>
              <Switch 
                checked={turnBasedMode} 
                onCheckedChange={setTurnBasedMode}
              />
            </div>

            {turnBasedMode && (
              <div className="flex items-center justify-between pl-4">
                <div>
                  <Label>Auto-advance turns</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically move to next agent after response
                  </p>
                </div>
                <Switch 
                  checked={autoAdvanceTurn} 
                  onCheckedChange={setAutoAdvanceTurn}
                />
              </div>
            )}
          </div>

          {/* Agent Selection */}
          <div>
            <Label className="mb-3 block">Select Participants ({selectedAgents.length} selected)</Label>
            <ScrollArea className="h-60 border rounded-lg p-2">
              <div className="space-y-2">
                {availableAgents.map((agent) => (
                  <Card
                    key={agent.id}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedAgents.includes(agent.id) 
                        ? 'border-primary bg-primary/10 shadow-md scale-[1.02]' 
                        : 'hover:bg-muted/50 hover:scale-[1.01]'
                    }`}
                    onClick={() => handleAgentToggle(agent.id)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedAgents.includes(agent.id)}
                        onChange={() => handleAgentToggle(agent.id)}
                        className="w-4 h-4 rounded border-border accent-primary"
                      />
                      
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-base font-medium shadow-sm"
                        style={{ backgroundColor: agent.color }}
                      >
                        {agent.avatar}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{agent.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {agent.mood}
                          </Badge>
                          {agent.isActive && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {agent.personality}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Turn Order Preview */}
          {turnBasedMode && selectedAgents.length > 0 && (
            <div>
              <Label className="mb-2 block">Turn Order</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted/20 rounded-lg">
                {selectedAgents.map((agentId, index) => {
                  const agent = availableAgents.find(a => a.id === agentId);
                  if (!agent) return null;
                  
                  return (
                    <div key={agentId} className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{index + 1}</span>
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: agent.color }}
                        />
                        {agent.name}
                      </Badge>
                      {index < selectedAgents.length - 1 && (
                        <span className="text-muted-foreground">→</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!name.trim() || selectedAgents.length < 2}
            >
              Create Group Chat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}