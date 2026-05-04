import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

const MEMBER_ORDER = ["水野由唯", "金田"];

export async function GET() {
  const members = await prisma.member.findMany();
  members.sort((a, b) => {
    const ai = MEMBER_ORDER.indexOf(a.name);
    const bi = MEMBER_ORDER.indexOf(b.name);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.name.localeCompare(b.name, "ja");
  });
  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "名前は必須です" }, { status: 400 });
  }
  const member = await prisma.member.create({ data: { name: name.trim() } });
  return NextResponse.json(member, { status: 201 });
}
