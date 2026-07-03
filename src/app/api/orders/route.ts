import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {};

  // Role-based filtering
  if (token.role === "SALES") {
    where.salesUserId = token.id;
  }

  if (status) where.status = status;

  if (search) {
    where.OR = [
      { orderNo: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        salesUser: { select: { id: true, name: true, email: true } },
        template: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, limit });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || (token.role !== "SALES" && token.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const order = await prisma.order.create({
      data: {
        orderNo: body.orderNo,
        model: body.model,
        quantity: parseInt(body.quantity),
        orderDate: new Date(body.orderDate),
        customerName: body.customerName || null,
        customerEmail: body.customerEmail || null,
        notes: body.notes || null,
        salesUserId: token.id as string,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orderId: order.id,
        userId: token.id as string,
        action: "ORDER_CREATED",
        description: `Order ${order.orderNo} created`,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
