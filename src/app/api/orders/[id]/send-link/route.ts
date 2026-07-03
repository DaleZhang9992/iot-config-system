import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { getBaseUrl } from "@/lib/utils";
import { sendEmail, customerLinkEmail } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || (token.role !== "FAE" && token.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!order.linkToken) return NextResponse.json({ error: "Generate link first" }, { status: 400 });

  const customerEmail = body.customerEmail || order.customerEmail;
  const customerName = body.customerName || order.customerName || "Customer";

  if (!customerEmail) {
    return NextResponse.json({ error: "Customer email is required" }, { status: 400 });
  }

  const baseUrl = getBaseUrl();
  const link = `${baseUrl}/customer/${order.linkToken}`;

  // Update order with customer info
  await prisma.order.update({
    where: { id },
    data: {
      customerEmail,
      customerName: body.customerName || customerName,
      status: "LINK_SENT",
    },
  });

  // Send email
  const html = customerLinkEmail({
    orderNo: order.orderNo,
    customerName,
    link,
    lang: "zh",
  });

  await sendEmail({
    to: customerEmail,
    subject: `[IoT Config] 订单 ${order.orderNo} 生产配置确认 / Production Configuration Confirmation`,
    html,
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      orderId: id,
      userId: token.id as string,
      action: "LINK_SENT",
      description: `Link sent to ${customerEmail} for order ${order.orderNo}`,
    },
  });

  return NextResponse.json({ success: true, sentTo: customerEmail });
}
