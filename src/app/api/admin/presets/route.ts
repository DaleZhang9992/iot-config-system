import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");

  const where: any = {};
  if (model) where.model = model;

  const presets = await prisma.modelATCommandPreset.findMany({
    where,
    orderBy: [{ model: "asc" }, { name: "asc" }],
  });

  // Parse parameters JSON for each preset
  const result = presets.map((p) => ({
    ...p,
    parameters: JSON.parse(p.parameters || "[]"),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { model, name, parameters, isDefault } = body;

    if (!model || !parameters) {
      return NextResponse.json({ error: "Model and parameters are required" }, { status: 400 });
    }

    // If setting as default, unset other defaults for this model
    if (isDefault) {
      await prisma.modelATCommandPreset.updateMany({
        where: { model, isDefault: true },
        data: { isDefault: false },
      });
    }

    const preset = await prisma.modelATCommandPreset.create({
      data: {
        model,
        name: name || "默认配置",
        isDefault: isDefault || false,
        parameters: JSON.stringify(parameters),
      },
    });

    return NextResponse.json({
      ...preset,
      parameters: JSON.parse(preset.parameters),
    }, { status: 201 });
  } catch (error) {
    console.error("Create preset error:", error);
    return NextResponse.json({ error: "Failed to create preset" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, parameters, isDefault, model } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // If setting as default, unset other defaults for this model
    if (isDefault && model) {
      await prisma.modelATCommandPreset.updateMany({
        where: { model, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const preset = await prisma.modelATCommandPreset.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(isDefault !== undefined && { isDefault }),
        ...(parameters !== undefined && { parameters: JSON.stringify(parameters) }),
      },
    });

    return NextResponse.json({
      ...preset,
      parameters: JSON.parse(preset.parameters),
    });
  } catch (error) {
    console.error("Update preset error:", error);
    return NextResponse.json({ error: "Failed to update preset" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  await prisma.modelATCommandPreset.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
