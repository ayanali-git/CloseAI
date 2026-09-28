"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  SettingsRow,
  SettingsPanelSkeleton,
} from "@/components/modals/settings/settings-modal";

type DataPrefKey =
  | "improveModel"
  | "personalizeAds"
  | "marketingMeasurement"
  | "personalizedMarketing";

const DATA_PREF_STORAGE_KEYS: Record<DataPrefKey, string> = {
  improveModel: "data-pref-improve-model",
  personalizeAds: "data-pref-personalize-ads",
  marketingMeasurement: "data-pref-marketing-measurement",
  personalizedMarketing: "data-pref-personalized-marketing",
};

function getDataPref(key: DataPrefKey): boolean {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(DATA_PREF_STORAGE_KEYS[key]);
  if (raw === null) return true; // default on, matches ChatGPT's default state
  return raw === "true";
}

function setDataPref(key: DataPrefKey, value: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DATA_PREF_STORAGE_KEYS[key], String(value));
}
// ---------------------------------------------------------------------------

export function DataPanel() {
  const [mounted, setMounted] = useState(false);
  const [improveModel, setImproveModel] = useState(true);
  const [personalizeAds, setPersonalizeAds] = useState(true);
  const [marketingMeasurement, setMarketingMeasurement] = useState(true);
  const [personalizedMarketing, setPersonalizedMarketing] = useState(true);

  useEffect(() => {
    setMounted(true);
    setImproveModel(getDataPref("improveModel"));
    setPersonalizeAds(getDataPref("personalizeAds"));
    setMarketingMeasurement(getDataPref("marketingMeasurement"));
    setPersonalizedMarketing(getDataPref("personalizedMarketing"));
  }, []);

  if (!mounted) {
    return <SettingsPanelSkeleton />;
  }

  return (
    <div>
      <SettingsRow
        label="Improve the model for everyone"
        description="Allow your content to be used to train our models, which helps improve them for you and everyone who uses them. We take steps to protect your privacy."
      >
        <Switch
          checked={improveModel}
          onCheckedChange={(checked) => {
            setImproveModel(checked);
            setDataPref("improveModel", checked);
          }}
        />
      </SettingsRow>

      <SettingsRow
        label="Personalize ads"
        description="Allow us to use your past chats, activity, and preferences to select ads. Ads may still be based on your current chat."
      >
        <Switch
          checked={personalizeAds}
          onCheckedChange={(checked) => {
            setPersonalizeAds(checked);
            setDataPref("personalizeAds", checked);
          }}
        />
      </SettingsRow>

      <SettingsRow
        label="Marketing measurement"
        description="These cookies help us measure the effectiveness of our marketing campaigns."
      >
        <Switch
          checked={marketingMeasurement}
          onCheckedChange={(checked) => {
            setMarketingMeasurement(checked);
            setDataPref("marketingMeasurement", checked);
          }}
        />
      </SettingsRow>

      <SettingsRow
        label="Personalized marketing"
        description="This helps us personalize and measure our own marketing on third-party platforms."
      >
        <Switch
          checked={personalizedMarketing}
          onCheckedChange={(checked) => {
            setPersonalizedMarketing(checked);
            setDataPref("personalizedMarketing", checked);
          }}
        />
      </SettingsRow>
    </div>
  );
}