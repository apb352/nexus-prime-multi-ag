import { useState } from 'react';
import { AIAgent, GroupChat } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, Se
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
  onCreateGroupChat: (groupChat: GroupChat) => void;
}
export function CreateGroupChatDialog({ agents
  const [name, setName] = useState('');
  const [turnBasedMode, setTurnBasedMode] = useState(true);
  const [selectedModel, setSele

  const presetTemplates = [
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
    }
        : [...current, agentId]
  cons
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('Please enter a group chat name');

     

    if (selectedAgents.length < 2) {
      toast.error('Please select at least 2 agents');
      return;
    }

      return;
      id: `group-${Date.now()}`,
    if (selectedAgents.l
      participants: selectedAgents,
      position: { x: 200 + Math.random() * 100, y: 150 + Math.random() * 100 },
      size: { width: 500, height: 650 },
      isMinimized: false,
      selectedModel,
      position: { x:
      currentTurn: 0,
      autoAdvanceTurn
    };

    onCreateGroupChat(newGroupChat);
    
    // Reset form
    setName('');
    setSelectedAgents([]);
    setAutoAdvanceTurn(fals
    setAutoAdvanceTurn(false);

    setOpen(false);

    toast.success(`Created group chat "${newGroupChat.name}"`);
    

  return (
    <Dialog open={open} onOpenChange={setOpen}>
            <MessageCircle si
        {children || (
          <Button variant="outline" className="flex items-center gap-2">
            <MessageCircle size={16} />
        <DialogHeader>
          </Button>
          
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="text-primary" />
              {presetTemplate
          </DialogTitle>
                  class
        
        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="chat-name">Group Chat Name</Label>
              <Input
                </Card>
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name for your group chat..."
                className="mt-1"
              />
              <Inp

                o
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
                          {agent.personality}
                    
                  </
              </div>
          </div>
          {/* Turn Order Preview */}
            <div
              <div

                  
                    <div key={agentId} className="flex items-center ga
                     
                          className="w-4 h-4 rounde
                        />
                      </Badge>
                      
                    </
                })}
            </div>

          <div cla
              Cancel
            <B
              di

          </div>
      </DialogC
  );
























































































