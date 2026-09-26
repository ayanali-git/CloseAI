"use client";

import React, { useRef, useState, useEffect } from "react";
import { Camera, Loader, AlertTriangle } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import toast from "@/lib/toast";
import { cn } from "@/lib/utils";

export interface ProfileImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string | null;
  userName?: string;
  userEmail?: string;
  onAvatarUpdated: (newUrl: string | null) => void;
}

export function ProfileImageModal({
  open,
  onOpenChange,
  currentAvatarUrl,
  userName,
  userEmail,
  onAvatarUpdated,
}: ProfileImageModalProps) {
  const { refreshSession } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up preview blob URL when modal closes
  useEffect(() => {
    if (!open) {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      setLoading(false);
    }
  }, [open, previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      const newAvatarUrl = data.avatar_url;

      // 1. Update client-side Supabase user metadata so session and auth context reflect immediately
      try {
        await supabase.auth.updateUser({
          data: { avatar_url: newAvatarUrl },
        });
      } catch (clientErr) {
        console.error("Failed to updateUser on client:", clientErr);
      }

      // 2. Refresh auth session to ensure sync
      try {
        await refreshSession();
      } catch (refreshErr) {
        console.error("Failed to refresh session:", refreshErr);
      }

      // 3. Inform parent component
      onAvatarUpdated(newAvatarUrl);

      toast.success("Profile picture updated!");
      onOpenChange(false);
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      toast.error(err.message || "Failed to update profile picture");
    } finally {
      setLoading(false);
    }
  };

  const displayAvatar = previewUrl || currentAvatarUrl || undefined;
  const initialChar = userName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase();

  return (
    <BottomSheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!loading) onOpenChange(isOpen);
      }}
      snapPoints={["auto"]}
      className="max-w-[600px]"
    >
      <div className="flex flex-col space-y-4 pt-1 pb-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Update profile picture
          </h2>
        </div>

        <div className="relative w-full overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-[30%] min-h-[95px] sm:min-h-[105px] z-10 pointer-events-none" />

          <div
            className={cn(
              "relative z-0 max-h-[160px] sm:max-h-[200px] min-h-[140px] sm:min-h-[180px] flex items-center justify-center p-5 sm:p-6 overflow-hidden select-none"
            )}
          >
            <div
              onClick={() => !loading && fileInputRef.current?.click()}
              className="relative cursor-pointer select-none group"
            >
              <Avatar className="w-32 h-32 rounded-full overflow-hidden transition-transform">
                <AvatarImage src={displayAvatar} className="object-cover w-full h-full" />
                <AvatarFallback className="text-4xl font-bold bg-secondary text-foreground">
                  {initialChar}
                </AvatarFallback>
              </Avatar>

              {/* Camera badge button at bottom-right (loader spins here on save) */}
              <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-neutral-700 flex items-center justify-center transition-transform">
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <Camera className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={loading}
        />

        {/* Info Box Note */}
        <div className="w-full flex items-start gap-2.5 p-3 rounded-2xl bg-secondary/50 text-left text-xs text-muted-foreground">
          <AlertTriangle className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
          <span className="leading-normal">
            This will update your profile picture across all CloseAI platforms.
          </span>
        </div>

        {/* Action Buttons: Save changes and Cancel */}
        <div className="w-full space-y-2 pt-1">
          <button
            type="button"
            onClick={selectedFile ? handleSave : () => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full h-11 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer select-none flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {selectedFile ? "Save changes" : "Choose photo"}
          </button>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full h-11 rounded-full border border-border/80 bg-transparent text-foreground font-normal text-sm hover:bg-secondary/60 transition-all cursor-pointer select-none"
          >
            Cancel
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
