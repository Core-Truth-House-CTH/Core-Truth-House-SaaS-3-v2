import { useEffect, useState } from "react";
import { Download, LockKeyhole, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { Status, Toggle, messageFor } from "./WorkspaceControlPrimitives";
import {
  downloadTenantExport,
  patchWorkspaceSettings,
  updateSupportConsent,
} from "./workspaceApi";
import { formatDateTime } from "./workspaceRoutes";

const consentSchema = z.object({
  case_id: z.string().trim().min(2, "Add the approved support case ID.").max(120),
  expires_at: z.string().min(1, "Choose an expiration time."),
});

function defaultExpiry() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function WorkspacePrivacyControl({ data }) {
  const consent = data.controls?.support_consent || {};
  const [visibility, setVisibility] = useState(data.settings?.brand_visibility || "private");
  const [supportEnabled, setSupportEnabled] = useState(Boolean(consent.enabled));
  const [caseId, setCaseId] = useState(consent.case_id || "");
  const [expiresAt, setExpiresAt] = useState(defaultExpiry());
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    setVisibility(data.settings?.brand_visibility || "private");
    setSupportEnabled(Boolean(data.controls?.support_consent?.enabled));
    setCaseId(data.controls?.support_consent?.case_id || "");
  }, [data.controls, data.settings]);

  const saveVisibility = async () => {
    setBusy("visibility");
    setMessage("");
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

  const saveConsent = async () => {
    setMessage("");
    if (!data.companionAvailable) {
      setMessage("Support consent cannot change until the Workspace companion API is available.");
      return;
    }

    let payload = { enabled: false, case_id: "", expires_at: null };
    if (supportEnabled) {
      const parsed = consentSchema.safeParse({ case_id: caseId, expires_at: expiresAt });
      if (!parsed.success) {
        setMessage(parsed.error.issues[0]?.message || "Check the support consent details.");
        return;
      }
      payload = {
        enabled: true,
        case_id: parsed.data.case_id,
        expires_at: new Date(parsed.data.expires_at).toISOString(),
      };
    }

    setBusy("consent");
    try {
      await updateSupportConsent(payload);
      setMessage(supportEnabled ? "Temporary support consent granted." : "Support consent revoked.");
      await data.reload();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy("");
    }
  };

  const exportData = async () => {
    setBusy("export");
    setMessage("");
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
        <div className="ws-panel-head"><div><h2>Privacy Boundary</h2><p>Visibility and temporary support consent are stored separately and remain tenant-scoped.</p></div><LockKeyhole size={21} /></div>
        <div className="ws-form">
          <label><span>Brand visibility</span><select value={visibility} onChange={(event) => setVisibility(event.target.value)}><option value="private">Private</option><option value="internal">Internal</option><option value="public">Public</option></select></label>
        </div>
        <button className="ws-btn secondary" onClick={() => void saveVisibility()} disabled={Boolean(busy)}>{busy === "visibility" ? "Saving…" : "Save Visibility"}</button>

        <div className="ws-control-divider" />
        <Toggle
          label="Temporary support consent"
          description="Owner-authorized access must include a case ID and expire within seven days."
          checked={supportEnabled}
          onCheckedChange={setSupportEnabled}
          disabled={!data.companionAvailable || Boolean(busy)}
        />
        {supportEnabled ? (
          <div className="ws-form ws-nested-form">
            <label><span>Support case ID</span><input value={caseId} onChange={(event) => setCaseId(event.target.value)} placeholder="CTH-SUPPORT-0001" /></label>
            <label><span>Consent expires</span><input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></label>
          </div>
        ) : null}
        {consent.enabled ? <div className="ws-privacy-card"><ShieldCheck size={18} /><div><strong>Consent currently active</strong><p>Case {consent.case_id}. Expires {formatDateTime(consent.expires_at)}.</p></div></div> : null}
        <button className="ws-btn primary" onClick={() => void saveConsent()} disabled={!data.companionAvailable || Boolean(busy)}>{busy === "consent" ? "Saving…" : supportEnabled ? "Grant Temporary Consent" : "Confirm Consent Revocation"}</button>
        <Status>{message}</Status>
      </article>

      <article className="ws-panel soft">
        <div className="ws-panel-head"><div><h2>Workspace Export</h2><p>Download the supported tenant collections as JSON.</p></div><Download size={21} /></div>
        <p className="ws-body-copy">The export service derives scope from the authenticated tenant context instead of accepting a user-supplied Workspace ID.</p>
        <div className="ws-privacy-card"><ShieldCheck size={18} /><div><strong>Separate platform administration</strong><p>Core Truth House service operations do not grant automatic access to tenant content.</p></div></div>
        <button className="ws-btn secondary" onClick={() => void exportData()} disabled={Boolean(busy)}><Download size={16} /> {busy === "export" ? "Preparing…" : "Download Workspace Export"}</button>
      </article>
    </div>
  );
}
