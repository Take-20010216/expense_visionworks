import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data: any = {};
  if (body.checked !== undefined) data.checked = body.checked;
  if (body.category !== undefined) data.category = body.category;
  if (body.memo !== undefined) data.memo = body.memo;
  if (body.amount !== undefined) data.amount = parseInt(body.amount);
  if (body.description !== undefined) data.description = body.description;
  if (body.receiptType !== undefined) data.receiptType = body.receiptType;
  if (body.date !== undefined) data.date = new Date(body.date);

  const expense = await prisma.expense.update({
    where: { id: parseInt(id) },
    data,
    include: { member: true },
  });
  return NextResponse.json(expense);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.expense.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
