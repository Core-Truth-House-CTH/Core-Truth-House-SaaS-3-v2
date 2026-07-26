import { useEffect, useState } from "react";
import { Cloud, Download, Link2, LockKeyhole, ShieldCheck } from "lucide-react";
import { z } from "zod";
import apiClient from "../../lib/apiClient";
import { Modal, Toggle, Status, messageFor } from "./WorkspaceControlPrimitives";
import {
  WORKSPACE_ENDPOINTS,
  downloadTenantExport,
  getIntegrationStatuses,
  patchWorkspaceSettings,
} from "./workspaceApi";

const approvalDefinitions = [
  ["Content approval", "Require owner approval before content is scheduled."],
  ["Campaign approval", "Require approval before a campaign activates."],
  ["Asset approval", "Review uploaded media before shared use."],
];

const providerDefinitions = {
  openai: {
    label: "OpenAI",
    description: "Tenant-billed AI generation",
    schema: z.object({ api_key: z.string().trim().min(10, "Enter a valid OpenAI API key.") }),
  },
  fal: {
    label: "fal.ai",
    description: "Image and video generation",
    schema: z.object({ api_key: z.string().trim().min(10, "Enter a valid fal.ai API key.") }),
  },
  higgsfield: {
    label: "Higgsfield",
    description: "Studio generation credentials",
    schema: z.object({
      api_key: z.string().trim().min(8, "Enter a valid Higgsfield API key."),
      api_secret: z.string().trim().min(8, "Enter a valid Higgsfield API secret."),
    }),
  },
};

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
  const [statuses, setStatuses] = useState({});
  const [message, setMessage] = useState("");
  const [activeProvider, setActiveProvider] = useState(null);
  const [form, setForm] = useState({ api_key: "", api_secret: "" });
  const [busy, setBusy] = useState("");

  const loadStatuses = async () => {
    try {
      setStatuses(await getIntegrationStatuses());
    } catch (error) {
      setMessage(messageFor(error));
    }
  };

  useEffect(() => {
    let mounted = true;
    getIntegrationStatuses()
      .then((result) => mounted && setStatuses(result))
      .catch((error) => mounted && setMessage(messageFor(error)));
    return () => { mounted = false; };
  }, []);

  const openProvider = (provider) => {
    setMessage("");
    setForm({ api_key: "", api_secret: "" });
    setActiveProvider(provider);
  };

  const connect = async (event) => {
    event.preventDefault();
    const definition = providerDefinitions[activeProvider];
    const payload = activeProvider === "higgsfield"
      ? { api_key: form.api_key, api_secret: form.api_secret }
      : { api_key: form.api_key };
    const parsed = definition?.schema.safeParse(payload);
    if (!parsed?.success) {
      setMessage(parsed?.error?.issues?.[0]?.message || "Check the provider credentials.");
      return;
    }

    setBusy(activeProvider);
    try {
      await apiClient.post(WORKSPACE_ENDPOINTS.integrations[activeProvider], parsed.data);
      setMessage(`${definition.label} connected to this workspace.`);
      setActiveProvider(null);
      setForm({ api_key: "", api_secret: "" });
      await loadStatuses();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy("");
    }
  };

  const disconnect = async (provider) => {
    const definition = providerDefinitions[provider];
    setBusy(provider);
    setMessage("");
    try {
      await apiClient.delete(WORKSPACE_ENDPOINTS.integrations[provider]);
      setMessage(`${definition.label} disconnected from this workspace.`);
      await loadStatuses();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy("");
    }
  };

  const activeDefinition = activeProvider ? providerDefinitions[activeProvider] : null;

  return (
    <article className="ws-panel">
      <div className="ws-panel-head">
        <div><h2>Workspace Integrations</h2><p>Credentials are encrypted at rest and remain scoped to the active tenant.</p></div>
        <Cloud size={21} />
      </div>
      <div className="ws-integration-grid">
        {Object.entries(providerDefinitions).map(([key, definition]) => {
          const status = statuses[key];
          const connected = Boolean(status?.connected);
          return (
            <div key={key} className="ws-integration-card">
              <Link2 size={20} />
              <div><strong>{definition.label}</strong><p>{definition.description}</p></div>
              <div className="ws-integration-actions">
                <span className={`ws-pill ${connected ? "green" : "default"}`}>
                  {status?.available === false ? "Unavailable" : connected ? `Connected${status.api_key_last4 ? ` · ••••${status.api_key_last4}` : ""}` : "Not connected"}
                </span>
                {connected ? (
                  <button type="button" className="ws-btn secondary compact" onClick={() => void disconnect(key)} disabled={Boolean(busy)}>
                    {busy === key ? "Disconnecting…" : "Disconnect"}
                  </button>
                ) : (
                  <button type="button" className="ws-btn primary compact" onClick={() => openProvider(key)} disabled={status?.available === false || Boolean(busy)}>
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Status>{message}</Status>

      <Modal
        open={Boolean(activeProvider)}
        onOpenChange={(open) => !open && setActiveProvider(null)}
        title={activeDefinition ? `Connect ${activeDefinition.label}` : "Connect integration"}
        description="Credentials will be sent directly to the tenant-scoped encrypted integration endpoint."
      >
        <form className="ws-form" onSubmit={connect}>
          <label><span>API key</span><input type="password" autoComplete="off" value={form.api_key} onChange={(event) => setForm((current) => ({ ...current, api_key: event.target.value }))} /></label>
          {activeProvider === "higgsfield" ? (
            <label><span>API secret</span><input type="password" autoComplete="off" value={form.api_secret} onChange={(event) => setForm((current) => ({ ...current, api_secret: event.target.value }))} /></label>
          ) : null}
          <div className="ws-privacy-card"><ShieldCheck size={18} /><div><strong>Credentials are never returned</strong><p>After connection, the interface receives only connection status and the final four key characters.</p></div></div>
          <Status>{message}</Status>
          <div className="ws-dialog-actions">
            <button type="button" className="ws-btn secondary" onClick={() => setActiveProvider(null)}>Cancel</button>
            <button className="ws-btn primary" disabled={Boolean(busy)}>{busy ? "Connecting…" : "Connect Provider"}</button>
          </div>
        </form>
      </Modal>
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
