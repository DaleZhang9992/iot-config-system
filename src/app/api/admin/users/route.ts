import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcryptjs";

// GET /api/admin/users
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, phone: true, isActive: true, language: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

// POST /api/admin/users
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const hashedPassword = await bcrypt.hash(body.password || "123456", 10);

  const user = await prisma.user.create({
    data: {
      email: body.email,
      password: hashedPassword,
      name: body.name,
      role: body.role || "SALES",
      phone: body.phone || null,
      language: body.language || "zh",
    },
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }, { status: 201 });
}
