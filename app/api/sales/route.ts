import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  const where: any = {};
  if (month) {
    const [year, m] = month.split("-").map(Number);
    where.date = {
      gte: new Date(year, m - 1, 1),
      lt: new Date(year, m, 1),
    };
  }

  const sales = await prisma.sale.findMany({
    where,
    orderBy: { date: "asc" },
  });
  return NextResponse.json(sales);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sale = await prisma.sale.create({
    data: {
      date: new Date(body.date),
      amount: parseInt(body.amount),
      description: body.description,
      client: body.client ?? null,
      category: body.category ?? "売上高",
    },
  });
  return NextResponse.json(sale, { status: 201 });
}
