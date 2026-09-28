"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/components/subscription-provider";
import { AnimatedPlusMinus } from "@/components/ui/animated";
import { LoginModal } from "@/components/modals/log-in-modal";
import { LogoutModal } from "@/components/modals/log-out-modal";
import { SettingsRow, SettingsPanelSkeleton } from "@/components/modals/settings/settings-modal";

export function AccountPanel() {
  const { user, loading, signOut } = useAuth();
  const { plan } = useSubscription();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  if (loading && !user) {
    return <SettingsPanelSkeleton />;
  }

  const planLabel =
    plan === "ultra" ? "Ultra Pro" : plan === "pro" ? "Pro" : "Free";
  const created = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <div>
      <SettingsRow label="Email">
        <span className="text-[15px] text-muted-foreground">
          {user?.email || "—"}
        </span>
      </SettingsRow>
      <SettingsRow label="Plan">
        <span className="text-[15px] text-muted-foreground">{planLabel}</span>
      </SettingsRow>
      <SettingsRow label="Member since">
        <span className="text-[15px] text-muted-foreground">{created}</span>
      </SettingsRow>
      <SettingsRow
        label="Add account"
        description="Log in or Sign up with another CloseAI account."
      >
        <button
          type="button"
          onClick={() => setLoginOpen(true)}
          className="inline-flex items-center gap-1 text-[15px] text-muted-foreground hover:text-foreground hover:bg-secondary outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm px-3 py-2 cursor-pointer transition-colors"
        >
          Add
          <AnimatedPlusMinus size={18} open={loginOpen} />
        </button>
      </SettingsRow>

      <div className="pt-6">
        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className="w-full h-11 rounded-full bg-foreground text-background font-medium text-sm hover:opacity-90 cursor-pointer flex items-center justify-center"
        >
          Log out
        </button>
      </div>

      <LogoutModal
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={() => signOut("/")}
        userName={
          user?.user_metadata?.name ||
          user?.user_metadata?.full_name ||
          user?.email?.split("@")[0]
        }
        userEmail={user?.email}
        userAvatar={user?.user_metadata?.avatar_url}
      />
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
