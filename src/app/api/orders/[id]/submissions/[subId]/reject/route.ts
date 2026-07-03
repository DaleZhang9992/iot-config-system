import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { sendEmail, rejectedEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; subId: string }> }) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || (token.role !== "FAE" && token.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, subId } = await params;
  const body = await req.json();

  if (!body.comment || !body.comment.trim()) {
    return NextResponse.json({ error: "Review comment is required for rejection" }, { status: 400 });
  }

  const submission = await prisma.customerSubmission.findUnique({
    where: { id: subId },
    include: {
      order: true,
      paramValues: {
        include: { parameter: true },
      },
    },
  });

  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  // Update submission status
  await prisma.customerSubmission.update({
    where: { id: subId },
    data: {
      status: "REJECTED",
      reviewComment: body.comment,
      reviewDetails: body.reviewDetails || null,
      reviewedBy: token.id as string,
      reviewedAt: new Date(),
    },
  });

  // Update order status
  await prisma.order.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  // Create new submission record with version+1 for next attempt
  const newSubmission = await prisma.customerSubmission.create({
    data: {
      orderId: id,
      version: submission.version + 1,
      submitterName: submission.submitterName,
      submitterEmail: submission.submitterEmail,
      status: "PENDING",
      reviewComment: null,
      reviewDetails: body.comment, // Store rejection reason for frontend
    },
  });

  // Copy previous values to new submission (preserving data)
  for (const val of submission.paramValues) {
    await prisma.aTCommandValue.create({
      data: {
        submissionId: newSubmission.id,
        parameterId: val.parameterId,
        value: val.value,
      },
    });
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      orderId: id,
      userId: token.id as string,
      action: "REJECTED",
      description: `Submission v${submission.version} rejected: ${body.comment}`,
    },
  });

  // Send rejection email to customer with link
  if (submission.order.linkToken && submission.order.customerEmail) {
    const baseUrl = getBaseUrl();
    const link = `${baseUrl}/customer/${submission.order.linkToken}`;

    const html = rejectedEmail({
      orderNo: submission.order.orderNo,
      customerName: submission.order.customerName || "Customer",
      comment: body.comment,
      link,
      lang: "zh",
    });

    await sendEmail({
      to: submission.order.customerEmail,
      subject: `[IoT Config] 订单 ${submission.order.orderNo} 配置需要修改`,
      html,
    });
  }

  return NextResponse.json({ success: true, newSubmissionId: newSubmission.id });
}
