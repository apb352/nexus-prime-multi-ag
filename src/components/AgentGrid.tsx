import { useAgents } from '@/hooks/use-agents';
import { AgentCard } from './AgentCard';
import { AIAgent } from '@/lib/types';

interface AgentGridProps {
  onAgentSelect: (agent: AIAgent) => void;
}

export function AgentGrid({ onAgentSelect }: AgentGridProps) {
  const { agents } = useAgents();

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
          Nexus Prime
        </h1>
        <p className="text-xl text-muted-foreground">
          Choose an AI agent to begin your conversation
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onClick={onAgentSelect}
          />
        ))}
      </div>
    </div>
  );
}