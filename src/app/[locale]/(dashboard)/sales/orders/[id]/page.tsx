"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

const STATUS_MAP: Record<string, string> = {
  PENDING_CONFIG: "status_pending_config",
  FAE_CONFIGURED: "status_fae_configured",
  LINK_SENT: "status_link_sent",
  CUSTOMER_SUBMITTED: "status_customer_submitted",
  UNDER_REVIEW: "status_under_review",
  APPROVED: "status_approved",
  REJECTED: "status_rejected",
  COMPLETED: "status_completed",
};

export default function SalesOrderDetailPage() {
  const t = useTranslations("order");
  const common = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then(r => r.json())
      .then(data => { setOrder(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="flex items-center justify-center h-64">{common("loading")}</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("detail")}: {order.orderNo}</h1>
          <p className="text-muted-foreground">{t("model")}: {order.model}</p>
        </div>
        <Badge variant="success" className="ml-auto">{t(STATUS_MAP[order.status] || order.status)}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">{t("orderNo")}</CardTitle></CardHeader><CardContent className="text-lg font-bold">{order.orderNo}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">{t("model")}</CardTitle></CardHeader><CardContent className="text-lg font-bold">{order.model}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">{t("quantity")}</CardTitle></CardHeader><CardContent className="text-lg font-bold">{order.quantity}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("order")} {common("info")}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">{t("orderDate")}:</span> {new Date(order.orderDate).toLocaleDateString()}</div>
          <div><span className="text-muted-foreground">{t("customerName")}:</span> {order.customerName || "-"}</div>
          <div><span className="text-muted-foreground">{t("customerEmail")}:</span> {order.customerEmail || "-"}</div>
          <div><span className="text-muted-foreground">{t("salesPerson")}:</span> {order.salesUser?.name}</div>
          <div><span className="text-muted-foreground">{t("createdAt")}:</span> {new Date(order.createdAt).toLocaleString()}</div>
          <div><span className="text-muted-foreground">{t("status")}:</span> {t(STATUS_MAP[order.status] || order.status)}</div>
        </CardContent>
      </Card>

      {order.auditLogs && order.auditLogs.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{common("history")}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>操作</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>操作人</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.auditLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell>{log.user?.name || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
