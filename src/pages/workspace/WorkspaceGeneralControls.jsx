import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { CONTROLS_CENTER_CARDS } from "./workspaceRoutes";
import { Pill, Status, messageFor } from "./WorkspaceControlPrimitives";
import { patchWorkspaceSettings } from "./workspaceApi";

/*
 * Only the keys the settings service actually accepts are ever validated or
 * sent. Everything else on this page is presented read-only, because no write
 * contract for it exists in this repository.
 */
const identitySchema = z.object({
  workspace_name: z.string().trim().min(2, "Add a workspace name."),
  brand_visibility: z.enum(["private", "internal", "public"]),
  logo_url: z.union([z.literal(""), z.string().trim().url("Enter a valid logo URL.")]),
});

const regionalSchema = z.object({
  timezone: z.string().trim().min(2, "Choose a time zone."),
  locale: z.string().trim().min(2, "Choose a language."),
});

const TIMEZONES = [
  ["America/New_York", "(GMT-05:00) Eastern Time (US & Canada)"],
  ["America/Chicago", "(GMT-06:00) Central Time (US & Canada)"],
  ["America/Denver", "(GMT-07:00) Mountain Time (US & Canada)"],
  ["America/Los_Angeles", "(GMT-08:00) Pacific Time (US & Canada)"],
  ["UTC", "(GMT+00:00) Coordinated Universal Time"],
];

const LOCALES = [["en-US", "English (US)"]];

const identityFrom = (settings, activeWorkspace) => ({
  workspace_name: settings?.workspace_name || activeWorkspace?.name || "",
  brand_visibility: settings?.brand_visibility || "private",
  logo_url: settings?.logo_url || "",
});

const regionalFrom = (settings) => ({
  timezone: settings?.timezone || "America/Chicago",
  locale: settings?.locale || "en-US",
});

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/*
 * Owns both supported settings forms so the page header's Save Changes and the
 * per-panel Save Changes are the same operation over the same allowlisted keys.
 * Nothing here reports success it did not get from the settings service.
 */
export function useGeneralControlsForms(data) {
  const { settings, activeWorkspace, reload } = data;
  const [identity, setIdentity] = useState(() => identityFrom(settings, activeWorkspace));
  const [regional, setRegional] = useState(() => regionalFrom(settings));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState("default");
  const [savedAt, setSavedAt] = useState(null);

  const baseIdentity = useMemo(
    () => identityFrom(settings, activeWorkspace),
    [settings, activeWorkspace]
  );
  const baseRegional = useMemo(() => regionalFrom(settings), [settings]);

  useEffect(() => {
    setIdentity(baseIdentity);
    setRegional(baseRegional);
  }, [baseIdentity, baseRegional]);

  const identityDirty = !same(identity, baseIdentity);
  const regionalDirty = !same(regional, baseRegional);
  const dirty = identityDirty || regionalDirty;

  const resetIdentity = useCallback(() => {
    setIdentity(baseIdentity);
    setMessage("");
    setTone("default");
  }, [baseIdentity]);

  const resetRegional = useCallback(() => {
    setRegional(baseRegional);
    setMessage("");
    setTone("default");
  }, [baseRegional]);

  const save = useCallback(
    async (scope = "all") => {
      const patch = {};

      if (scope === "identity" || scope === "all") {
        const parsed = identitySchema.safeParse(identity);
        if (!parsed.success) {
          setTone("danger");
          setMessage(parsed.error.issues[0]?.message || "Check the workspace details.");
          return false;
        }
        Object.assign(patch, parsed.data);
      }

      if (scope === "regional" || scope === "all") {
        const parsed = regionalSchema.safeParse(regional);
        if (!parsed.success) {
          setTone("danger");
          setMessage(parsed.error.issues[0]?.message || "Check the regional defaults.");
          return false;
        }
        Object.assign(patch, parsed.data);
      }

      setSaving(true);
      setMessage("");
      setTone("default");
      try {
        await patchWorkspaceSettings(patch);
        setTone("default");
        setMessage("All changes saved.");
        setSavedAt(new Date());
        await reload();
        return true;
      } catch (error) {
        setTone("danger");
        setMessage(messageFor(error));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [reload, identity, regional]
  );

  return {
    identity,
    setIdentity,
    regional,
    setRegional,
    identityDirty,
    regionalDirty,
    dirty,
    resetIdentity,
    resetRegional,
    save,
    saving,
    message,
    tone,
    savedAt,
  };
}

/*
 * A live value the workspace can read but not write. `value` is whatever the
 * settings service returned; when it returned nothing we say so rather than
 * invent a placeholder or hard-code a tenant.
 */
function ReadOnlyField({ label, value, multiline }) {
  const resolved = typeof value === "string" ? value.trim() : value;
  const missing = resolved === undefined || resolved === null || resolved === "";
  return (
    <div className={`ws-readonly${multiline ? " multiline" : ""}`}>
      <span className="ws-readonly-label">
        {label}
        <em>Read-only</em>
      </span>
      <div
        className={`ws-readonly-value${missing ? " missing" : ""}`}
        aria-readonly="true"
        title="This workspace can read this value but has no supported endpoint to change it."
      >
        {missing ? "Not available from this workspace" : String(resolved)}
      </div>
    </div>
  );
}

export function WorkspaceIdentityPanel({ data, forms }) {
  const settings = data.settings;
  const { identity, setIdentity, saving } = forms;
  const [editingLogo, setEditingLogo] = useState(false);

  return (
    <article className="ws-panel ws-controls-panel">
      <div className="ws-panel-title">
        <h2>Workspace Identity</h2>
      </div>
      <form
        className="ws-form ws-identity-form"
        onSubmit={(event) => {
          event.preventDefault();
          void forms.save("identity");
        }}
      >
        <div className="ws-identity-grid">
          <div className="ws-identity-fields">
            <label>
              <span>Workspace Name</span>
              <input
                value={identity.workspace_name}
                onChange={(event) =>
                  setIdentity((current) => ({ ...current, workspace_name: event.target.value }))
                }
              />
            </label>
            <ReadOnlyField label="Business Name" value={settings?.business_name} />
            <ReadOnlyField label="Website" value={settings?.website} />
          </div>

          <div className="ws-identity-logo">
            <span className="ws-readonly-label">Workspace Logo</span>
            <div className="ws-logo-tile">
              {identity.logo_url ? (
                <img src={identity.logo_url} alt="Workspace logo" />
              ) : (
                <span className="ws-logo-placeholder">
                  <ImageIcon size={26} aria-hidden="true" />
                  <small>No logo set</small>
                </span>
              )}
            </div>
            <div className="ws-logo-actions">
              <button
                type="button"
                className="ws-btn secondary compact"
                onClick={() => setEditingLogo((value) => !value)}
                aria-expanded={editingLogo}
              >
                Change Logo
              </button>
              <button
                type="button"
                className="ws-icon-btn danger"
                aria-label="Remove workspace logo"
                disabled={!identity.logo_url}
                onClick={() => setIdentity((current) => ({ ...current, logo_url: "" }))}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
            {editingLogo ? (
              <label className="ws-logo-url">
                <span>Logo URL</span>
                <input
                  type="url"
                  placeholder="https://"
                  value={identity.logo_url}
                  onChange={(event) =>
                    setIdentity((current) => ({ ...current, logo_url: event.target.value }))
                  }
                />
              </label>
            ) : null}
          </div>
        </div>

        <div className="ws-identity-grid lower">
          <ReadOnlyField label="Description" value={settings?.description} multiline />
          <div className="ws-identity-fields">
            <ReadOnlyField label="Primary Industry" value={settings?.primary_industry} />
            <label>
              <span>Brand Visibility</span>
              <select
                value={identity.brand_visibility}
                onChange={(event) =>
                  setIdentity((current) => ({
                    ...current,
                    brand_visibility: event.target.value,
                  }))
                }
              >
                <option value="private">Private</option>
                <option value="internal">Internal</option>
                <option value="public">Public</option>
              </select>
            </label>
          </div>
        </div>

        <div className="ws-panel-actions">
          <button
            type="button"
            className="ws-btn secondary"
            onClick={forms.resetIdentity}
            disabled={saving || !forms.identityDirty}
          >
            Cancel
          </button>
          <button className="ws-btn primary" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </article>
  );
}

export function RegionalDefaultsPanel({ data, forms }) {
  const settings = data.settings;
  const { regional, setRegional, saving } = forms;

  return (
    <article className="ws-panel ws-controls-panel">
      <div className="ws-panel-title">
        <h2>Regional Defaults</h2>
      </div>
      <form
        className="ws-form"
        onSubmit={(event) => {
          event.preventDefault();
          void forms.save("regional");
        }}
      >
        <div className="ws-regional-grid">
          <label>
            <span>Time Zone</span>
            <select
              value={regional.timezone}
              onChange={(event) =>
                setRegional((current) => ({ ...current, timezone: event.target.value }))
              }
            >
              {TIMEZONES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <ReadOnlyField label="Date Format" value={settings?.date_format} />
          <ReadOnlyField label="Week Starts On" value={settings?.week_start} />
          <ReadOnlyField label="Currency" value={settings?.currency} />
          <label className="ws-regional-language">
            <span>Language</span>
            <select
              value={regional.locale}
              onChange={(event) =>
                setRegional((current) => ({ ...current, locale: event.target.value }))
              }
            >
              {LOCALES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="ws-panel-actions">
          <button
            type="button"
            className="ws-btn secondary"
            onClick={forms.resetRegional}
            disabled={saving || !forms.regionalDirty}
          >
            Cancel
          </button>
          <button className="ws-btn primary" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </article>
  );
}

/*
 * Reads the active brand from the tenant's own Brand Memory payload. There is
 * deliberately no fallback tenant name here: if the workspace has no active
 * brand, or the read did not succeed, the panel says so in the same frame.
 */
export function ActiveBrandProfilePanel({ data }) {
  const navigate = useNavigate();
  const memory = data.brandMemory;

  const brandName = useMemo(() => {
    const candidates = [
      memory?.brand_name,
      memory?.active_brand?.name,
      memory?.brand?.name,
      memory?.foundation?.brand_name,
      memory?.business_name,
    ];
    return candidates.find((value) => typeof value === "string" && value.trim()) || "";
  }, [memory]);

  const modules = useMemo(() => {
    if (!memory) return [];
    const has = (value) =>
      Boolean(value) && (typeof value !== "object" || Object.keys(value).length > 0);
    return [
      ["Brand Memory", has(memory.foundation || memory.brand_memory)],
      ["Identity Studio", has(memory.identity || memory.identity_studio)],
      ["Messaging Structure", has(memory.messaging || memory.messaging_structure)],
      ["Brand Health", has(memory.health || memory.brand_health)],
    ];
  }, [memory]);

  const connected = Boolean(memory && brandName);

  return (
    <article className="ws-panel ws-controls-panel ws-brand-panel">
      <div className="ws-panel-title">
        <h2>Active Brand Profile</h2>
      </div>

      <div className="ws-brand-head">
        <div>
          <span className="ws-readonly-label">Active Brand</span>
          <strong className="ws-brand-name">{connected ? brandName : "No active brand"}</strong>
        </div>
        <Pill tone={connected ? "green" : "gold"}>
          {connected ? "Connected" : "Not connected"}
        </Pill>
      </div>

      {connected ? (
        <div className="ws-brand-modules">
          {modules.map(([label, ready]) => (
            <div key={label} className="ws-brand-module">
              <span>{label}</span>
              {ready ? (
                <Pill tone="green">Connected</Pill>
              ) : (
                <small className="ws-brand-module-muted">Not set up</small>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="ws-brand-empty">
          {memory
            ? "This workspace does not have an active brand yet. Build the Brand House to connect Brand Memory to every module."
            : "Brand Memory could not be read for this workspace right now. Nothing has been assumed about the active brand."}
        </p>
      )}

      <div className="ws-brand-links">
        <button type="button" className="ws-textlink" onClick={() => navigate("/brand-house")}>
          View Brand Profile <ArrowRight size={14} aria-hidden="true" />
        </button>
        <button type="button" className="ws-textlink" onClick={() => navigate("/brand-house")}>
          Change Active Brand <ArrowRight size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="ws-textlink"
          onClick={data.reload}
          disabled={data.loading}
        >
          Refresh Brand Memory
          <RefreshCw size={14} className={data.loading ? "ws-spin" : ""} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

/*
 * Exactly eight landing cards, in the approved order. Badges describe the gate
 * that the route already enforces - they do not enforce anything themselves, so
 * the Estate and owner checks stay where they were.
 */
export function WorkspaceControlsCenter({ data }) {
  const navigate = useNavigate();
  const isEstate = String(data.activeWorkspace?.plan || "").toLowerCase() === "estate";

  return (
    <section className="ws-center" aria-labelledby="ws-center-heading">
      <div className="ws-center-head">
        <h2 id="ws-center-heading">Workspace Controls Center</h2>
        <p>Configure access, approvals, notifications, and system preferences.</p>
      </div>
      <div className="ws-center-grid">
        {CONTROLS_CENTER_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.path}
              type="button"
              className={`ws-center-card${card.danger ? " danger" : ""}`}
              onClick={() => navigate(card.path)}
            >
              <span className="ws-center-icon" aria-hidden="true">
                <Icon size={20} />
              </span>
              <span className="ws-center-copy">
                <strong>
                  {card.label}
                  {card.estateOnly && !isEstate ? <small>Estate</small> : null}
                </strong>
                <small>{card.description}</small>
              </span>
              <ArrowRight size={16} className="ws-center-chevron" aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <div className="ws-center-footnote">
        <Building2 size={14} aria-hidden="true" />
        <button
          type="button"
          className="ws-textlink"
          onClick={() => navigate("/workspace/controls/client-workspaces")}
        >
          Client Workspaces <ArrowRight size={14} aria-hidden="true" />
        </button>
        <span>Estate plans manage isolated client Houses from their own control.</span>
      </div>
    </section>
  );
}

export default function WorkspaceGeneralControls({ data, forms }) {
  return (
    <>
      <Status tone={forms.tone}>{forms.tone === "danger" ? forms.message : ""}</Status>
      <div className="ws-config-row">
        <WorkspaceIdentityPanel data={data} forms={forms} />
        <RegionalDefaultsPanel data={data} forms={forms} />
        <ActiveBrandProfilePanel data={data} />
      </div>
      <WorkspaceControlsCenter data={data} />
    </>
  );
}
