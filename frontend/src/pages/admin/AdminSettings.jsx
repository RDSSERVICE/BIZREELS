import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import ScreenHeader from "@/components/app/ScreenHeader";
import BottomNav from "@/components/app/BottomNav";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { KeyRound, AlertTriangle, Loader2, PlugZap } from "lucide-react";
import {
  useGetIntegrationSettingsQuery,
  useUpdateIntegrationSettingsMutation,
  useTestIntegrationMutation,
} from "@/features/admin/adminApi";

const TABS = [
  { key: "msg91", label: "MSG91 · OTP", secrets: ["auth_key"],
    fields: [
      ["auth_key", "Auth Key", "text"],
      ["template_id", "Template ID", "text"],
      ["sender_id", "Sender ID", "text"],
      ["txn_template_id", "Transactional Template ID", "text"],
    ] },
  { key: "cloudinary", label: "Cloudinary · Media", secrets: ["api_secret"],
    fields: [
      ["cloud_name", "Cloud Name", "text"],
      ["api_key", "API Key", "text"],
      ["api_secret", "API Secret", "text"],
      ["upload_preset", "Upload Preset", "text"],
    ] },
  { key: "razorpay", label: "Razorpay · Payments", secrets: ["key_secret", "webhook_secret"],
    fields: [
      ["key_id", "Key ID", "text"],
      ["key_secret", "Key Secret", "text"],
      ["webhook_secret", "Webhook Secret", "text"],
    ] },
  { key: "fcm", label: "FCM · Push", secrets: ["service_account_json"],
    fields: [
      ["service_account_json", "Service Account JSON (paste full JSON)", "textarea"],
    ] },
  { key: "ai_content", label: "AI Content · Listings", secrets: ["api_key"],
    fields: [
      ["provider", "Provider (openai / anthropic / gemini)", "text"],
      ["model", "Model (e.g., gpt-5.4, claude-sonnet-4-6, gemini-3.1-pro-preview)", "text"],
      ["api_key", "API Key (leave empty to use BIZREELS_LLM_KEY from env)", "text"],
    ] },
];

function IntegrationForm({ config, values, onChange, onSave, onTest, saving, testing }) {
  return (
    <div className="space-y-4" data-testid={`settings-${config.key}-form`}>
      <div className="glass rounded-2xl p-4 space-y-4">
        {config.fields.map(([key, label, type]) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`f-${config.key}-${key}`} className="text-xs uppercase tracking-wider text-white/60">
              {label}
              {config.secrets.includes(key) && (
                <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-amber-400 normal-case tracking-normal">
                  <KeyRound className="h-3 w-3" /> secret
                </span>
              )}
            </Label>
            {type === "textarea" ? (
              <textarea
                id={`f-${config.key}-${key}`}
                data-testid={`input-${config.key}-${key}`}
                value={values[key] ?? ""}
                onChange={(e) => onChange(key, e.target.value)}
                rows={6}
                placeholder={config.secrets.includes(key) ? "•••• (existing preserved if left as ****)" : ""}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono text-white outline-none focus:border-primary"
              />
            ) : (
              <Input
                id={`f-${config.key}-${key}`}
                data-testid={`input-${config.key}-${key}`}
                type="text"
                value={values[key] ?? ""}
                onChange={(e) => onChange(key, e.target.value)}
                placeholder={config.secrets.includes(key) ? "•••• (leave ****XXXX to keep existing)" : ""}
                className="bg-white/5 border-white/10"
              />
            )}
          </div>
        ))}

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          {config.key === "ai_content" ? (
            <>
              <div>
                <Label htmlFor={`sw-${config.key}`} className="text-sm">Enabled</Label>
                <p className="text-xs text-white/50 mt-0.5">
                  {values.enabled ? "AI autofill live in listing wizard" : "AI features disabled for vendors"}
                </p>
              </div>
              <Switch
                id={`sw-${config.key}`}
                data-testid={`switch-${config.key}-enabled`}
                checked={!!values.enabled}
                onCheckedChange={(v) => onChange("enabled", v)}
              />
            </>
          ) : (
            <>
              <div>
                <Label htmlFor={`sw-${config.key}`} className="text-sm">Dev mode</Label>
                <p className="text-xs text-white/50 mt-0.5">
                  {values.dev_mode ? "Mocked — no real API calls" : "LIVE — real provider will be hit"}
                </p>
              </div>
              <Switch
                id={`sw-${config.key}`}
                data-testid={`switch-${config.key}-dev-mode`}
                checked={!!values.dev_mode}
                onCheckedChange={(v) => onChange("dev_mode", v)}
              />
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onTest}
          disabled={testing}
          variant="outline"
          className="flex-1"
          data-testid={`btn-${config.key}-test`}
        >
          {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlugZap className="h-4 w-4 mr-2" />}
          Test connection
        </Button>
        <Button
          onClick={onSave}
          disabled={saving}
          className="flex-1"
          data-testid={`btn-${config.key}-save`}
        >
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Save
        </Button>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const { user } = useAuth();
  const isAdmin = !!user?.roles?.includes("admin");
  const [state, setState] = useState({});
  const [activeTab, setActiveTab] = useState("msg91");

  const { data: remote, isFetching: loading } = useGetIntegrationSettingsQuery(undefined, { skip: !isAdmin });
  const [updateIntegrationSettings] = useUpdateIntegrationSettingsMutation();
  const [testIntegration] = useTestIntegrationMutation();
  const [savingKey, setSavingKey] = useState(null);
  const [testingKey, setTestingKey] = useState(null);

  useEffect(() => {
    if (!remote) return;
    const s = {};
    for (const t of TABS) s[t.key] = { ...(remote[t.key] || {}) };
    setState(s);
  }, [remote]);

  if (user && !isAdmin) return <Navigate to="/" replace />;

  const setField = (integ, key, val) => {
    setState((s) => ({ ...s, [integ]: { ...(s[integ] || {}), [key]: val } }));
  };

  const save = async (integ) => {
    setSavingKey(integ);
    try {
      const patch = { [integ]: state[integ] };
      const data = await updateIntegrationSettings(patch).unwrap();
      setState((s) => ({ ...s, [integ]: { ...(data[integ] || {}) } }));
      toast.success(`${integ.toUpperCase()} settings saved`);
    } catch (e) {
      toast.error(e?.data?.message || e?.data?.detail || "Save failed");
    } finally {
      setSavingKey(null);
    }
  };

  const test = async (integ) => {
    setTestingKey(integ);
    try {
      const data = await testIntegration(integ).unwrap();
      if (data.ok) {
        toast.success(`${integ.toUpperCase()} OK ${data.dev_mode ? "· dev mode" : "· LIVE"}`);
      } else {
        toast.error(`${integ.toUpperCase()} failed: ${data.error || "unknown"}`);
      }
    } catch (e) {
      toast.error(e?.data?.message || e?.data?.detail || `Test failed for ${integ}`);
    } finally {
      setTestingKey(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen relative bg-black text-white animate-page-enter flex flex-col">
      <ScreenHeader title="Integrations" subtitle="Live keys · dev mode toggles" />

      <div className="px-4 sm:px-6 lg:px-8 pb-24 flex-1 space-y-4">
        <div className="glass rounded-2xl p-4 flex items-start gap-3 border border-amber-400/20 bg-amber-400/5" data-testid="settings-warning">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-white/80">
            <div className="font-heading font-semibold text-sm text-amber-200">Test before flipping dev mode</div>
            Live keys replace the mocks the moment Dev Mode is switched off. Use <span className="font-semibold">Test connection</span> first — the toggle only saves after you press <span className="font-semibold">Save</span>.
          </div>
        </div>

        {loading || !remote ? (
          <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-5 bg-white/5" data-testid="settings-tabs">
              {TABS.map((t) => (
                <TabsTrigger key={t.key} value={t.key} className="text-xs" data-testid={`tab-${t.key}`}>
                  {t.key.toUpperCase()}
                </TabsTrigger>
              ))}
            </TabsList>
            {TABS.map((t) => (
              <TabsContent key={t.key} value={t.key} className="mt-4">
                <IntegrationForm
                  config={t}
                  values={state[t.key] || {}}
                  onChange={(k, v) => setField(t.key, k, v)}
                  onSave={() => save(t.key)}
                  onTest={() => test(t.key)}
                  saving={savingKey === t.key}
                  testing={testingKey === t.key}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}

        {remote?.updated_at && (
          <div className="text-xs text-white/40 text-center pt-4" data-testid="settings-updated-at">
            Last updated {new Date(remote.updated_at).toLocaleString()}
            {remote.updated_by ? ` · by ${remote.updated_by.slice(-6)}` : ""}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
