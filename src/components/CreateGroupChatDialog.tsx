import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/chec
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
interface CreateGroupChatDialogProps {
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface CreateGroupChatDialogProps {
  agents: AIAgent[];
  const [turnBasedMode, setTurnBasedMode] = useState
  children?: React.ReactNode;
 

export function CreateGroupChatDialog({ agents, onCreateGroupChat, children }: CreateGroupChatDialogProps) {
  const [open, setOpen] = useState(false);
        : [...current, agentId]
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [turnBasedMode, setTurnBasedMode] = useState(true);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');

  const availableAgents = agents.filter(agent => agent.id !== 'user');

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents(current => 
      current.includes(agentId)
    const newGroupChat: GroupChat = {
        : [...current, agentId]
      
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('Please enter a group chat name');
    
    s

    if (selectedAgents.length < 2) {
      toast.error('Please select at least 2 agents');
      return;
    }

        {children || (
      id: `group-${Date.now()}`,
            Create Group
      participants: selectedAgents,
      position: { x: 200 + Math.random() * 100, y: 150 + Math.random() * 100 },
      size: { width: 500, height: 650 },
          <DialogTitle cl
      selectedModel,
      turnBasedMode,
      currentTurn: 0,
        <div classNam
    };

    onCreateGroupChat(newGroupChat);
    
    // Reset form
                
    setSelectedAgents([]);
            </div>
    setOpen(false);

    toast.success(`Created group chat "${newGroupChat.name}"`);
    

  return (
    <Dialog open={open} onOpenChange={setOpen}>
              </Select>
        {children || (
          <Button variant="outline" className="flex items-center gap-2">
            <MessageCircle size={16} />
            <div className="f
          </Button>
          
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="text-primary" />
          </div>
          </DialogTitle>
          <div classNam
        
        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="chat-name">Group Chat Name</Label>
              <Input
                      <div cla
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name for your group chat..."
                className="mt-1"
              />
                  

                 
              <Label>AI Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                </SelectContent>
              </Select>
            </div>
}

          {/* Chat Mode Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Turn-based mode</Label>
                <p className="text-sm text-muted-foreground">
                  Agents take turns speaking in order
                </p>
              </div>
              <Switch




















































































