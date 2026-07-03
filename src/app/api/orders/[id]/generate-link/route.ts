import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { generateLinkToken, getBaseUrl } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || (token.role !== "FAE" && token.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const linkToken = generateLinkToken();
  const baseUrl = getBaseUrl();

  await prisma.order.update({
    where: { id },
    data: {
      linkToken,
      linkSentAt: new Date(),
      status: order.status === "FAE_CONFIGURED" || order.status === "PENDING_CONFIG" ? "LINK_SENT" : order.status,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      orderId: id,
      userId: token.id as string,
      action: "LINK_GENERATED",
      description: `Customer link generated for order ${order.orderNo}`,
    },
  });

  const customerUrl = `${baseUrl}/customer/${linkToken}`;

  return NextResponse.json({
    linkToken,
    url: customerUrl,
  });
}
