'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '@/lib/utils';

type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface AvatarContextValue {
  status: ImageLoadingStatus;
  setStatus: (status: ImageLoadingStatus) => void;
  hasSrc: boolean;
  setHasSrc: (has: boolean) => void;
}

const AvatarContext = React.createContext<AvatarContextValue>({
  status: 'idle',
  setStatus: () => {},
  hasSrc: false,
  setHasSrc: () => {},
});

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, children, ...props }, ref) => {
  const [status, setStatus] = React.useState<ImageLoadingStatus>('idle');
  const [hasSrc, setHasSrc] = React.useState(false);

  return (
    <AvatarContext.Provider value={{ status, setStatus, hasSrc, setHasSrc }}>
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
          className
        )}
        {...props}
      >
        {children}
      </AvatarPrimitive.Root>
    </AvatarContext.Provider>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, onLoadingStatusChange, ...props }, ref) => {
  const { setStatus, setHasSrc } = React.useContext(AvatarContext);

  React.useEffect(() => {
    setHasSrc(!!src);
    if (src) {
      setStatus('loading');
    } else {
      setStatus('idle');
    }
  }, [src, setHasSrc, setStatus]);

  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={src}
      className={cn('aspect-square h-full w-full', className)}
      onLoadingStatusChange={(newStatus) => {
        setStatus(newStatus);
        onLoadingStatusChange?.(newStatus);
      }}
      {...props}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, children, ...props }, ref) => {
  const { status, hasSrc } = React.useContext(AvatarContext);
  const isLoading = hasSrc && (status === 'loading' || status === 'idle');

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted',
        isLoading
          ? 'animate-pulse bg-secondary dark:bg-neutral-800/80 text-transparent select-none'
          : className
      )}
      {...props}
    >
      {isLoading ? null : children}
    </AvatarPrimitive.Fallback>
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
