"use client";

import React, { useState, useRef, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Chat } from "@/lib/chat-service";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/components/subscription-provider";
import { CloseAIIcon } from "@/components/brand/logo";
import {
  Plus,
  Search,
  Trash2,
  Pin,
  PinOff,
  Settings,
  LogOut,
  PanelLeft,
  PanelRight,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  Check,
  User as UserIcon,
  HelpCircle,
  Clock,
  PenLine,
  ArrowDownCircle,
  Command,
  FileText,
  Info,
  Bug,
  LifeBuoy,
  ChevronRight,
  ChevronLeft,
  Archive,
  ArchiveX,
  Download,
  ArrowUpRight,
  Store,
  SquarePen,
  Image as ImageIcon,
  Globe,
  X,
  CreditCard,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { useTheme } from "next-themes";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  AnimatedChevron,
  AnimatedComingSoonText,
  AnimatedSearchClose,
} from "@/components/ui/animated";
import { LogoutModal } from "@/components/modals/log-out-modal";
import { DeleteModal } from "@/components/modals/delete-chat-modal";
import toast from "@/lib/toast";
import { openSettings } from "@/lib/settings-hash";
import { motion } from "framer-motion";

const SIDEBAR_SPRING = { type: "spring", damping: 30, stiffness: 320 } as const;

interface SidebarProps {
  user: User | null;
  chats: Chat[];
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onToggleStar: (chatId: string, starred: boolean) => void;
  onToggleArchive?: (chatId: string, archived: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  isLoading?: boolean;
  onOpenLoginModal?: () => void;
  onOpenWebSearchModal?: () => void;
  onOpenAdvancedFeaturesModal?: () => void;
  onWebSearchHover?: () => void;
}

/**
 * Auto-scrolling title on hover
 */
function ChatTitleMarquee({
  title,
  isHovered,
  isSelected,
}: {
  title: string;
  isHovered: boolean;
  isSelected: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowWidth, setOverflowWidth] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (textRef.current && containerRef.current) {
        const isMobile =
          typeof window !== "undefined" && window.innerWidth < 1280;
        const actionSpace = isMobile ? 0 : 70;

        const diff =
          textRef.current.scrollWidth -
          containerRef.current.clientWidth +
          actionSpace;

        setOverflowWidth(Math.max(diff, 0));
      }
    };

    measure();

    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("resize", measure);
    };
  }, [title]);

  const isScrolling = overflowWidth > 0 && isHovered;

  const duration = Math.max(3.2, overflowWidth / 35 + 1.8);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-w-0 overflow-hidden pr-1 max-xl:mr-[78px]"
      style={{
        maskImage:
          overflowWidth > 0
            ? isScrolling
              ? "linear-gradient(to right, transparent 0%, black 5px, black calc(100% - 5px), transparent 100%)"
              : "linear-gradient(to right, black 0%, black calc(100% - 8px), transparent 100%)"
            : "none",

        WebkitMaskImage:
          overflowWidth > 0
            ? isScrolling
              ? "linear-gradient(to right, transparent 0%, black 5px, black calc(100% - 5px), transparent 100%)"
              : "linear-gradient(to right, black 0%, black calc(100% - 8px), transparent 100%)"
            : "none",
      }}
    >
      {/* Chat title */}
      <span
        ref={textRef}
        style={
          {
            "--marquee-dist": `${overflowWidth + 10}px`,
            animation: isScrolling
              ? `chat-title-marquee ${duration}s ease-in-out infinite`
              : "none",
            transform: isScrolling ? undefined : "translateX(0px)",
            transition: isScrolling ? "none" : "transform 0.25s ease-out",
          } as React.CSSProperties
        }
        className="inline-block whitespace-nowrap text-[15px] leading-snug select-none will-change-transform"
      >
        {title || "New chat"}
      </span>
    </div>
  );
}

const groupChats = (chats: Chat[]) => {
  const groups: Record<string, Chat[]> = {
    Pinned: [],
    Archived: [],
    Chats: [],
  };

  chats.forEach((chat) => {
    if (chat.starred) {
      groups["Pinned"].push(chat);
      return;
    }

    if (chat.archived) {
      groups["Archived"].push(chat);
      return;
    }

    groups["Chats"].push(chat);
  });

  return groups;
};

export function Sidebar({
  user,
  chats,
  currentChatId,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  onToggleStar,
  onToggleArchive,
  searchQuery,
  onSearchChange,
  isOpen,
  onToggle,
  isLoading = false,
  onOpenLoginModal,
  onOpenWebSearchModal,
  onOpenAdvancedFeaturesModal,
  onWebSearchHover,
}: SidebarProps) {
  const { signOut, loading: authLoading } = useAuth();
  // True while the session is still being restored on reload (user not known yet).
  const isAuthLoading = authLoading && !user;
  // Show the profile skeleton at the same time as the chat skeleton
  const showProfileSkeleton = isAuthLoading || (!!user && isLoading);
  const { plan: userPlan } = useSubscription();
  const { theme, setTheme } = useTheme();
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [pressedChatId, setPressedChatId] = useState<string | null>(null);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isCloseBtnHovered, setIsCloseBtnHovered] = useState(false);
  const [isImagesHovered, setIsImagesHovered] = useState(false);

  useEffect(() => {
    if (isOpen && showSearch) {
      const timer = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);

      return () => window.clearTimeout(timer);
    }
  }, [isOpen, showSearch]);

  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const [isGuestCardDismissed, setIsGuestCardDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDismissed =
        document.body.getAttribute("data-guest-card-dismissed") === "true" ||
        document.cookie.includes("guest_card=true");
      if (isDismissed) {
        setIsGuestCardDismissed(true);
        document.body.setAttribute("data-guest-card-dismissed", "true");
      }
    }
    fetch("/api/guest-card")
      .then((res) => res.json())
      .then((data) => {
        if (data?.dismissed) {
          setIsGuestCardDismissed(true);
          if (typeof document !== "undefined") {
            document.body.setAttribute("data-guest-card-dismissed", "true");
          }
        }
      })
      .catch(() => {});
  }, []);

  // Close sidebar drawer on Escape key (matching FilesDrawer behavior)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showLogoutModal || chatToDelete) return;
        onToggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showLogoutModal, chatToDelete, onToggle]);

  const toggleSection = (group: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const filteredChats = chats.filter((chat) =>
    chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedChats = groupChats(filteredChats);
  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";
  const planDisplay =
    userPlan === "ultra" ? "Ultra Pro" : userPlan === "pro" ? "Pro" : "Free";
  const userEmail = user?.email || (user ? "" : "Not signed in");
  const avatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const [accountSubView, setAccountSubView] = useState<
    "main" | "theme" | "help" | "accounts"
  >("main");
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setMounted(true);
    });
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 1280);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  /**
   * Account Popover Menu Items (Responsive: Flyout on Desktop, In-Place on Mobile)
   */
  const renderAccountMenuItems = () => {
    // Mobile In-Place Subviews
    if (isMobileScreen && accountSubView === "help") {
      return (
        <div className="space-y-1 p-0.5">
          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              setAccountSubView("main");
            }}
            className="flex items-center gap-2 px-2 py-2 text-md font-medium text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 rounded-xl cursor-pointer w-full text-left transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Help</span>
          </button>
          <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1" />
          <Link
            href="/support/help"
            className="group flex items-center gap-2.5 px-2 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <HelpCircle className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            <span>Help center</span>
          </Link>
          <Link
            href="/company/blog"
            className="group flex items-center gap-2.5 px-2 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <PenLine className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            <span>Release notes</span>
          </Link>
          <div
            className="group w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-md font-normal transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none whitespace-nowrap text-left cursor-pointer select-none text-muted-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f]"
          >
            <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            <AnimatedComingSoonText label="Download apps" comingSoonText="Coming soon" />
          </div>
          <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1" />
          <Link
            href="/company/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between px-2 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <div className="flex items-center gap-2.5">
              <Bug className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              <span>Report a bug</span>
            </div>
          </Link>
          <Link
            href="/support/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between px-2 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              <span>Terms of Use</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-auto transition-opacity duration-150 opacity-100 xl:opacity-0 xl:group-hover:opacity-100" />
          </Link>
          <Link
            href="/support/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between px-2 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              <span>Privacy Policy</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-auto transition-opacity duration-150 opacity-100 xl:opacity-0 xl:group-hover:opacity-100" />
          </Link>
        </div>
      );
    }

    if (isMobileScreen && accountSubView === "accounts") {
      return (
        <div className="space-y-1 p-0.5">
          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              setAccountSubView("main");
            }}
            className="flex items-center gap-2 px-2 py-2 text-md font-medium text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 rounded-xl cursor-pointer w-full text-left transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Accounts</span>
          </button>
          <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1" />
          <div className="flex items-center gap-2 px-2 py-1.5 text-base text-muted-foreground hover:text-foreground select-none">
            <UserIcon className="w-4 h-4 shrink-0" />
            <span className="truncate">{userEmail}</span>
          </div>
          <div className="flex items-center justify-between px-2 py-2 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="w-8 h-8 rounded-full border border-border shrink-0">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-[14px] font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-md font-medium truncate">
                {displayName}
              </span>
            </div>
            <Check className="w-4 h-4 text-foreground shrink-0 ml-2" />
          </div>
          <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1" />
          <Link
            href="/?auth=login"
            className="flex items-center gap-2.5 px-2 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
            <span>Add account</span>
          </Link>
        </div>
      );
    }

    // Default Main View (Desktop uses DropdownMenuSub, Mobile uses Clickable Rows)
    return (
      <div className="space-y-0.5 p-0.5">
        {/* Account Info Button */}
        {isMobileScreen ? (
          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              setAccountSubView("accounts");
            }}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 text-left transition-colors cursor-pointer outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <Avatar className="w-8 h-8 rounded-full border border-border shrink-0">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-md font-semibold bg-secondary text-foreground">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-md font-medium truncate text-foreground leading-tight">
                {displayName}
              </p>
              <p className="text-sm text-muted-foreground leading-tight">
                {planDisplay}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
          </button>
        ) : (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2.5 px-2 py-2 text-md rounded-xl cursor-pointer">
              <Avatar className="w-8 h-8 rounded-full border border-border shrink-0">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-md font-semibold bg-secondary text-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-md font-medium truncate text-foreground leading-tight">
                  {displayName}
                </p>
                <p className="text-sm text-muted-foreground leading-tight">
                  {planDisplay}
                </p>
              </div>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              sideOffset={5}
              alignOffset={-102}
              className="w-64 rounded-2xl p-2 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none"
            >
              <div className="flex items-center gap-2 px-2 py-2 text-md text-muted-foreground hover:text-foreground select-none">
                <UserIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{userEmail}</span>
              </div>
              <DropdownMenuItem className="flex items-center justify-between px-2 py-2 rounded-xl cursor-pointer">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="w-8 h-8 rounded-full border border-border shrink-0">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-[14px] font-semibold">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-md font-medium truncate">
                    {displayName}
                  </span>
                </div>
                <Check className="w-4 h-4 text-foreground shrink-0 ml-2" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/?auth=login"
                  className="flex items-center gap-2.5 px-2 py-2 cursor-pointer rounded-xl text-md"
                >
                  <Plus className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  <span>Add account</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1 -mx-1.5" />

        {/* Upgrade plan */}
        <DropdownMenuItem
          onClick={() => openSettings("plans")}
          className="flex items-center gap-2.5 px-2 py-2 rounded-xl text-md cursor-pointer"
        >
          <CreditCard className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          <span>Plans</span>
        </DropdownMenuItem>

        {/* Data */}
        <DropdownMenuItem
          onClick={() => openSettings("data")}
          className="flex items-center gap-2.5 px-2 py-2 rounded-xl text-md cursor-pointer"
        >
          <Database className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          <span>Data</span>
        </DropdownMenuItem>

        {/* Profile */}
        <DropdownMenuItem
          onClick={() => openSettings("profile")}
          className="flex items-center gap-2.5 px-2 py-2 rounded-xl text-md cursor-pointer"
        >
          <UserIcon className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          <span>Profile</span>
        </DropdownMenuItem>

        {/* Settings */}
        <DropdownMenuItem
          onClick={() =>
            isMobileScreen ? openSettings() : openSettings("general")
          }
          className="flex items-center gap-2.5 px-2 py-2 rounded-xl text-md cursor-pointer"
        >
          <Settings className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          <span>Settings</span>
        </DropdownMenuItem>

        <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1 -mx-1.5" />

        {/* Help Button / Dropdown */}
        {isMobileScreen ? (
          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              setAccountSubView("help");
            }}
            className="w-full flex items-center justify-between px-2 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors cursor-pointer outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <div className="flex items-center gap-2.5">
              <LifeBuoy className="w-4 h-4 text-muted-foreground" />
              <span>Help</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ) : (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2.5 px-2 py-2 text-md rounded-xl cursor-pointer">
              <LifeBuoy className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              <span>Help</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              sideOffset={5}
              alignOffset={-225}
              className="w-56 rounded-2xl p-2 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none"
            >
              <DropdownMenuItem asChild>
                <Link
                  href="/support/help"
                  className="flex items-center gap-2.5 px-2 py-2 cursor-pointer rounded-xl text-md"
                >
                  <HelpCircle className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  <span>Help center</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/company/blog"
                  className="flex items-center gap-2.5 px-2 py-2 cursor-pointer rounded-xl text-md"
                >
                  <PenLine className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  <span>Release notes</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2.5 px-2 py-2 rounded-xl text-md font-normal transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none whitespace-nowrap text-left cursor-not-allowed select-none text-muted-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f]">
                <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                <AnimatedComingSoonText
                  label="Download app"
                  comingSoonText="Coming soon"
                />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/company/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between px-2 py-2 cursor-pointer rounded-xl text-md text-foreground"
                >
                  <div className="flex items-center gap-2.5">
                    <Bug className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    <span>Report a bug</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/support/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between px-2 py-2 cursor-pointer rounded-xl text-md text-foreground"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    <span>Terms of Use</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-auto transition-opacity duration-150 opacity-100 xl:opacity-0 xl:group-hover:opacity-100" />
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/support/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between px-2 py-2 cursor-pointer rounded-xl text-md text-foreground"
                >
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    <span>Privacy Policy</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-auto transition-opacity duration-150 opacity-100 xl:opacity-0 xl:group-hover:opacity-100" />
                </Link>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {/* Log out */}
        <DropdownMenuItem
          onClick={() => setShowLogoutModal(true)}
          className="flex items-center gap-2.5 px-2 py-2 cursor-pointer rounded-xl"
        >
          <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          <span>Log out</span>
        </DropdownMenuItem>
      </div>
    );
  };

  const renderChatItem = (chat: Chat) => {
    const isHovered = hoveredChatId === chat.id;
    const isPressed = pressedChatId === chat.id;
    const isSelected = currentChatId === chat.id;
    const isHighlighted = isSelected || isHovered || isPressed;

    return (
      <div
        key={chat.id}
        onClick={() => {
          onChatSelect(chat.id);
          if (typeof window !== "undefined" && window.innerWidth < 1280) {
            onToggle();
          }
        }}
        onMouseEnter={() => setHoveredChatId(chat.id)}
        onMouseLeave={() => {
          setHoveredChatId(null);
          setPressedChatId(null);
        }}
        onTouchStart={() => setPressedChatId(chat.id)}
        onTouchEnd={() => setPressedChatId(null)}
        onTouchCancel={() => setPressedChatId(null)}
        className={cn(
          "group relative flex items-center justify-between px-2 py-2 rounded-xl text-md cursor-pointer transition-all duration-150",
          isSelected
            ? "bg-secondary text-foreground"
            : cn(
                "text-muted-foreground hover:bg-secondary active:bg-secondary",
                isPressed && "bg-secondary"
              )
        )}
      >
        {/* Title with Smooth Marquee on Hover */}
        <ChatTitleMarquee
          title={chat.title || "New chat"}
          isHovered={isHovered}
          isSelected={isSelected}
        />

        {/* Status indicators when not hovered (hidden on mobile where action buttons are always visible) */}
        {chat.starred && !isHovered && (
          <PinOff className="w-4 h-4 text-muted-foreground shrink-0 ml-1.5 max-xl:hidden" />
        )}
        {chat.archived && !chat.starred && !isHovered && (
          <ArchiveX className="w-4 h-4 text-muted-foreground shrink-0 ml-1.5 max-xl:hidden" />
        )}

        {/* Actions */}
        <div
          className={cn(
            "absolute right-2 inset-y-0 flex items-center gap-0.5 z-10 pointer-events-none",
            // Desktop (>= 1280px): full-height smooth gradient fade matching hover box
            "xl:right-0 xl:pl-16 xl:pr-2 xl:rounded-r-xl",
            "xl:bg-gradient-to-l xl:from-secondary xl:via-secondary xl:to-transparent",
            // Small screens (< 1280px): completely transparent, no gradient box, seamless with hover box!
            "max-xl:bg-transparent max-xl:bg-none max-xl:opacity-100",
            // Desktop visibility: shown on hover or when selected
            isSelected
              ? "opacity-100"
              : "xl:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar(chat.id, !chat.starred);
                }}
                className="p-1 rounded-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer pointer-events-auto"
              >
                {chat.starred ? (
                  <PinOff className="w-4 h-4 text-foreground" />
                ) : (
                  <Pin className="w-4 h-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-md">
              {chat.starred ? "Unpin" : "Pin"}
            </TooltipContent>
          </Tooltip>

          {onToggleArchive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleArchive(chat.id, !chat.archived);
                  }}
                  className="p-1 rounded-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer pointer-events-auto"
                >
                  {chat.archived ? (
                    <ArchiveX className="w-4 h-4" />
                  ) : (
                    <Archive className="w-4 h-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-md">
                {chat.archived ? "Unarchive" : "Archive"}
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setChatToDelete(chat);
                }}
                className="p-1 rounded-sm text-muted-foreground hover:text-red-500 transition-colors cursor-pointer pointer-events-auto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-md">Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  };

  const renderAvatarContent = () => (
    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-secondary flex items-center justify-center select-none">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover select-none"
          loading="eager"
          decoding="sync"
        />
      ) : (
        <span className="text-md font-semibold text-foreground select-none">
          {displayName.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );

  // ----------------------------------------------------
  // Both Sidebar variants (Collapsed Rail + Expanded) are rendered from this
  // single return so the Logout/Delete modals always mount, regardless of
  // whether the sidebar itself is open or collapsed to the 50px rail.
  // Previously the modals lived only after the expanded <aside>, so opening
  // them from the collapsed rail's dropdown set state with nothing mounted
  // to render it.
  // ----------------------------------------------------
  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-sidebar/50 xl:hidden transition-opacity duration-200",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={onToggle}
      />

      {/* Main Sidebar (Expands smoothly from 50px to 250px on Desktop, slides over on Mobile) */}
      <motion.aside
        suppressHydrationWarning
        initial={false}
        animate={{ x: isMobileScreen && !isOpen ? "-100%" : 0 }}
        transition={
          mounted && isMobileScreen ? SIDEBAR_SPRING : { duration: 0 }
        }
        className={cn(
          "h-[100dvh] max-h-[100dvh] bg-sidebar border-r border-border/50 flex flex-col shrink-0 select-none overflow-hidden relative group/sidebar",
          mounted &&
            "transition-[width] duration-300 ease-in-out will-change-[width]",
          // Small screens: always a fixed drawer (never `hidden`) so it can slide out.
          // xl and up: normal in-flow sidebar (50px rail / 250px open), same as before.
          "fixed xl:relative inset-y-0 left-0 w-[77.5%] max-w-[77.5%] sm:w-[250px] sm:max-w-[250px]",
          isOpen ? "z-50 xl:z-20" : "max-xl:z-50 xl:w-[50px]",
          // Before mount we don't know the screen size yet, so keep the closed
          // drawer out of sight (no flash on mobile page load).
          !mounted && !isOpen && "max-xl:invisible"
        )}
      >
        {/* Full-height border resize/toggle handle */}
        <div
          onClick={onToggle}
          style={{ cursor: "ew-resize" }}
          className="absolute -right-[3px] top-0 bottom-0 w-[6px] z-30 hover:bg-foreground/15 transition-colors cursor-ew-resize"
        />

        {/* Persistent Non-Blinking Profile Avatar for Authenticated Users.
            left-[9px] = (50px rail - 32px avatar) / 2 → centered in the 40px hover box
            when collapsed, and lines up with the profile row when expanded. */}
        {user && !showProfileSkeleton && (
          <div
            suppressHydrationWarning
            className="absolute left-[9px] z-30 pointer-events-none select-none transition-none"
            style={{
              bottom: "calc(max(env(safe-area-inset-bottom), 0.5rem) + 4px)",
            }}
          >
            {renderAvatarContent()}
          </div>
        )}

        {/* Middle Navigation & Chats Area */}
        <div className="w-full h-full relative overflow-hidden flex-1">
          {/* Collapsed Rail Body (50px) */}
          <div
            data-sidebar-rail
            suppressHydrationWarning
            className={cn(
              "w-[50px] h-full flex flex-col items-center shrink-0 absolute top-0 left-0 z-10 max-xl:hidden",
              mounted && "transition-opacity duration-200",
              !isOpen
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            )}
            aria-hidden={isOpen}
            onMouseLeave={() => setIsLogoHovered(false)}
          >
            <div className="flex flex-col items-center relative z-20">
              {/* Brand Emblem / Expand (h-14 container matching header h-14) */}
              <div className="w-[50px] h-14 pt-[env(safe-area-inset-top,0px)] flex items-center justify-center shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => {
                        (e.currentTarget as HTMLElement)?.blur();
                        setIsLogoHovered(false);
                        onToggle();
                      }}
                      onMouseEnter={() => setIsLogoHovered(true)}
                      onMouseLeave={() => setIsLogoHovered(false)}
                      onBlur={() => setIsLogoHovered(false)}
                      style={{ cursor: "ew-resize" }}
                      className="w-10 h-10 rounded-sm flex items-center justify-center text-foreground hover:bg-secondary transition-colors !cursor-ew-resize [&_*]:!cursor-ew-resize"
                      aria-label="Open sidebar"
                    >
                      {isLogoHovered ? (
                        <PanelRight className="w-4 h-4 text-foreground pointer-events-none" />
                      ) : (
                        <CloseAIIcon
                          size={20}
                          className="w-4 h-4 pointer-events-none"
                        />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={15}
                    className="text-md"
                  >
                    Open sidebar
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Rail Navigation Items */}
              <div className="flex flex-col items-center gap-1.5 pt-1">
                {/* New Chat */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        onNewChat();
                        if (
                          typeof window !== "undefined" &&
                          window.innerWidth < 1280
                        ) {
                          onToggle();
                        }
                      }}
                      className="w-10 h-10 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                      aria-label="New chat"
                    >
                      <SquarePen className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={15}
                    className="text-md"
                  >
                    New chat
                  </TooltipContent>
                </Tooltip>

                {user ? (
                  <>
                    {/* Search */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            onToggle();
                            setShowSearch(true);
                          }}
                          className="w-10 h-10 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                          aria-label="Search chats"
                        >
                          <AnimatedSearchClose open={showSearch} size={18} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        sideOffset={15}
                        className="text-md"
                      >
                        Search chats
                      </TooltipContent>
                    </Tooltip>

                    {/* Pinned Shortcut */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={onToggle}
                          className="w-10 h-10 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                          aria-label="Pinned chats"
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        sideOffset={15}
                        className="text-md"
                      >
                        Pinned chats
                      </TooltipContent>
                    </Tooltip>

                    {/* Archived Shortcut */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={onToggle}
                          className="w-10 h-10 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                          aria-label="Archived chats"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        sideOffset={15}
                        className="text-md"
                      >
                        Archived chats
                      </TooltipContent>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    {/* Create Images (Coming soon) */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="w-10 h-10 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors select-none cursor-not-allowed"
                          aria-label="Create Images"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        sideOffset={15}
                        className="text-md"
                      >
                        Create Images
                      </TooltipContent>
                    </Tooltip>

                    {/* Web search */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => onOpenWebSearchModal?.()}
                          className="w-10 h-10 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                          aria-label="Web search"
                        >
                          <Globe className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        sideOffset={5}
                        className="text-md"
                      >
                        Web search
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>
            </div>

            {/* Rail Bottom Dock (mt-auto) */}
            <div className="mt-auto w-full pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 flex flex-col items-center gap-1.5 relative z-20">
              {isAuthLoading ? (
                <div className="w-10 h-10 flex items-center justify-center animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-secondary/80 dark:bg-neutral-800/80" />
                </div>
              ) : user ? (
                <>
                  {/* Collapsed View Download Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          toast.info("App coming soon");
                        }}
                        className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0 transition-colors select-none text-muted-foreground bg-transparent hover:bg-secondary hover:text-foreground cursor-pointer"
                        aria-label="Download app"
                      >
                        <Store className="w-4 h-4 shrink-0" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      sideOffset={15}
                      className="text-md"
                    >
                      Download app
                    </TooltipContent>
                  </Tooltip>

                  {/* Collapsed Avatar Trigger */}
                  <DropdownMenu
                    onOpenChange={(open) => {
                      if (!open) setAccountSubView("main");
                    }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="w-10 h-10 rounded-sm flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer select-none outline-none focus:outline-none"
                            aria-label="Account menu"
                          >
                            {showProfileSkeleton ? (
                              <div className="w-8 h-8 rounded-full bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
                            ) : (
                              <div className="relative z-50 shrink-0 opacity-0">
                                {renderAvatarContent()}
                              </div>
                            )}
                          </button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        sideOffset={15}
                        className="text-md"
                      >
                        {displayName}
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent
                      side="top"
                      align="start"
                      alignOffset={1}
                      sideOffset={5}
                      className="w-64 rounded-2xl p-2 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none outline-none focus:outline-none ring-0"
                    >
                      {renderAccountMenuItems()}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  {/* Rail Pricing */}
                  <Tooltip open={isOpen ? false : undefined}>
                    <TooltipTrigger asChild>
                      <Link
                        href="/product/pricing"
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={isOpen ? -1 : 0}
                        className="w-10 h-10 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                        aria-label="Pricing & Plans"
                      >
                        <CreditCard className="w-4 h-4 shrink-0" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      sideOffset={15}
                      className="text-md"
                    >
                      Pricing & Plans
                    </TooltipContent>
                  </Tooltip>

                  {/* Rail Help */}
                  <Tooltip open={isOpen ? false : undefined}>
                    <TooltipTrigger asChild>
                      <Link
                        href="/support/help"
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={isOpen ? -1 : 0}
                        className="w-10 h-10 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                        aria-label="Help & Support"
                      >
                        <LifeBuoy className="w-4 h-4 shrink-0" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      sideOffset={15}
                      className="text-md"
                    >
                      Help & Support
                    </TooltipContent>
                  </Tooltip>

                  {/* Rail Settings */}
                  <Tooltip open={isOpen ? false : undefined}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        tabIndex={isOpen ? -1 : 0}
                        onClick={() =>
                          isMobileScreen
                            ? openSettings()
                            : openSettings("general")
                        }
                        className="w-10 h-10 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                        aria-label="Settings"
                      >
                        <Settings className="w-4 h-4 shrink-0" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      sideOffset={15}
                      className="text-md"
                    >
                      Settings
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </div>

          {/* Expanded Sidebar View (250px) */}
          <div
            data-sidebar-expanded
            suppressHydrationWarning
            className={cn(
              "w-full sm:w-[250px] sm:min-w-[250px] h-full flex flex-col shrink-0 absolute top-0 left-0 z-10",
              mounted && "transition-opacity duration-200",
              isOpen
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none max-xl:opacity-100"
            )}
            aria-hidden={!isOpen}
          >
            {/* Top Header
                Guest: pl-[5px] + w-10 link = the same 40px box (x 5–45) as the rail emblem,
                so the logo doesn't move when the sidebar expands/collapses. */}
            <div
              className={cn(
                "h-14 pt-[env(safe-area-inset-top,0px)] flex items-center justify-between relative z-20 shrink-0",
                !user ? "pl-[5px] pr-2" : "px-2"
              )}
            >
              <Link
                href="/"
                className={cn(
                  "h-10 flex items-center transition-opacity",
                  !user
                    ? "w-10 justify-center rounded-sm hover:bg-secondary text-foreground px-0"
                    : "gap-2 px-1 hover:opacity-85"
                )}
                aria-label="CloseAI"
              >
                {!user ? (
                  <CloseAIIcon
                    size={20}
                    className="w-4 h-4 text-foreground shrink-0"
                  />
                ) : (
                  <span className="font-semibold text-xl tracking-tight text-foreground leading-none">
                    CloseAI
                  </span>
                )}
              </Link>

              <div className="flex items-center gap-0.5">
                {user && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-10 h-10 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                        onClick={() => setShowSearch(!showSearch)}
                      >
                        <AnimatedSearchClose open={showSearch} size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      sideOffset={5}
                      className="text-md"
                    >
                      Search chats
                    </TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      style={{ cursor: "ew-resize" }}
                      className="w-10 h-10 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary !cursor-ew-resize [&_*]:!cursor-ew-resize"
                      onClick={(e) => {
                        (e.currentTarget as HTMLElement)?.blur();
                        setIsCloseBtnHovered(false);
                        setIsLogoHovered(false);
                        onToggle();
                      }}
                      onMouseEnter={() => setIsCloseBtnHovered(true)}
                      onMouseLeave={() => setIsCloseBtnHovered(false)}
                    >
                      <PanelLeft className="w-4 h-4 pointer-events-none" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    sideOffset={5}
                    className="text-md"
                  >
                    Close sidebar
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* New Chat & Guest Items
                Icon rows use pl-[9px]: 8px container padding + 9px = icon at x 17,
                the same x as the collapsed rail icons. */}
            <div className="px-2 pt-1 pb-2 space-y-1.5 relative z-20">
              {user && showSearch && (
                <div className="relative group mb-1">
                  <Search className="w-4 h-4 absolute left-[9px] top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search anything"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-[35px] pr-3 h-10 text-base bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:placeholder:text-foreground focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 border-0 transition-colors"
                  />
                </div>
              )}

              <button
                onClick={() => {
                  onNewChat();
                  if (
                    typeof window !== "undefined" &&
                    window.innerWidth < 1280
                  ) {
                    onToggle();
                  }
                }}
                className="w-full flex items-center justify-between h-10 pl-[9px] pr-2.5 rounded-xl hover:bg-secondary text-foreground text-md group cursor-pointer transition-all duration-150"
              >
                <div className="flex items-center gap-2.5">
                  <SquarePen className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  <span className="whitespace-nowrap">New chat</span>
                </div>
              </button>

              {!user && (
                <>
                  {/* Create Images (Coming soon) */}
                  <button
                    type="button"
                    onMouseEnter={() => setIsImagesHovered(true)}
                    onMouseLeave={() => setIsImagesHovered(false)}
                    className="w-full flex items-center justify-between h-10 pl-[9px] pr-2.5 rounded-xl text-muted-foreground [@media(hover:hover)]:hover:bg-secondary text-md select-none cursor-not-allowed group transition-all duration-150 text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <ImageIcon className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                      <AnimatedComingSoonText
                        label="Create Images"
                        comingSoonText="Coming soon"
                        isHovered={isImagesHovered}
                      />
                    </div>
                  </button>

                  {/* Web search */}
                  <HoverCard
                    openDelay={100}
                    closeDelay={200}
                    onOpenChange={(open) => {
                      if (open) {
                        onWebSearchHover?.();
                      }
                    }}
                  >
                    <HoverCardTrigger asChild>
                      <button
                        type="button"
                        onMouseEnter={() => {
                          onWebSearchHover?.();
                        }}
                        onClick={() => {
                          onOpenLoginModal?.();
                          if (
                            typeof window !== "undefined" &&
                            window.innerWidth < 1280
                          ) {
                            onToggle();
                          }
                        }}
                        className="w-full flex items-center justify-between h-10 pl-[9px] pr-2.5 rounded-xl hover:bg-secondary data-[state=open]:bg-secondary text-foreground text-md group cursor-pointer transition-all duration-150"
                      >
                        <div className="flex items-center gap-2.5">
                          <Globe className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                          <span className="whitespace-nowrap">Web search</span>
                        </div>
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent
                      side="right"
                      align="start"
                      sideOffset={15}
                      className="w-[350px] p-0 rounded-2xl bg-white dark:bg-[#212121] border border-border/80 dark:border-neutral-800 overflow-hidden text-left z-50 select-none"
                    >
                      {/* Web Search Simple Sky Blue & Soft Lilac Gradient Banner */}
                      <div className="h-32 w-full bg-gradient-to-tr from-[#ebb8f7] via-[#5bb5f8] via-25% to-[#72ccfd]" />
                      <div className="p-4">
                        <h4 className="text-[15.5px] font-semibold text-foreground dark:text-white tracking-tight leading-snug">
                          Search the web
                        </h4>
                        <p className="text-[13px] text-muted-foreground dark:text-neutral-300 mt-1.5 leading-relaxed">
                          Search the web, synthesize multiple sources, and get
                          up-to-date answers with citations.
                        </p>
                        <div className="flex items-center gap-2.5 mt-4">
                          <button
                            type="button"
                            onClick={() => {
                              onOpenLoginModal?.();
                            }}
                            className="h-10 px-4 rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-90 text-sm font-medium transition-all cursor-pointer flex items-center justify-center text-center"
                          >
                            Log in
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onOpenLoginModal?.();
                            }}
                            className="h-10 px-4 rounded-full bg-white hover:bg-secondary text-black border border-border/80 dark:border-none dark:bg-[#2f2f2f] dark:hover:bg-[#383838] dark:text-white text-sm font-normal transition-colors cursor-pointer flex items-center justify-center text-center"
                          >
                            Sign up for free
                          </button>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </>
              )}
            </div>

            {/* Chat History Stream (Only for authenticated users) */}
            {user ? (
              <div className="flex-1 px-2 overflow-y-auto border-t border-border/50 sidebar-scroll min-h-0">
                {isLoading ? (
                  <div className="space-y-5 py-3 px-1 select-none">
                    {/* PINNED Skeleton Group */}
                    <div className="space-y-2">
                      <div className="h-3 w-20 bg-muted-foreground/20 rounded animate-pulse ml-2" />
                      <div className="space-y-1.5">
                        <div className="h-8 w-full bg-secondary/80 dark:bg-neutral-800/60 rounded-xl animate-pulse" />
                      </div>
                    </div>

                    {/* ARCHIVED Skeleton Group */}
                    <div className="space-y-2 pt-1">
                      <div className="h-3 w-24 bg-muted-foreground/20 rounded animate-pulse ml-2" />
                      <div className="space-y-1.5">
                        <div className="h-8 w-full bg-secondary/70 dark:bg-neutral-800/50 rounded-xl animate-pulse" />
                      </div>
                    </div>

                    {/* CHATS Skeleton Group */}
                    <div className="space-y-2 pt-1">
                      <div className="h-3 w-16 bg-muted-foreground/20 rounded animate-pulse ml-2" />
                      <div className="space-y-1.5">
                        <div className="h-8 w-full bg-secondary/70 dark:bg-neutral-800/50 rounded-xl animate-pulse" />
                        <div className="h-8 w-full bg-secondary/70 dark:bg-neutral-800/50 rounded-xl animate-pulse" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    {/* Pinned Section */}
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => toggleSection("Pinned")}
                        className="w-full flex items-center justify-between px-2 py-1 text-[15px] font-semibold tracking-wider text-foreground select-none cursor-pointer transition-colors group/section text-left"
                      >
                        <span>Pinned</span>
                        <AnimatedChevron
                          open={!collapsedSections["Pinned"]}
                          disableHover
                          orientation="right-down"
                          size={18}
                          className="text-muted-foreground group-hover/section:text-foreground shrink-0 xl:opacity-0 xl:group-hover/section:opacity-100 transition-opacity duration-150"
                        />
                      </button>
                      {!collapsedSections["Pinned"] && (
                        <>
                          {(groupedChats["Pinned"] || []).length === 0 ? (
                            <div className="px-2 py-1 text-[13.5px] text-muted-foreground/60 select-none font-normal">
                              No pinned chats
                            </div>
                          ) : (
                            groupedChats["Pinned"].map((chat) =>
                              renderChatItem(chat)
                            )
                          )}
                        </>
                      )}
                    </div>

                    {/* Archived Section */}
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => toggleSection("Archived")}
                        className="w-full flex items-center justify-between px-2 py-1 text-[15px] font-semibold tracking-wider text-foreground select-none cursor-pointer transition-colors group/section text-left"
                      >
                        <span>Archived</span>
                        <AnimatedChevron
                          open={!collapsedSections["Archived"]}
                          disableHover
                          orientation="right-down"
                          size={18}
                          className="text-muted-foreground group-hover/section:text-foreground shrink-0 xl:opacity-0 xl:group-hover/section:opacity-100 transition-opacity duration-150"
                        />
                      </button>
                      {!collapsedSections["Archived"] && (
                        <>
                          {(groupedChats["Archived"] || []).length === 0 ? (
                            <div className="px-2 py-1 text-[13.5px] text-muted-foreground/60 select-none font-normal">
                              No archived chats
                            </div>
                          ) : (
                            groupedChats["Archived"].map((chat) =>
                              renderChatItem(chat)
                            )
                          )}
                        </>
                      )}
                    </div>

                    {/* Chats Section */}
                    <div className="space-y-0.5">
                      <div className="px-2 py-1 text-[15px] font-semibold tracking-wider text-foreground select-none">
                        Chats
                      </div>

                      {groupedChats["Chats"].length === 0 ? (
                        <div className="px-2 py-1 text-[13.5px] text-muted-foreground/60 select-none font-normal">
                          {searchQuery ? "No chats found" : "No chats"}
                        </div>
                      ) : (
                        groupedChats["Chats"].map((chat) =>
                          renderChatItem(chat)
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 min-h-0" />
            )}

            {/* Expanded Bottom Dock (mt-auto)
                Signed in: px-[5px] so the profile row box starts at x 5 (same as the collapsed
                hover box) and the avatar sits 4px inside it (5 + 4 = 9, matching the persistent
                avatar). Guest: px-2 + pl-[9px] rows put icons at x 17. */}
            <div
              className={cn(
                "mt-auto w-full pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 relative z-20 select-none",
                user || isAuthLoading
                  ? "px-[5px] border-t border-border/50"
                  : "px-2"
              )}
            >
              {isAuthLoading ? (
                /* Profile skeleton while the session loads */
                <div className="w-full h-10 flex items-center gap-2.5 pl-[4px] pr-2 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-secondary/80 dark:bg-neutral-800/80 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-24 rounded bg-secondary/80 dark:bg-neutral-800/80" />
                    <div className="h-2.5 w-10 rounded bg-secondary/70 dark:bg-neutral-800/60" />
                  </div>
                </div>
              ) : user ? (
                /* Authenticated User Profile Row */
                <div className="w-full h-10 flex items-center justify-between relative">
                  <DropdownMenu
                    onOpenChange={(open) => {
                      if (!open) setAccountSubView("main");
                    }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <div
                            role="button"
                            tabIndex={0}
                            className="w-full h-12 flex items-center justify-between rounded-sm hover:bg-secondary transition-colors duration-200 cursor-pointer select-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 ring-0 border-0 pl-[4px] pr-2 min-w-0"
                          >
                            {/* Profile Section */}
                            <div className="h-10 flex items-center justify-start min-w-0 flex-1 gap-2.5 text-left">
                              {showProfileSkeleton ? (
                                <>
                                  {/* Skeleton: avatar + name + plan */}
                                  <div className="w-8 h-8 rounded-full shrink-0 bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
                                  <div className="flex-1 min-w-0 space-y-1.5 animate-pulse">
                                    <div className="h-3 w-24 rounded bg-secondary/80 dark:bg-neutral-800/80" />
                                    <div className="h-2.5 w-10 rounded bg-secondary/70 dark:bg-neutral-800/60" />
                                  </div>
                                </>
                              ) : (
                                <>
                                  {/* Non-blinking avatar placeholder */}
                                  <div className="relative z-50 shrink-0 opacity-0">
                                    {renderAvatarContent()}
                                  </div>

                                  {/* Expanded User Details */}
                                  <div className="flex-1 min-w-0 transition-all duration-200 overflow-hidden whitespace-nowrap">
                                    <p className="text-md font-medium text-foreground truncate leading-snug">
                                      {displayName}
                                    </p>
                                    <p
                                      className="text-sm text-muted-foreground leading-none"
                                      suppressHydrationWarning
                                    >
                                      {planDisplay}
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Download App Button */}
                            <div
                              className="shrink-0"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (user) toast.info("App coming soon");
                                    }}
                                    className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0 transition-colors select-none text-muted-foreground hover:text-foreground bg-transparent hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                                    aria-label="Download app"
                                  >
                                    <Store className="w-4 h-4 shrink-0" />
                                  </button>
                                </TooltipTrigger>

                                <TooltipContent
                                  side="top"
                                  sideOffset={5}
                                  className="text-md"
                                >
                                  Download app
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                    </Tooltip>

                    {/* Account Dropdown */}
                    <DropdownMenuContent
                      side="top"
                      align="start"
                      sideOffset={5}
                      className="w-[var(--radix-dropdown-menu-trigger-width)] max-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-2xl p-2 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none outline-none focus:outline-none ring-0"
                    >
                      {renderAccountMenuItems()}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                /* Guest Bottom Dock */
                <div className="w-full space-y-1.5 select-none">
                  {/* Expanded Pricing */}
                  <Link
                    id="guest-sidebar-pricing-plans"
                    href="/product/pricing"
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={!isOpen ? -1 : 0}
                    className="w-full h-10 pl-[9px] pr-2.5 flex items-center justify-between rounded-xl hover:bg-secondary text-foreground group cursor-pointer transition-colors duration-150 select-none overflow-hidden"
                    aria-label="Pricing & Plans"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CreditCard className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                      <span className="text-md font-normal leading-normal whitespace-nowrap">
                        Pricing & Plans
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity duration-150" />
                  </Link>

                  {/* Expanded Help */}
                  <Link
                    href="/support/help"
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={!isOpen ? -1 : 0}
                    className="w-full h-10 pl-[9px] pr-2.5 flex items-center justify-between rounded-xl hover:bg-secondary text-foreground group cursor-pointer transition-colors duration-150 select-none overflow-hidden"
                    aria-label="Help & Support"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <LifeBuoy className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                      <span className="text-md font-normal leading-normal whitespace-nowrap">
                        Help & Support
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity duration-150" />
                  </Link>

                  {/* Expanded Settings */}
                  <button
                    type="button"
                    tabIndex={!isOpen ? -1 : 0}
                    onClick={() =>
                      isMobileScreen ? openSettings() : openSettings("general")
                    }
                    className="w-full h-10 pl-[9px] pr-2.5 flex items-center justify-between rounded-xl hover:bg-secondary text-foreground group cursor-pointer transition-colors duration-150 select-none overflow-hidden"
                    aria-label="Settings"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Settings className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                      <span className="text-md font-normal leading-normal whitespace-nowrap">
                        Settings
                      </span>
                    </div>
                  </button>

                  {/* Guest Callout Card */}
                  <div
                    id="guest-sidebar-callout-card"
                    className={cn(
                      "w-full pt-1.5 select-text",
                      isGuestCardDismissed && "hidden"
                    )}
                  >
                    <div className="w-full p-3.5 rounded-xl bg-secondary/40 border border-border/80 dark:border-none space-y-2 select-text text-left relative">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-base font-semibold text-foreground text-left pt-2">
                          Get efficient responses
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsGuestCardDismissed(true);
                            if (typeof document !== "undefined") {
                              document.body.setAttribute(
                                "data-guest-card-dismissed",
                                "true"
                              );
                              try {
                                document.cookie =
                                  "guest_card=true; path=/; max-age=31536000; SameSite=Lax";
                              } catch {}
                            }
                            fetch("/api/guest-card", {
                              method: "POST",
                            }).catch(() => {});
                          }}
                          className="w-7 h-7 -mr-1 -mt-1 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shrink-0"
                          aria-label="Close"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-sm text-muted-foreground leading-snug text-left">
                        Log in to get efficient answers, plus thinking
                        capabilities, upload files and more.
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenLoginModal?.()}
                        className="w-full mt-1 h-10 px-4 rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-90 text-sm font-semibold transition-all cursor-pointer flex items-center justify-center text-center leading-none"
                      >
                        Log in
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Logout Confirmation Modal — mounted here, outside the isOpen branch,
          so it renders whether the sidebar is expanded or collapsed to the rail. */}
      <LogoutModal
        open={showLogoutModal}
        onOpenChange={setShowLogoutModal}
        onConfirm={signOut}
        userName={user ? displayName : undefined}
        userEmail={user?.email || undefined}
        userAvatar={user ? avatarUrl : undefined}
      />

      {/* Delete Confirmation Modal — same reasoning as above. */}
      <DeleteModal
        open={!!chatToDelete}
        onOpenChange={(open) => {
          if (!open) setChatToDelete(null);
        }}
        itemTitle={chatToDelete?.title || "New chat"}
        onConfirm={() => {
          if (chatToDelete) {
            onDeleteChat(chatToDelete.id);
            setChatToDelete(null);
          }
        }}
      />
    </>
  );
}

export default Sidebar;
