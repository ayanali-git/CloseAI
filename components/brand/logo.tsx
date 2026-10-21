import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
  inverted?: boolean;
}

export function CloseAIIcon({ className = 'w-6 h-6', size = 24, inverted = false }: LogoProps) {
  const isInverted = inverted || className.includes('text-background');

  return (
    <span
      style={{ width: size, height: size }}
      className={cn("inline-flex items-center justify-center shrink-0 select-none", className)}
    >
      {isInverted ? (
        <>
          <img
            src="/closeai-icon-white.png"
            alt="CloseAI"
            width={size}
            height={size}
            className="w-full h-full object-contain dark:hidden"
          />
          <img
            src="/closeai-icon.png"
            alt="CloseAI"
            width={size}
            height={size}
            className="w-full h-full object-contain hidden dark:block"
          />
        </>
      ) : (
        <>
          <img
            src="/closeai-icon.png"
            alt="CloseAI"
            width={size}
            height={size}
            className="w-full h-full object-contain dark:hidden"
          />
          <img
            src="/closeai-icon-white.png"
            alt="CloseAI"
            width={size}
            height={size}
            className="w-full h-full object-contain hidden dark:block"
          />
        </>
      )}
    </span>
  );
}

export function CloseAILogo({ className = 'flex items-center gap-2.5', iconSize = 22 }: { className?: string; iconSize?: number }) {
  return (
    <div className={className}>
      <CloseAIIcon size={iconSize} />
      <span className="font-semibold text-[17px] tracking-tight text-foreground select-none">
        CloseAI
      </span>
    </div>
  );
}
