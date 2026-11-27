"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Download, X } from "lucide-react";
import { motion, useIsPresent, useReducedMotion } from "framer-motion";
import { SWIPE_SETTLE, useMobilePanelLayout, useSwipeDismiss } from "@/lib/touch";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 cursor-default data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, onPointerDownOutside, onInteractOutside, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      onPointerDownOutside={(e) => {
        e.preventDefault();
        onPointerDownOutside?.(e);
      }}
      onInteractOutside={(e) => {
        e.preventDefault();
        onInteractOutside?.(e);
      }}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-base text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

interface PreviewDialogProps {
  kind: "image" | "file";
  title: string;
  isGuest: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: () => void;
  children: React.ReactNode;
}

export function PreviewDialog({
  kind,
  title,
  isGuest,
  onOpenChange,
  onDownload,
  children,
}: PreviewDialogProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const mobile = useMobilePanelLayout();
  const present = useIsPresent();
  const { offset, backdropOpacity, bind } = useSwipeDismiss({
    direction: "down",
    enabled: present && mobile,
    panelRef,
    onRelease: ({ shouldDismiss }) => {
      if (shouldDismiss) onOpenChange(false);
    },
  });

  const buttonClass = cn(
    "group h-10 w-10 flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none select-none shrink-0",
    isGuest
      ? "rounded-full bg-white dark:bg-[#303030] border border-border/80 dark:border-white/10 hover:bg-secondary dark:hover:bg-[#404040] active:bg-secondary dark:active:bg-[#404040] text-muted-foreground hover:text-foreground"
      : "rounded-sm xl:rounded-full bg-background border border-border/80 dark:border-none hover:bg-secondary active:bg-secondary text-foreground"
  );

  return (
    <DialogPrimitive.Root open onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay asChild>
          <motion.div
            style={{ opacity: backdropOpacity }}
            className="fixed inset-0 z-50 bg-background/80 cursor-default"
          />
        </DialogPrimitive.Overlay>
        <DialogPrimitive.Content asChild>
          <motion.div
            ref={panelRef}
            style={{ y: offset }}
            initial={false}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={mobile && !reduceMotion ? SWIPE_SETTLE : { duration: 0 }}
            className="fixed inset-0 z-50 w-full h-[100dvh] px-3 sm:px-6 pt-14 pb-[max(env(safe-area-inset-bottom,0px),1rem)] bg-transparent border-0 outline-none focus:outline-none flex items-center justify-center pointer-events-auto cursor-default"
            onClick={() => onOpenChange(false)}
          >
            <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">Preview {kind} full size</DialogPrimitive.Description>
            <header className="absolute top-0 left-0 right-0 z-10 h-14 pt-[env(safe-area-inset-top,0px)] px-3 sm:px-4 flex items-center justify-end select-none pointer-events-none">
              <div
                {...bind}
                aria-hidden="true"
                onClick={(event) => event.stopPropagation()}
                className="absolute inset-0 xl:hidden flex justify-center pt-4 touch-none pointer-events-auto cursor-grab active:cursor-grabbing"
              >
                <div className="h-1 w-10 rounded-full bg-muted-foreground" />
              </div>
              <div
                className="relative flex items-center pointer-events-auto pr-3 sm:pr-1 gap-2"
                onClick={(event) => event.stopPropagation()}
              >
                {onDownload && (
                  <button
                    type="button"
                    onClick={onDownload}
                    className={buttonClass}
                    title={`Download ${kind}`}
                    aria-label={`Download ${kind}`}
                  >
                    <Download className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className={buttonClass}
                  title={`Close ${kind} preview`}
                  aria-label={`Close ${kind} preview`}
                >
                  <X className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                </button>
              </div>
            </header>
            {children}
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
