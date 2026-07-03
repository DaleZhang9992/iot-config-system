import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const template = await prisma.aTCommandTemplate.findUnique({
    where: { orderId: id },
    include: { parameters: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(template);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || (token.role !== "FAE" && token.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Upsert template
  const template = await prisma.aTCommandTemplate.upsert({
    where: { orderId: id },
    update: {
      firmwareVersion: body.firmwareVersion,
      isCustomVersion: body.isCustomVersion || false,
      notes: body.notes,
      faeUserId: token.id as string,
    },
    create: {
      orderId: id,
      faeUserId: token.id as string,
      firmwareVersion: body.firmwareVersion,
      isCustomVersion: body.isCustomVersion || false,
      notes: body.notes,
    },
  });

  // Delete old parameters and recreate
  await prisma.aTCommandParameter.deleteMany({ where: { templateId: template.id } });

  if (body.parameters && body.parameters.length > 0) {
    await prisma.aTCommandParameter.createMany({
      data: body.parameters.map((p: any, index: number) => ({
        templateId: template.id,
        paramKey: p.paramKey,
        displayName: p.displayName,
        description: p.description || null,
        dataType: p.dataType || "STRING",
        isRequired: p.isRequired || false,
        defaultValue: p.defaultValue || null,
        unit: p.unit || null,
        minValue: p.minValue ?? null,
        maxValue: p.maxValue ?? null,
        step: p.step ?? null,
        enumValues: p.enumValues || null,
        regexPattern: p.regexPattern || null,
        regexHint: p.regexHint || null,
        sortOrder: p.sortOrder ?? index,
        groupName: p.groupName || null,
      })),
    });
  }

  // Update order status if it's the first config
  if (order.status === "PENDING_CONFIG") {
    await prisma.order.update({
      where: { id },
      data: { status: "FAE_CONFIGURED" },
    });
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      orderId: id,
      userId: token.id as string,
      action: "TEMPLATE_CONFIGURED",
      description: `AT commands configured for order ${order.orderNo}`,
    },
  });

  const updated = await prisma.aTCommandTemplate.findUnique({
    where: { id: template.id },
    include: { parameters: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(updated);
}
