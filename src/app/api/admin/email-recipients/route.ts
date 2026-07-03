import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const recipients = await prisma.emailRecipient.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(recipients);
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const recipient = await prisma.emailRecipient.create({
    data: {
      role: body.role,
      email: body.email,
      name: body.name || null,
    },
  });

  return NextResponse.json(recipient, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.emailRecipient.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
