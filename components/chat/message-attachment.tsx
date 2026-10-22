"use client";

import React, { useState, useEffect } from "react";
import { getFileIconInfo } from "@/lib/file-utils";
import { ImagePreview } from "@/components/modals/image-preview-modal";
import { cn } from "@/lib/utils";

export function isImageFile(file: any): boolean {
  if (
    file?.type &&
    typeof file.type === "string" &&
    file.type.toLowerCase().startsWith("image/")
  ) {
    return true;
  }
  const name =
    file?.filename || file?.name || file?.url || file?.publicUrl || "";
  if (typeof name === "string") {
    return (
      /\.(png|jpe?g|webp|gif|svg|bmp|ico|avif)(\?.*)?$/i.test(name) ||
      /^pasted_image/i.test(name)
    );
  }
  return false;
}

export interface MessageAttachmentItemProps {
  file: any;
  onPreview?: (file: any) => void;
  interactive?: boolean;
}

export function MessageAttachmentItem({
  file,
  onPreview,
  interactive = true,
}: MessageAttachmentItemProps) {
  const isImg = isImageFile(file);
  const [imgSrc, setImgSrc] = useState<string>(() => {
    const directUrl = file?.url || file?.publicUrl;
    if (directUrl && typeof directUrl === "string") return directUrl;
    if (typeof window !== "undefined" && file instanceof File) {
      try {
        return URL.createObjectURL(file);
      } catch (e) {
        return "";
      }
    }
    return "";
  });

  useEffect(() => {
    const directUrl = file?.url || file?.publicUrl;
    if (directUrl && typeof directUrl === "string") {
      setImgSrc(directUrl);
    } else if (file instanceof File) {
      const u = URL.createObjectURL(file);
      setImgSrc(u);
      return () => {
        URL.revokeObjectURL(u);
      };
    }
  }, [file]);

  const displayName = file?.filename || file?.name || "File";
  const { Icon } = getFileIconInfo(file);

  if (isImg && imgSrc) {
    const imageContent = (
      <div
        className={cn(
          "relative flex leading-[0] overflow-clip rounded-[25px] sm:rounded-3xl bg-[#e8e8e8] dark:bg-[#383838] border border-border/80 max-w-[100px] sm:max-w-[200px] select-none",
          interactive && "cursor-pointer hover:opacity-80 transition-opacity"
        )}
      >
        <img
          src={imgSrc}
          alt={displayName}
          className="block m-0 w-full max-h-[100px] sm:max-h-[200px] object-cover pointer-events-none"
          draggable={false}
        />
      </div>
    );

    if (interactive) {
      return (
        <ImagePreview src={imgSrc} alt={displayName}>
          {imageContent}
        </ImagePreview>
      );
    }
    return imageContent;
  }

  // Non-image file pill with simple Phosphor icon
  if (interactive) {
    return (
      <button
        type="button"
        onClick={() => onPreview?.(file)}
        className="flex self-end items-center gap-2.5 bg-[#e8e8e8] dark:bg-[#383838] hover:opacity-80 text-foreground text-xs sm:text-sm px-3 py-2.5 rounded-[25px] sm:rounded-3xl border border-border/80 transition-opacity cursor-pointer group select-none text-left"
      >
        <Icon className="w-5 h-5 shrink-0 text-muted-foreground" weight="fill" />
        <span className="truncate max-w-[100px] sm:max-w-[200px] font-normal">
          {displayName}
        </span>
      </button>
    );
  }

  return (
    <div
      className="flex self-end items-center gap-2.5 bg-[#e8e8e8] dark:bg-[#383838] text-foreground text-xs sm:text-sm px-3 py-2.5 rounded-[25px] sm:rounded-3xl border border-border/80 select-none text-left"
    >
      <Icon className="w-5 h-5 shrink-0 text-muted-foreground" weight="fill" />
      <span className="truncate max-w-[100px] sm:max-w-[200px] font-normal">
        {displayName}
      </span>
    </div>
  );
}
