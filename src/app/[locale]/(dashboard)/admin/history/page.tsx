"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function AdminAuditLogPage() {
  const common = useTranslations("common");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchAction, setSearchAction] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchAction) params.set("action", searchAction);
    const res = await fetch(`/api/admin/audit-logs?${params}`);
    const data = await res.json();
    setLogs(data.logs || []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">审计日志</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="按操作类型筛选 (如: APPROVED, REJECTED)"
                className="pl-10"
                value={searchAction}
                onChange={e => setSearchAction(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchLogs()}
              />
            </div>
            <Button variant="outline" onClick={fetchLogs}>{common("search")}</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>操作</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>操作人</TableHead>
                <TableHead>关联订单</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">{common("loading")}</TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">{common("noData")}</TableCell></TableRow>
              ) : logs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</TableCell>
                  <TableCell><span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{log.action}</span></TableCell>
                  <TableCell className="max-w-md truncate">{log.description}</TableCell>
                  <TableCell>{log.user?.name || "-"}</TableCell>
                  <TableCell>{log.order?.orderNo || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
