import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { AIAgent, GroupChat } from '@/lib/types';

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

    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
    
    const newGroupChat: GroupChat = {
      id: `group-${Date.now()}`,
      name: name.trim(),
      participants: selectedAgents,
      position: { 
        x: Math.max(50, Math.min(screenWidth - 550, 200 + Math.random() * 100)), 
        y: Math.max(80, Math.min(screenHeight - 700, 150 + Math.random() * 100))
      },
      size: { width: 550, height: 700 },
      isMinimized: false,
      selectedModel,
      turnBasedMode,
      currentTurn: 0,
      messages: []
    };

    onCreateGroupChat(newGroupChat);
    
    // Reset form
    setName('');
    setSelectedAgents([]);
    setTurnBasedMode(true);
    setSelectedModel('gpt-4o');
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
                  Each agent gets a turn, then it starts over with you
                </p>
              </div>
              <Switch
                checked={turnBasedMode}
                onCheckedChange={setTurnBasedMode}
              />
            </div>
          </div>

          {/* Agent Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Select Agents ({selectedAgents.length} selected)</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAgents(availableAgents.map(a => a.id))}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAgents([])}
                >
                  Clear All
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {availableAgents.map((agent) => (
                <Card key={agent.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`agent-${agent.id}`}
                        checked={selectedAgents.includes(agent.id)}
                        onCheckedChange={() => handleAgentToggle(agent.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{agent.avatar}</span>
                          <div>
                            <p className="font-medium text-sm">{agent.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {agent.expertise?.slice(0, 2).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {agent.expertise && agent.expertise.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{agent.expertise.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={selectedAgents.length < 2 || !name.trim()}>
              Create Group Chat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}