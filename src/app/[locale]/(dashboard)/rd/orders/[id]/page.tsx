"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2 } from "lucide-react";

export default function RdOrderDetailPage() {
  const t = useTranslations("rd");
  const orderT = useTranslations("order");
  const common = useTranslations("common");
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <div className="p-8">{common("loading")}</div>;
  if (!order) return <div className="p-8">Not found</div>;

  // Get approved submission
  const approvedSub = order.submissions?.find((s: any) => s.status === "APPROVED");
  const paramValueMap: Record<string, string> = {};
  if (approvedSub?.paramValues) {
    for (const pv of approvedSub.paramValues) {
      paramValueMap[pv.parameterId] = pv.value;
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-6 w-6 text-green-600" />
        <h1 className="text-2xl font-bold">{t("configDetail")}</h1>
        <Badge variant="success" className="ml-2">已审批通过</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("orderInfo")}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">{orderT("orderNo")}:</span> {order.orderNo}</div>
          <div><span className="text-muted-foreground">{orderT("model")}:</span> {order.model}</div>
          <div><span className="text-muted-foreground">{orderT("quantity")}:</span> {order.quantity}</div>
          <div><span className="text-muted-foreground">{orderT("customerName")}:</span> {order.customerName || "-"}</div>
        </CardContent>
      </Card>

      {order.template?.parameters && (
        <Card>
          <CardHeader>
            <CardTitle>AT 指令配置</CardTitle>
            <p className="text-sm text-muted-foreground">固件版本: {order.template.firmwareVersion}</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>参数</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>配置值</TableHead>
                  <TableHead>默认值</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.template.parameters.map((param: any) => (
                  <TableRow key={param.id}>
                    <TableCell className="font-mono text-xs">{param.paramKey}</TableCell>
                    <TableCell>{param.displayName}</TableCell>
                    <TableCell className="font-medium">
                      {paramValueMap[param.id] || param.defaultValue || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{param.defaultValue || "-"}</TableCell>
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
