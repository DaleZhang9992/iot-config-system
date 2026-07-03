import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      salesUser: { select: { id: true, name: true, email: true } },
      faeUser: { select: { id: true, name: true, email: true } },
      template: {
        include: { parameters: { orderBy: { sortOrder: "asc" } } },
      },
      submissions: {
        include: {
          paramValues: true,
        },
        orderBy: { version: "desc" },
      },
      auditLogs: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // FAE assignment - only FAE/ADMIN can claim
  if (body.faeUserId !== undefined) {
    if (token.role !== "FAE" && token.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Only allow claiming for yourself
    if (body.faeUserId !== token.id && token.role !== "ADMIN") {
      return NextResponse.json({ error: "Can only assign to yourself" }, { status: 403 });
    }
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      faeUserId: body.faeUserId ?? undefined,
      customerName: body.customerName ?? undefined,
      customerEmail: body.customerEmail ?? undefined,
      notes: body.notes ?? undefined,
      shipWithSimCard: body.shipWithSimCard ?? undefined,
      shipPoweredOn: body.shipPoweredOn ?? undefined,
      firmwareVersion: body.firmwareVersion ?? undefined,
    },
  });

  // Audit log
  if (body.faeUserId) {
    await prisma.auditLog.create({
      data: {
        orderId: id,
        userId: token.id as string,
        action: "FAE_ASSIGNED",
        description: `FAE assigned to order ${order.orderNo}`,
      },
    });
  }

  return NextResponse.json(order);
}
