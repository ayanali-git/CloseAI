'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Chat, chatService } from '@/lib/chat-service';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

const DESKTOP_BREAKPOINT = 1280;

interface SidebarContextType {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  isChatsLoading: boolean;
  loadChats: () => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
}

const SidebarContext = createContext<SidebarContextType>({
  sidebarOpen: true,
  setSidebarOpen: () => {},
  toggleSidebar: () => {},
  chats: [],
  setChats: () => {},
  isChatsLoading: true,
  loadChats: async () => {},
  deleteChat: async () => {},
});

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const { user } = useAuth();
  const pathname = usePathname();

  // Desktop preference memory (persisted to cookie on desktop)
  const desktopPreferenceRef = useRef<boolean>(defaultOpen);
  const isDesktopRef = useRef<boolean>(true);
  const prevPathnameRef = useRef<string | null>(null);

  // Initial state MUST match server-rendered defaultOpen for hydration
  const [sidebarOpen, setSidebarOpenRaw] = useState<boolean>(defaultOpen);

  const [chats, setChats] = useState<Chat[]>([]);
  const [isChatsLoading, setIsChatsLoading] = useState<boolean>(true);
  const deletedChatIdsRef = useRef<Set<string>>(new Set());

  const loadChats = useCallback(async () => {
    if (!user) {
      setIsChatsLoading(false);
      return;
    }
    try {
      const userChats = await chatService.getUserChats(supabase, user.id);
      const filtered = userChats.filter((c) => !deletedChatIdsRef.current.has(c.id));
      setChats(filtered);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsChatsLoading(false);
    }
  }, [user]);

  const deleteChat = useCallback(
    async (chatIdToDelete: string) => {
      deletedChatIdsRef.current.add(chatIdToDelete);
      setChats((prev) => prev.filter((c) => c.id !== chatIdToDelete));
      try {
        await chatService.deleteChat(supabase, chatIdToDelete);
        setTimeout(() => {
          deletedChatIdsRef.current.delete(chatIdToDelete);
        }, 5000);
      } catch (err) {
        console.error('Failed to delete chat in background:', err);
        deletedChatIdsRef.current.delete(chatIdToDelete);
        loadChats();
        throw err;
      }
    },
    [loadChats]
  );

  useEffect(() => {
    if (user) {
      loadChats();
    } else {
      setChats([]);
      setIsChatsLoading(false);
    }
  }, [user, loadChats]);

  // Persist sidebar state to cookie only for desktop
  const persistSidebarState = (open: boolean) => {
    try {
      if (typeof document !== 'undefined') {
        document.cookie = `sidebar_open=${open}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch (e) {}
  };

  // On mount: sync desktop preference and set initial pathname
  useEffect(() => {
    const isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;
    isDesktopRef.current = isDesktop;

    if (isDesktop) {
      desktopPreferenceRef.current = defaultOpen;
      setSidebarOpenRaw(defaultOpen);
    } else {
      setSidebarOpenRaw(false);
    }

    prevPathnameRef.current = pathname;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On navigation: automatically close the mobile drawer on route changes,
  // but skip on the first render (so no flash-close on mount) and leave desktop untouched.
  useEffect(() => {
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname;
      return;
    }
    if (pathname === prevPathnameRef.current) return;
    prevPathnameRef.current = pathname;

    if (typeof window !== 'undefined' && window.innerWidth < DESKTOP_BREAKPOINT) {
      setSidebarOpenRaw(false);
    }
  }, [pathname]);

  // Handle window resize crossing between mobile and desktop
  useEffect(() => {
    let prevIsDesktop = isDesktopRef.current;

    const handleResize = () => {
      const nowDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;
      if (nowDesktop === prevIsDesktop) return; // Didn't cross the breakpoint

      isDesktopRef.current = nowDesktop;
      prevIsDesktop = nowDesktop;

      if (nowDesktop) {
        // Mobile → Desktop: restore the user's desktop preference!
        setSidebarOpenRaw(desktopPreferenceRef.current);
      } else {
        // Desktop → Mobile: close the overlay drawer (do not touch desktop cookie)
        setSidebarOpenRaw(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpenRaw((prev) => {
      const next = !prev;
      if (isDesktopRef.current) {
        desktopPreferenceRef.current = next;
        persistSidebarState(next);
      }
      return next;
    });
  }, []);

  const handleSetSidebarOpen: React.Dispatch<React.SetStateAction<boolean>> = useCallback((action) => {
    setSidebarOpenRaw((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (isDesktopRef.current) {
        desktopPreferenceRef.current = next;
        persistSidebarState(next);
      }
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen: handleSetSidebarOpen,
        toggleSidebar,
        chats,
        setChats,
        isChatsLoading,
        loadChats,
        deleteChat,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  return useContext(SidebarContext);
}
