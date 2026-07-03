"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Copy, Send, Check } from "lucide-react";

const STATUS_MAP: Record<string, string> = {
  PENDING_CONFIG: "status_pending_config",
  FAE_CONFIGURED: "status_fae_configured",
  LINK_SENT: "status_link_sent",
  CUSTOMER_SUBMITTED: "status_customer_submitted",
  APPROVED: "status_approved",
  REJECTED: "status_rejected",
};

export default function FaeOrderDetailPage() {
  const t = useTranslations("order");
  const common = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [sendEmail, setSendEmail] = useState("");
  const [sendName, setSendName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`).then(r => r.json()).then(data => {
      setOrder(data);
      if (data.linkToken) {
        setLinkUrl(`${window.location.origin}/customer/${data.linkToken}`);
        setLinkGenerated(true);
      }
      setSendEmail(data.customerEmail || "");
      setSendName(data.customerName || "");
      setLoading(false);
    });
  }, [params.id]);

  const handleGenerateLink = async () => {
    const res = await fetch(`/api/orders/${params.id}/generate-link`, { method: "POST" });
    const data = await res.json();
    if (data.url) {
      setLinkUrl(data.url);
      setLinkGenerated(true);
    }
  };

  const handleSendLink = async () => {
    if (!sendEmail) return;
    setSending(true);
    const res = await fetch(`/api/orders/${params.id}/send-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerEmail: sendEmail, customerName: sendName }),
    });
    if (res.ok) setSent(true);
    setSending(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(linkUrl);
  };

  if (loading) return <div className="p-8">{common("loading")}</div>;
  if (!order) return <div className="p-8">Not found</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{order.orderNo}</h1>
          <p className="text-muted-foreground">{order.model} - {order.quantity}台</p>
        </div>
        <Badge variant="success">{t(STATUS_MAP[order.status] || order.status)}</Badge>
      </div>

      {/* Link Management */}
      <Card>
        <CardHeader><CardTitle>客户链接管理</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!linkGenerated ? (
            <Button onClick={handleGenerateLink}>
              生成客户链接
            </Button>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Input value={linkUrl} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">客户邮箱</label>
                  <Input type="email" value={sendEmail} onChange={e => setSendEmail(e.target.value)} placeholder="customer@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">客户名称</label>
                  <Input value={sendName} onChange={e => setSendName(e.target.value)} placeholder="客户名称" />
                </div>
              </div>
              <Button onClick={handleSendLink} disabled={sending || !sendEmail || sent}>
                {sent ? <><Check className="h-4 w-4 mr-1" />已发送</> : <><Send className="h-4 w-4 mr-1" />{sending ? common("loading") : "发送邮件给客户"}</>}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Template Info */}
      {order.template && (
        <Card>
          <CardHeader><CardTitle>AT 指令配置</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4 text-sm">
              <span className="text-muted-foreground">固件版本: </span>
              <span className="font-medium">{order.template.firmwareVersion}</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>参数标识</TableHead>
                  <TableHead>显示名称</TableHead>
                  <TableHead>数据类型</TableHead>
                  <TableHead>默认值</TableHead>
                  <TableHead>范围</TableHead>
                  <TableHead>必填</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.template.parameters?.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.paramKey}</TableCell>
                    <TableCell>{p.displayName}</TableCell>
                    <TableCell>{p.dataType}</TableCell>
                    <TableCell>{p.defaultValue || "-"}</TableCell>
                    <TableCell className="text-xs">
                      {p.minValue !== null && `[${p.minValue}`}
                      {p.maxValue !== null && ` ~ ${p.maxValue}]`}
                      {p.enumValues && `可选: ${p.enumValues}`}
                      {p.regexPattern && `正则: ${p.regexPattern}`}
                      {!p.minValue && !p.maxValue && !p.enumValues && !p.regexPattern && "-"}
                    </TableCell>
                    <TableCell>{p.isRequired ? "是" : "否"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Audit Logs */}
      {order.auditLogs?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{common("history")}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>时间</TableHead><TableHead>操作</TableHead><TableHead>描述</TableHead><TableHead>操作人</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {order.auditLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{new Date(log.createdAt).toLocaleString()}</TableCell>
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
