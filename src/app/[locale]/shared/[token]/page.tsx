"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2 } from "lucide-react";
import LanguageSwitcher from "@/components/layout/language-switcher";

export default function SharedViewPage() {
  const t = useTranslations("shared");
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/orders/${params.token}`)
      .then(r => r.json())
      .then(data => {
        setOrder(data.order);
        const template = data.template;
        const lastSub = data.lastSubmission;

        const approvedSub = lastSub?.status === "APPROVED" ? lastSub : null;

        setSubmission({ template, approvedSub, lastSub });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center">Invalid link</div>;

  const approvedSub = submission?.lastSub?.status === "APPROVED" ? submission.lastSub : null;
  const paramValueMap: Record<string, string> = {};
  if (approvedSub?.paramValues) {
    for (const pv of approvedSub.paramValues) {
      paramValueMap[pv.parameterId] = pv.value;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-green-600 text-white py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6" />
            <h1 className="text-xl font-bold">{t("title")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader><CardTitle>{t("orderInfo")}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">{t("orderNo")}:</span> <span className="font-medium">{order.orderNo}</span></div>
            <div><span className="text-muted-foreground">{t("productModel")}:</span> <span className="font-medium">{order.model}</span></div>
            <div><span className="text-muted-foreground">{t("quantity")}:</span> <span className="font-medium">{order.quantity}</span></div>
            <div><span className="text-muted-foreground">{t("orderDate")}:</span> <span className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</span></div>
            <div><span className="text-muted-foreground">{t("status")}:</span> <Badge variant="success">{t("statusApproved")}</Badge></div>
          </CardContent>
        </Card>

        {submission?.template?.parameters && (
          <Card>
            <CardHeader>
              <CardTitle>{t("configDetail")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("version")}: {submission.template.firmwareVersion}</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("parameter")}</TableHead>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("configValue")}</TableHead>
                    <TableHead>{t("defaultValue")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submission.template.parameters.map((param: any) => {
                    const customerValue = paramValueMap[param.id] || param.defaultValue || "";
                    return (
                      <TableRow key={param.id}>
                        <TableCell className="font-mono text-xs">{param.paramKey}</TableCell>
                        <TableCell>{param.displayName}</TableCell>
                        <TableCell className="font-medium">{customerValue}</TableCell>
                        <TableCell className="text-muted-foreground">{param.defaultValue || "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
