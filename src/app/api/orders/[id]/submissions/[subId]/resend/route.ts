import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { sendEmail, customerLinkEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; subId: string }> }) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || (token.role !== "FAE" && token.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!order.linkToken) return NextResponse.json({ error: "No link token" }, { status: 400 });

  const customerEmail = body.customerEmail || order.customerEmail;
  const customerName = body.customerName || order.customerName || "Customer";

  if (!customerEmail) {
    return NextResponse.json({ error: "Customer email required" }, { status: 400 });
  }

  const baseUrl = getBaseUrl();
  const link = `${baseUrl}/customer/${order.linkToken}`;

  const html = customerLinkEmail({
    orderNo: order.orderNo,
    customerName,
    link,
    lang: "zh",
  });

  await sendEmail({
    to: customerEmail,
    subject: `[IoT Config] 订单 ${order.orderNo} 配置已更新，请重新确认`,
    html,
  });

  return NextResponse.json({ success: true, sentTo: customerEmail });
}
