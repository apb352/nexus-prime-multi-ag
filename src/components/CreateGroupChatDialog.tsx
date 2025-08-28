import { useState } from 'react';
import { AIAgent, GroupChat } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users } from '@phosphor-icons/react';
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
    setAutoAdvanceTurn(false);
    setOpen(false);

    toast.success(`Created group chat "${newGroupChat.name}"`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="flex items-center gap-2">
            <MessageCircle size={16} />
            Create Group Chat
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="text-primary" />
            Create Group Chat
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="chat-name">Group Chat Name</Label>
              <Input
                id="chat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name for your group chat..."
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
                  Agents take turns speaking in order
                </p>
              </div>
              <Switch
                checked={turnBasedMode}
                onCheckedChange={setTurnBasedMode}
              />
            </div>

            {turnBasedMode && (
              <div className="flex items-center justify-between">
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
          <div className="space-y-4">
            <Label>Select Participants ({selectedAgents.length} selected)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {availableAgents.map((agent) => (
                <Card key={agent.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`agent-${agent.id}`}
                        checked={selectedAgents.includes(agent.id)}
                        onCheckedChange={() => handleAgentToggle(agent.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{agent.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {agent.expertise}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {agent.personality}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Turn Order Preview */}
          {turnBasedMode && selectedAgents.length > 0 && (
            <div className="space-y-2">
              <Label>Turn Order</Label>
              <div className="flex flex-wrap gap-2">
                {selectedAgents.map((agentId, index) => {
                  const agent = agents.find(a => a.id === agentId);
                  return agent ? (
                    <div key={agentId} className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">{index + 1}.</span>
                      <Badge variant="secondary">
                        {agent.name}
                      </Badge>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || selectedAgents.length < 2}>
              Create Group Chat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}