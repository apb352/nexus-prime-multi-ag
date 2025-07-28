import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface VoiceLevelIndicatorProps {
  isActive: boolean;
  level?: number; // 0-1 range
  size?: 'sm' | 'md' | 'lg';
  variant?: 'bars' | 'wave' | 'pulse';
  className?: string;
}

export function VoiceLevelIndicator({ 
  isActive, 
  level = 0.5, 
  size = 'md',
  variant = 'bars',
  className 
}: VoiceLevelIndicatorProps) {
  const [animatedLevel, setAnimatedLevel] = useState(0);
  const [bars, setBars] = useState<number[]>([]);

  // Simulate dynamic voice levels when active
  useEffect(() => {
    if (!isActive) {
      setAnimatedLevel(0);
      setBars([0, 0, 0, 0, 0]);
      return;
    }

    const interval = setInterval(() => {
      // Create realistic voice pattern with varying intensities
      const baseLevel = 0.3 + Math.random() * 0.4;
      const spike = Math.random() > 0.7 ? Math.random() * 0.3 : 0;
      const newLevel = Math.min(1, baseLevel + spike);
      
      setAnimatedLevel(newLevel);
      
      // Generate bar heights based on the level
      const newBars = Array.from({ length: 5 }, (_, i) => {
        const barThreshold = (i + 1) * 0.2;
        const intensity = Math.max(0, newLevel - barThreshold + 0.2);
        return Math.min(1, intensity + Math.random() * 0.1);
      });
      setBars(newBars);
    }, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  const sizeClasses = {
    sm: 'h-4',
    md: 'h-6', 
    lg: 'h-8'
  };

  const barSizeClasses = {
    sm: 'w-0.5 h-4',
    md: 'w-1 h-6',
    lg: 'w-1.5 h-8'
  };

  if (variant === 'bars') {
    return (
      <div className={cn(
        'flex items-end gap-0.5 justify-center',
        sizeClasses[size],
        className
      )}>
        {bars.map((barLevel, index) => (
          <div
            key={index}
            className={cn(
              'bg-primary rounded-sm transition-all duration-100',
              barSizeClasses[size],
              !isActive && 'opacity-30',
              isActive && 'animate-voice-bars'
            )}
            style={{
              height: isActive ? `${Math.max(10, barLevel * 100)}%` : '20%',
              opacity: isActive ? Math.max(0.3, barLevel) : 0.3,
              animationDelay: `${index * 0.1}s`
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <div className={cn(
        'flex items-center justify-center relative',
        sizeClasses[size],
        className
      )}>
        <svg
          width="40"
          height="24"
          viewBox="0 0 40 24"
          className="overflow-visible"
        >
          <path
            d={`M 0 12 Q 10 ${12 - animatedLevel * 8} 20 12 Q 30 ${12 + animatedLevel * 8} 40 12`}
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className={cn(
              'text-primary transition-all duration-100',
              !isActive && 'opacity-30'
            )}
            style={{
              filter: isActive ? `drop-shadow(0 0 4px currentColor)` : 'none'
            }}
          />
        </svg>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn(
        'flex items-center justify-center',
        sizeClasses[size],
        className
      )}>
        <div
          className={cn(
            'w-4 h-4 bg-primary rounded-full transition-all duration-100',
            !isActive && 'opacity-30',
            isActive && 'animate-voice-pulse'
          )}
          style={{
            transform: isActive ? `scale(${1 + animatedLevel * 0.5})` : 'scale(1)',
            opacity: isActive ? Math.max(0.5, animatedLevel) : 0.3,
            filter: isActive ? `drop-shadow(0 0 ${animatedLevel * 8}px currentColor)` : 'none'
          }}
        />
      </div>
    );
  }

  return null;
}