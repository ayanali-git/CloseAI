import { NextRequest, NextResponse } from "next/server";
import { sendFeedbackEmail } from "@/lib/nodemailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, categories, details, isGuest, email } = body;

    if (!details || typeof details !== "string" || !details.trim()) {
      return NextResponse.json(
        { success: false, error: "Details are required" },
        { status: 400 }
      );
    }

    await sendFeedbackEmail({
      category,
      categories,
      details: details.trim(),
      isGuest: Boolean(isGuest),
      email: typeof email === "string" ? email.trim() : null,
    });

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
    });
  } catch (error: any) {
    console.error("[FEEDBACK_API_ERROR]", error);
    const errorMessage =
      error?.message || "Failed to process feedback. Please try again later.";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
