"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  FAE_NOTIFY: "role_fae_notify",
  RD_NOTIFY: "role_rd_notify",
  SALES_NOTIFY: "role_sales_notify",
};

export default function AdminEmailConfigPage() {
  const t = useTranslations("email");
  const common = useTranslations("common");
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ role: "FAE_NOTIFY", email: "", name: "" });

  const fetchRecipients = async () => {
    const res = await fetch("/api/admin/email-recipients");
    const data = await res.json();
    setRecipients(data);
    setLoading(false);
  };

  useEffect(() => { fetchRecipients(); }, []);

  const handleAdd = async () => {
    await fetch("/api/admin/email-recipients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ role: "FAE_NOTIFY", email: "", name: "" });
    fetchRecipients();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/email-recipients?id=${id}`, { method: "DELETE" });
    fetchRecipients();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />{t("addRecipient")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{t("addRecipient")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("role")}</Label>
                <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FAE_NOTIFY">{t("role_fae_notify")}</SelectItem>
                    <SelectItem value="RD_NOTIFY">{t("role_rd_notify")}</SelectItem>
                    <SelectItem value="SALES_NOTIFY">{t("role_sales_notify")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("email")}</Label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{t("name")}</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>{common("cancel")}</Button>
              <Button onClick={handleAdd}>{common("save")}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("role")}</TableHead>
                <TableHead>{t("email")}</TableHead>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("isActive")}</TableHead>
                <TableHead>{common("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">{common("loading")}</TableCell></TableRow>
              ) : recipients.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell><Badge variant="outline">{t(ROLE_LABELS[r.role] || r.role)}</Badge></TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>{r.name || "-"}</TableCell>
                  <TableCell>{r.isActive ? <Badge variant="success">启用</Badge> : <Badge variant="secondary">停用</Badge>}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
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
