'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { AnimatedCheckbox } from '@/components/ui/animated';
import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AnimatedCheckbox
    ref={ref}
    size={20}
    className={cn('h-5 w-5 rounded-full bg-card border border-border/80', className)}
    {...props}
  />
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };