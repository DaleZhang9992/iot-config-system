"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search } from "lucide-react";

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

const STATUS_VARIANT: Record<string, "secondary" | "default" | "success" | "warning" | "destructive" | "outline"> = {
  PENDING_CONFIG: "secondary",
  FAE_CONFIGURED: "outline",
  LINK_SENT: "outline",
  CUSTOMER_SUBMITTED: "warning",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  COMPLETED: "success",
};

export default function SalesOrdersPage() {
  const t = useTranslations("order");
  const common = useTranslations("common");
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("create")}</p>
        </div>
        <Button onClick={() => router.push("/sales/orders/new")}>
          <Plus className="h-4 w-4 mr-2" />
          {t("create")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={common("search")}
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchOrders()}
              />
            </div>
            <Button variant="outline" onClick={fetchOrders}>{common("search")}</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("orderNo")}</TableHead>
                <TableHead>{t("model")}</TableHead>
                <TableHead>{t("quantity")}</TableHead>
                <TableHead>{t("orderDate")}</TableHead>
                <TableHead>{t("customerName")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{common("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">{common("loading")}</TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">{common("noData")}</TableCell></TableRow>
              ) : (
                orders.map((order: any) => (
                  <TableRow key={order.id} className="cursor-pointer" onClick={() => router.push(`/sales/orders/${order.id}`)}>
                    <TableCell className="font-medium">{order.orderNo}</TableCell>
                    <TableCell>{order.model}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell>{order.customerName || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[order.status] || "secondary"}>
                        {t(STATUS_MAP[order.status] || order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">{common("edit")}</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
