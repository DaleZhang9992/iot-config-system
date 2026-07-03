"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function CreateOrderPage() {
  const t = useTranslations("order");
  const common = useTranslations("common");
  const router = useRouter();

  const [form, setForm] = useState({
    orderNo: "",
    model: "",
    quantity: "",
    orderDate: new Date().toISOString().split("T")[0],
    customerName: "",
    customerEmail: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orderNo || !form.model || !form.quantity) {
      setError("请填写必填项");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "创建失败");
      }

      const order = await res.json();
      router.push(`/sales/orders/${order.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("create")}</h1>
        <p className="text-muted-foreground">创建新的订单并填写基本信息</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")} {common("info")}</CardTitle>
          <CardDescription>{t("create")}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("orderNo")} <span className="text-destructive">*</span></Label>
                <Input value={form.orderNo} onChange={e => setForm({...form, orderNo: e.target.value})} placeholder="例如：ORD-2024-001" required />
              </div>
              <div className="space-y-2">
                <Label>{t("model")} <span className="text-destructive">*</span></Label>
                <Input value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="例如：IoT-Module-A1" required />
              </div>
              <div className="space-y-2">
                <Label>{t("quantity")} <span className="text-destructive">*</span></Label>
                <Input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>{t("orderDate")}</Label>
                <Input type="date" value={form.orderDate} onChange={e => setForm({...form, orderDate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{t("customerName")}</Label>
                <Input value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} placeholder="客户名称（可选）" />
              </div>
              <div className="space-y-2">
                <Label>{t("customerEmail")}</Label>
                <Input type="email" value={form.customerEmail} onChange={e => setForm({...form, customerEmail: e.target.value})} placeholder="客户邮箱（可选）" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("notes")}</Label>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="备注（可选）" />
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => router.back()}>{common("cancel")}</Button>
              <Button type="submit" disabled={saving}>{saving ? common("loading") : common("save")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
