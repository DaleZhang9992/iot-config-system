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
import { Plus } from "lucide-react";

export default function AdminUsersPage() {
  const t = useTranslations("admin");
  const common = useTranslations("common");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "123456", role: "SALES" });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ name: "", email: "", password: "123456", role: "SALES" });
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("users")}</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />{t("createUser")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{t("createUser")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("userName")}</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{t("userEmail")}</Label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{t("userRole")}</Label>
                <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALES">销售</SelectItem>
                    <SelectItem value="FAE">FAE</SelectItem>
                    <SelectItem value="RD">研发</SelectItem>
                    <SelectItem value="ADMIN">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>密码</Label>
                <Input value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>{common("cancel")}</Button>
              <Button onClick={handleCreate} disabled={saving}>{common("save")}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("userName")}</TableHead>
                <TableHead>{t("userEmail")}</TableHead>
                <TableHead>{t("userRole")}</TableHead>
                <TableHead>{t("userActive")}</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">{common("loading")}</TableCell></TableRow>
              ) : users.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                  <TableCell>{u.isActive ? <Badge variant="success">启用</Badge> : <Badge variant="destructive">停用</Badge>}</TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
