import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");

  if (!model) {
    return NextResponse.json({ error: "Model parameter is required" }, { status: 400 });
  }

  // Find presets for the given model, default first
  const presets = await prisma.modelATCommandPreset.findMany({
    where: { model },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  const result = presets.map((p) => ({
    ...p,
    parameters: JSON.parse(p.parameters || "[]"),
  }));

  return NextResponse.json(result);
}
