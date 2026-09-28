import {
  Bell, CreditCard, Database, Lock, Settings2, Sparkles, User, UserCircle,
} from "lucide-react";
import type { SettingsSection } from "@/lib/settings-hash";

export const NAV: {
  id: SettingsSection;
  label: string;
  icon: typeof Settings2;
  auth?: boolean;
}[] = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "notifications", label: "Notifications", icon: Bell, auth: true },
  { id: "personalization", label: "Personalization", icon: Sparkles, auth: true },
  { id: "profile", label: "Profile", icon: User, auth: true },
  { id: "plans", label: "Plans", icon: CreditCard, auth: true },
  { id: "account", label: "Account", icon: UserCircle, auth: true },
  { id: "password", label: "Password", icon: Lock, auth: true },
  { id: "data", label: "Data", icon: Database },
];