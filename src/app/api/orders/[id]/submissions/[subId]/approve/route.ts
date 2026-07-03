import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { sendEmail, approvedEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; subId: string }> }) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || (token.role !== "FAE" && token.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, subId } = await params;
  const body = await req.json().catch(() => ({}));

  const submission = await prisma.customerSubmission.findUnique({
    where: { id: subId },
    include: { order: true },
  });

  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  // Update submission
  await prisma.customerSubmission.update({
    where: { id: subId },
    data: {
      status: "APPROVED",
      reviewComment: body.comment || null,
      reviewedBy: token.id as string,
      reviewedAt: new Date(),
    },
  });

  // Update order
  await prisma.order.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      orderId: id,
      userId: token.id as string,
      action: "APPROVED",
      description: `Submission v${submission.version} approved for order ${submission.order.orderNo}`,
    },
  });

  // Notify RD
  const rdRecipients = await prisma.emailRecipient.findMany({
    where: { role: "RD_NOTIFY", isActive: true },
  });

  if (rdRecipients.length > 0) {
    const baseUrl = getBaseUrl();
    const viewUrl = `${baseUrl}/shared/${submission.order.linkToken}`;

    const html = approvedEmail({
      orderNo: submission.order.orderNo,
      model: submission.order.model,
      viewUrl,
      lang: "zh",
    });

    await sendEmail({
      to: rdRecipients.map(r => r.email),
      subject: `[IoT Config] 订单 ${submission.order.orderNo} 配置已审批通过`,
      html,
    });
  }

  return NextResponse.json({ success: true });
}
