"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Clock, CheckCircle, XCircle } from "lucide-react";

export default function AdminDashboard() {
  const t = useTranslations("admin");
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/orders?status=CUSTOMER_SUBMITTED").then(r => r.json()),
      fetch("/api/orders?status=APPROVED").then(r => r.json()),
      fetch("/api/orders?status=REJECTED").then(r => r.json()),
    ]).then(([total, pending, approved, rejected]) => {
      setStats({
        total: total.total || 0,
        pending: pending.total || 0,
        approved: approved.total || 0,
        rejected: rejected.total || 0,
      });
    });
  }, []);

  const cards = [
    { title: t("totalOrders"), value: stats.total, icon: ShoppingCart, color: "text-blue-600" },
    { title: t("pendingReview"), value: stats.pending, icon: Clock, color: "text-yellow-600" },
    { title: t("approved"), value: stats.approved, icon: CheckCircle, color: "text-green-600" },
    { title: t("rejected"), value: stats.rejected, icon: XCircle, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard")}</h1>

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-3xl font-bold mt-1">{card.value}</p>
                </div>
                <card.icon className={`h-8 w-8 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
