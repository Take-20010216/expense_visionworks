import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const memberId = searchParams.get("memberId");

  const where: any = {};
  if (month) {
    const [year, m] = month.split("-").map(Number);
    where.date = {
      gte: new Date(year, m - 1, 1),
      lt: new Date(year, m, 1),
    };
  }
  if (memberId) {
    where.memberId = parseInt(memberId);
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: { member: true },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const expense = await prisma.expense.create({
    data: {
      date: new Date(body.date),
      amount: parseInt(body.amount),
      description: body.description,
      category: body.category,
      receiptType: body.receiptType ?? "紙",
      checked: body.checked ?? false,
      memo: body.memo ?? null,
      memberId: parseInt(body.memberId),
    },
    include: { member: true },
  });
  return NextResponse.json(expense, { status: 201 });
}
