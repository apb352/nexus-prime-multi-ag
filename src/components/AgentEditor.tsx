import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar3D } from './Avatar3D';
import { AIAgent } from '@/lib/types';
import { Pencil, Save, X } from '@phosphor-icons/react';

interface AgentEditorProps {
  agent: AIAgent;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAgent: AIAgent) => void;
}

const AVATAR_TYPES = [
  { value: 'female-tech', label: 'Tech Specialist (Female)' },
  { value: 'male-engineer', label: 'Engineer (Male)' },
  { value: 'android-fem', label: 'Android (Female)' },
  { value: 'cyber-male', label: 'Cyber Agent (Male)' },
  { value: 'ai-researcher', label: 'AI Researcher' },
  { value: 'neural-net', label: 'Neural Network Entity' }
];

const MOOD_OPTIONS = [
  'Analytical', 'Creative', 'Focused', 'Curious', 'Energetic', 
  'Calm', 'Mysterious', 'Friendly', 'Professional', 'Playful',
  'Philosophical', 'Technical', 'Artistic', 'Strategic', 'Innovative'
];

const COLOR_PRESETS = [
  '#4f46e5', // Indigo
  '#7c3aed', // Violet  
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#84cc16'  // Lime
];

export function AgentEditor({ agent, isOpen, onClose, onSave }: AgentEditorProps) {
  const [editedAgent, setEditedAgent] = useState<AIAgent>(agent);

  const handleSave = () => {
    onSave(editedAgent);
    onClose();
  };

  const handleFieldChange = (field: keyof AIAgent, value: string) => {
    setEditedAgent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Edit Agent
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Avatar Preview */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar3D
                avatarType={editedAgent.avatar}
                color={editedAgent.color}
                isActive={false}
                size={120}
              />
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="agent-name">Name</Label>
            <Input
              id="agent-name"
              value={editedAgent.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Enter agent name (optional)"
            />
          </div>

          {/* Mood Input */}
          <div className="space-y-2">
            <Label htmlFor="agent-mood">Mood</Label>
            <div className="flex gap-2">
              <Select 
                value={editedAgent.mood} 
                onValueChange={(value) => handleFieldChange('mood', value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent>
                  {MOOD_OPTIONS.map(mood => (
                    <SelectItem key={mood} value={mood}>
                      {mood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={editedAgent.mood}
                onChange={(e) => handleFieldChange('mood', e.target.value)}
                placeholder="Custom mood"
                className="flex-1"
              />
            </div>
          </div>

          {/* Avatar Type */}
          <div className="space-y-2">
            <Label htmlFor="avatar-type">Avatar Type</Label>
            <Select 
              value={editedAgent.avatar} 
              onValueChange={(value) => handleFieldChange('avatar', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVATAR_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Theme Color</Label>
            <div className="grid grid-cols-5 gap-2">
              {COLOR_PRESETS.map(color => (
                <button
                  key={color}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    editedAgent.color === color 
                      ? 'border-foreground scale-110' 
                      : 'border-border hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleFieldChange('color', color)}
                />
              ))}
            </div>
          </div>

          {/* Personality */}
          <div className="space-y-2">
            <Label htmlFor="personality">Personality Description</Label>
            <Input
              id="personality"
              value={editedAgent.personality}
              onChange={(e) => handleFieldChange('personality', e.target.value)}
              placeholder="Brief personality description"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}