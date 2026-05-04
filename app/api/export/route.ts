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

  const expenses = await prisma.expense.findMany({
    where,
    include: { member: true },
    orderBy: { date: "asc" },
  });

  const type = searchParams.get("type") ?? "freee";

  let rows: string[][];
  if (type === "freee") {
    rows = [
      ["取引日", "借方勘定科目", "借方税区分", "借方金額", "借方税額", "貸方勘定科目", "貸方税区分", "貸方金額", "貸方税額", "摘要", "備考"],
      ...expenses.map((e) => [
        formatDate(e.date),
        e.category,
        "課税仕入10%",
        Math.floor(e.amount / 1.1).toString(),
        (e.amount - Math.floor(e.amount / 1.1)).toString(),
        "未払金",
        "",
        e.amount.toString(),
        "",
        e.description,
        `${e.member.name}（${e.receiptType}）`,
      ]),
    ];
  } else {
    rows = [
      ["日付", "勘定科目", "金額", "内容", "担当者", "領収書種別", "確認済"],
      ...expenses.map((e) => [
        formatDate(e.date),
        e.category,
        e.amount.toString(),
        e.description,
        e.member.name,
        e.receiptType,
        e.checked ? "○" : "",
      ]),
    ];
  }

  const csv = rows.map((row) => row.map(escapeCSV).join(",")).join("\n");
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="expenses-${month ?? "all"}.csv"`,
    },
  });
}

function formatDate(d: Date) {
  const date = new Date(d);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function escapeCSV(val: string) {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
