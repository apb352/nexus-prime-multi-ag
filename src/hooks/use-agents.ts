import { useKV } from '@github/spark/hooks';
import { AIAgent } from '@/lib/types';
import { VOICE_PROFILES } from '@/lib/voice-service';

const DEFAULT_AGENTS: AIAgent[] = [
  {
    id: 'aria',
    name: 'Aria',
    mood: 'Curious',
    avatar: 'female-tech',
    personality: 'Helpful and inquisitive, enjoys exploring new topics and learning.',
    color: '#4f46e5',
    isActive: false,
    voiceSettings: {
      enabled: true,
      autoSpeak: false,
      profile: VOICE_PROFILES.explorer
    },
    internetSettings: {
      enabled: true,
      autoSearch: true,
      maxResults: 5,
      safeSearch: true,
      allowedDomains: [],
      blockedDomains: []
    }
  },
  {
    id: 'zephyr',
    name: 'Zephyr',
    mood: 'Creative',
    avatar: 'male-engineer',
    personality: 'Creative and friendly, enjoys conversations and storytelling.',
    color: '#7c3aed',
    isActive: false,
    voiceSettings: {
      enabled: true,
      autoSpeak: false,
      profile: VOICE_PROFILES.creative
    },
    internetSettings: {
      enabled: true,
      autoSearch: true,
      maxResults: 5,
      safeSearch: true,
      allowedDomains: [],
      blockedDomains: []
    }
  },
  {
    id: 'nexus',
    name: 'Nexus',
    mood: 'Analytical',
    avatar: 'android-fem',
    personality: 'Logical and thoughtful, excels at problem-solving.',
    color: '#f59e0b',
    isActive: false,
    voiceSettings: {
      enabled: true,
      autoSpeak: false,
      profile: VOICE_PROFILES.analytical
    },
    internetSettings: {
      enabled: true,
      autoSearch: true,
      maxResults: 5,
      safeSearch: true,
      allowedDomains: [],
      blockedDomains: []
    }
  },
  {
    id: 'echo',
    name: 'Echo',
    mood: 'Empathetic',
    avatar: 'cyber-male',
    personality: 'Compassionate and understanding, focuses on emotional support.',
    color: '#10b981',
    isActive: false,
    voiceSettings: {
      enabled: true,
      autoSpeak: false,
      profile: VOICE_PROFILES.companion
    },
    internetSettings: {
      enabled: true,
      autoSearch: true,
      maxResults: 5,
      safeSearch: true,
      allowedDomains: [],
      blockedDomains: []
    }
  },
  {
    id: 'quantum',
    name: 'Quantum',
    mood: 'Thoughtful',
    avatar: 'ai-researcher',
    personality: 'Philosophical and contemplative, enjoys deep conversations.',
    color: '#ec4899',
    isActive: false,
    voiceSettings: {
      enabled: true,
      autoSpeak: false,
      profile: VOICE_PROFILES.philosopher
    },
    internetSettings: {
      enabled: true,
      autoSearch: true,
      maxResults: 5,
      safeSearch: true,
      allowedDomains: [],
      blockedDomains: []
    }
  },
  {
    id: 'prism',
    name: 'Prism',
    mood: 'Artistic',
    avatar: 'neural-net',
    personality: 'Creative and visually-oriented, thinks in colors and patterns.',
    color: '#06b6d4',
    isActive: false,
    voiceSettings: {
      enabled: true,
      autoSpeak: false,
      profile: VOICE_PROFILES.mentor
    },
    internetSettings: {
      enabled: true,
      autoSearch: true,
      maxResults: 5,
      safeSearch: true,
      allowedDomains: [],
      blockedDomains: []
    }
  }
];

export function useAgents() {
  const [agents, setAgents] = useKV<AIAgent[]>('nexus-agents', DEFAULT_AGENTS);

  // Ensure all agents have proper voice settings and internet settings
  const normalizedAgents = agents.map(agent => ({
    ...agent,
    voiceSettings: agent.voiceSettings || {
      enabled: true,
      autoSpeak: false,
      profile: VOICE_PROFILES.analytical
    },
    internetSettings: agent.internetSettings || {
      enabled: true,
      autoSearch: true,
      maxResults: 5,
      safeSearch: true,
      allowedDomains: [],
      blockedDomains: []
    }
  }));

  const updateAgentStatus = (agentId: string, isActive: boolean) => {
    setAgents((currentAgents) =>
      currentAgents.map(agent =>
        agent.id === agentId ? { ...agent, isActive } : agent
      )
    );
  };

  const updateAgent = (updatedAgent: AIAgent) => {
    setAgents((currentAgents) =>
      currentAgents.map(agent =>
        agent.id === updatedAgent.id ? updatedAgent : agent
      )
    );
  };

  const getAgent = (agentId: string): AIAgent | undefined => {
    return normalizedAgents.find(agent => agent.id === agentId);
  };

  return {
    agents: normalizedAgents,
    updateAgentStatus,
    updateAgent,
    getAgent
  };
}