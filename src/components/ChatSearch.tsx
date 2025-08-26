import { useState, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useKV } from '@github/spark/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, MessageSquare, Calendar, User, Filter, X } from '@phosphor-icons/react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAgents } from '@/hooks/use-agents';
import { ChatMessage } from '@/lib/types';

interface SearchResult {
  agentId: string;
  agentName: string;
  message: ChatMessage;
  messageIndex: number;
  context: string;
}

interface SearchFilters {
  agentId?: string;
  sender?: 'user' | 'ai';
  dateRange?: 'today' | 'week' | 'month' | 'all';
}

export interface ChatSearchRef {
  openSearch: () => void;
}

export const ChatSearch = forwardRef<ChatSearchRef>((_, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: 'all',
  });
  const [recentSearches, setRecentSearches] = useKV<string[]>('nexus-recent-searches', []);
  const [chatHistory] = useKV<Record<string, ChatMessage[]>>('nexus-chat-history', {});
  const { agents } = useAgents();

  useImperativeHandle(ref, () => ({
    openSearch: () => setIsOpen(true)
  }));

  // Focus search input when dialog opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const searchInput = document.querySelector('[placeholder="Search messages..."]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      // ESC to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const results: SearchResult[] = [];
    const query = searchQuery.toLowerCase();

    // Get date filter timestamp
    const now = new Date();
    let dateThreshold = 0;
    switch (filters.dateRange) {
      case 'today':
        dateThreshold = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        break;
      case 'week':
        dateThreshold = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        dateThreshold = now.getTime() - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        dateThreshold = 0;
    }

    Object.entries(chatHistory).forEach(([agentId, messages]) => {
      // Apply agent filter
      if (filters.agentId && agentId !== filters.agentId) return;

      const agent = agents.find(a => a.id === agentId);
      const agentName = agent?.name || 'Unknown Agent';

      messages.forEach((message, index) => {
        // Apply date filter
        if (message.timestamp < dateThreshold) return;

        // Apply sender filter
        if (filters.sender && message.sender !== filters.sender) return;

        // Search in message content
        if (message.content.toLowerCase().includes(query)) {
          // Create context snippet
          const words = message.content.split(' ');
          const queryIndex = words.findIndex(word => word.toLowerCase().includes(query));
          const start = Math.max(0, queryIndex - 10);
          const end = Math.min(words.length, queryIndex + 10);
          const context = words.slice(start, end).join(' ');

          results.push({
            agentId,
            agentName,
            message,
            messageIndex: index,
            context: context.length < message.content.length ? `...${context}...` : context
          });
        }
      });
    });

    // Sort by timestamp (newest first)
    return results.sort((a, b) => b.message.timestamp - a.message.timestamp);
  }, [searchQuery, filters, chatHistory, agents]);

  const highlightQuery = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-accent text-accent-foreground font-medium px-1 rounded">
          {part}
        </span>
      ) : part
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;
    
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString();
    } else if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const clearFilters = () => {
    setFilters({ dateRange: 'all' });
  };

  const hasActiveFilters = filters.agentId || filters.sender || filters.dateRange !== 'all';

  const saveSearch = (query: string) => {
    if (!query.trim() || recentSearches.includes(query)) return;
    
    setRecentSearches((prev) => {
      const updated = [query, ...prev.filter(s => s !== query)].slice(0, 10); // Keep only 10 recent searches
      return updated;
    });
  };

  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    saveSearch(query);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Search size={16} />
          Search Chats
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search size={20} />
            Search Chat History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-shrink-0">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  saveSearch(searchQuery.trim());
                }
              }}
              className="pl-10"
            />
          </div>

          {/* Recent searches - show when search is empty */}
          {!searchQuery && recentSearches.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Recent searches:</span>
              <div className="flex flex-wrap gap-1">
                {recentSearches.slice(0, 5).map((recentSearch, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSearchSubmit(recentSearch)}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {recentSearch}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select
              value={filters.agentId || 'all'}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                agentId: value === 'all' ? undefined : value 
              }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All agents</SelectItem>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.sender || 'all'}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                sender: value === 'all' ? undefined : value as 'user' | 'ai'
              }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All senders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All senders</SelectItem>
                <SelectItem value="user">You</SelectItem>
                <SelectItem value="ai">AI</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                dateRange: value as any
              }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X size={14} />
                Clear
              </Button>
            )}
          </div>

          {/* Results summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {searchQuery ? (
                searchResults.length > 0 ? (
                  <>
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                    {hasActiveFilters && ' (filtered)'}
                  </>
                ) : (
                  'No results found'
                )
              ) : (
                'Enter a search term to begin'
              )}
            </span>
            {searchQuery && searchResults.length > 0 && (
              <span className="text-xs">
                Across {new Set(searchResults.map(r => r.agentId)).size} agent{new Set(searchResults.map(r => r.agentId)).size !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <Separator />

        {/* Results */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-3 p-1">
            {searchResults.length === 0 && searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                <p>No messages found matching your search.</p>
                <p className="text-sm mt-1">Try adjusting your search terms or filters.</p>
              </div>
            )}

            {searchResults.map((result, index) => (
              <Card key={`${result.agentId}-${result.messageIndex}-${index}`} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        {result.message.sender === 'user' ? (
                          <User size={16} className="text-primary" />
                        ) : (
                          <MessageSquare size={16} className="text-primary" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {result.agentName}
                        </Badge>
                        <Badge variant={result.message.sender === 'user' ? 'default' : 'secondary'} className="text-xs">
                          {result.message.sender === 'user' ? 'You' : 'AI'}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar size={12} />
                          {formatDate(result.message.timestamp)}
                        </div>
                      </div>

                      <div className="text-sm leading-relaxed">
                        {highlightQuery(result.context, searchQuery)}
                      </div>

                      {result.message.imageUrl && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            🖼️ Contains image
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
});