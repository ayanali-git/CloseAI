"use client";

import React from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClearChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewChat: () => void;
  onOpenLogin: () => void;
  onOpenSignup?: () => void;
  forceModal?: boolean;
}

export function ClearChatModal({
  open,
  onOpenChange,
  onNewChat,
  onOpenLogin,
  onOpenSignup,
  forceModal,
}: ClearChatModalProps) {
  const handleNewChat = () => {
    onOpenChange(false);
    onNewChat();
  };

  const handleLogin = () => {
    onOpenChange(false);
    onOpenLogin();
  };

  const handleSignup = () => {
    onOpenChange(false);
    (onOpenSignup || onOpenLogin)();
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={["auto"]}
      className="max-w-[440px]"
      forceModal={forceModal}
    >
      <div className="flex flex-col space-y-5 pt-1 pb-2 relative">
        {/* Top-Right Close Button matching LoginModal */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute top-0 right-0 w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center pt-2">
          <h2 className="text-2xl font-normal tracking-tight text-foreground">
            Clear chat
          </h2>
          <p className="text-base text-muted-foreground mt-2 leading-relaxed px-2 sm:px-4">
            To start a new chat, your current conversation will be discarded.{" "}
            <span
              onClick={handleSignup}
              className="font-semibold text-foreground hover:opacity-80 active:opacity-70 transition-opacity cursor-pointer"
            >
              Log in
            </span>{" "}
            or{" "}
            <span
              onClick={handleLogin}
              className="font-semibold text-foreground hover:opacity-80 active:opacity-70 transition-opacity cursor-pointer"
            >
              Sign up
            </span>{" "}
            to save chats.
          </p>
        </div>

        {/* Action Buttons styled consistently with LoginModal */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full h-11 rounded-full bg-foreground text-background font-medium text-base flex items-center justify-center hover:opacity-90 active:scale-[0.99] border border-transparent focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all cursor-pointer select-none"
          >
            New chat
          </button>

          <button
            type="button"
            onClick={handleLogin}
            className="w-full h-11 rounded-full bg-secondary/80 dark:bg-[#2f2f2f] hover:bg-secondary dark:hover:bg-[#383838] text-foreground font-medium text-base flex items-center justify-center border border-transparent focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors cursor-pointer select-none"
          >
            Log in
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

export default ClearChatModal;
