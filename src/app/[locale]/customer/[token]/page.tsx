"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import LanguageSwitcher from "@/components/layout/language-switcher";
import { validateAllParams } from "@/lib/validation";

export default function CustomerFormPage() {
  const t = useTranslations("customer");
  const orderT = useTranslations("order");
  const common = useTranslations("common");
  const params = useParams();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [lastSubmission, setLastSubmission] = useState<any>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const rejectionComment = lastSubmission?.reviewDetails;

  useEffect(() => {
    fetch(`/api/public/orders/${params.token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Invalid link");
        }
        return res.json();
      })
      .then((data) => {
        setOrder(data.order);
        setTemplate(data.template);

        // If there's a pending submission (rejected & resubmit), pre-fill
        if (data.lastSubmission) {
          const savedVals: Record<string, string> = {};
          for (const pv of data.lastSubmission.paramValues) {
            savedVals[pv.parameterId] = pv.value;
          }
          // Use paramKey as key instead of parameterId
          setValues(savedVals);
          setLastSubmission(data.lastSubmission);
          setSubmitterName(data.lastSubmission.submitterName || "");
          setSubmitterEmail(data.lastSubmission.submitterEmail || "");
        }

        // Set default values for params not yet filled
        const defaultVals: Record<string, string> = {};
        if (data.template?.parameters) {
          for (const p of data.template.parameters) {
            const existingVal = data.lastSubmission?.paramValues?.find(
              (pv: any) => pv.parameterId === p.id
            );
            if (existingVal) {
              defaultVals[p.paramKey] = existingVal.value;
            } else if (p.defaultValue) {
              defaultVals[p.paramKey] = p.defaultValue;
            } else {
              defaultVals[p.paramKey] = "";
            }
          }
        }
        setValues(defaultVals);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.token]);

  const handleChange = (paramKey: string, value: string) => {
    setValues({ ...values, [paramKey]: value });
    // Clear error for this field
    if (errors[paramKey]) {
      const newErrors = { ...errors };
      delete newErrors[paramKey];
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!submitterName.trim()) {
      setErrors({ submitterName: "请填写提交人姓名" });
      return;
    }

    // Client-side validation
    if (template?.parameters) {
      const validationErrors = validateAllParams(template.parameters, values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    setSubmitting(true);
    setErrors({});
    setServerErrors({});

    try {
      const res = await fetch(`/api/public/orders/${params.token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submitterName,
          submitterEmail,
          paramValues: values,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setServerErrors(data.errors);
        } else {
          throw new Error(data.error || "提交失败");
        }
        return;
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrors({ _form: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground">{common("loading")}</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" /> 链接无效
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );

  if (!template) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" /> 配置尚未就绪
          </CardTitle>
          <CardDescription>请等待 FAE 完成配置后再访问此链接</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <CardHeader>
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">{t("submitSuccess")}</CardTitle>
          <CardDescription>{t("submitSuccessDesc")}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );

  // Group parameters
  const groups: Record<string, any[]> = {};
  if (template?.parameters) {
    for (const p of template.parameters) {
      const g = p.groupName || "基本参数";
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">IoT 生产配置确认</h1>
            <p className="text-sm opacity-80">Production Configuration Confirmation</p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Rejection Notice */}
        {rejectionComment && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">{t("rejectedNotice")}</p>
                <p className="text-sm mt-1">{t("reviewComment")} {rejectionComment}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Info (Read Only) */}
        {order && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("orderInfo")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">{orderT("orderNo")}:</span> <span className="font-medium">{order.orderNo}</span></div>
                <div><span className="text-muted-foreground">{orderT("model")}:</span> <span className="font-medium">{order.model}</span></div>
                <div><span className="text-muted-foreground">{orderT("quantity")}:</span> <span className="font-medium">{order.quantity}</span></div>
                <div><span className="text-muted-foreground">{orderT("orderDate")}:</span> <span className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</span></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuration Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("configForm")}</CardTitle>
              <CardDescription>
                固件版本: {template.firmwareVersion}
                {template.isCustomVersion && " (自定义)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Submitter Info */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div className="space-y-2">
                  <Label>{t("submitterName")} <span className="text-destructive">*</span></Label>
                  <Input value={submitterName} onChange={e => setSubmitterName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>{t("submitterEmail")}</Label>
                  <Input type="email" value={submitterEmail} onChange={e => setSubmitterEmail(e.target.value)} />
                </div>
              </div>

              {/* Form errors */}
              {errors._form && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{errors._form}</div>
              )}

              {/* Parameters by group */}
              {Object.entries(groups).map(([groupName, params]) => (
                <div key={groupName}>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3">{groupName}</h3>
                  <div className="space-y-4">
                    {params.map((param: any) => {
                      const valKey = param.paramKey;
                      const fieldError = errors[valKey] || serverErrors[valKey];
                      const isRejected = lastSubmission?.status === "REJECTED";

                      return (
                        <div key={param.id} className={`p-3 rounded-lg border ${isRejected ? "border-red-200 bg-red-50 dark:bg-red-950/20" : ""}`}>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-sm font-medium">
                              {param.displayName}
                              {param.isRequired && <span className="text-destructive ml-1">*</span>}
                            </Label>
                            {param.unit && <span className="text-xs text-muted-foreground">({param.unit})</span>}
                          </div>
                          {param.description && (
                            <p className="text-xs text-muted-foreground mb-2">{param.description}</p>
                          )}
                          <ParamInput
                            param={param}
                            value={values[valKey] || ""}
                            onChange={(v: string) => handleChange(valKey, v)}
                            error={fieldError}
                          />
                          {fieldError && (
                            <p className="text-xs text-destructive mt-1">{fieldError}</p>
                          )}
                          {isRejected && (
                            <p className="text-xs text-red-500 mt-1 font-medium">上次提交值需要修改</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6 pb-8">
            <Button type="submit" size="lg" disabled={submitting} className="min-w-[200px]">
              {submitting ? common("loading") : (lastSubmission?.status === "REJECTED" ? t("resubmit") : t("submitConfig"))}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Parameter Input Component
function ParamInput({ param, value, onChange, error }: {
  param: any;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const inputClass = `w-full ${error ? "border-destructive" : ""}`;

  if (param.dataType === "BOOLEAN") {
    return (
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input type="radio" name={param.paramKey} checked={value === "true"} onChange={() => onChange("true")} />
          <span>True</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name={param.paramKey} checked={value === "false"} onChange={() => onChange("false")} />
          <span>False</span>
        </label>
      </div>
    );
  }

  if (param.dataType === "ENUM" && param.enumValues) {
    const options = JSON.parse(param.enumValues);
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ${inputClass}`}
      >
        <option value="">-- 请选择 --</option>
        {options.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (param.dataType === "NUMBER") {
    return (
      <Input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        min={param.minValue ?? undefined}
        max={param.maxValue ?? undefined}
        step={param.step ?? undefined}
        placeholder={param.regexHint || `范围: ${param.minValue ?? "..."} ~ ${param.maxValue ?? "..."}`}
        className={inputClass}
      />
    );
  }

  return (
    <Input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={param.regexHint || `请输入${param.displayName}`}
      className={inputClass}
    />
  );
}
