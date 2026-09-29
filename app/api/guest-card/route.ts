import { NextRequest, NextResponse } from "next/server";

// Server-side set of dismissed client IP addresses
const dismissedIps = new Set<string>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const cookieVal = req.cookies.get("guest_card")?.value;
  const isDismissed = dismissedIps.has(ip) || cookieVal === "true";

  const res = NextResponse.json({ dismissed: isDismissed, ip });
  if (isDismissed && cookieVal !== "true") {
    res.cookies.set("guest_card", "true", {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
  }
  return res;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  dismissedIps.add(ip);

  const res = NextResponse.json({ success: true, ip });
  res.cookies.set("guest_card", "true", {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
  });
  return res;
}
