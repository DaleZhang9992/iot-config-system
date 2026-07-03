import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAllParams } from "@/lib/validation";
import { sendEmail, notifyFaeEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json();

  const order = await prisma.order.findUnique({
    where: { linkToken: token },
    include: {
      template: {
        include: { parameters: true },
      },
    },
  });

  if (!order || !order.template) {
    return NextResponse.json({ error: "Invalid link or configuration not ready" }, { status: 404 });
  }

  // Get current version
  const latestSubmission = await prisma.customerSubmission.findFirst({
    where: { orderId: order.id },
    orderBy: { version: "desc" },
  });

  const newVersion = (latestSubmission?.version || 0) + 1;

  // Validate all parameters server-side
  const errors = validateAllParams(
    order.template.parameters,
    body.paramValues || {}
  );

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  // Create submission
  const submission = await prisma.customerSubmission.create({
    data: {
      orderId: order.id,
      version: newVersion,
      submitterName: body.submitterName || null,
      submitterEmail: body.submitterEmail || null,
      status: "PENDING",
    },
  });

  // Save parameter values
  if (body.paramValues) {
    const valuesToCreate = order.template.parameters
      .filter((p) => body.paramValues[p.paramKey] !== undefined)
      .map((p) => ({
        submissionId: submission.id,
        parameterId: p.id,
        value: body.paramValues[p.paramKey] || "",
      }));

    if (valuesToCreate.length > 0) {
      await prisma.aTCommandValue.createMany({ data: valuesToCreate });
    }
  }

  // Update order status
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "CUSTOMER_SUBMITTED" },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      orderId: order.id,
      action: "CUSTOMER_SUBMITTED",
      description: `Customer submitted configuration v${newVersion}`,
    },
  });

  // Notify FAE
  const faeRecipients = await prisma.emailRecipient.findMany({
    where: { role: "FAE_NOTIFY", isActive: true },
  });

  if (faeRecipients.length > 0) {
    const baseUrl = getBaseUrl();
    const reviewUrl = `${baseUrl}/fae/orders/${order.id}/review`;

    const html = notifyFaeEmail({
      orderNo: order.orderNo,
      customerName: order.customerName || "Customer",
      submissionUrl: reviewUrl,
      lang: "zh",
    });

    await sendEmail({
      to: faeRecipients.map(r => r.email),
      subject: `[IoT Config] 订单 ${order.orderNo} 有新的配置提交`,
      html,
    });
  }

  return NextResponse.json({
    success: true,
    submissionId: submission.id,
    version: newVersion,
  });
}
