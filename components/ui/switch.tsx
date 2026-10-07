"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => {
  let isGuest = true;
  try {
    const { user, loading } = useAuth();
    isGuest = !loading && !user;
  } catch {
    isGuest = true;
  }

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 my-0.5",
        "transition-colors duration-200 ease-in-out motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2",
        isGuest
          ? "focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#2f2f2f]"
          : "focus-visible:ring-offset-white dark:focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input hover:data-[state=unchecked]:bg-input/80 hover:data-[state=checked]:bg-primary/90",
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full ring-0",
          "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-background",
          "transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
          "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
