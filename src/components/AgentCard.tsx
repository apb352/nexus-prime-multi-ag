import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar3D } from './Avatar3D';
import { AIAgent } from '@/lib/types';

interface AgentCardProps {
  agent: AIAgent;
  onClick: (agent: AIAgent) => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  return (
    <Card 
      className="p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 bg-card/80 backdrop-blur-sm"
      style={{
        borderColor: agent.isActive ? agent.color : 'var(--border)',
        boxShadow: agent.isActive ? `0 0 20px ${agent.color}40` : undefined
      }}
      onClick={() => onClick(agent)}
    >
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
          <h3 className="text-xl font-semibold text-foreground">{agent.name}</h3>
          <Badge 
            variant="secondary" 
            className="text-xs"
            style={{ backgroundColor: `${agent.color}20`, color: agent.color }}
          >
            {agent.mood}
          </Badge>
          <p className="text-sm text-muted-foreground max-w-xs">
            {agent.personality}
          </p>
        </div>
      </div>
    </Card>
  );
}