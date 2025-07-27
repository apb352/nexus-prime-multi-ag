import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Trash2, Edit } from '@phosphor-icons/react';
import { AIAgent, AvatarType } from '@/lib/types';
import { Avatar3D } from './Avatar3D';
import { useAgents } from '@/hooks/use-agents';

const AVATAR_TYPES: AvatarType[] = ['human-male', 'human-female', 'robot', 'alien', 'cyborg'];

const AVATAR_TYPE_LABELS = {
  'human-male': 'Human Male',
  'human-female': 'Human Female',
  'robot': 'Robot',
  'alien': 'Alien',
  'cyborg': 'Cyborg'
};

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

interface AgentManagerProps {
  activeWindowAgents: string[];
  onRemoveAgent?: (agentId: string) => void;
}

export function AgentManager({ activeWindowAgents, onRemoveAgent }: AgentManagerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  
  const { agents, addAgent, updateAgent, removeAgent } = useAgents();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    personality: '',
    mood: '',
    avatar: 'human-male' as AvatarType,
    color: PRESET_COLORS[0]
  });

  const resetForm = () => {
    setFormData({
      name: '',
      personality: '',
      mood: '',
      avatar: 'human-male',
      color: PRESET_COLORS[0]
    });
    setEditingAgent(null);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setIsCreating(true);
    resetForm();
  };

  const handleEdit = (agent: AIAgent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      personality: agent.personality,
      mood: agent.mood,
      avatar: agent.avatar,
      color: agent.color
    });
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (editingAgent) {
      // Update existing agent
      updateAgent({
        ...editingAgent,
        ...formData
      });
    } else {
      // Create new agent
      const newAgent: AIAgent = {
        id: `agent-${Date.now()}`,
        name: formData.name,
        personality: formData.personality,
        mood: formData.mood,
        avatar: formData.avatar,
        color: formData.color,
        isActive: false,
        voiceSettings: {
          enabled: false,
          autoSpeak: false
        }
      };
      addAgent(newAgent);
    }
    
    resetForm();
    // Close the dialog after saving
    setShowDialog(false);
  };

  const handleDelete = (agent: AIAgent) => {
    // Check if agent has active windows
    if (activeWindowAgents.includes(agent.id)) {
      if (onRemoveAgent) {
        onRemoveAgent(agent.id);
      }
    }
    removeAgent(agent.id);
  };

  const canDeleteAgent = (agentId: string) => {
    return !activeWindowAgents.includes(agentId);
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed top-4 right-4 z-[10001] shadow-lg bg-card/95 backdrop-blur-sm"
        >
          <Users size={16} className="mr-1" />
          Manage Agents
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={20} />
            Agent Management
          </DialogTitle>
          <DialogDescription>
            Add, edit, or remove AI agents. Active agents cannot be deleted.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!isCreating ? (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Current Agents ({agents.length})</h3>
                <Button onClick={handleCreate} size="sm">
                  <Plus size={16} className="mr-1" />
                  Add Agent
                </Button>
              </div>
              
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                <div className="space-y-3">
                  {agents.map((agent) => {
                    const isActive = activeWindowAgents.includes(agent.id);
                    const canDelete = canDeleteAgent(agent.id);
                    
                    return (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                        style={{ borderColor: `${agent.color}50` }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10">
                            <Avatar3D
                              avatarType={agent.avatar}
                              color={agent.color}
                              isActive={agent.isActive}
                              size={40}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{agent.name}</h4>
                              {isActive && (
                                <Badge variant="secondary" className="text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {agent.mood || 'No mood set'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {AVATAR_TYPE_LABELS[agent.avatar]}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(agent)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(agent)}
                            disabled={!canDelete}
                            className={!canDelete ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {agents.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No agents created yet. Click "Add Agent" to get started.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {editingAgent ? 'Edit Agent' : 'Create New Agent'}
                </h3>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    resetForm();
                    setShowDialog(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-name">Name</Label>
                  <Input
                    id="agent-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Agent name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="agent-mood">Mood (optional)</Label>
                  <Input
                    id="agent-mood"
                    value={formData.mood}
                    onChange={(e) => setFormData(prev => ({ ...prev, mood: e.target.value }))}
                    placeholder="e.g., Helpful, Sarcastic, Philosophical"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="agent-personality">Personality</Label>
                <Textarea
                  id="agent-personality"
                  value={formData.personality}
                  onChange={(e) => setFormData(prev => ({ ...prev, personality: e.target.value }))}
                  placeholder="Describe the agent's personality, traits, and behavior..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-avatar">Avatar Type</Label>
                  <Select 
                    value={formData.avatar} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, avatar: value as AvatarType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVATAR_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {AVATAR_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? 'border-foreground' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center p-4 border rounded-lg">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto">
                    <Avatar3D
                      avatarType={formData.avatar}
                      color={formData.color}
                      isActive={true}
                      size={64}
                    />
                  </div>
                  <p className="text-sm font-medium">{formData.name || 'Preview'}</p>
                  <p className="text-xs text-muted-foreground">{formData.mood || 'No mood'}</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    resetForm();
                    setShowDialog(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={!formData.name.trim()}
                >
                  {editingAgent ? 'Update Agent' : 'Create Agent'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}