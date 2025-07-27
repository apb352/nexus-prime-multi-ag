import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Globe, Search, Shield, X } from '@phosphor-icons/react';
import { internetService, InternetSettings } from '@/lib/internet-service';
import { useAgents } from '@/hooks/use-agents';

interface InternetControlsProps {
  agentId: string;
  windowId: string;
  internetEnabled?: boolean;
  autoSearch?: boolean;
  onInternetToggle?: (enabled: boolean) => void;
  onAutoSearchToggle?: (enabled: boolean) => void;
}

export function InternetControls({
  agentId,
  windowId,
  internetEnabled = false,
  autoSearch = false,
  onInternetToggle,
  onAutoSearchToggle
}: InternetControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<InternetSettings>(internetService.getSettings());
  const [newDomain, setNewDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { updateAgent, getAgent } = useAgents();

  useEffect(() => {
    const agent = getAgent(agentId);
    if (agent?.internetSettings) {
      setSettings(agent.internetSettings);
    }
  }, [agentId, getAgent]);

  const handleToggleInternet = () => {
    const newEnabled = !internetEnabled;
    onInternetToggle?.(newEnabled);
    
    // Update agent settings
    const agent = getAgent(agentId);
    if (agent) {
      updateAgent(agentId, {
        internetSettings: {
          ...settings,
          enabled: newEnabled
        }
      });
    }
  };

  const handleToggleAutoSearch = () => {
    const newAutoSearch = !autoSearch;
    onAutoSearchToggle?.(newAutoSearch);
    
    // Update agent settings
    const agent = getAgent(agentId);
    if (agent) {
      updateAgent(agentId, {
        internetSettings: {
          ...settings,
          autoSearch: newAutoSearch
        }
      });
    }
  };

  const handleSettingsChange = (key: keyof InternetSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Update agent and service settings
    const agent = getAgent(agentId);
    if (agent) {
      updateAgent(agentId, {
        internetSettings: newSettings
      });
    }
  };

  const handleAddDomain = (type: 'allowed' | 'blocked') => {
    if (!newDomain.trim()) return;
    
    const currentDomains = type === 'allowed' ? settings.allowedDomains || [] : settings.blockedDomains || [];
    const updatedDomains = [...currentDomains, newDomain.trim()];
    
    handleSettingsChange(
      type === 'allowed' ? 'allowedDomains' : 'blockedDomains',
      updatedDomains
    );
    setNewDomain('');
  };

  const handleRemoveDomain = (domain: string, type: 'allowed' | 'blocked') => {
    const currentDomains = type === 'allowed' ? settings.allowedDomains || [] : settings.blockedDomains || [];
    const updatedDomains = currentDomains.filter(d => d !== domain);
    
    handleSettingsChange(
      type === 'allowed' ? 'allowedDomains' : 'blockedDomains',
      updatedDomains
    );
  };

  const handleTestSearch = async () => {
    setIsLoading(true);
    try {
      console.log('Testing internet search...');
      const results = await internetService.searchWeb('artificial intelligence news', 3);
      console.log('Test search results:', results);
      
      // Also test weather
      const weather = await internetService.getWeather('London');
      console.log('Test weather:', weather);
      
      // Show success message
      alert(`Internet test successful!\n\nFound ${results.length} search results.\nWeather info: ${weather.substring(0, 100)}...`);
    } catch (error) {
      console.error('Test search failed:', error);
      alert(`Internet test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative ${internetEnabled ? 'text-primary hover:text-primary/80' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Globe 
            size={16} 
            className={internetEnabled ? 'animate-pulse' : ''} 
          />
          {autoSearch && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 internet-settings-popover" 
        align="end"
        side="bottom"
        sideOffset={5}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Globe size={16} />
              Internet Access
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X size={14} />
            </Button>
          </div>

          <div className="space-y-3">
            {/* Enable Internet Access */}
            <div className="flex items-center justify-between">
              <Label htmlFor="internet-enabled" className="text-sm">
                Enable Internet Access
              </Label>
              <Switch
                id="internet-enabled"
                checked={internetEnabled}
                onCheckedChange={handleToggleInternet}
              />
            </div>

            {internetEnabled && (
              <>
                {/* Auto Search */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="auto-search" className="text-sm">
                      Auto Search
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically search when questions are detected
                    </p>
                  </div>
                  <Switch
                    id="auto-search"
                    checked={autoSearch}
                    onCheckedChange={handleToggleAutoSearch}
                  />
                </div>

                <Separator />

                {/* Max Results */}
                <div className="space-y-2">
                  <Label className="text-sm">Max Search Results: {settings.maxResults}</Label>
                  <Slider
                    value={[settings.maxResults]}
                    onValueChange={([value]) => handleSettingsChange('maxResults', value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Safe Search */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="safe-search" className="text-sm flex items-center gap-1">
                      <Shield size={14} />
                      Safe Search
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Filter inappropriate content
                    </p>
                  </div>
                  <Switch
                    id="safe-search"
                    checked={settings.safeSearch}
                    onCheckedChange={(checked) => handleSettingsChange('safeSearch', checked)}
                  />
                </div>

                <Separator />

                {/* Blocked Domains */}
                <div className="space-y-2">
                  <Label className="text-sm">Blocked Domains</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="domain.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddDomain('blocked');
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddDomain('blocked')}
                      disabled={!newDomain.trim()}
                    >
                      Block
                    </Button>
                  </div>
                  
                  {settings.blockedDomains && settings.blockedDomains.length > 0 && (
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {settings.blockedDomains.map((domain) => (
                        <Badge
                          key={domain}
                          variant="destructive"
                          className="text-xs cursor-pointer"
                          onClick={() => handleRemoveDomain(domain, 'blocked')}
                        >
                          {domain} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Allowed Domains */}
                <div className="space-y-2">
                  <Label className="text-sm">Allowed Domains (leave empty for all)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="domain.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddDomain('allowed');
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddDomain('allowed')}
                      disabled={!newDomain.trim()}
                    >
                      Allow
                    </Button>
                  </div>
                  
                  {settings.allowedDomains && settings.allowedDomains.length > 0 && (
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {settings.allowedDomains.map((domain) => (
                        <Badge
                          key={domain}
                          variant="secondary"
                          className="text-xs cursor-pointer"
                          onClick={() => handleRemoveDomain(domain, 'allowed')}
                        >
                          {domain} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Test Search */}
                <Button
                  onClick={handleTestSearch}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <Search size={16} className="mr-2" />
                  {isLoading ? 'Testing...' : 'Test Search'}
                </Button>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}