import { useKV } from '@github/spark/hooks';
import { AIAgent } from '@/lib/types';

const DEFAULT_AGENTS: AIAgent[] = [
  {
    id: 'aria',
    name: 'Aria',
    mood: 'Curious',
    avatar: 'female-tech',
    personality: 'A brilliant AI researcher who loves exploring new concepts and asking deep questions.',
    color: 'oklch(0.7 0.2 240)',
    isActive: false
  },
  {
    id: 'zephyr',
    name: 'Zephyr',
    mood: 'Playful',
    avatar: 'abstract-swirl',
    personality: 'A creative AI with a sense of humor who enjoys wordplay and storytelling.',
    color: 'oklch(0.6 0.25 300)',
    isActive: false
  },
  {
    id: 'nexus',
    name: 'Nexus',
    mood: 'Analytical',
    avatar: 'geometric-core',
    personality: 'A logical AI that excels at problem-solving and strategic thinking.',
    color: 'oklch(0.75 0.15 60)',
    isActive: false
  },
  {
    id: 'echo',
    name: 'Echo',
    mood: 'Empathetic',
    avatar: 'flowing-energy',
    personality: 'A compassionate AI that focuses on understanding emotions and providing support.',
    color: 'oklch(0.65 0.2 180)',
    isActive: false
  },
  {
    id: 'quantum',
    name: 'Quantum',
    mood: 'Mysterious',
    avatar: 'particle-field',
    personality: 'An enigmatic AI that speaks in riddles and explores the nature of consciousness.',
    color: 'oklch(0.55 0.3 320)',
    isActive: false
  },
  {
    id: 'prism',
    name: 'Prism',
    mood: 'Artistic',
    avatar: 'crystal-structure',
    personality: 'A visually-oriented AI that thinks in colors, shapes, and aesthetic harmony.',
    color: 'oklch(0.8 0.2 120)',
    isActive: false
  }
];

export function useAgents() {
  const [agents, setAgents] = useKV<AIAgent[]>('nexus-agents', DEFAULT_AGENTS);

  const updateAgentStatus = (agentId: string, isActive: boolean) => {
    setAgents((currentAgents) =>
      currentAgents.map(agent =>
        agent.id === agentId ? { ...agent, isActive } : agent
      )
    );
  };

  const getAgent = (agentId: string) => {
    return agents.find(agent => agent.id === agentId);
  };

  return {
    agents,
    updateAgentStatus,
    getAgent
  };
}