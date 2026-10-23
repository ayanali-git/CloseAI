import React from "react";
import {
  FilePdf as FilePdfIcon,
  FileDoc as FileDocIcon,
  FileCsv as FileCsvIcon,
  FileText as FileTextIcon,
  FileCode as FileCodeIcon,
  FileZip as FileZipIcon,
  FileAudio as FileAudioIcon,
  FileVideo as FileVideoIcon,
  File as FileIcon,
  Image as ImageIcon,
} from "@phosphor-icons/react";

export function getFileExtension(file: any): string {
  if (!file) return "";
  const name = file.name || file.filename || file.url || "";
  const match = typeof name === "string" ? name.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/) : null;
  if (match) return match[1].toLowerCase();

  const mime = file.type || "";
  if (typeof mime === "string") {
    if (mime === "application/pdf") return "pdf";
    if (mime.includes("word") || mime.includes("document")) return "docx";
    if (mime.includes("sheet") || mime.includes("excel")) return "xlsx";
    if (mime.includes("csv")) return "csv";
    if (mime.includes("zip") || mime.includes("compressed")) return "zip";
    if (mime.startsWith("image/")) return mime.split("/")[1] || "png";
  }
  return "";
}

export function isImageFile(file: any): boolean {
  if (!file) return false;
  if (file.type && typeof file.type === "string" && file.type.toLowerCase().startsWith("image/")) {
    return true;
  }
  const ext = getFileExtension(file);
  return ["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp", "ico", "avif"].includes(ext);
}

export function isPdfFile(file: any): boolean {
  if (!file) return false;
  if (file.type && typeof file.type === "string" && file.type.toLowerCase().includes("pdf")) {
    return true;
  }
  return getFileExtension(file) === "pdf";
}

export function isTextOrCodeFile(file: any): boolean {
  if (!file) return false;
  const ext = getFileExtension(file);
  const codeAndTextExts = [
    "txt", "md", "markdown", "json", "jsonl", "csv", "log", "xml", "yaml", "yml", "toml",
    "js", "jsx", "ts", "tsx", "py", "html", "css", "scss", "sql", "sh", "bash",
    "c", "cpp", "h", "cs", "java", "rs", "go", "php", "rb"
  ];
  return codeAndTextExts.includes(ext);
}

export function getPhosphorFileIcon(file: any): React.ComponentType<any> {
  const ext = getFileExtension(file);
  switch (ext) {
    case "pdf":
      return FilePdfIcon;
    case "doc":
    case "docx":
    case "odt":
    case "rtf":
      return FileDocIcon;
    case "csv":
    case "xlsx":
    case "xls":
      return FileCsvIcon;
    case "txt":
    case "md":
    case "markdown":
      return FileTextIcon;
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
    case "py":
    case "json":
    case "jsonl":
    case "html":
    case "css":
    case "scss":
    case "sql":
    case "sh":
    case "c":
    case "cpp":
    case "cs":
    case "java":
    case "rs":
    case "go":
      return FileCodeIcon;
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return FileZipIcon;
    case "audio":
    case "mp3":
    case "wav":
    case "ogg":
    case "m4a":
    case "flac":
      return FileAudioIcon;
    case "video":
    case "mp4":
    case "mov":
    case "avi":
    case "webm":
      return FileVideoIcon;
    default:
      return FileIcon;
  }
}

export interface FileIconInfo {
  Icon: React.ComponentType<any>;
  label: string;
  colorClass: string;
  badgeBg: string;
  badgeBorder: string;
}

export function getFileIconInfo(file: any): FileIconInfo {
  const ext = getFileExtension(file);
  const Icon = isImageFile(file) ? ImageIcon : getPhosphorFileIcon(file);
  const label = ext ? ext.toUpperCase() : "FILE";

  return {
    Icon,
    label,
    colorClass: "text-muted-foreground",
    badgeBg: "bg-transparent",
    badgeBorder: "border-border/80",
  };
}

export function getFileUrl(file: any): string {
  if (!file) return "";
  if (typeof file === "string") return file;
  if (file.url && typeof file.url === "string") return file.url;
  if (file.publicUrl && typeof file.publicUrl === "string") return file.publicUrl;
  if (typeof window !== "undefined" && file instanceof File) {
    try {
      return URL.createObjectURL(file);
    } catch (e) {
      return "";
    }
  }
  return "";
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || typeof bytes !== "number" || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

