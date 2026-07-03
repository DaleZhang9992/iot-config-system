"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function RdOrdersPage() {
  const t = useTranslations("rd");
  const orderT = useTranslations("order");
  const common = useTranslations("common");
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders?status=APPROVED")
      .then(r => r.json())
      .then(data => { setOrders(data.orders || []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("approvedOrders")}</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{orderT("orderNo")}</TableHead>
                <TableHead>{orderT("model")}</TableHead>
                <TableHead>{orderT("quantity")}</TableHead>
                <TableHead>{orderT("customerName")}</TableHead>
                <TableHead>{orderT("status")}</TableHead>
                <TableHead>{common("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">{common("loading")}</TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">{common("noData")}</TableCell></TableRow>
              ) : orders.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNo}</TableCell>
                  <TableCell>{order.model}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{order.customerName || "-"}</TableCell>
                  <TableCell><Badge variant="success">已通过</Badge></TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => router.push(`/rd/orders/${order.id}`)}>
                      {t("viewConfig")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
