'use client';

import * as React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';

import { cn } from '@/lib/utils';

interface HoverCardContextValue {
  setOpenState: (open: boolean) => void;
}

const HoverCardContext = React.createContext<HoverCardContextValue | null>(null);

const HoverCard = ({
  openDelay = 0,
  closeDelay = 0,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Root>) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  const setOpenState = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  return (
    <HoverCardContext.Provider value={{ setOpenState }}>
      <HoverCardPrimitive.Root
        open={isOpen}
        onOpenChange={handleOpenChange}
        openDelay={openDelay}
        closeDelay={closeDelay}
        {...props}
      />
    </HoverCardContext.Provider>
  );
};

const HoverCardTrigger = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Trigger>
>(({ onClick, onClickCapture, onFocus, ...props }, ref) => {
  const ctx = React.useContext(HoverCardContext);

  return (
    <HoverCardPrimitive.Trigger
      ref={ref}
      onFocus={(e) => {
        // Prevent opening on click/touch focus so hover card only opens on genuine hover
        e.preventDefault();
        onFocus?.(e);
      }}
      onClickCapture={(e) => {
        ctx?.setOpenState(false);
        onClickCapture?.(e);
      }}
      onClick={(e) => {
        ctx?.setOpenState(false);
        onClick?.(e);
      }}
      {...props}
    />
  );
});
HoverCardTrigger.displayName = HoverCardPrimitive.Trigger.displayName;

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, style, onClick, onClickCapture, ...props }, ref) => {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground outline-none transition-none animate-none duration-0 !transition-none !animate-none !duration-0',
          className
        )}
        style={{ animation: 'none', transition: 'none', ...style }}
        onClickCapture={onClickCapture}
        onClick={onClick}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  );
});
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export { HoverCard, HoverCardTrigger, HoverCardContent };
