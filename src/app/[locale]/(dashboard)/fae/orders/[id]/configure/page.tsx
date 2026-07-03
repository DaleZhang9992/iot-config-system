"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Copy, Plus, Trash2, ArrowLeft, Send, Check, FileDown, Loader2 } from "lucide-react";

interface ParamDef {
  id?: string;
  paramKey: string;
  displayName: string;
  description: string;
  dataType: string;
  isRequired: boolean;
  defaultValue: string;
  unit: string;
  minValue: string;
  maxValue: string;
  step: string;
  enumValues: string;
  regexPattern: string;
  regexHint: string;
  sortOrder: number;
  groupName: string;
}

const DEFAULT_PARAM: ParamDef = {
  paramKey: "", displayName: "", description: "", dataType: "STRING",
  isRequired: false, defaultValue: "", unit: "", minValue: "", maxValue: "",
  step: "", enumValues: "", regexPattern: "", regexHint: "",
  sortOrder: 0, groupName: "",
};

const DATA_TYPES = ["STRING", "NUMBER", "ENUM", "BOOLEAN", "IP_ADDRESS", "HEX_STRING"];

export default function ConfigureAtCommandsPage() {
  const t = useTranslations("atCommand");
  const faeT = useTranslations("fae");
  const common = useTranslations("common");
  const params = useParams();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [templateNotes, setTemplateNotes] = useState("");
  const [parameters, setParameters] = useState<ParamDef[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [presets, setPresets] = useState<any[]>([]);
  const [loadingPreset, setLoadingPreset] = useState(false);
  const [presetLoaded, setPresetLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then(r => r.json())
      .then(async (data) => {
        setOrder(data);
        // Try to load existing template
        const tplRes = await fetch(`/api/orders/${params.id}/template`);
        if (tplRes.ok) {
          const tpl = await tplRes.json();
          if (tpl) {
            setTemplateNotes(tpl.notes || "");
            if (tpl.parameters) {
              setParameters(tpl.parameters.map((p: any) => ({
                ...p,
                minValue: p.minValue?.toString() || "",
                maxValue: p.maxValue?.toString() || "",
                step: p.step?.toString() || "",
              })));
            }
          }
        }
        setLoading(false);
      });
  }, [params.id]);

  const handleLoadPreset = async () => {
    if (!order?.model) return;
    setLoadingPreset(true);
    setPresetLoaded(false);
    try {
      const res = await fetch(`/api/presets?model=${encodeURIComponent(order.model)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        // Use the first (default) preset
        const preset = data[0];
        if (preset.parameters && preset.parameters.length > 0) {
          setParameters(preset.parameters.map((p: any, i: number) => ({
            paramKey: p.paramKey || "",
            displayName: p.displayName || "",
            description: p.description || "",
            dataType: p.dataType || "STRING",
            isRequired: p.isRequired || false,
            defaultValue: p.defaultValue || "",
            unit: p.unit || "",
            minValue: p.minValue?.toString() || "",
            maxValue: p.maxValue?.toString() || "",
            step: p.step?.toString() || "",
            enumValues: p.enumValues || "",
            regexPattern: p.regexPattern || "",
            regexHint: p.regexHint || "",
            sortOrder: p.sortOrder ?? i,
            groupName: p.groupName || "",
          })));
          setPresetLoaded(true);
        }
      }
    } catch (err) {
      console.error("Failed to load preset:", err);
    } finally {
      setLoadingPreset(false);
    }
  };

  const addParam = () => {
    setParameters([...parameters, { ...DEFAULT_PARAM, sortOrder: parameters.length }]);
  };

  const deleteParam = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const updateParam = (index: number, field: keyof ParamDef, value: any) => {
    const updated = [...parameters];
    (updated[index] as any)[field] = value;
    setParameters(updated);
  };

  const handleSave = async (sendLinkAfter?: boolean) => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/orders/${params.id}/template`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: templateNotes,
          parameters: parameters.map((p, i) => ({
            ...p,
            sortOrder: i,
            minValue: p.minValue ? parseFloat(p.minValue) : null,
            maxValue: p.maxValue ? parseFloat(p.maxValue) : null,
            step: p.step ? parseFloat(p.step) : null,
          })),
        }),
      });

      if (!res.ok) throw new Error("保存失败");
      setSaved(true);

      if (sendLinkAfter) {
        const linkRes = await fetch(`/api/orders/${params.id}/generate-link`, {
          method: "POST",
        });
        if (linkRes.ok) {
          router.push(`/fae/orders/${params.id}/detail`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">{common("loading")}</div>;
  if (!order) return <div className="p-8">Order not found</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("configure")}</h1>
          <p className="text-muted-foreground">{order.orderNo} - {order.model}</p>
        </div>
      </div>

      {/* AT Parameters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>{t("title")} ({parameters.length})</CardTitle>
            {order?.model && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {order.model}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleLoadPreset} variant="outline" size="sm" disabled={loadingPreset || !order?.model}>
              {loadingPreset ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4 mr-1" />}
              {loadingPreset ? "加载中..." : "加载型号预设"}
            </Button>
            <Button onClick={addParam} size="sm">
              <Plus className="h-4 w-4 mr-1" />{t("addParam")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {presetLoaded && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm px-3 py-2 rounded-md">
              已加载型号预设
            </div>
          )}
          {parameters.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {faeT("noParams")}
            </div>
          )}

          {parameters.map((param, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">参数 #{index + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => deleteParam(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t("paramKey")}</Label>
                  <Input size={1} value={param.paramKey} onChange={e => updateParam(index, "paramKey", e.target.value)} placeholder="如: AT+GSN" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("displayName")}</Label>
                  <Input value={param.displayName} onChange={e => updateParam(index, "displayName", e.target.value)} placeholder="如: 查询IMEI" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("dataType")}</Label>
                  <Select value={param.dataType} onValueChange={v => updateParam(index, "dataType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DATA_TYPES.map(dt => (
                        <SelectItem key={dt} value={dt}>{t(`dataType_${dt.toLowerCase()}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t("description")}</Label>
                  <Input value={param.description} onChange={e => updateParam(index, "description", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("groupName")}</Label>
                  <Input value={param.groupName} onChange={e => updateParam(index, "groupName", e.target.value)} placeholder="如: 网络配置" />
                </div>
                <div className="flex items-center gap-4 pt-5">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={param.isRequired} onChange={e => updateParam(index, "isRequired", e.target.checked)} />
                    {t("isRequired")}
                  </label>
                </div>
              </div>

              {param.dataType === "NUMBER" && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("minValue")}</Label>
                    <Input type="number" value={param.minValue} onChange={e => updateParam(index, "minValue", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("maxValue")}</Label>
                    <Input type="number" value={param.maxValue} onChange={e => updateParam(index, "maxValue", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("unit")}</Label>
                    <Input value={param.unit} onChange={e => updateParam(index, "unit", e.target.value)} placeholder="如: dBm" />
                  </div>
                </div>
              )}

              {param.dataType === "ENUM" && (
                <div className="space-y-1">
                  <Label className="text-xs">{t("enumValues")}</Label>
                  <Input value={param.enumValues} onChange={e => updateParam(index, "enumValues", e.target.value)} placeholder='用JSON数组: ["0","1","2"]' />
                </div>
              )}

              {param.dataType === "STRING" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("regexPattern")}</Label>
                    <Input value={param.regexPattern} onChange={e => updateParam(index, "regexPattern", e.target.value)} placeholder="如: ^[0-9]{15}$" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("regexHint")}</Label>
                    <Input value={param.regexHint} onChange={e => updateParam(index, "regexHint", e.target.value)} placeholder="如: 请输入15位数字" />
                  </div>
                </div>
              )}

              {param.dataType !== "BOOLEAN" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("defaultValue")}</Label>
                    <Input value={param.defaultValue} onChange={e => updateParam(index, "defaultValue", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("sortOrder")}</Label>
                    <Input type="number" value={param.sortOrder} onChange={e => updateParam(index, "sortOrder", parseInt(e.target.value) || 0)} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader><CardTitle>FAE {common("notes")}</CardTitle></CardHeader>
        <CardContent>
          <Input value={templateNotes} onChange={e => setTemplateNotes(e.target.value)} placeholder={faeT("notes")} />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => router.back()}>{common("cancel")}</Button>
        <Button variant="secondary" onClick={() => handleSave(false)} disabled={saving}>
          {saving ? common("loading") : <><Check className="h-4 w-4 mr-1" />{common("save")}</>}
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving}>
          <Send className="h-4 w-4 mr-1" />保存并生成链接
        </Button>
      </div>
    </div>
  );
}
