'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;

let lastWindowFocusTime = 0;

if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    lastWindowFocusTime = Date.now();
  });
}

interface TooltipContextValue {
  isFocusedRef: React.MutableRefObject<boolean>;
  focusTimestampRef: React.MutableRefObject<number>;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  setOpenState: (open: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

const Tooltip = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isFocusedRef = React.useRef(false);
  const focusTimestampRef = React.useRef(0);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  // Immediately close tooltip when user switches tabs or window loses focus
  React.useEffect(() => {
    const handleWindowBlur = () => {
      if (!isControlled) {
        setInternalOpen(false);
      }
      onOpenChange?.(false);
    };
    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, [isControlled, onOpenChange]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        // Prevent tooltip from automatically triggering when switching tabs or refocusing the window
        if (Date.now() - lastWindowFocusTime < 800) {
          return;
        }
      }

      if (!nextOpen) {
        // When tabbing to an element that causes a container scroll (e.g., auto scroll-into-view),
        // Radix's internal handleScroll listener automatically calls onClose().
        // If the trigger was focused via keyboard within 600ms and is still the active element,
        // ignore this premature close to allow the tooltip to remain open for the user.
        const now = Date.now();
        const timeSinceFocus = now - focusTimestampRef.current;
        const isStillFocused =
          isFocusedRef.current ||
          (triggerRef.current &&
            (document.activeElement === triggerRef.current ||
              triggerRef.current.contains(document.activeElement)));

        if (isStillFocused && timeSinceFocus < 600) {
          return;
        }
      }

      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  return (
    <TooltipContext.Provider
      value={{
        isFocusedRef,
        focusTimestampRef,
        triggerRef,
        setOpenState: (open: boolean) => {
          if (!isControlled) {
            setInternalOpen(open);
          }
          onOpenChange?.(open);
        },
      }}
    >
      <TooltipPrimitive.Root
        open={isOpen}
        onOpenChange={handleOpenChange}
        {...props}
      >
        {children}
      </TooltipPrimitive.Root>
    </TooltipContext.Provider>
  );
};

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ onFocus, onBlur, onClick, onKeyDown, ...props }, ref) => {
  const ctx = React.useContext(TooltipContext);

  return (
    <TooltipPrimitive.Trigger
      ref={(node: any) => {
        if (ctx) {
          ctx.triggerRef.current = node;
        }
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as any).current = node;
        }
      }}
      onFocus={(e) => {
        // If focus occurred right after window/tab switch, prevent opening tooltip
        if (Date.now() - lastWindowFocusTime < 800) {
          e.preventDefault();
          return;
        }
        if (ctx) {
          ctx.isFocusedRef.current = true;
          ctx.focusTimestampRef.current = Date.now();
        }
        onFocus?.(e);
      }}
      onBlur={(e) => {
        if (ctx) {
          ctx.isFocusedRef.current = false;
          ctx.setOpenState(false);
        }
        onBlur?.(e);
      }}
      onClick={(e) => {
        if (ctx) {
          ctx.setOpenState(false);
        }
        onClick?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          if (ctx) {
            ctx.isFocusedRef.current = false;
            ctx.setOpenState(false);
          }
        }
        onKeyDown?.(e);
      }}
      {...props}
    />
  );
});
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, collisionPadding = 12, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className={cn(
        'z-[9999] overflow-hidden rounded-full bg-secondary px-3 py-1 text-[15px] font-normal text-foreground select-none',
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
