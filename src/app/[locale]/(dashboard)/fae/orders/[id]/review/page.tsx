"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

export default function ReviewPage() {
  const t = useTranslations("review");
  const common = useTranslations("common");
  const params = useParams();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [pendingSubmission, setPendingSubmission] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [orderRes, subRes] = await Promise.all([
        fetch(`/api/orders/${params.id}`),
        fetch(`/api/orders/${params.id}/submissions`),
      ]);
      const orderData = await orderRes.json();
      const subData = await subRes.json();
      setOrder(orderData);
      setSubmissions(subData);
      // Find the latest PENDING submission
      const pending = subData.find((s: any) => s.status === "PENDING");
      setPendingSubmission(pending || subData[0]);
      setLoading(false);
    };
    loadData();
  }, [params.id]);

  const handleApprove = async () => {
    if (!pendingSubmission) return;
    setActionLoading(true);
    const res = await fetch(`/api/orders/${params.id}/submissions/${pendingSubmission.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    });
    if (res.ok) {
      router.push("/fae/orders");
      router.refresh();
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!pendingSubmission || !comment.trim()) return;
    setActionLoading(true);
    const res = await fetch(`/api/orders/${params.id}/submissions/${pendingSubmission.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment, reviewDetails: comment }),
    });
    if (res.ok) {
      router.push("/fae/orders");
      router.refresh();
    }
    setActionLoading(false);
  };

  if (loading) return <div className="p-8">{common("loading")}</div>;
  if (!pendingSubmission && submissions.length === 0) return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">{t("noPending")}</p>
      <Button variant="outline" className="mt-4" onClick={() => router.back()}>{common("back")}</Button>
    </div>
  );

  const paramValueMap: Record<string, string> = {};
  if (pendingSubmission?.paramValues) {
    for (const pv of pendingSubmission.paramValues) {
      paramValueMap[pv.parameterId] = pv.value;
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{order?.orderNo} - v{pendingSubmission?.version}</p>
        </div>
        <Badge variant={pendingSubmission?.status === "PENDING" ? "warning" : pendingSubmission?.status === "APPROVED" ? "success" : "destructive"}>
          {pendingSubmission?.status}
        </Badge>
      </div>

      {order?.template?.parameters && (
        <Card>
          <CardHeader>
            <CardTitle>{common("detail")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>参数</TableHead>
                  <TableHead>显示名称</TableHead>
                  <TableHead>数据类型</TableHead>
                  <TableHead>必填</TableHead>
                  <TableHead>客户填写值</TableHead>
                  <TableHead>默认值</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.template.parameters.map((param: any) => {
                  const customerValue = paramValueMap[param.id] ?? "";
                  const defaultValue = param.defaultValue ?? "";
                  const isChanged = customerValue !== defaultValue && customerValue !== "";
                  return (
                    <TableRow key={param.id} className={isChanged ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}>
                      <TableCell className="font-mono text-xs">{param.paramKey}</TableCell>
                      <TableCell>{param.displayName}</TableCell>
                      <TableCell>{param.dataType}</TableCell>
                      <TableCell>{param.isRequired ? "是" : "否"}</TableCell>
                      <TableCell className={customerValue ? "font-medium" : "text-muted-foreground"}>
                        {customerValue || "(空)"}
                        {isChanged && <Badge variant="warning" className="ml-2">已修改</Badge>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{defaultValue || "-"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Review Action */}
      {pendingSubmission?.status === "PENDING" && (
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("comment")}</Label>
              <Input
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={t("commentPlaceholder")}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionLoading || !comment.trim()}
              >
                <XCircle className="h-4 w-4 mr-1" />{t("reject")}
              </Button>
              <Button
                variant="default"
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />{t("approve")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission History */}
      {submissions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{t("submissionHistory")}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("version")}</TableHead>
                  <TableHead>{t("submittedAt")}</TableHead>
                  <TableHead>{common("status")}</TableHead>
                  <TableHead>{t("comment")}</TableHead>
                  <TableHead>{t("reviewedAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>v{s.version}</TableCell>
                    <TableCell>{new Date(s.submittedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "APPROVED" ? "success" : s.status === "REJECTED" ? "destructive" : "warning"}>
                        {s.status === "APPROVED" ? t("approved") : s.status === "REJECTED" ? t("rejected") : "待审核"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{s.reviewComment || "-"}</TableCell>
                    <TableCell>{s.reviewedAt ? new Date(s.reviewedAt).toLocaleString() : "-"}</TableCell>
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
