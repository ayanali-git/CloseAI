import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[User Feedback Received]:", {
      category: body.category,
      categories: body.categories || (body.category ? [body.category] : []),
      details: body.details,
      isGuest: body.isGuest,
      email: body.email,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to process feedback" },
      { status: 400 }
    );
  }
}
