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

function isModalOrDialogOpen(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    return (
      document.body.classList.contains('modal-open-no-scroll') ||
      document.body.style.overflow === 'hidden' ||
      document.querySelector('[role="dialog"]') !== null ||
      document.querySelector('[aria-modal="true"]') !== null
    );
  } catch {
    return false;
  }
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

  // Whenever controlledOpen transitions to false, reset internal state so
  // reverting to uncontrolled does not retain a stale 'true'
  React.useEffect(() => {
    if (controlledOpen === false) {
      setInternalOpen(false);
    }
  }, [controlledOpen]);

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

  // Close tooltip automatically whenever a modal or dialog opens
  React.useEffect(() => {
    if (typeof document === 'undefined') return;

    const checkModal = () => {
      if (isModalOrDialogOpen()) {
        if (!isControlled) {
          setInternalOpen(false);
        }
        onOpenChange?.(false);
      }
    };

    checkModal();

    let observer: MutationObserver | null = null;
    try {
      observer = new MutationObserver(checkModal);
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
    } catch {}

    const handlePointerDown = () => {
      if (isModalOrDialogOpen()) {
        checkModal();
      }
    };
    window.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      observer?.disconnect();
      window.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [isControlled, onOpenChange]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        // Prevent tooltip from automatically triggering when switching tabs or refocusing the window
        if (Date.now() - lastWindowFocusTime < 800) {
          return;
        }

        // Prevent tooltip from opening if ANY modal or dialog is active
        if (isModalOrDialogOpen()) {
          return;
        }
      }

      if (!nextOpen) {
        // Only block premature close if focused via keyboard Tab navigation
        const now = Date.now();
        const timeSinceFocus = now - focusTimestampRef.current;
        const isStillFocused =
          isFocusedRef.current ||
          (triggerRef.current &&
            (document.activeElement === triggerRef.current ||
              triggerRef.current.contains(document.activeElement)));

        let isKeyboardFocus = false;
        try {
          isKeyboardFocus = !!triggerRef.current?.matches(':focus-visible');
        } catch {}

        if (isKeyboardFocus && isStillFocused && timeSinceFocus < 600) {
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
>(({ onFocus, onBlur, onClick, onKeyDown, onPointerDown, ...props }, ref) => {
  const ctx = React.useContext(TooltipContext);
  const lastPointerDownTimeRef = React.useRef(0);

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
      onPointerDown={(e) => {
        lastPointerDownTimeRef.current = Date.now();
        if (ctx) {
          ctx.isFocusedRef.current = false;
          ctx.setOpenState(false);
        }
        onPointerDown?.(e);
      }}
      onFocus={(e) => {
        // If focus occurred right after window/tab switch, prevent opening tooltip
        if (Date.now() - lastWindowFocusTime < 800) {
          e.preventDefault();
          return;
        }

        // If focus was triggered by pointer/mouse click, never open the tooltip
        const isRecentPointer = Date.now() - lastPointerDownTimeRef.current < 600;
        let isKeyboardFocus = false;
        try {
          isKeyboardFocus = !!(e.target as HTMLElement)?.matches(':focus-visible');
        } catch {}

        if (isRecentPointer || !isKeyboardFocus) {
          e.preventDefault();
          if (ctx) {
            ctx.isFocusedRef.current = false;
            ctx.setOpenState(false);
          }
          onFocus?.(e);
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
          ctx.isFocusedRef.current = false;
          ctx.setOpenState(false);
        }
        onClick?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
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
