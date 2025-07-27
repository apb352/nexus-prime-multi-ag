import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar3D } from './Avatar3D';
import { AgentEditor } from './AgentEditor';
import { AIAgent } from '@/lib/types';
import { Pencil } from '@phosphor-icons/react';

interface AgentCardProps {
  agent: AIAgent;
  onClick: (agent: AIAgent) => void;
  onEdit: (agent: AIAgent) => void;
}

export function AgentCard({ agent, onClick, onEdit }: AgentCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(agent);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSaveEdit = (updatedAgent: AIAgent) => {
    onEdit(updatedAgent);
    setIsEditing(false);
  };

  return (
    <>
      <Card 
        className="p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 bg-card/80 backdrop-blur-sm relative group"
        style={{
          borderColor: agent.isActive ? agent.color : 'var(--border)',
          boxShadow: agent.isActive ? `0 0 20px ${agent.color}40` : undefined
        }}
        onClick={handleCardClick}
      >
        {/* Edit Button */}
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={handleEditClick}
        >
          <Pencil className="w-4 h-4" />
        </Button>

        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar3D 
              avatarType={agent.avatar}
              color={agent.color}
              isActive={agent.isActive}
              size={120}
            />
            {agent.isActive && (
              <div className="absolute -top-2 -right-2">
                <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
              </div>
            )}
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              {agent.name || 'Unnamed Agent'}
            </h3>
            {agent.mood && (
              <Badge 
                variant="secondary" 
                className="text-xs"
                style={{ backgroundColor: `${agent.color}20`, color: agent.color }}
              >
                {agent.mood}
              </Badge>
            )}
            {agent.personality && (
              <p className="text-sm text-muted-foreground max-w-xs">
                {agent.personality}
              </p>
            )}
          </div>
        </div>
      </Card>

      <AgentEditor
        agent={agent}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={handleSaveEdit}
      />
    </>
  );
}