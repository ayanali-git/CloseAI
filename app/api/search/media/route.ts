import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser, supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getServerAuthUser(request);
    if (!user) {
      return NextResponse.json({ images: [], files: [] });
    }

    // 1. Fetch user's chats to map IDs and titles
    const { data: chats, error: chatsError } = await supabaseAdmin
      .from("chats")
      .select("id, title, created_at, updated_at")
      .eq("user_id", user.id);

    if (chatsError || !chats || chats.length === 0) {
      return NextResponse.json({ images: [], files: [] });
    }

    const chatIds = chats.map((c: any) => c.id);
    const chatTitleMap = new Map<string, string>();
    chats.forEach((c: any) => chatTitleMap.set(c.id, c.title || "Chat"));

    // 2. Fetch messages in user's chats
    const { data: messages, error: msgsError } = await supabaseAdmin
      .from("messages")
      .select("id, chat_id, created_at, metadata, file_uploads(*)")
      .in("chat_id", chatIds)
      .order("created_at", { ascending: false });

    if (msgsError || !messages) {
      return NextResponse.json({ images: [], files: [] });
    }

    const images: any[] = [];
    const files: any[] = [];
    const seenKeys = new Set<string>();

    const imageExts = new Set([
      "png",
      "jpg",
      "jpeg",
      "webp",
      "gif",
      "svg",
      "bmp",
      "ico",
      "avif",
    ]);

    const isImg = (file: any) => {
      const type = (file.type || "").toLowerCase();
      if (type.startsWith("image/")) return true;
      const name = (file.filename || file.name || file.url || "").toLowerCase();
      const ext = name.split(".").pop()?.split("?")[0] || "";
      return imageExts.has(ext);
    };

    messages.forEach((msg: any) => {
      const rawList = [
        ...(Array.isArray(msg.file_uploads) ? msg.file_uploads : []),
        ...(Array.isArray(msg.metadata?.files) ? msg.metadata.files : []),
      ];

      rawList.forEach((f: any) => {
        if (!f) return;
        const name = f.filename || f.name || "File";
        const url = f.url || f.publicUrl || "";
        const uniqueKey = url || `${msg.chat_id}_${name}_${f.size || ""}`;

        if (seenKeys.has(uniqueKey)) return;
        seenKeys.add(uniqueKey);

        const item = {
          id: f.id || uniqueKey,
          chatId: msg.chat_id,
          chatTitle: chatTitleMap.get(msg.chat_id) || "Chat",
          name,
          filename: name,
          url,
          publicUrl: url,
          type: f.type || "",
          size: f.size || 0,
          createdAt: f.created_at || msg.created_at,
        };

        if (isImg(item)) {
          images.push(item);
        } else {
          files.push(item);
        }
      });
    });

    return NextResponse.json({ images, files });
  } catch (error: any) {
    console.error("Error in search media API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
