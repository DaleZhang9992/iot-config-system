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
  const faeT = useTranslations("fae");
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
        <CardHeader><CardTitle>{faeT("linkManagement")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!linkGenerated ? (
            <Button onClick={handleGenerateLink}>
              {faeT("generateLink")}
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
                  <label className="text-sm font-medium">{faeT("customerEmail")}</label>
                  <Input type="email" value={sendEmail} onChange={e => setSendEmail(e.target.value)} placeholder="customer@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{faeT("customerName")}</label>
                  <Input value={sendName} onChange={e => setSendName(e.target.value)} placeholder={faeT("customerName")} />
                </div>
              </div>
              <Button onClick={handleSendLink} disabled={sending || !sendEmail || sent}>
                {sent ? <><Check className="h-4 w-4 mr-1" />{faeT("sent")}</> : <><Send className="h-4 w-4 mr-1" />{sending ? common("loading") : faeT("sendEmailToCustomer")}</>}
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
              <span className="text-muted-foreground">{faeT("firmwareVersion")}: </span>
              <span className="font-medium">{order.template.firmwareVersion}</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{faeT("paramKey")}</TableHead>
                  <TableHead>{faeT("displayName")}</TableHead>
                  <TableHead>{faeT("dataType")}</TableHead>
                  <TableHead>{faeT("defaultValue")}</TableHead>
                  <TableHead>{faeT("range")}</TableHead>
                  <TableHead>{faeT("isRequired")}</TableHead>
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
                      {p.enumValues && `${faeT("enumOptions")}: ${p.enumValues}`}
                      {p.regexPattern && `${faeT("regex")}: ${p.regexPattern}`}
                      {!p.minValue && !p.maxValue && !p.enumValues && !p.regexPattern && "-"}
                    </TableCell>
                    <TableCell>{p.isRequired ? faeT("yes") : faeT("no")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Shipping Info */}
      <Card>
        <CardHeader><CardTitle>{faeT("shippingConfig")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">{faeT("targetFirmware")}: </span>
              <span className="font-medium">{order.firmwareVersion || faeT("notSpecified")}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{faeT("shipWithSimCard")}: </span>
              <span className="font-medium">{order.shipWithSimCard ? faeT("yes") : faeT("no")}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{faeT("shipPoweredOn")}: </span>
              <span className="font-medium">{order.shipPoweredOn ? faeT("yes") : faeT("no")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      {order.auditLogs?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{common("history")}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>{faeT("time")}</TableHead><TableHead>{faeT("actionLabel")}</TableHead><TableHead>{faeT("descriptionLabel")}</TableHead><TableHead>{faeT("operatorLabel")}</TableHead></TableRow>
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
