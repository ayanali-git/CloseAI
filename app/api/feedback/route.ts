import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await req.json();

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
