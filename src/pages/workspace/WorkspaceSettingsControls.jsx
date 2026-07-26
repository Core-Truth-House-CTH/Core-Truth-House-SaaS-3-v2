import { useEffect, useState } from "react";
import * as Switch from "@radix-ui/react-switch";
import { Cloud, Download, Link2, LockKeyhole, ShieldCheck } from "lucide-react";
import apiClient from "../../lib/apiClient";
import { Toggle, Status, messageFor, saveSettings } from "./WorkspaceControlPrimitives";

const preferenceDefinitions = {
  approvals: [
    ["content", "Content approval", "Require owner approval before content is scheduled."],
    ["campaigns", "Campaign approval", "Require approval before a campaign activates."],
    ["assets", "Asset approval", "Review uploaded media before shared use."],
  ],
  notifications: [
    ["email", "Email notifications", "Send workspace updates by email."],
    ["approvals", "Approval alerts", "Notify approvers when work is waiting."],
    ["health", "Brand health alerts", "Surface important brand-health changes."],
  ],
};

export function PreferencesControl({ data, kind }) {
  const definitions = preferenceDefinitions[kind];
  const saved = data.settings?.[kind] || {};
  const [values, setValues] = useState(() =>
    Object.fromEntries(definitions.map(([key]) => [key, Boolean(saved[key])]))
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(Object.fromEntries(definitions.map(([key]) => [key, Boolean(saved[key])])));
  }, [data.settings, definitions]);

  const save = async () => {
    setSaving(true);
    try {
      await saveSettings(data, { [kind]: values });
      setMessage(`${kind === "approvals" ? "Approval" : "Notification"} settings saved.`);
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="ws-panel">
      <div className="ws-panel-head">
        <div>
          <h2>{kind === "approvals" ? "Approval Routing" : "Notification Preferences"}</h2>
          <p>Settings apply only to the active workspace.</p>
        </div>
      </div>
      {definitions.map(([key, label, description]) => (
        <Toggle
          key={key}
          label={label}
          description={description}
          checked={Boolean(values[key])}
          onCheckedChange={(checked) => setValues((current) => ({ ...current, [key]: checked }))}
        />
      ))}
      <Status>{message}</Status>
      <button className="ws-btn primary" onClick={() => void save()} disabled={saving}>
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </article>
  );
}

export function IntegrationsControl({ data }) {
  const [values, setValues] = useState(data.settings?.integrations || {});
  const [message, setMessage] = useState("");
  const items = [
    ["google_drive", "Google Drive", "Files and exported reports"],
    ["slack", "Slack", "Workspace alerts"],
    ["stripe", "Stripe", "Revenue and billing signals"],
    ["social", "Social Channels", "Social Planner publishing"],
  ];

  useEffect(() => setValues(data.settings?.integrations || {}), [data.settings]);

  const toggle = async (key, checked) => {
    const next = { ...values, [key]: checked };
    setValues(next);
    try {
      await saveSettings(data, { integrations: next });
      setMessage("Integration preference saved.");
    } catch (error) {
      setMessage(messageFor(error));
    }
  };

  return (
    <article className="ws-panel">
      <div className="ws-panel-head">
        <div><h2>Workspace Integrations</h2><p>Credentials and data remain tenant-specific.</p></div>
        <Cloud size={21} />
      </div>
      <div className="ws-integration-grid">
        {items.map(([key, label, description]) => (
          <div key={key} className="ws-integration-card">
            <Link2 size={20} />
            <div><strong>{label}</strong><p>{description}</p></div>
            <Switch.Root className="ws-switch" checked={Boolean(values[key])} onCheckedChange={(checked) => void toggle(key, checked)}>
              <Switch.Thumb className="ws-switch-thumb" />
            </Switch.Root>
          </div>
        ))}
      </div>
      <Status>{message}</Status>
    </article>
  );
}

export function PrivacyControl({ data }) {
  const [supportAccess, setSupportAccess] = useState(Boolean(data.settings?.privacy?.support_access));
  const [message, setMessage] = useState("");
  useEffect(() => setSupportAccess(Boolean(data.settings?.privacy?.support_access)), [data.settings]);

  const save = async () => {
    try {
      await saveSettings(data, {
        privacy: { ...(data.settings?.privacy || {}), support_access: supportAccess },
      });
      setMessage("Privacy settings saved.");
    } catch (error) {
      setMessage(messageFor(error));
    }
  };

  const requestExport = async () => {
    try {
      await apiClient.post(
        `/api/workspaces/${encodeURIComponent(data.activeWorkspaceId)}/exports`,
        { scope: "workspace" }
      );
      setMessage("Workspace export requested.");
    } catch (error) {
      setMessage(messageFor(error));
    }
  };

  return (
    <div className="ws-grid two">
      <article className="ws-panel">
        <div className="ws-panel-head">
          <div><h2>Privacy Boundary</h2><p>Tenant content is private unless the owner grants temporary access.</p></div>
          <LockKeyhole size={21} />
        </div>
        <Toggle
          label="Temporary support access"
          description="Allow support to enter only for an approved case."
          checked={supportAccess}
          onCheckedChange={setSupportAccess}
        />
        <div className="ws-privacy-card">
          <ShieldCheck size={18} />
          <div><strong>Separate platform administration</strong><p>Platform broadcasts and service health do not expose tenant content.</p></div>
        </div>
        <Status>{message}</Status>
        <button className="ws-btn primary" onClick={() => void save()}>Save Privacy Settings</button>
      </article>
      <article className="ws-panel soft">
        <div className="ws-panel-head">
          <div><h2>Workspace Export</h2><p>Create a tenant-scoped archive of supported records.</p></div>
          <Download size={21} />
        </div>
        <p className="ws-body-copy">Exports are generated by the backend and must never include another workspace’s content.</p>
        <button className="ws-btn secondary" onClick={() => void requestExport()}><Download size={16} /> Request Export</button>
      </article>
    </div>
  );
}
