"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface Preset {
  id: string;
  model: string;
  name: string;
  isDefault: boolean;
  parameters: any[];
}

export default function AdminSettingsPage() {
  const t = useTranslations("admin");
  const common = useTranslations("common");
  const [firmwareVersions, setFirmwareVersions] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Presets
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(true);
  const [showPresetForm, setShowPresetForm] = useState(false);
  const [presetForm, setPresetForm] = useState({ model: "", name: "", parameters: "[]", isDefault: false });
  const [presetSaving, setPresetSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/system-config")
      .then(r => r.json())
      .then(data => {
        if (data.firmware_versions) setFirmwareVersions(data.firmware_versions);
      });
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    const res = await fetch("/api/admin/presets");
    const data = await res.json();
    setPresets(data);
    setPresetsLoading(false);
  };

  const handleSaveFirmware = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/system-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firmware_versions: firmwareVersions }),
    });
    setSaved(true);
    setSaving(false);
  };

  const handleCreatePreset = async () => {
    if (!presetForm.model || !presetForm.parameters) return;
    setPresetSaving(true);
    try {
      const params = JSON.parse(presetForm.parameters);
      await fetch("/api/admin/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: presetForm.model,
          name: presetForm.name,
          parameters: params,
          isDefault: presetForm.isDefault,
        }),
      });
      setShowPresetForm(false);
      setPresetForm({ model: "", name: "", parameters: "[]", isDefault: false });
      fetchPresets();
    } catch {
      alert("JSON 格式无效，请检查");
    } finally {
      setPresetSaving(false);
    }
  };

  const handleDeletePreset = async (id: string) => {
    await fetch(`/api/admin/presets?id=${id}`, { method: "DELETE" });
    fetchPresets();
  };

  const handleSetDefault = async (preset: Preset) => {
    await fetch("/api/admin/presets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: preset.id,
        isDefault: true,
        model: preset.model,
      }),
    });
    fetchPresets();
  };

  // Group presets by model
  const presetsByModel: Record<string, Preset[]> = {};
  for (const p of presets) {
    if (!presetsByModel[p.model]) presetsByModel[p.model] = [];
    presetsByModel[p.model].push(p);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">{t("systemSettings")}</h1>

      {/* Firmware Versions */}
      <Card>
        <CardHeader><CardTitle>{t("firmwareVersions")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("firmwareListLabel")}</Label>
            <Input
              value={firmwareVersions}
              onChange={e => setFirmwareVersions(e.target.value)}
              placeholder='["v1.0.0", "v1.1.0", "v2.0.0"]'
            />
            <p className="text-xs text-muted-foreground">
              {t("firmwareListHint")}
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveFirmware} disabled={saving}>
              {saved ? "已保存" : (saving ? common("loading") : common("save"))}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Model Presets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>型号预设管理</CardTitle>
          <Button onClick={() => setShowPresetForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />添加预设
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showPresetForm && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <h3 className="font-medium text-sm">新建型号预设</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>产品型号 <span className="text-destructive">*</span></Label>
                  <Input
                    value={presetForm.model}
                    onChange={e => setPresetForm({...presetForm, model: e.target.value})}
                    placeholder="如: IoT-Module-A1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>预设名称</Label>
                  <Input
                    value={presetForm.name}
                    onChange={e => setPresetForm({...presetForm, name: e.target.value})}
                    placeholder="默认配置"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>参数定义（JSON 数组） <span className="text-destructive">*</span></Label>
                <textarea
                  className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  value={presetForm.parameters}
                  onChange={e => setPresetForm({...presetForm, parameters: e.target.value})}
                  placeholder='[{"paramKey":"AT+GSN","displayName":"查询IMEI","dataType":"STRING","isRequired":true,...}]'
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={presetForm.isDefault}
                  onChange={e => setPresetForm({...presetForm, isDefault: e.target.checked})}
                  className="h-4 w-4"
                />
                设为该型号的默认预设
              </label>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowPresetForm(false)}>
                  {common("cancel")}
                </Button>
                <Button size="sm" onClick={handleCreatePreset} disabled={presetSaving}>
                  {presetSaving ? common("loading") : common("save")}
                </Button>
              </div>
            </div>
          )}

          {presetsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : Object.keys(presetsByModel).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无型号预设，点击"添加预设"创建
            </div>
          ) : (
            Object.entries(presetsByModel).map(([model, modelPresets]) => (
              <div key={model} className="border rounded-lg">
                <div className="bg-muted/30 px-4 py-2 font-medium text-sm border-b">
                  型号: {model} ({modelPresets.length}个预设)
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>预设名称</TableHead>
                      <TableHead>参数数量</TableHead>
                      <TableHead>默认</TableHead>
                      <TableHead className="w-[120px]">{common("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modelPresets.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.parameters.length} 个参数</TableCell>
                        <TableCell>
                          {p.isDefault ? <Badge variant="success">默认</Badge> : (
                            <Button variant="ghost" size="sm" onClick={() => handleSetDefault(p)}>
                              设为默认
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleDeletePreset(p.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
