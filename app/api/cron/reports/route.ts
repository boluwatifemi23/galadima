import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { generateAndSendReport } from "@/lib/reports";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const now = new Date();
  const generated: string[] = [];

  if (now.getDay() === 1) { // Monday
    await generateAndSendReport("weekly");
    generated.push("weekly");
  }

  if (now.getDate() === 1) { // 1st of the month
    await generateAndSendReport("monthly");
    generated.push("monthly");

    if ([0, 3, 6, 9].includes(now.getMonth())) {
      await generateAndSendReport("quarterly");
      generated.push("quarterly");
    }
    if (now.getMonth() === 0) {
      await generateAndSendReport("annual");
      generated.push("annual");
    }
  }

  return NextResponse.json({ success: true, generated });
}