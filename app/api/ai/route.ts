import { NextRequest, NextResponse } from "next/server";
import { categorizeExpense } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const { description } = await req.json();
  if (!description) {
    return NextResponse.json({ error: "品目名が必要です" }, { status: 400 });
  }
  const result = await categorizeExpense(description);
  return NextResponse.json(result);
}
