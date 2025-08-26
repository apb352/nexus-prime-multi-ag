import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, X, ChevronUp, ChevronDown } from '@phosphor-icons/react';
import { ChatMessage } from '@/lib/types';

interface ChatWindowSearchProps {
  messages: ChatMessage[];
  onMessageSelect?: (messageIndex: number) => void;
}

export function ChatWindowSearch({ messages, onMessageSelect }: ChatWindowSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const results: { messageIndex: number; message: ChatMessage }[] = [];
    const query = searchQuery.toLowerCase();

    messages.forEach((message, index) => {
      if (message.content.toLowerCase().includes(query)) {
        results.push({ messageIndex: index, message });
      }
    });

    return results;
  }, [searchQuery, messages]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentResultIndex(-1);
  };

  const navigateResult = (direction: 'up' | 'down') => {
    if (searchResults.length === 0) return;

    let newIndex;
    if (direction === 'down') {
      newIndex = currentResultIndex + 1;
      if (newIndex >= searchResults.length) newIndex = 0;
    } else {
      newIndex = currentResultIndex - 1;
      if (newIndex < 0) newIndex = searchResults.length - 1;
    }

    setCurrentResultIndex(newIndex);
    if (onMessageSelect && searchResults[newIndex]) {
      onMessageSelect(searchResults[newIndex].messageIndex);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentResultIndex(-1);
    setIsOpen(false);
  };

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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Search size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={14} />
              <Input
                placeholder="Search in this chat..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
                autoFocus
              />
            </div>
            {searchQuery && (
              <Button variant="ghost" size="sm" onClick={clearSearch} className="h-8 w-8 p-0">
                <X size={14} />
              </Button>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {currentResultIndex >= 0 ? currentResultIndex + 1 : 0} of {searchResults.length} results
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateResult('up')}
                  disabled={searchResults.length === 0}
                  className="h-6 w-6 p-0"
                >
                  <ChevronUp size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateResult('down')}
                  disabled={searchResults.length === 0}
                  className="h-6 w-6 p-0"
                >
                  <ChevronDown size={12} />
                </Button>
              </div>
            </div>
          )}
        </div>

        {searchQuery && (
          <ScrollArea className="max-h-60">
            <div className="p-2 space-y-1">
              {searchResults.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No messages found
                </div>
              ) : (
                searchResults.map((result, index) => (
                  <div
                    key={result.messageIndex}
                    className={`p-2 rounded text-sm cursor-pointer hover:bg-muted/50 transition-colors ${
                      index === currentResultIndex ? 'bg-muted' : ''
                    }`}
                    onClick={() => {
                      setCurrentResultIndex(index);
                      if (onMessageSelect) {
                        onMessageSelect(result.messageIndex);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Badge variant={result.message.sender === 'user' ? 'default' : 'secondary'} className="text-xs">
                        {result.message.sender === 'user' ? 'You' : 'AI'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(result.message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="line-clamp-2">
                      {highlightQuery(result.message.content, searchQuery)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}