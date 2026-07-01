import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { generateAndSendReport } from "@/lib/reports";
import type { ReportType } from "@/lib/models/Report";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const now = new Date();
  const generated: string[] = [];
  const failed: { type: string; error: string }[] = [];

  async function tryGenerate(type: ReportType) {
    try {
      await generateAndSendReport(type);
      generated.push(type);
    } catch (err) {
      console.error(`[cron/reports] ${type} failed:`, err);
      failed.push({ type, error: err instanceof Error ? err.message : "unknown error" });
    }
  }

if (now.getDay() === 5) { // Friday
    await tryGenerate("weekly");
    generated.push("weekly");
  }

  if (now.getDate() === 1) {
    await tryGenerate("monthly");
    if ([0, 3, 6, 9].includes(now.getMonth())) await tryGenerate("quarterly");
    if (now.getMonth() === 0) await tryGenerate("annual");
  }

  return NextResponse.json({ success: true, generated, failed });
}