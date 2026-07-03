import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const configs = await prisma.systemConfig.findMany();
  const result: Record<string, string> = {};
  for (const c of configs) result[c.key] = c.value;
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  for (const [key, value] of Object.entries(body)) {
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value: value as string },
      create: { key, value: value as string },
    });
  }

  return NextResponse.json({ success: true });
}
