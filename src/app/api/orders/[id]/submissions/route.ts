import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const submissions = await prisma.customerSubmission.findMany({
    where: { orderId: id },
    include: {
      paramValues: {
        include: { parameter: true },
      },
    },
    orderBy: { version: "desc" },
  });

  return NextResponse.json(submissions);
}
