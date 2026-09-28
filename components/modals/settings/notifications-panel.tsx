"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { SettingsRow } from "@/components/modals/settings/settings-modal";
import {
  getNotificationPrefs,
  setNotificationPrefs,
} from "@/lib/user-preferences";

export function NotificationsPanel() {
  const [mounted, setMounted] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    const prefs = getNotificationPrefs();
    setEmailNotifications(prefs.emailNotifications);
    setMarketingEmails(prefs.marketingEmails);
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-3 pt-2">
        <div className="h-16 rounded-xl bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
        <div className="h-16 rounded-xl bg-secondary/70 dark:bg-neutral-800/60 animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <SettingsRow
        label="Email notifications"
        description="Receive updates about your conversations."
      >
        <Switch
          checked={emailNotifications}
          onCheckedChange={(checked) => {
            setEmailNotifications(checked);
            setNotificationPrefs({
              emailNotifications: checked,
              marketingEmails,
            });
          }}
        />
      </SettingsRow>
      <SettingsRow
        label="Marketing emails"
        description="Receive news and promotional content."
      >
        <Switch
          checked={marketingEmails}
          onCheckedChange={(checked) => {
            setMarketingEmails(checked);
            setNotificationPrefs({
              emailNotifications,
              marketingEmails: checked,
            });
          }}
        />
      </SettingsRow>
    </div>
  );
}
