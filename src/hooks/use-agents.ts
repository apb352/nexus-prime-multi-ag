import { useKV } from '@github/spark/hooks';
import { useMemo } from 'react';
import { AIAgent } from '@/lib/types';
import { VOICE_PROFILES } from '@/lib/voice-service';
import { defaultImageSettings } from '@/lib/image-service';

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
    },
    imageSettings: {
      ...defaultImageSettings,
      enabled: true,
      imageStyle: 'realistic'
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
    },
    imageSettings: {
      ...defaultImageSettings,
      enabled: true,
      imageStyle: 'artistic'
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
    },
    imageSettings: {
      ...defaultImageSettings,
      enabled: true,
      imageStyle: 'minimalist'
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
    },
    imageSettings: {
      ...defaultImageSettings,
      enabled: true,
      imageStyle: 'realistic'
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
    },
    imageSettings: {
      ...defaultImageSettings,
      enabled: true,
      imageStyle: 'artistic'
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
    },
    imageSettings: {
      ...defaultImageSettings,
      enabled: true,
      imageStyle: 'cyberpunk'
    }
  }
];

export function useAgents() {
  const [agents, setAgents] = useKV<AIAgent[]>('nexus-agents', DEFAULT_AGENTS);

  // Ensure all agents have proper voice settings, internet settings, and image settings
  const normalizedAgents = useMemo(() => agents.map(agent => ({
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
    },
    imageSettings: agent.imageSettings || {
      ...defaultImageSettings,
      enabled: true
    }
  })), [agents]);

  const updateAgentStatus = (agentId: string, isActive: boolean) => {
    setAgents((currentAgents) =>
      currentAgents.map(agent =>
        agent.id === agentId ? { ...agent, isActive } : agent
      )
    );
  };

  const updateAgent = (updatedAgent: AIAgent) => {
    console.log('useAgents updateAgent called with:', updatedAgent);
    setAgents((currentAgents) => {
      console.log('Current agents before update:', currentAgents);
      const newAgents = currentAgents.map(agent =>
        agent.id === updatedAgent.id ? { ...updatedAgent } : agent
      );
      console.log('New agents after update:', newAgents);
      return newAgents;
    });
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