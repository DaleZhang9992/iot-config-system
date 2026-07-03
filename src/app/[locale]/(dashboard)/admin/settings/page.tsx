"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  const t = useTranslations("admin");
  const common = useTranslations("common");
  const [firmwareVersions, setFirmwareVersions] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/system-config")
      .then(r => r.json())
      .then(data => {
        if (data.firmware_versions) setFirmwareVersions(data.firmware_versions);
      });
  }, []);

  const handleSave = async () => {
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

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{t("systemSettings")}</h1>

      <Card>
        <CardHeader><CardTitle>{t("firmwareVersions")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>固件版本列表（JSON 数组格式）</Label>
            <Input
              value={firmwareVersions}
              onChange={e => setFirmwareVersions(e.target.value)}
              placeholder='["v1.0.0", "v1.1.0", "v2.0.0"]'
            />
            <p className="text-xs text-muted-foreground">
              FAE 配置 AT 指令时可以从这些版本中选择默认固件
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saved ? "已保存" : (saving ? common("loading") : common("save"))}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
