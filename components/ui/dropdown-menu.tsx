'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';

import { cn } from '@/lib/utils';

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
    chevronClassName?: string;
  }
>(({ className, inset, chevronClassName, children, onPointerMove, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    onPointerMove={(e) => {
      e.currentTarget.focus();
      onPointerMove?.(e);
    }}
    className={cn(
      'flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-md outline-none transition-colors duration-75 hover:bg-secondary dark:hover:bg-[#2f2f2f] dark:focus:bg-[#2f2f2f] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#2f2f2f] data-[state=open]:bg-secondary dark:data-[state=open]:bg-[#2f2f2f] text-foreground group focus:outline-none focus:ring-0 ring-0 text-left',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className={cn("ml-auto h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors", chevronClassName)} />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, sideOffset = 8, alignOffset = -4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      className={cn(
        'z-[9999] min-w-[10rem] overflow-hidden rounded-2xl bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none p-1.5 text-foreground outline-none focus:outline-none focus:ring-0',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 8, onCloseAutoFocus, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      onCloseAutoFocus={(e) => {
        if (onCloseAutoFocus) {
          onCloseAutoFocus(e);
        } else {
          e.preventDefault();
        }
      }}
      className={cn(
        'z-[9999] min-w-[8rem] overflow-hidden rounded-2xl bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none p-1.5 text-foreground outline-none focus:outline-none focus:ring-0',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, onPointerMove, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    onPointerMove={(e) => {
      e.currentTarget.focus();
      onPointerMove?.(e);
    }}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-md outline-none transition-colors duration-75 hover:bg-secondary dark:hover:bg-[#2f2f2f] dark:focus:bg-[#2f2f2f] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#2f2f2f] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-foreground group focus:outline-none focus:ring-0 ring-0 text-left',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-xl py-2 pl-8 pr-3 text-md outline-none transition-colors duration-100 hover:bg-secondary dark:hover:bg-[#2f2f2f] dark:focus:bg-[#2f2f2f] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-foreground focus:outline-none focus:ring-0 ring-0 text-left',
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-foreground" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2 text-md outline-none transition-colors duration-100 hover:bg-secondary dark:hover:bg-[#2f2f2f] dark:focus:bg-[#2f2f2f] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-foreground group focus:outline-none focus:ring-0 ring-0 text-left',
      className
    )}
    {...props}
  >
    {children}
    <DropdownMenuPrimitive.ItemIndicator className="ml-auto">
      <Check className="h-4 w-4 text-foreground" />
    </DropdownMenuPrimitive.ItemIndicator>
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'px-3 py-1.5 text-md font-semibold text-muted-foreground',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn(' my-1.5 h-[1px] bg-neutral-200 dark:bg-[#383838] border-0 shrink-0 block', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn('ml-auto text-md tracking-widest opacity-60', className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
