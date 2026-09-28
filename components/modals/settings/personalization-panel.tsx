"use client";

import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsRow } from "@/components/modals/settings/settings-modal";
import {
  getPersonalization,
  setPersonalization,
  type PersonalizationPrefs,
} from "@/lib/user-preferences";
import toast from "@/lib/toast";

export function PersonalizationPanel() {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<PersonalizationPrefs>({
    nickname: "",
    occupation: "",
    customInstructions: "",
    enableMemory: true,
  });
  const [saved, setSaved] = useState<PersonalizationPrefs | null>(null);

  useEffect(() => {
    const next = getPersonalization();
    setPrefs(next);
    setSaved(next);
    setMounted(true);
  }, []);

  const dirty =
    saved &&
    (prefs.nickname !== saved.nickname ||
      prefs.occupation !== saved.occupation ||
      prefs.customInstructions !== saved.customInstructions ||
      prefs.enableMemory !== saved.enableMemory);

  const handleSave = () => {
    setSaving(true);
    setPersonalization({
      nickname: prefs.nickname.trim(),
      occupation: prefs.occupation.trim(),
      customInstructions: prefs.customInstructions.trim(),
      enableMemory: prefs.enableMemory,
    });
    const next = getPersonalization();
    setPrefs(next);
    setSaved(next);
    toast.success("Personalization saved");
    setSaving(false);
  };

  if (!mounted) {
    return (
      <div className="space-y-3 pt-2">
        <div className="h-10 rounded-xl bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
        <div className="h-10 rounded-xl bg-secondary/70 dark:bg-neutral-800/60 animate-pulse" />
        <div className="h-28 rounded-xl bg-secondary/70 dark:bg-neutral-800/50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Customize how CloseAI talks with you. These details stay on this device.
      </p>

      <div className="space-y-2">
        <Label htmlFor="nickname">What should CloseAI call you?</Label>
        <Input
          id="nickname"
          value={prefs.nickname}
          onChange={(e) => setPrefs({ ...prefs, nickname: e.target.value })}
          placeholder="Nickname"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="occupation">What do you do?</Label>
        <Input
          id="occupation"
          value={prefs.occupation}
          onChange={(e) => setPrefs({ ...prefs, occupation: e.target.value })}
          placeholder="Occupation"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Custom instructions</Label>
        <textarea
          id="instructions"
          value={prefs.customInstructions}
          onChange={(e) =>
            setPrefs({ ...prefs, customInstructions: e.target.value })
          }
          placeholder="Anything CloseAI should know about you or how you like replies."
          rows={5}
          className="flex w-full rounded-md border border-input bg-secondary px-3 py-2 text-md placeholder:text-muted-foreground focus:placeholder:text-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none min-h-[120px]"
        />
      </div>

      <SettingsRow
        label="Reference saved memories"
        description="Let CloseAI use details you save between chats."
      >
        <Switch
          checked={prefs.enableMemory}
          onCheckedChange={(checked) =>
            setPrefs({ ...prefs, enableMemory: checked })
          }
        />
      </SettingsRow>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !dirty}
        className="w-full h-11 rounded-full bg-foreground text-background font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
      >
        {saving ? <Loader className="w-4 h-4 animate-spin" /> : "Save"}
      </button>
    </div>
  );
}
