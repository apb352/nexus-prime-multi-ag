import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Plus, Minus } from '@phosphor-icons/react';
import { AIAgent } from '@/lib/types';
import { Avatar3D } from './Avatar3D';

interface GroupAgentManagerProps {
  currentAgents: string[];
  allAgents: AIAgent[];
  onAddAgents: (agentIds: string[]) => void;
  onRemoveAgent: (agentId: string) => void;
}

export function GroupAgentManager({ 
  currentAgents, 
  allAgents, 
  onAddAgents, 
  onRemoveAgent 
}: GroupAgentManagerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  // Get agents that can be added (not currently in the group)
  const availableAgents = allAgents.filter(agent => !currentAgents.includes(agent.id));
  const currentAgentData = allAgents.filter(agent => currentAgents.includes(agent.id));

  const handleAddAgents = () => {
    if (selectedAgents.length > 0) {
      onAddAgents(selectedAgents);
      setSelectedAgents([]);
      setShowDialog(false);
    }
  };

  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  return (
    <div className="flex items-center gap-2">
      {/* Current agents with remove buttons */}
      {currentAgentData.map((agent) => (
        <div key={agent.id} className="flex items-center gap-1 text-xs bg-card rounded-full px-2 py-1 group">
          <div className="w-4 h-4">
            <Avatar3D
              avatarType={agent.avatar}
              color={agent.color}
              isActive={true}
              size={16}
              mood={agent.mood || 'neutral'}
              isSpeaking={false}
            />
          </div>
          <span className="font-medium">{agent.name}</span>
          <Button
            variant="ghost"
            size="sm"
            className="w-4 h-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemoveAgent(agent.id)}
            disabled={currentAgents.length <= 2} // Keep minimum 2 agents
          >
            <Minus size={12} />
          </Button>
        </div>
      ))}

      {/* Add agent button */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs"
            disabled={availableAgents.length === 0}
          >
            <Plus size={12} className="mr-1" />
            Add Agent
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users size={20} />
              Add Agents to Group
            </DialogTitle>
            <DialogDescription>
              Select agents to add to this group discussion.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {availableAgents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                All available agents are already in this group.
              </div>
            ) : (
              <>
                <ScrollArea className="h-[300px] border rounded-lg p-3">
                  <div className="space-y-2">
                    {availableAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleAgentSelection(agent.id)}
                      >
                        <Checkbox
                          checked={selectedAgents.includes(agent.id)}
                          onCheckedChange={() => toggleAgentSelection(agent.id)}
                        />
                        <div className="w-8 h-8">
                          <Avatar3D
                            avatarType={agent.avatar}
                            color={agent.color}
                            isActive={true}
                            size={32}
                            mood={agent.mood || 'neutral'}
                            isSpeaking={false}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{agent.name}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {agent.mood || 'No mood set'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">
                    {selectedAgents.length} selected
                  </Badge>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddAgents}
                      disabled={selectedAgents.length === 0}
                    >
                      Add {selectedAgents.length} Agent{selectedAgents.length !== 1 ? 's' : ''}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}