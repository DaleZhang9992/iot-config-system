"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_MAP: Record<string, string> = {
  PENDING_CONFIG: "status_pending_config",
  FAE_CONFIGURED: "status_fae_configured",
  LINK_SENT: "status_link_sent",
  CUSTOMER_SUBMITTED: "status_customer_submitted",
  UNDER_REVIEW: "status_under_review",
  APPROVED: "status_approved",
  REJECTED: "status_rejected",
};

const STATUS_VARIANT: Record<string, "secondary" | "default" | "success" | "warning" | "destructive" | "outline"> = {
  PENDING_CONFIG: "destructive",
  FAE_CONFIGURED: "outline",
  LINK_SENT: "outline",
  CUSTOMER_SUBMITTED: "warning",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

export default function FaeWorkspacePage() {
  const t = useTranslations("order");
  const faeT = useTranslations("fae");
  const common = useTranslations("common");
  const nav = useTranslations("nav");
  const router = useRouter();
  const { data: session } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchOrders = async (status?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleClaim = async (orderId: string) => {
    setClaimingId(orderId);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faeUserId: session?.user?.id }),
      });
      fetchOrders();
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{nav("faeWorkspace")}</h1>
        <p className="text-muted-foreground">管理 AT 指令配置和审核客户提交</p>
      </div>

      <Tabs defaultValue="all" onValueChange={(v) => fetchOrders(v === "all" ? undefined : v)}>
        <TabsList>
          <TabsTrigger value="all">{common("all")}</TabsTrigger>
          <TabsTrigger value="PENDING_CONFIG">{t("status_pending_config")}</TabsTrigger>
          <TabsTrigger value="CUSTOMER_SUBMITTED">{t("status_customer_submitted")}</TabsTrigger>
          <TabsTrigger value="APPROVED">{t("status_approved")}</TabsTrigger>
          <TabsTrigger value="REJECTED">{t("status_rejected")}</TabsTrigger>
        </TabsList>

        {["all", "PENDING_CONFIG", "CUSTOMER_SUBMITTED", "APPROVED", "REJECTED"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("orderNo")}</TableHead>
                      <TableHead>{t("model")}</TableHead>
                      <TableHead>{t("customerName")}</TableHead>
                      <TableHead>{t("salesPerson")}</TableHead>
                      <TableHead>{faeT("assignFae")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{common("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8">{common("loading")}</TableCell></TableRow>
                    ) : orders.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8">{common("noData")}</TableCell></TableRow>
                    ) : orders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNo}</TableCell>
                        <TableCell>{order.model}</TableCell>
                        <TableCell>{order.customerName || "-"}</TableCell>
                        <TableCell>{order.salesUser?.name}</TableCell>
                        <TableCell>
                          {order.faeUser ? (
                            <span className="text-sm">{order.faeUser.name}</span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleClaim(order.id)}
                              disabled={claimingId === order.id}
                            >
                              {claimingId === order.id ? common("loading") : faeT("claim")}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[order.status] || "secondary"}>
                            {t(STATUS_MAP[order.status] || order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {order.status === "PENDING_CONFIG" && (
                              <Button size="sm" onClick={() => router.push(`/fae/orders/${order.id}/configure`)}>
                                配置AT指令
                              </Button>
                            )}
                            {(order.status === "CUSTOMER_SUBMITTED" || order.status === "UNDER_REVIEW") && (
                              <Button size="sm" onClick={() => router.push(`/fae/orders/${order.id}/review`)}>
                                审核
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => router.push(`/fae/orders/${order.id}/detail`)}>
                              {common("detail")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
