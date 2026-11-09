"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/chat/sidebar";
import { useSidebarContext } from "@/components/chat/sidebar-context";
import { ProfilePanel } from "@/components/modals/settings/profile-panel";
import { chatService } from "@/lib/chat-service";
import { supabase } from "@/lib/supabase";
import toast from "@/lib/toast";
import { Loader, PanelRight, Pencil, Share2, Upload } from "lucide-react";
import { EditProfileDrawer } from "@/components/chat/drawer";
import { ShareProfileModal } from "@/components/modals/share-profile-modal";
import { AvatarShapeId } from "@/lib/avatar-shapes";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const rawParam = (params?.username as string) || "";
  const cleanUsername = decodeURIComponent(rawParam).replace(/^@/, "").trim();

  const { user, loading, isSigningOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    chats,
    isChatsLoading,
    loadChats,
    deleteChat,
  } = useSidebarContext();

  // Close sidebar on small screens when entering profile page
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setSidebarOpen(false);
    }
  }, [setSidebarOpen]);

  const currentName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    cleanUsername ||
    "User";

  const currentUsername =
    user?.user_metadata?.username ||
    user?.user_metadata?.user_name ||
    user?.email?.split("@")[0] ||
    cleanUsername ||
    "user";

  const currentAvatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  const currentAvatarShape =
    (user?.user_metadata?.avatar_shape as AvatarShapeId) ||
    ((typeof window !== "undefined" &&
      (localStorage.getItem("closeai_avatar_shape") as AvatarShapeId)) ||
      "circle");


  // Enforce consistent /u/@username URL format if user arrived at /u/username without @
  useEffect(() => {
    if (!rawParam) return;
    const decoded = decodeURIComponent(rawParam);
    if (!decoded.startsWith("@") && cleanUsername) {
      router.replace(`/u/@${encodeURIComponent(cleanUsername)}`);
    }
  }, [rawParam, cleanUsername, router]);

  // Auth protection: redirect guests to /gc
  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (isSigningOut) return;
      router.replace("/gc");
      return;
    }
    loadChats();
  }, [user, loading, isSigningOut, router, loadChats]);

  useEffect(() => {
    if (!cleanUsername && !currentUsername) {
      document.title = "CloseAI";
      return;
    }

    const u = cleanUsername || currentUsername;
    const name = currentName || u;
    document.title = `${name} (@${u}) | CloseAI`;

    // Also fetch the canonical profile from Supabase profiles table to ensure freshest display name
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("name, username")
          .ilike("username", u)
          .maybeSingle();

        if (cancelled || !data) return;
        const resolvedName = data.name || name;
        const resolvedUsername = data.username || u;
        document.title = `${resolvedName} (@${resolvedUsername}) | CloseAI`;
      } catch {
        // keep current title
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cleanUsername, currentUsername, currentName]);

  const handleToggleArchive = async (id: string, archived: boolean) => {
    try {
      if (archived) {
        await chatService.toggleChatStar(supabase, id, false);
      }
      await chatService.toggleChatArchive(supabase, id, archived);
      await loadChats();
      toast.success(archived ? "Chat archived" : "Chat unarchived");
    } catch (e) {
      console.error("Error toggling archive:", e);
      toast.error("Failed to update chat archive status");
    }
  };

  return (
    <div className="flex h-full w-full bg-background text-foreground overflow-hidden">
      <Sidebar
        user={user}
        chats={chats}
        currentChatId={null}
        onChatSelect={(id) => router.push(`/c/${id}`)}
        onNewChat={() => router.push("/c")}
        onDeleteChat={(id) => {
          deleteChat(id)
            .then(() => toast.success("Chat deleted"))
            .catch(() => toast.error("Failed to delete chat"));
        }}
        onToggleStar={async (id, starred) => {
          if (starred) {
            await chatService.toggleChatArchive(supabase, id, false);
          }
          await chatService.toggleChatStar(supabase, id, starred);
          loadChats();
          toast.success(starred ? "Chat pinned" : "Chat unpinned");
        }}
        onToggleArchive={handleToggleArchive}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        isLoading={isChatsLoading || loading || isSigningOut}
      />

      {/* Main Profile Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden selection:bg-secondary selection:text-foreground">
        {/* Transparent Floating Header for small-screen sidebar toggle */}
        <header className="absolute top-0 left-0 right-0 z-30 h-14 pt-[env(safe-area-inset-top,0px)] px-3 sm:px-4 flex items-center justify-between select-none pointer-events-none bg-transparent">
          <div className="absolute top-0 left-0 right-4 sm:right-5 h-20 pointer-events-none -z-10" />

          {/* Left Header Area: Sidebar toggle on small screens */}
          <div className="flex items-center pointer-events-auto mt-3 pl-3 sm:pl-0">
            {!sidebarOpen && (
              <div className="xl:hidden flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => toggleSidebar()}
                      className="group h-11 w-11 rounded-full xl:rounded-sm bg-background border border-border/80 xl:border-0 hover:bg-secondary active:bg-secondary text-foreground flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none select-none shrink-0"
                      aria-label="Open sidebar"
                    >
                      <PanelRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="start"
                    sideOffset={5}
                    className="text-base"
                  >
                    Open sidebar
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Right Header Area: Share & Edit actions (hidden when edit drawer is open, matching /c/id positioning) */}
          {!editDrawerOpen && (
            <div className="flex items-center pointer-events-auto mt-3 pr-3 sm:pr-1">
              <div className="flex items-center gap-2">
                {/* Share your profile button (left side) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setShareModalOpen(true)}
                      className="group h-11 w-11 sm:w-auto px-0 sm:px-4 gap-1.5 rounded-full xl:rounded-sm bg-background border border-border/80 xl:border-0 hover:bg-secondary active:bg-secondary text-foreground flex items-center justify-center text-sm sm:text-base font-medium transition-colors cursor-pointer outline-none focus:outline-none select-none shrink-0"
                      aria-label="Share your profile"
                    >
                      <Upload className="w-5 h-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    sideOffset={5}
                    className="text-base"
                  >
                    Share profile
                  </TooltipContent>
                </Tooltip>

                {/* Edit profile button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setEditDrawerOpen(true)}
                      className="group h-11 w-11 gap-1.5 rounded-full xl:rounded-sm bg-background border border-border/80 xl:border-0 hover:bg-secondary active:bg-secondary text-foreground flex items-center justify-center text-sm sm:text-base font-medium transition-colors cursor-pointer outline-none focus:outline-none select-none shrink-0"
                      aria-label="Edit profile"
                    >
                      <Pencil className="w-5 h-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    sideOffset={5}
                    className="text-base"
                  >
                    Edit profile
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
        </header>

        {/* Content Stream */}
        <div className="flex-1 flex flex-col overflow-y-auto px-4 sm:px-6 pt-16 sm:pt-16 pb-[max(env(safe-area-inset-bottom),1.5rem)] sm:pb-12 no-overscroll">
          <div className="w-full max-w-[820px] mx-auto py-2">
            <ProfilePanel
              isLoading={isChatsLoading || loading || !user}
              onOpenEdit={() => setEditDrawerOpen(true)}
              onUsernameUpdated={(newUsername) => {
                router.replace(`/u/@${encodeURIComponent(newUsername)}`);
              }}
            />
          </div>
        </div>
      </div>

      {/* Edit profile Drawer */}
      <EditProfileDrawer
        isOpen={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        currentName={currentName}
        currentUsername={currentUsername}
        currentAvatarUrl={currentAvatarUrl}
        currentAvatarShape={currentAvatarShape}
        onProfileUpdated={({ username: newUsername }) => {
          if (newUsername && newUsername !== cleanUsername) {
            router.replace(`/u/@${encodeURIComponent(newUsername)}`);
          }
        }}
      />

      {/* Share your profile Modal */}
      <ShareProfileModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        username={cleanUsername}
        displayName={currentName}
        avatarUrl={currentAvatarUrl}
        avatarShape={currentAvatarShape}
      />
    </div>
  );
}
