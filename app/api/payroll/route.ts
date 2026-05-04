import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  const payrolls = await prisma.payroll.findMany({
    where: month ? { month } : {},
    include: { member: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(payrolls);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const payroll = await prisma.payroll.create({
    data: {
      month: body.month,
      amount: parseInt(body.amount),
      type: body.type ?? "給与",
      memberId: parseInt(body.memberId),
    },
    include: { member: true },
  });
  return NextResponse.json(payroll, { status: 201 });
}
