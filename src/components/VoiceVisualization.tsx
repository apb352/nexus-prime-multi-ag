import { useEffect, useState } from 'react';
import { VoiceLevelIndicator } from './VoiceLevelIndicator';
import { cn } from '@/lib/utils';

interface VoiceVisualizationProps {
  isActive: boolean;
  className?: string;
  variant?: 'inline' | 'floating' | 'embedded';
}

export function VoiceVisualization({ 
  isActive, 
  className,
  variant = 'inline' 
}: VoiceVisualizationProps) {
  const [showRipple, setShowRipple] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowRipple(true);
      const timer = setTimeout(() => setShowRipple(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (variant === 'floating') {
    return (
      <div className={cn(
        'absolute -top-2 -right-2 z-10',
        className
      )}>
        <div className="relative">
          {/* Ripple effect */}
          {isActive && (
            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
          )}
          <VoiceLevelIndicator 
            isActive={isActive} 
            size="sm" 
            variant="pulse"
            className="relative z-10"
          />
        </div>
      </div>
    );
  }

  if (variant === 'embedded') {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-full border border-primary/20',
        isActive && 'bg-primary/20 border-primary/40',
        className
      )}>
        <div className="flex items-center gap-1">
          <div className={cn(
            'w-2 h-2 rounded-full bg-primary',
            isActive ? 'animate-pulse' : 'opacity-50'
          )} />
          <span className="text-xs text-muted-foreground">
            {isActive ? 'Speaking...' : 'Ready to speak'}
          </span>
        </div>
        <VoiceLevelIndicator 
          isActive={isActive} 
          size="sm" 
          variant="bars"
        />
      </div>
    );
  }

  // inline variant (default)
  return (
    <div className={cn(
      'flex items-center gap-2',
      className
    )}>
      <VoiceLevelIndicator 
        isActive={isActive} 
        size="sm" 
        variant="bars"
      />
      {isActive && (
        <span className="text-xs text-primary animate-pulse">
          Speaking...
        </span>
      )}
    </div>
  );
}