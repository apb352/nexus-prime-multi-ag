import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, MessageCircle } from '@phosphor-icons/react';
import { AIAgent } from '@/lib/types';

interface GroupChatCreatorProps {
  agents: AIAgent[];
  onCreateGroupChat: (selectedAgents: string[], topic: string) => void;
}

export function GroupChatCreator({ agents, onCreateGroupChat }: GroupChatCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [topic, setTopic] = useState('');

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleCreate = () => {
    if (selectedAgents.length >= 2 && topic.trim()) {
      onCreateGroupChat(selectedAgents, topic.trim());
      setIsOpen(false);
      setSelectedAgents([]);
      setTopic('');
    }
  };

  const availableAgents = agents.filter(agent => agent.name && agent.mood);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="fixed top-4 right-36 z-[10001] bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:from-primary/80 hover:to-secondary/80 shadow-lg"
          size="sm"
        >
          <Users className="w-4 h-4 mr-2" />
          Group Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Create Group Chat
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="topic">Discussion Topic</Label>
            <Input
              id="topic"
              placeholder="What should the agents discuss?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Select Agents (minimum 2)</Label>
            <ScrollArea className="h-48 mt-2 border rounded-md p-3">
              <div className="space-y-3">
                {availableAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={agent.id}
                      checked={selectedAgents.includes(agent.id)}
                      onCheckedChange={() => handleAgentToggle(agent.id)}
                    />
                    <div className="flex-1 flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: agent.color }}
                      />
                      <span className="text-sm font-medium">{agent.name}</span>
                      <span className="text-xs text-muted-foreground">({agent.mood})</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="text-xs text-muted-foreground">
            Selected: {selectedAgents.length} agents
          </div>

          <Button 
            onClick={handleCreate}
            disabled={selectedAgents.length < 2 || !topic.trim()}
            className="w-full"
          >
            Create Group Chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}