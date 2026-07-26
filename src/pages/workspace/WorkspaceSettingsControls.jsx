import { useEffect, useState } from "react";
import { Cloud, Download, Link2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Toggle, Status, messageFor } from "./WorkspaceControlPrimitives";
import {
  downloadTenantExport,
  getIntegrationStatuses,
  patchWorkspaceSettings,
} from "./workspaceApi";

const approvalDefinitions = [
  ["Content approval", "Require owner approval before content is scheduled."],
  ["Campaign approval", "Require approval before a campaign activates."],
  ["Asset approval", "Review uploaded media before shared use."],
];

export function PreferencesControl({ data, kind }) {
  const [notificationMode, setNotificationMode] = useState(
    data.settings?.notification_mode || "all"
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotificationMode(data.settings?.notification_mode || "all");
  }, [data.settings]);

  if (kind === "approvals") {
    return (
      <article className="ws-panel">
        <div className="ws-panel-head">
          <div><h2>Approval Routing</h2><p>The page is ready, but the live backend does not yet expose an enforceable approval-policy endpoint.</p></div>
          <ShieldCheck size={21} />
        </div>
        {approvalDefinitions.map(([label, description]) => (
          <Toggle key={label} label={label} description={description} checked={false} onCheckedChange={() => {}} disabled />
        ))}
        <Status>Approval toggles remain read-only so the interface never claims to enforce a workflow the backend cannot yet audit.</Status>
        <button className="ws-btn secondary" disabled>Save Approval Routing</button>
      </article>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      await patchWorkspaceSettings({ notification_mode: notificationMode });
      setMessage("Notification preference saved.");
      await data.reload();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="ws-panel">
      <div className="ws-panel-head">
        <div><h2>Notification Preferences</h2><p>Choose the workspace notification mode supported by the tenant settings service.</p></div>
      </div>
      <div className="ws-form">
        <label><span>Notification mode</span><select value={notificationMode} onChange={(event) => setNotificationMode(event.target.value)}><option value="all">All workspace updates</option><option value="important">Important updates only</option><option value="none">No optional notifications</option></select></label>
      </div>
      <Status>{message}</Status>
      <button className="ws-btn primary" onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save Notification Mode"}</button>
    </article>
  );
}

export function IntegrationsControl() {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState({});
  const [message, setMessage] = useState("");
  const providers = [
    ["openai", "OpenAI", "Tenant-billed AI generation"],
    ["fal", "fal.ai", "Image and video generation"],
    ["higgsfield", "Higgsfield", "Studio generation credentials"],
  ];

  useEffect(() => {
    let mounted = true;
    getIntegrationStatuses()
      .then((result) => mounted && setStatuses(result))
      .catch((error) => mounted && setMessage(messageFor(error)));
    return () => { mounted = false; };
  }, []);

  return (
    <article className="ws-panel">
      <div className="ws-panel-head">
        <div><h2>Workspace Integrations</h2><p>Connection status is read from encrypted, tenant-scoped provider records.</p></div>
        <Cloud size={21} />
      </div>
      <div className="ws-integration-grid">
        {providers.map(([key, label, description]) => {
          const status = statuses[key];
          return (
            <div key={key} className="ws-integration-card">
              <Link2 size={20} />
              <div><strong>{label}</strong><p>{description}</p></div>
              <span className={`ws-pill ${status?.connected ? "green" : "default"}`}>
                {status?.available === false ? "Unavailable" : status?.connected ? `Connected${status.api_key_last4 ? ` · ••••${status.api_key_last4}` : ""}` : "Not connected"}
              </span>
            </div>
          );
        })}
      </div>
      <Status>{message}</Status>
      <button className="ws-btn primary" onClick={() => navigate("/integrations")}>Manage Integration Credentials</button>
    </article>
  );
}

export function PrivacyControl({ data }) {
  const [visibility, setVisibility] = useState(data.settings?.brand_visibility || "private");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => setVisibility(data.settings?.brand_visibility || "private"), [data.settings]);

  const save = async () => {
    setBusy("save");
    try {
      await patchWorkspaceSettings({ brand_visibility: visibility });
      setMessage("Privacy visibility saved.");
      await data.reload();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy("");
    }
  };

  const exportData = async () => {
    setBusy("export");
    try {
      await downloadTenantExport(data.activeWorkspace?.name || "workspace");
      setMessage("Tenant-scoped export downloaded.");
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="ws-grid two">
      <article className="ws-panel">
        <div className="ws-panel-head"><div><h2>Privacy Boundary</h2><p>Visibility is stored by the tenant settings service.</p></div><LockKeyhole size={21} /></div>
        <div className="ws-form"><label><span>Brand visibility</span><select value={visibility} onChange={(event) => setVisibility(event.target.value)}><option value="private">Private</option><option value="internal">Internal</option><option value="public">Public</option></select></label></div>
        <div className="ws-privacy-card"><ShieldCheck size={18} /><div><strong>Support access is not automatic</strong><p>The live backend has no general support-access toggle. Access must remain case-specific and owner-authorized.</p></div></div>
        <Status>{message}</Status>
        <button className="ws-btn primary" onClick={() => void save()} disabled={Boolean(busy)}>{busy === "save" ? "Saving…" : "Save Privacy Visibility"}</button>
      </article>
      <article className="ws-panel soft">
        <div className="ws-panel-head"><div><h2>Workspace Export</h2><p>Download the supported tenant collections as JSON.</p></div><Download size={21} /></div>
        <p className="ws-body-copy">The export endpoint derives workspace scope from the authenticated tenant context rather than trusting a user-supplied workspace ID.</p>
        <button className="ws-btn secondary" onClick={() => void exportData()} disabled={Boolean(busy)}><Download size={16} /> {busy === "export" ? "Preparing…" : "Download Workspace Export"}</button>
      </article>
    </div>
  );
}
