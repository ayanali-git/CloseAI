"use client";

import React, { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";

interface WelcomeScreenProps {
  user?: User | null;
  resetKey?: number | string;
  onPromptSelect?: (prompt: string) => void;
  children?: React.ReactNode;
  customTitle?: string;
  customSubtitle?: string;
}

export function WelcomeScreen({
  user,
  resetKey,
  onPromptSelect,
  children,
  customTitle,
  customSubtitle,
}: WelcomeScreenProps) {
  const [dynamicTitle, setDynamicTitle] = useState<string>(
    "What would you like to explore?"
  );

  // Maintain a single stable random index for this new chat session.
  // It will NEVER re-roll when switching tabs or when the user object is re-referenced.
  const chosenSeedRef = useRef<number | null>(null);
  const lastResetKeyRef = useRef<number | string | undefined>(resetKey);

  if (lastResetKeyRef.current !== resetKey) {
    lastResetKeyRef.current = resetKey;
    chosenSeedRef.current = Math.floor(Math.random() * 1000);
  }

  useEffect(() => {
    if (chosenSeedRef.current === null) {
      chosenSeedRef.current = Math.floor(Math.random() * 1000);
    }

    const rawName =
      user?.user_metadata?.name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "";

    // Format user name cleanly (e.g., "Ayan Ali" -> "Ayan")
    const formattedName = rawName
      ? rawName
          .split(" ")
          .map((n: string) => n.charAt(0).toUpperCase() + n.slice(1))
          .join(" ")
      : "";
    const firstName = formattedName ? formattedName.split(" ")[0] : "";
    const nameToUse = firstName || formattedName;

    const titlesWithUser = nameToUse
      ? [
          `Hey, ${nameToUse}. Ready to dive in?`,
          `Welcome back, ${nameToUse}. What are we working on today?`,
          `Good to see you, ${nameToUse}. Where should we begin?`,
          `Hey ${nameToUse}, what’s on your mind today?`,
          `What would you like to explore today, ${nameToUse}?`,
          `What are we building today, ${nameToUse}?`,
          `Ready to create something great, ${nameToUse}?`,
          `Hey ${nameToUse}, how can I help you today?`,
          `What idea are we exploring today, ${nameToUse}?`,
          `Where shall we start today, ${nameToUse}?`,
          `What’s on the agenda today, ${nameToUse}?`,
          `Hey ${nameToUse}, what can I assist you with?`,
          `Let’s make something today, ${nameToUse}.`,
          `What can we solve together today, ${nameToUse}?`,
        ]
      : [
          "Where should we begin?",
          "What can I help with today?",
          "What’s on your mind?",
          "Where shall we start?",
          "What would you like to explore?",
          "How can I help you today?",
          "What are we working on today?",
          "What idea are we exploring today?",
          "What do you want to create?",
          "What are we building today?",
        ];

    const listIndex = chosenSeedRef.current % titlesWithUser.length;
    setDynamicTitle(titlesWithUser[listIndex]);
  }, [user, resetKey]);

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center text-center select-none pb-6 sm:pb-8">
      <div className="w-full max-w-3xl relative flex flex-col items-center">
        {/* Title & Subtitle — Anchored strictly above input pill so pill NEVER shifts */}
        <div className="absolute bottom-full left-0 right-0 mb-6 px-6 flex flex-col items-center justify-end pointer-events-none">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90 transition-all duration-200 pointer-events-auto">
            {customTitle || dynamicTitle}
          </h1>
          {customSubtitle && (
            <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl mx-auto leading-relaxed animate-in fade-in-50 duration-200 pointer-events-auto">
              {customSubtitle}
            </p>
          )}
        </div>

        {/* Centered Floating Input Bar — The immutable layout anchor */}
        {children && <div className="w-full">{children}</div>}
      </div>
    </div>
  );
}

export default WelcomeScreen;
