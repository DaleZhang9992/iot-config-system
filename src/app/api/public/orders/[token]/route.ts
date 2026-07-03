import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const order = await prisma.order.findUnique({
    where: { linkToken: token },
    include: {
      template: {
        include: { parameters: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }

  if (!order.template) {
    return NextResponse.json({ error: "Configuration not ready yet" }, { status: 400 });
  }

  // Get latest pending submission (for resubmit)
  const lastSubmission = await prisma.customerSubmission.findFirst({
    where: { orderId: order.id },
    orderBy: { version: "desc" },
    include: {
      paramValues: true,
    },
  });

  return NextResponse.json({
    order: {
      orderNo: order.orderNo,
      model: order.model,
      quantity: order.quantity,
      orderDate: order.orderDate,
      customerName: order.customerName,
      status: order.status,
    },
    template: order.template,
    lastSubmission,
  });
}
