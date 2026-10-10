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
import { ReportBugModal } from "@/components/modals/report-bug-modal";
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
  onOpenLoginModal?: (options?: { description?: string; title?: string }) => void;
  onOpenWebSearchModal?: (options?: { description?: string; title?: string }) => void;
  onOpenAdvancedFeaturesModal?: (options?: { description?: string; title?: string }) => void;
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
        const diff =
          textRef.current.scrollWidth -
          containerRef.current.clientWidth;

        setOverflowWidth(Math.max(diff, 0));
      }
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    if (containerRef.current) ro.observe(containerRef.current);
    if (textRef.current) ro.observe(textRef.current);

    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(measure);
    }

    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [title, isHovered, isSelected]);

  const isScrolling = overflowWidth > 0 && isHovered;

  const duration = Math.max(3.2, overflowWidth / 35 + 1.8);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex-1 min-w-0 overflow-hidden pr-1 max-xl:mr-[78px] group-hover:xl:mr-[78px]",
        (isHovered || isSelected) && "xl:mr-[78px]"
      )}
      style={{
        animation: isScrolling
          ? `chat-title-marquee-mask ${duration}s ease-in-out infinite`
          : undefined,
        maskImage: isScrolling
          ? undefined
          : "linear-gradient(to right, black 0%, black calc(100% - 10px), transparent 100%)",

        WebkitMaskImage: isScrolling
          ? undefined
          : "linear-gradient(to right, black 0%, black calc(100% - 10px), transparent 100%)",
      }}
    >
      {/* Chat title */}
      <span
        ref={textRef}
        style={
          {
            "--marquee-dist": `${overflowWidth}px`,
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
  const [showReportBugModal, setShowReportBugModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const [isGuestCardDismissed, setIsGuestCardDismissed] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [collapsedAccountMenuOpen, setCollapsedAccountMenuOpen] = useState(false);
  const [guestHelpMenuOpen, setGuestHelpMenuOpen] = useState(false);
  const [railHelpOpen, setRailHelpOpen] = useState(false);
  const [webSearchHoverOpen, setWebSearchHoverOpen] = useState(false);
  const [railWebSearchHoverOpen, setRailWebSearchHoverOpen] = useState(false);
  const isWebSearchMouseHoveringRef = useRef(false);
  const ignoreNextWebSearchOpenRef = useRef(false);

  const handleOpenReportBug = () => {
    setAccountMenuOpen(false);
    setCollapsedAccountMenuOpen(false);
    setRailHelpOpen(false);
    setGuestHelpMenuOpen(false);
    setAccountSubView("main");
    setShowReportBugModal(true);
    if (isOpen && typeof window !== "undefined" && window.innerWidth < 1280) {
      onToggle();
    }
  };

  const handleOpenAddAccount = () => {
    setAccountMenuOpen(false);
    setCollapsedAccountMenuOpen(false);
    setRailHelpOpen(false);
    setGuestHelpMenuOpen(false);
    setAccountSubView("main");
    if (onOpenLoginModal) {
      onOpenLoginModal();
    } else {
      window.dispatchEvent(new CustomEvent("closeai-open-login"));
    }
    if (isOpen && typeof window !== "undefined" && window.innerWidth < 1280) {
      onToggle();
    }
  };

  useEffect(() => {
    if (showReportBugModal) {
      setAccountMenuOpen(false);
      setCollapsedAccountMenuOpen(false);
      setRailHelpOpen(false);
      setGuestHelpMenuOpen(false);
      setAccountSubView("main");
      if (isOpen && typeof window !== "undefined" && window.innerWidth < 1280) {
        onToggle();
      }
    }
  }, [showReportBugModal, isOpen, onToggle]);

  useEffect(() => {
    setWebSearchHoverOpen(false);
    setRailWebSearchHoverOpen(false);
  }, [isOpen]);

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
        if (showLogoutModal || chatToDelete || showReportBugModal) return;
        onToggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showLogoutModal, chatToDelete, showReportBugModal, onToggle]);

  useEffect(() => {
    const handleOpen = () => handleOpenReportBug();
    window.addEventListener("open-report-bug-modal", handleOpen);
    return () => window.removeEventListener("open-report-bug-modal", handleOpen);
  }, [isOpen, onToggle]);

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
  const username =
    user?.user_metadata?.username?.trim() ||
    user?.user_metadata?.user_name?.trim() ||
    user?.email?.split("@")[0] ||
    "user";
  const userEmail = user?.email || (user ? "" : "Not signed in");
  const avatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const [accountSubView, setAccountSubView] = useState<
    "main" | "theme" | "help" | "accounts"
  >("main");
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isReadyToAnimate, setIsReadyToAnimate] = useState(false);

  useEffect(() => {
    setIsMobileScreen(window.innerWidth < 1280);
    setMounted(true);

    const timer = setTimeout(() => {
      setIsReadyToAnimate(true);
    }, 120);

    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 1280);
    };
    window.addEventListener("resize", checkMobile);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const renderHelpMenuItems = () => (
    <div className="space-y-0.5 p-0.5">
      <DropdownMenuItem asChild>
        <Link
          href="/support/help"
          className="flex items-center gap-2.5 px-3 py-2 text-md rounded-xl font-normal cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] active:bg-secondary/80 dark:active:bg-[#383838]/80 transition-colors outline-none whitespace-nowrap text-left group"
        >
          <HelpCircle className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
          <span>Help center</span>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem asChild>
        <Link
          href="/company/blog"
          className="flex items-center gap-2.5 px-3 py-2 text-md rounded-xl font-normal cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] active:bg-secondary/80 dark:active:bg-[#383838]/80 transition-colors outline-none whitespace-nowrap text-left group"
        >
          <PenLine className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
          <span>Release notes</span>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
        <div className="flex items-center gap-2.5 px-3 py-2 text-md rounded-xl font-normal cursor-pointer text-muted-foreground hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] active:bg-secondary/80 dark:active:bg-[#383838]/80 transition-colors outline-none whitespace-nowrap text-left group">
          <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          <AnimatedComingSoonText
            label="Download apps"
            comingSoonText="Coming soon"
          />
        </div>
      </DropdownMenuItem>

      <DropdownMenuSeparator className="my-1 bg-neutral-200 dark:bg-[#383838]" />

      <DropdownMenuItem asChild>
        <Link
          href="/support/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between px-3 py-2 cursor-pointer rounded-xl text-md font-normal text-foreground hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] active:bg-secondary/80 dark:active:bg-[#383838]/80 transition-colors outline-none whitespace-nowrap text-left"
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
            <span>Terms of Service</span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-auto transition-opacity duration-150 opacity-100 xl:opacity-0 xl:group-hover:opacity-100" />
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem asChild>
        <Link
          href="/support/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between px-3 py-2 cursor-pointer rounded-xl text-md font-normal text-foreground hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] active:bg-secondary/80 dark:active:bg-[#383838]/80 transition-colors outline-none whitespace-nowrap text-left"
        >
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
            <span>Privacy Policy</span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-auto transition-opacity duration-150 opacity-100 xl:opacity-0 xl:group-hover:opacity-100" />
        </Link>
      </DropdownMenuItem>

      <DropdownMenuSeparator className="my-1 bg-neutral-200 dark:bg-[#383838]" />

      <DropdownMenuItem
        onClick={handleOpenReportBug}
        className="group flex items-center justify-between px-3 py-2 cursor-pointer rounded-xl text-md font-normal text-foreground hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] active:bg-secondary/80 dark:active:bg-[#383838]/80 transition-colors outline-none whitespace-nowrap text-left"
      >
        <div className="flex items-center gap-2.5">
          <Bug className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
          <span>Report a bug</span>
        </div>
      </DropdownMenuItem>
    </div>
  );

  /**
   * Guest Web Search Hover Card Content
   * Matches the background and border of the guest Help dropdown:
   * bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none
   */
  const renderWebSearchHoverCardContent = (closeCard: () => void) => (
    <HoverCardContent
      side="right"
      align="start"
      sideOffset={15}
      className="w-[350px] p-0 rounded-2xl bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none overflow-hidden text-left z-50 select-none"
    >
      {/* Web Search Simple Sky Blue & Soft Lilac Gradient Banner with DiceBear Glass SVG */}
      <div className="h-32 w-full relative overflow-hidden bg-gradient-to-tr from-[#ebb8f7] via-[#5bb5f8] via-25% to-[#72ccfd]">
        <img
          src="https://api.dicebear.com/10.x/glass/svg?tags=animation&seed=Search%20the%20web"
          alt="Search the web"
          className="w-full h-full object-cover select-none pointer-events-none"
        />
      </div>
      <div className="p-4">
        <h4 className="text-[15.5px] font-semibold text-foreground dark:text-white tracking-tight leading-snug">
          Search the web
        </h4>
        <p className="text-[13px] text-muted-foreground dark:text-neutral-300 mt-1.5 leading-relaxed">
          Search the web, synthesize multiple sources, and get up-to-date
          answers with citations.
        </p>
        <div className="flex items-center gap-2.5 mt-4">
          <button
            type="button"
            onClick={() => {
              closeCard();
              (onOpenLoginModal || onOpenWebSearchModal)?.({ description: "To continue with Web search" });
              if (
                isOpen &&
                typeof window !== "undefined" &&
                window.innerWidth < 1280
              ) {
                onToggle();
              }
            }}
            className="h-11 px-4 rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-90 text-base font-medium transition-colors cursor-pointer flex items-center justify-center text-center"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => {
              closeCard();
              (onOpenLoginModal || onOpenWebSearchModal)?.({ description: "To continue with Web search" });
              if (
                isOpen &&
                typeof window !== "undefined" &&
                window.innerWidth < 1280
              ) {
                onToggle();
              }
            }}
            className="h-11 px-4 rounded-full bg-white hover:bg-secondary text-black border border-border/80 dark:border-none dark:bg-[#383838] dark:hover:bg-[#424242] dark:text-white text-base font-normal transition-colors cursor-pointer flex items-center justify-center text-center"
          >
            Sign up for free
          </button>
        </div>
      </div>
    </HoverCardContent>
  );

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
          <DropdownMenuItem asChild>
            <Link
              href="/support/help"
              onClick={() => {
                setAccountMenuOpen(false);
                if (isOpen && typeof window !== "undefined" && window.innerWidth < 1280) {
                  onToggle();
                }
              }}
              className="group flex items-center gap-2.5 px-2 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              <span>Help center</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/company/blog"
              onClick={() => {
                setAccountMenuOpen(false);
                if (isOpen && typeof window !== "undefined" && window.innerWidth < 1280) {
                  onToggle();
                }
              }}
              className="group flex items-center gap-2.5 px-2 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none cursor-pointer"
            >
              <PenLine className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              <span>Release notes</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
            <div className="group w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-md font-normal transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none whitespace-nowrap text-left cursor-pointer select-none text-muted-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f]">
              <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              <AnimatedComingSoonText
                label="Download apps"
                comingSoonText="Coming soon"
              />
            </div>
          </DropdownMenuItem>
          <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1" />
          <DropdownMenuItem asChild>
            <Link
              href="/support/terms"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setAccountMenuOpen(false)}
              className="group flex items-center justify-between px-2 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none cursor-pointer"
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
              onClick={() => setAccountMenuOpen(false)}
              className="group flex items-center justify-between px-2 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                <span>Privacy Policy</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-auto transition-opacity duration-150 opacity-100 xl:opacity-0 xl:group-hover:opacity-100" />
            </Link>
          </DropdownMenuItem>
          <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1" />
          <DropdownMenuItem
            onClick={handleOpenReportBug}
            className="group flex items-center justify-between px-2 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none w-full text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Bug className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              <span>Report a bug</span>
            </div>
          </DropdownMenuItem>
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
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Avatar className="w-8 h-8 rounded-full border border-border shrink-0">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-[14px] font-semibold bg-secondary text-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-md font-medium truncate text-foreground leading-tight">
                  {displayName}
                </p>
                <p
                  className="text-sm text-muted-foreground leading-tight truncate"
                  suppressHydrationWarning
                >
                  @{username}
                </p>
              </div>
            </div>
            <Check className="w-4 h-4 text-foreground shrink-0 ml-2" />
          </div>
          <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1" />
          <button
            type="button"
            onClick={handleOpenAddAccount}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors cursor-pointer outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
            <span>Add account</span>
          </button>
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
              <p
                className="text-sm text-muted-foreground leading-tight truncate"
                suppressHydrationWarning
              >
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
                <p
                  className="text-sm text-muted-foreground leading-tight truncate"
                  suppressHydrationWarning
                >
                  {planDisplay}
                </p>
              </div>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              sideOffset={5}
              alignOffset={-108}
              className="w-64 rounded-2xl p-2 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none"
            >
              <div className="flex items-center gap-2 px-2 py-2 text-md text-muted-foreground hover:text-foreground select-none">
                <UserIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{userEmail}</span>
              </div>
              <DropdownMenuItem className="flex items-center justify-between px-2 py-2 rounded-xl cursor-pointer">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Avatar className="w-8 h-8 rounded-full border border-border shrink-0">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-[14px] font-semibold bg-secondary text-foreground">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-md font-medium truncate text-foreground leading-tight">
                      {displayName}
                    </p>
                    <p
                      className="text-sm text-muted-foreground leading-tight truncate"
                      suppressHydrationWarning
                    >
                      @{username}
                    </p>
                  </div>
                </div>
                <Check className="w-4 h-4 text-foreground shrink-0 ml-2" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleOpenAddAccount}
                className="flex items-center gap-2.5 px-2 py-2 cursor-pointer rounded-xl text-md"
              >
                <Plus className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                <span>Add account</span>
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
              alignOffset={-238}
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
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleOpenReportBug}
                className="group flex items-center justify-between px-2 py-2 cursor-pointer rounded-xl text-md text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <Bug className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  <span>Report a bug</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {/* Log out */}
        <DropdownMenuItem
          onClick={() => {
            setAccountMenuOpen(false);
            setCollapsedAccountMenuOpen(false);
            setShowLogoutModal(true);
          }}
          className="flex items-center gap-2.5 px-2 py-2 cursor-pointer rounded-xl"
        >
          <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          <span>Log out</span>
        </DropdownMenuItem>
      </div>
    );
  };

function SidebarChatItem({
  chat,
  isSelected,
  onChatSelect,
  isOpen,
  onToggle,
  onToggleStar,
  onToggleArchive,
  setChatToDelete,
}: {
  chat: Chat;
  isSelected: boolean;
  onChatSelect: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onToggleStar: (id: string, starred: boolean) => void;
  onToggleArchive?: (id: string, archived: boolean) => void;
  setChatToDelete: (chat: Chat) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (itemRef.current?.matches(":hover")) {
      setIsHovered(true);
    }
  }, []);

  const showActions = isHovered || isSelected;

  return (
    <div
      ref={itemRef}
      onClick={() => {
        setIsHovered(true);
        onChatSelect(chat.id);
        if (
          isOpen &&
          typeof window !== "undefined" &&
          window.innerWidth < 1280
        ) {
          onToggle();
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={() => {
        if (!isHovered) setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
      className={cn(
        "group relative flex items-center justify-between px-2 py-2.5 rounded-xl text-md cursor-pointer transition-all duration-150",
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

      {/* Status indicators when not hovered and not selected (hidden on mobile where action buttons are always visible) */}
      {chat.starred && !showActions && (
        <PinOff className="w-4 h-4 text-muted-foreground shrink-0 ml-1.5 max-xl:hidden xl:group-hover:hidden" />
      )}
      {chat.archived && !chat.starred && !showActions && (
        <ArchiveX className="w-4 h-4 text-muted-foreground shrink-0 ml-1.5 max-xl:hidden xl:group-hover:hidden" />
      )}

      {/* Actions */}
      <div
        className={cn(
          "absolute right-2 inset-y-0 flex items-center gap-0.5 z-10 transition-opacity duration-150",
          // Desktop (>= 1280px): position at right edge, completely transparent background so it matches the row seamlessly!
          "xl:right-0 xl:pl-1 xl:pr-2 xl:rounded-r-xl",
          // Small screens (< 1280px): completely transparent, no gradient box, seamless with hover box!
          "max-xl:bg-transparent max-xl:bg-none",
          // Visibility: on small screens always visible; on desktop visible when hovered, selected, or on group-hover!
          "max-xl:opacity-100 max-xl:pointer-events-auto",
          showActions
            ? "opacity-100 pointer-events-auto"
            : "xl:opacity-0 xl:pointer-events-none xl:group-hover:opacity-100 xl:group-hover:pointer-events-auto"
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
}

  const renderChatItem = (chat: Chat) => (
    <SidebarChatItem
      key={chat.id}
      chat={chat}
      isSelected={currentChatId === chat.id}
      onChatSelect={onChatSelect}
      isOpen={isOpen}
      onToggle={onToggle}
      onToggleStar={onToggleStar}
      onToggleArchive={onToggleArchive}
      setChatToDelete={setChatToDelete}
    />
  );

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
          "fixed inset-0 z-40 bg-sidebar/80 xl:hidden transition-opacity duration-200",
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
          isReadyToAnimate && mounted && isMobileScreen
            ? SIDEBAR_SPRING
            : { duration: 0 }
        }
        className={cn(
          "h-[100dvh] max-h-[100dvh] bg-sidebar border-r border-border/80 dark:border-white/10 flex flex-col shrink-0 select-none overflow-hidden relative group/sidebar",
          mounted &&
            "transition-[width] duration-300 ease-in-out will-change-[width]",
          // Small screens: always a fixed drawer (never `hidden`) so it can slide out.
          // xl and up: normal in-flow sidebar (60px rail / 250px open), same as before.
          "fixed xl:relative inset-y-0 left-0 w-[78%] max-w-[78%] sm:w-[250px] sm:max-w-[250px]",
          isOpen ? "z-50 xl:z-20" : "max-xl:z-50 xl:w-[60px]",
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
            left-[14px] = (60px rail - 32px avatar) / 2 → centered in the 44px (w-11) button
            when collapsed, and lines up with the profile row when expanded. */}
        {user && !showProfileSkeleton && (
          <div
            suppressHydrationWarning
            className="absolute left-[14px] z-30 pointer-events-none select-none transition-none"
            style={{
              bottom: "calc(max(env(safe-area-inset-bottom), 0.5rem) + 4px)",
            }}
          >
            {renderAvatarContent()}
          </div>
        )}

        {/* Middle Navigation & Chats Area */}
        <div className="w-full h-full relative overflow-hidden flex-1">
          {/* Collapsed Rail Body (60px) */}
          <div
            data-sidebar-rail
            suppressHydrationWarning
            className={cn(
              "w-[60px] h-full flex flex-col items-center shrink-0 absolute top-0 left-0 z-10 max-xl:hidden",
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
              <div className="w-[60px] h-14 pt-[env(safe-area-inset-top,0px)] flex items-center justify-center shrink-0">
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
                      className="w-11 h-11 rounded-sm flex items-center justify-center text-foreground hover:bg-secondary transition-colors !cursor-ew-resize [&_*]:!cursor-ew-resize"
                      aria-label="Open sidebar"
                    >
                      {user && !isLogoHovered ? (
                        <CloseAIIcon
                          size={20}
                          className="w-4 h-4 pointer-events-none"
                        />
                      ) : (
                        <PanelRight className="w-4 h-4 text-foreground pointer-events-none" />
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
                          isOpen &&
                          typeof window !== "undefined" &&
                          window.innerWidth < 1280
                        ) {
                          onToggle();
                        }
                      }}
                      className="w-11 h-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
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
                          className="w-11 h-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
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
                          className="w-11 h-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
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
                          className="w-11 h-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
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
                          className="w-11 h-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors select-none cursor-not-allowed"
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
                    <HoverCard
                      open={railWebSearchHoverOpen}
                      onOpenChange={(open) => {
                        setRailWebSearchHoverOpen(open);
                        if (open) {
                          onWebSearchHover?.();
                        }
                      }}
                      openDelay={100}
                      closeDelay={300}
                    >
                      <HoverCardTrigger asChild>
                        <button
                          type="button"
                          onMouseEnter={() => {
                            onWebSearchHover?.();
                          }}
                          onClick={() => {
                            setRailWebSearchHoverOpen(false);
                            (onOpenLoginModal || onOpenWebSearchModal)?.({ description: "To continue with Web search" });
                          }}
                          className={cn(
                            "w-11 h-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer",
                            railWebSearchHoverOpen &&
                              "bg-secondary text-foreground"
                          )}
                          aria-label="Web search"
                        >
                          <Globe className="w-4 h-4" />
                        </button>
                      </HoverCardTrigger>
                      {renderWebSearchHoverCardContent(() =>
                        setRailWebSearchHoverOpen(false)
                      )}
                    </HoverCard>
                  </>
                )}
              </div>
            </div>

            {/* Rail Bottom Dock (mt-auto) */}
            <div className="mt-auto w-full pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 flex flex-col items-center gap-1.5 relative z-20">
              {isAuthLoading ? (
                <div className="w-11 h-11 flex items-center justify-center animate-pulse">
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
                        className="w-11 h-11 rounded-sm flex items-center justify-center shrink-0 transition-colors select-none text-muted-foreground bg-transparent hover:bg-secondary hover:text-foreground cursor-pointer"
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
                    open={collapsedAccountMenuOpen}
                    onOpenChange={(open) => {
                      setCollapsedAccountMenuOpen(open);
                      if (!open) setAccountSubView("main");
                    }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="w-11 h-11 rounded-sm flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer select-none outline-none focus:outline-none"
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
                      sideOffset={5}
                      className="w-64 rounded-2xl p-2 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none outline-none focus:outline-none ring-0"
                    >
                      {renderAccountMenuItems()}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  {/* Rail Plans */}
                  <Tooltip open={isOpen ? false : undefined}>
                    <TooltipTrigger asChild>
                      <Link
                        href="/product/plans"
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={isOpen ? -1 : 0}
                        className="w-11 h-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                        aria-label="Plans"
                      >
                        <CreditCard className="w-4 h-4 shrink-0" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      sideOffset={15}
                      className="text-md"
                    >
                      Plans
                    </TooltipContent>
                  </Tooltip>

                  {/* Rail Help */}
                  <DropdownMenu
                    open={railHelpOpen}
                    onOpenChange={setRailHelpOpen}
                  >
                    <Tooltip open={isOpen || railHelpOpen ? false : undefined}>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            tabIndex={isOpen ? -1 : 0}
                            className="w-11 h-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer data-[state=open]:bg-secondary data-[state=open]:text-foreground outline-none focus:outline-none"
                            aria-label="Help"
                          >
                            <LifeBuoy className="w-4 h-4 shrink-0" />
                          </button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        sideOffset={15}
                        className="text-md"
                      >
                        Help
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent
                      side="right"
                      align="end"
                      sideOffset={12}
                      className="w-[230px] rounded-2xl p-1.5 bg-white dark:bg-[#212121] border border-border/80 dark:border-neutral-800 select-none outline-none focus:outline-none ring-0 space-y-0.5"
                    >
                      {renderHelpMenuItems()}
                    </DropdownMenuContent>
                  </DropdownMenu>

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
                        className="w-11 h-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
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
                Guest: px-2 + w-11 link = the same 44px box (x 8–52) as the 60px rail emblem,
                so the logo doesn't move when the sidebar expands/collapses. */}
            <div
              className={cn(
                "h-14 pt-[env(safe-area-inset-top,0px)] flex items-center justify-between relative z-20 shrink-0",
                user ? "px-2" : "max-xl:pl-6 max-xl:sm:pl-8 max-xl:pr-3 xl:px-2"
              )}
            >
              <Link
                href="/"
                className={cn(
                  "flex items-center transition-opacity",
                  user
                    ? "h-11 gap-2 px-1 hover:opacity-85"
                    : "flex items-center gap-2 hover:opacity-85"
                )}
                aria-label="CloseAI"
              >
                <span
                  className={cn(
                    "tracking-tight text-foreground",
                    user
                      ? "text-xl font-semibold leading-none"
                      : "font-bold text-xl"
                  )}
                >
                  CloseAI
                </span>
              </Link>

              <div className="flex items-center gap-0.5">
                {user ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-11 h-11 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
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
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          onOpenLoginModal?.();
                          if (
                            isOpen &&
                            typeof window !== "undefined" &&
                            window.innerWidth < 1280
                          ) {
                            onToggle();
                          }
                        }}
                        className="xl:hidden w-12 h-12 rounded-full bg-white hover:bg-secondary text-muted-foreground hover:text-foreground dark:bg-[#2f2f2f] dark:hover:bg-[#383838] border border-border/80 dark:border-none flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none shrink-0 active:scale-[0.98] max-xl:translate-y-2"
                        aria-label="Search chats"
                      >
                        <Search className="w-5 h-5 shrink-0" />
                      </button>
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
                      className={cn(
                        "w-11 h-11 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary !cursor-ew-resize [&_*]:!cursor-ew-resize",
                        !user && "hidden xl:inline-flex"
                      )}
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
                Icon rows use pl-[14px]: 8px container padding + 14px = icon at x 22 (center x 30),
                the exact same x as the 60px collapsed rail icons. */}
            <div className="px-2 pt-1 pb-2 space-y-1.5 relative z-20">
              {user && showSearch && (
                <div className="relative group mb-1">
                  <Search className="w-4 h-4 absolute left-[14px] top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search chats"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-[40px] pr-3 h-11 text-base bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:placeholder:text-foreground focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 border-0 transition-colors"
                  />
                </div>
              )}

              <button
                onClick={() => {
                  onNewChat();
                  if (
                    isOpen &&
                    typeof window !== "undefined" &&
                    window.innerWidth < 1280
                  ) {
                    onToggle();
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between h-11 pl-[14px] pr-2.5 rounded-xl hover:bg-secondary text-foreground text-md group cursor-pointer transition-all duration-150",
                  !user && "hidden xl:flex"
                )}
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
                    className="w-full flex items-center justify-between h-11 pl-[14px] pr-2.5 rounded-xl text-muted-foreground [@media(hover:hover)]:hover:bg-secondary text-md select-none cursor-not-allowed group transition-all duration-150 text-left"
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
                    open={webSearchHoverOpen}
                    onOpenChange={(open) => {
                      if (open) {
                        if (ignoreNextWebSearchOpenRef.current) return;
                        // On small screens, only genuine mouse hover should open the hover card, never clicks or taps
                        if (
                          typeof window !== "undefined" &&
                          window.innerWidth < 1280 &&
                          !isWebSearchMouseHoveringRef.current
                        ) {
                          return;
                        }
                        setWebSearchHoverOpen(true);
                        onWebSearchHover?.();
                      } else {
                        setWebSearchHoverOpen(false);
                      }
                    }}
                    openDelay={100}
                    closeDelay={300}
                  >
                    <HoverCardTrigger asChild>
                      <button
                        type="button"
                        onMouseEnter={(e) => {
                          if (
                            e.nativeEvent &&
                            "pointerType" in e.nativeEvent &&
                            (e.nativeEvent as any).pointerType === "touch"
                          ) {
                            return;
                          }
                          isWebSearchMouseHoveringRef.current = true;
                          onWebSearchHover?.();
                        }}
                        onMouseLeave={() => {
                          isWebSearchMouseHoveringRef.current = false;
                        }}
                        onPointerDown={(e) => {
                          if (
                            e.pointerType === "touch" ||
                            (typeof window !== "undefined" &&
                              window.innerWidth < 1280)
                          ) {
                            ignoreNextWebSearchOpenRef.current = true;
                            setWebSearchHoverOpen(false);
                          }
                        }}
                        onClick={() => {
                          ignoreNextWebSearchOpenRef.current = true;
                          isWebSearchMouseHoveringRef.current = false;
                          setWebSearchHoverOpen(false);
                          setTimeout(() => {
                            ignoreNextWebSearchOpenRef.current = false;
                          }, 300);
                          (onOpenLoginModal || onOpenWebSearchModal)?.({ description: "To continue with Web search" });
                          if (
                            isOpen &&
                            typeof window !== "undefined" &&
                            window.innerWidth < 1280
                          ) {
                            onToggle();
                          }
                        }}
                        className={cn(
                          "w-full flex items-center justify-between h-11 pl-[14px] pr-2.5 rounded-xl hover:bg-secondary text-foreground text-md group cursor-pointer transition-all duration-150",
                          webSearchHoverOpen && "bg-secondary"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Globe
                            className={cn(
                              "w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors",
                              webSearchHoverOpen && "text-foreground"
                            )}
                          />
                          <span className="whitespace-nowrap">Web search</span>
                        </div>
                      </button>
                    </HoverCardTrigger>
                    {renderWebSearchHoverCardContent(() =>
                      setWebSearchHoverOpen(false)
                    )}
                  </HoverCard>

                  {/* Small Screen Devices Only: Plans */}
                  <Link
                    href="/product/plans"
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={!isOpen ? -1 : 0}
                    className="xl:hidden w-full flex items-center justify-between h-11 pl-[14px] pr-2.5 rounded-xl hover:bg-secondary text-foreground group cursor-pointer transition-colors duration-150 select-none overflow-hidden"
                    aria-label="Plans"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CreditCard className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                      <span className="text-md font-normal leading-normal whitespace-nowrap">
                        Plans
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 opacity-100 transition-opacity duration-150" />
                  </Link>

                  {/* Small Screen Devices Only: Help Dropdown */}
                  <div className="xl:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          tabIndex={!isOpen ? -1 : 0}
                          className="w-full h-11 pl-[14px] pr-2.5 flex items-center justify-between rounded-xl hover:bg-secondary text-foreground group cursor-pointer transition-colors duration-150 select-none overflow-hidden data-[state=open]:bg-secondary outline-none focus:outline-none"
                          aria-label="Help"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <LifeBuoy className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                            <span className="text-md font-normal leading-normal whitespace-nowrap">
                              Help
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 opacity-100 transition-opacity duration-150" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="bottom"
                        align="start"
                        sideOffset={8}
                        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[230px] rounded-2xl p-1.5 bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none select-none outline-none focus:outline-none ring-0 space-y-0.5"
                      >
                        {renderHelpMenuItems()}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              )}
            </div>

            {/* Small Screen Devices Only: Upper Divider & Always-shown Callout Card */}
            {!user && (
              <div className="xl:hidden w-full flex flex-col select-none">
                {/* Full-width divider */}
                <div className="w-full border-t border-border/80 dark:border-white/10" />

                {/* Upper Callout Card (No bg, no close button, always shows) */}
                <div className="w-full px-3 pt-3.5 space-y-2 select-text text-left">
                  <div className="text-base font-semibold text-foreground text-left">
                    Get efficient responses
                  </div>
                  <div className="text-sm text-muted-foreground leading-snug text-left">
                    Log in to get efficient answers, plus thinking capabilities,
                    upload files and more.
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenLoginModal?.()}
                    className="w-full mt-1.5 h-11 px-4 rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-90 text-base font-semibold transition-colors cursor-pointer flex items-center justify-center text-center leading-none"
                  >
                    Log in
                  </button>
                </div>
              </div>
            )}

            {/* Chat History Stream (Only for authenticated users) */}
            {user ? (
              <div className="flex-1 px-2 overflow-y-auto border-t border-border/80 dark:border-white/10  sidebar-scroll min-h-0">
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
                Signed in: px-2 so the profile row box starts at x 8 and the avatar sits 6px inside it (8 + 6 = 14,
                matching the persistent avatar at x 14 in the 60px rail). Guest: px-2 + pl-[14px] rows put icons at x 22. */}
            <div
              className={cn(
                "mt-auto w-full relative z-20 select-none",
                user || isAuthLoading
                  ? "px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] border-t border-border/80 dark:border-white/10"
                  : "px-2 max-xl:px-3 pt-2 max-xl:pt-0 max-xl:pb-[max(env(safe-area-inset-bottom),0.75rem)] pb-[max(env(safe-area-inset-bottom),0.5rem)]"
              )}
            >
              {isAuthLoading ? (
                /* Profile skeleton while the session loads */
                <div className="w-full h-10 flex items-center gap-2.5 pl-[6px] pr-2 animate-pulse">
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
                    open={accountMenuOpen}
                    onOpenChange={(open) => {
                      setAccountMenuOpen(open);
                      if (!open) setAccountSubView("main");
                    }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <div
                            role="button"
                            tabIndex={0}
                            className="w-full h-12 flex items-center justify-between rounded-sm hover:bg-secondary transition-colors duration-200 cursor-pointer select-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 ring-0 border-0 pl-[6px] pr-1.5 min-w-0"
                          >
                            {/* Profile Section */}
                            <div className="h-10 flex items-center justify-start min-w-0 flex-1 gap-2.5 text-left">
                              {showProfileSkeleton ? (
                                <>
                                  {/* Skeleton: avatar + name + plan */}
                                  <div className="w-8 h-8 rounded-full shrink-0 bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
                                  <div className="flex-1 min-w-0 space-y-1.5 animate-pulse">
                                    <div className="h-3 w-24 rounded bg-secondary/80 dark:bg-neutral-800/80" />
                                    <div className="h-2.5 w-12 rounded bg-secondary/70 dark:bg-neutral-800/60" />
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
                                      className="text-sm text-muted-foreground leading-none truncate"
                                      suppressHydrationWarning
                                    >
                                      @{username}
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
                                    className="w-11 h-11 rounded-sm flex items-center justify-center shrink-0 transition-colors select-none text-muted-foreground hover:text-foreground bg-transparent hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
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
                  {/* Desktop Only: Expanded Help, Plans, Settings, and Callout Card */}
                  <div className="hidden xl:block space-y-1.5">
                    {/* Expanded Plans */}
                    <Link
                      id="guest-sidebar-pricing-plans"
                      href="/product/plans"
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={!isOpen ? -1 : 0}
                      className="w-full h-11 pl-[14px] pr-2.5 flex items-center justify-between rounded-xl hover:bg-secondary text-foreground group cursor-pointer transition-colors duration-150 select-none overflow-hidden"
                      aria-label="Plans"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CreditCard className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                        <span className="text-md font-normal leading-normal whitespace-nowrap">
                          Plans
                        </span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity duration-150" />
                    </Link>

                    {/* Expanded Help */}
                    <DropdownMenu
                      open={guestHelpMenuOpen}
                      onOpenChange={setGuestHelpMenuOpen}
                    >
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          tabIndex={!isOpen ? -1 : 0}
                          className="w-full h-11 pl-[14px] pr-2.5 flex items-center justify-between rounded-xl hover:bg-secondary text-foreground group cursor-pointer transition-colors duration-150 select-none overflow-hidden data-[state=open]:bg-secondary outline-none focus:outline-none"
                          aria-label="Help"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <LifeBuoy className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                            <span className="text-md font-normal leading-normal whitespace-nowrap">
                              Help
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 group-data-[state=open]:opacity-100 transition-opacity duration-150" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="top"
                        align="start"
                        sideOffset={8}
                        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[230px] rounded-2xl p-1.5 bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none select-none outline-none focus:outline-none ring-0 space-y-0.5"
                      >
                        {renderHelpMenuItems()}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Expanded Settings */}
                    <button
                      type="button"
                      tabIndex={!isOpen ? -1 : 0}
                      onClick={() =>
                        isMobileScreen
                          ? openSettings()
                          : openSettings("general")
                      }
                      className="w-full h-11 pl-[14px] pr-2.5 flex items-center justify-between rounded-xl hover:bg-secondary text-foreground group cursor-pointer transition-colors duration-150 select-none overflow-hidden"
                      aria-label="Settings"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Settings className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                        <span className="text-md font-normal leading-normal whitespace-nowrap">
                          Settings
                        </span>
                      </div>
                    </button>

                    {/* Desktop Guest Callout Card */}
                    <div
                      id="guest-sidebar-callout-card"
                      className={cn(
                        "w-full pt-1.5 select-text",
                        isGuestCardDismissed && "hidden"
                      )}
                    >
                      <div className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none space-y-2 select-text text-left relative">
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
                            className="p-1.5 -mr-1 -mt-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[#383838] transition-colors cursor-pointer shrink-0"
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
                          className="w-full mt-1 h-11 px-4 rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-90 text-base font-semibold transition-colors cursor-pointer flex items-center justify-center text-center leading-none"
                        >
                          Log in
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Small Screen Device Guest Bottom Buttons */}
                  <div className="xl:hidden w-full flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        onNewChat();
                        if (
                          isOpen &&
                          typeof window !== "undefined" &&
                          window.innerWidth < 1280
                        ) {
                          onToggle();
                        }
                      }}
                      className="h-11 px-4 rounded-full flex items-center gap-2.5 bg-send-btn text-send-btn-foreground hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer font-semibold text-[15px] select-none"
                      aria-label="Chat"
                    >
                      <SquarePen className="w-5 h-5 shrink-0" />
                      <span>Chat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isMobileScreen) {
                          openSettings();
                        } else {
                          openSettings("general");
                        }
                      }}
                      className="w-12 h-12 rounded-full bg-white hover:bg-secondary text-muted-foreground hover:text-foreground dark:bg-[#2f2f2f] dark:hover:bg-[#383838] border border-border/80 dark:border-none flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none shrink-0 active:scale-[0.98]"
                      aria-label="Settings"
                    >
                      <Settings className="w-5 h-5 shrink-0" />
                    </button>
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
        isActive={chatToDelete?.id === currentChatId}
        starred={chatToDelete?.starred}
        archived={chatToDelete?.archived}
        onConfirm={() => {
          if (chatToDelete) {
            onDeleteChat(chatToDelete.id);
            setChatToDelete(null);
          }
        }}
      />

      {/* Report Bug / Feedback Modal */}
      <ReportBugModal
        open={showReportBugModal}
        onOpenChange={setShowReportBugModal}
        isGuest={!user}
      />
    </>
  );
}

export default Sidebar;
