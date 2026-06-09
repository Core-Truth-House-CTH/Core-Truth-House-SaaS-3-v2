import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Settings as SettingsIcon,
  Check,
  X as XIcon,
  Pencil,
  Image as ImageIcon,
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trash2,
} from "lucide-react";
import { DashboardLayout } from "../components/Layout";
import apiClient from "../lib/apiClient";

// visual_url is stored as a backend-relative path (e.g.
// /api/audience/portraits/<file>.png), served by the API host — prefix it with
// the backend base URL. Full http(s)/data URLs pass through unchanged.
const API_BASE = String(
  import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    "https://api.coretruthhouse.com"
).replace(/\/$/, "");

const absUrl = (u) =>
  !u ? u : /^(https?:|data:)/.test(u) ? u : `${API_BASE}${u}`;

const SERIF = "'Cormorant Garamond', Georgia, serif";

// Platform brand colours are an explicit spec requirement for the badges.
const PLATFORM_META = {
  instagram: { label: "Instagram", color: "#E1306C" },
  facebook: { label: "Facebook", color: "#1877F2" },
  linkedin: { label: "LinkedIn", color: "#0A66C2" },
  twitter: { label: "Twitter/X", color: "#111111" },
  threads: { label: "Threads", color: "#111111" },
  tiktok: { label: "TikTok", color: "#14B8A6" },
  youtube_shorts: { label: "YouTube", color: "#FF0000" },
};

const PLATFORM_ORDER = [
  "instagram",
  "facebook",
  "linkedin",
  "twitter",
  "threads",
  "tiktok",
  "youtube_shorts",
];

const DIRECTION_META = {
  campaign: { label: "Campaign", color: "var(--cth-command-crimson)" },
  pillar: { label: "Pillar", color: "var(--cth-command-gold)" },
  signal: { label: "Signal", color: "var(--cth-command-cinnabar)" },
};

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const SCHEDULE_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
];

const WEEKDAYS = [
  { value: 0, label: "Mon" },
  { value: 1, label: "Tue" },
  { value: 2, label: "Wed" },
  { value: 3, label: "Thu" },
  { value: 4, label: "Fri" },
  { value: 5, label: "Sat" },
  { value: 6, label: "Sun" },
];

const DEFAULT_SETTINGS = {
  enabled: false,
  schedule: "weekly",
  schedule_day: 0,
  schedule_time: "08:00",
  platforms: [...PLATFORM_ORDER],
  posts_per_run: 3,
  content_mix: { campaigns: true, pillars: true, signals: true },
  notify_email: true,
};

const unwrap = (res) => res?.data ?? res;

const DEFAULT_VISUAL_MODEL = "openai/gpt-image-1";
const VISUAL_MODELS = [
  { value: "openai/gpt-image-1", label: "GPT Image (best text)" },
  { value: "google/gemini-2.5-flash-image", label: "Gemini 2.5 Flash (fast)" },
  { value: "higgsfield-ai/soul/standard", label: "Higgsfield Soul", higgsfield: true },
  {
    value: "higgsfield-ai/nano-banana/pro",
    label: "Higgsfield Nano Banana",
    higgsfield: true,
  },
];

function formatRunDate(iso) {
  if (!iso) return "Unknown date";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function PlatformBadge({ platform }) {
  const meta = PLATFORM_META[platform] || { label: platform, color: "#444" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: "#fff",
        background: meta.color,
        letterSpacing: 0.2,
      }}
    >
      {meta.label}
    </span>
  );
}

function DirectionBadge({ direction, label }) {
  const meta = DIRECTION_META[direction] || {
    label: direction,
    color: "var(--cth-command-muted)",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: meta.color,
        border: `1px solid ${meta.color}`,
        background: "transparent",
      }}
      title={label || meta.label}
    >
      {meta.label}
      {label ? (
        <span
          style={{
            color: "var(--cth-command-muted)",
            fontWeight: 500,
            maxWidth: 220,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          · {label}
        </span>
      ) : null}
    </span>
  );
}

function Pill({ active, onClick, children, accentColor }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        border: `1px solid ${
          active ? "transparent" : "var(--cth-command-border)"
        }`,
        background: active
          ? accentColor || "var(--cth-command-ink)"
          : "var(--cth-command-panel)",
        color: active ? "#fff" : "var(--cth-command-muted)",
        transition: "all 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}

function RationaleCell({ title, value }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          color: "var(--cth-command-gold)",
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 13, color: "var(--cth-command-ink)", lineHeight: 1.5 }}>
        {value || "—"}
      </div>
    </div>
  );
}

function QueueItemCard({
  item,
  onPatch,
  onPush,
  onGenerateVisual,
  onDeleteVisual,
  busy,
  higgsfieldConnected,
  selectedModel,
  onSelectModel,
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.generated_text || "");
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const status = item.status || "pending";

  useEffect(() => {
    setDraft(item.generated_text || "");
  }, [item.generated_text]);

  const itemBusy = busy === item.item_id;

  const saveEdit = async () => {
    await onPatch(item, { generated_text: draft });
    setEditing(false);
  };

  return (
    <div
      style={{
        background: "var(--cth-command-panel)",
        border: "1px solid var(--cth-command-border)",
        borderRadius: 14,
        padding: 18,
        marginBottom: 14,
        opacity: status === "rejected" ? 0.6 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <PlatformBadge platform={item.platform} />
        <DirectionBadge direction={item.content_direction} label={item.source_label} />
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "capitalize",
            color:
              status === "approved"
                ? "var(--cth-command-success)"
                : status === "rejected"
                ? "var(--cth-command-error)"
                : status === "pushed"
                ? "var(--cth-command-gold)"
                : "var(--cth-command-muted)",
          }}
        >
          {status}
        </span>
      </div>

      <div style={{ display: "flex", gap: 14 }}>
        {item.visual_url ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <img
              src={absUrl(item.visual_url)}
              alt="Generated visual"
              className="cth-thumb"
              onClick={() => setLightboxUrl(absUrl(item.visual_url))}
              style={{
                width: 84,
                height: 84,
                objectFit: "cover",
                borderRadius: 10,
                border: "1px solid var(--cth-command-border)",
                cursor: "pointer",
              }}
            />
            {confirmingDelete ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 11, color: "var(--cth-command-muted)" }}>
                  Remove this visual?
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => {
                      onDeleteVisual(item);
                      setConfirmingDelete(false);
                    }}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 7,
                      border: "1px solid var(--cth-command-error)",
                      background: "var(--cth-command-error)",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 7,
                      border: "1px solid var(--cth-command-border)",
                      background: "transparent",
                      color: "var(--cth-command-muted)",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingDelete(true)}
                title="Remove visual"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 7,
                  border: "1px solid var(--cth-command-border)",
                  background: "transparent",
                  color: "var(--cth-command-muted)",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={12} /> Remove
              </button>
            )}
          </div>
        ) : null}

        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "1px solid var(--cth-command-border)",
                background: "var(--cth-command-panel-soft)",
                color: "var(--cth-command-ink)",
                fontSize: 14,
                lineHeight: 1.55,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          ) : (
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--cth-command-ink)",
                whiteSpace: "pre-wrap",
              }}
            >
              {item.generated_text || (
                <span style={{ color: "var(--cth-command-muted)" }}>
                  No content generated.
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Platform analysis */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginTop: 12,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--cth-command-muted)",
          fontSize: 13,
          fontWeight: 600,
          padding: 0,
        }}
      >
        Platform analysis
        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {expanded ? (
        <div
          style={{
            marginTop: 10,
            padding: 14,
            borderRadius: 10,
            background: "var(--cth-command-panel-soft)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          <RationaleCell title="Hook" value={item.hook_rationale} />
          <RationaleCell title="Format" value={item.format_rationale} />
          <RationaleCell title="CTA" value={item.cta_rationale} />
          <RationaleCell title="Platform alignment" value={item.platform_alignment} />
        </div>
      ) : null}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginTop: 14,
        }}
      >
        {editing ? (
          <>
            <ActionButton onClick={saveEdit} variant="solid">
              Save
            </ActionButton>
            <ActionButton onClick={() => setEditing(false)} variant="ghost">
              Cancel
            </ActionButton>
          </>
        ) : (
          <>
            <ActionButton
              onClick={() => onPatch(item, { status: "approved" })}
              variant="success"
              disabled={status === "approved" || status === "pushed"}
            >
              <Check size={15} /> Approve
            </ActionButton>
            <ActionButton
              onClick={() => onPatch(item, { status: "rejected" })}
              variant="ghost"
              disabled={status === "rejected"}
            >
              <XIcon size={15} /> Reject
            </ActionButton>
            <ActionButton onClick={() => setEditing(true)} variant="ghost">
              <Pencil size={14} /> Edit
            </ActionButton>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <ActionButton
                onClick={() => onGenerateVisual(item, selectedModel)}
                variant="ghost"
                disabled={itemBusy}
              >
                {itemBusy ? (
                  <Loader2 size={14} className="cth-spin" />
                ) : (
                  <ImageIcon size={14} />
                )}{" "}
                Generate Visual
              </ActionButton>
              <select
                value={selectedModel}
                onChange={(e) => onSelectModel(item.item_id, e.target.value)}
                title="Image model"
                style={{
                  fontSize: 11,
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: "1px solid var(--cth-command-border)",
                  background: "var(--cth-command-panel-soft)",
                  color: "var(--cth-command-ink)",
                  cursor: "pointer",
                }}
              >
                {VISUAL_MODELS.filter(
                  (m) => !m.higgsfield || higgsfieldConnected
                ).map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </span>
            {status === "approved" ? (
              <ActionButton onClick={() => onPush(item)} variant="solid">
                <Send size={14} /> Push to Social Planner
              </ActionButton>
            ) : null}
          </>
        )}
      </div>

      {/* Full-size image lightbox */}
      {lightboxUrl ? (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1100,
            background: "rgba(13,0,16,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteVisual(item);
              setConfirmingDelete(false);
              setLightboxUrl(null);
            }}
            aria-label="Delete visual"
            title="Remove visual"
            style={{
              position: "absolute",
              top: 20,
              left: 24,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#fff",
              display: "inline-flex",
            }}
          >
            <Trash2 size={28} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxUrl(null);
            }}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 20,
              right: 24,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#fff",
              display: "inline-flex",
            }}
          >
            <XIcon size={32} />
          </button>
          <img
            src={lightboxUrl}
            alt="Generated visual, full size"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: 12,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function ActionButton({ children, onClick, variant = "ghost", disabled }) {
  const styles = {
    solid: {
      background: "var(--cth-command-crimson)",
      color: "#fff",
      border: "1px solid var(--cth-command-crimson)",
    },
    success: {
      background: "var(--cth-command-success)",
      color: "#fff",
      border: "1px solid var(--cth-command-success)",
    },
    ghost: {
      background: "transparent",
      color: "var(--cth-command-ink)",
      border: "1px solid var(--cth-command-border)",
    },
  }[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 12px",
        borderRadius: 9,
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        ...styles,
      }}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        fontSize: 14,
        color: "var(--cth-command-ink)",
        fontWeight: 500,
      }}
    >
      <span>{label}</span>
      <span
        onClick={() => onChange(!checked)}
        style={{
          width: 42,
          height: 24,
          borderRadius: 999,
          background: checked
            ? "var(--cth-command-crimson)"
            : "var(--cth-command-border)",
          position: "relative",
          transition: "background 0.15s ease",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 20 : 2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.15s ease",
          }}
        />
      </span>
    </label>
  );
}

function SettingsDrawer({ open, onClose, settings, onSave, saving }) {
  const [local, setLocal] = useState(settings);

  useEffect(() => {
    setLocal(settings);
  }, [settings, open]);

  if (!open) return null;

  const set = (patch) => setLocal((s) => ({ ...s, ...patch }));
  const setMix = (key, val) =>
    setLocal((s) => ({ ...s, content_mix: { ...s.content_mix, [key]: val } }));
  const togglePlatform = (p) =>
    setLocal((s) => {
      const has = (s.platforms || []).includes(p);
      return {
        ...s,
        platforms: has
          ? s.platforms.filter((x) => x !== p)
          : [...(s.platforms || []), p],
      };
    });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(13,0,16,0.45)" }}
      />
      <div
        style={{
          position: "relative",
          width: "min(440px, 100%)",
          height: "100%",
          background: "var(--cth-command-panel)",
          borderLeft: "1px solid var(--cth-command-border)",
          padding: 24,
          overflowY: "auto",
          boxShadow: "-12px 0 40px rgba(13,0,16,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontFamily: SERIF,
              fontSize: 26,
              fontWeight: 600,
              color: "var(--cth-command-ink)",
              margin: 0,
            }}
          >
            Automation Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--cth-command-muted)",
            }}
          >
            <XIcon size={22} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Toggle
            label="Enable automation"
            checked={!!local.enabled}
            onChange={(v) => set({ enabled: v })}
          />

          <div>
            <FieldLabel>Schedule</FieldLabel>
            <select
              value={local.schedule}
              onChange={(e) => set({ schedule: e.target.value })}
              style={selectStyle}
            >
              {SCHEDULE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {local.schedule === "weekly" || local.schedule === "biweekly" ? (
            <div>
              <FieldLabel>Day of week</FieldLabel>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {WEEKDAYS.map((d) => (
                  <Pill
                    key={d.value}
                    active={Number(local.schedule_day) === d.value}
                    onClick={() => set({ schedule_day: d.value })}
                    accentColor="var(--cth-command-ink)"
                  >
                    {d.label}
                  </Pill>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <FieldLabel>Time (UTC)</FieldLabel>
            <input
              type="time"
              value={local.schedule_time || "08:00"}
              onChange={(e) => set({ schedule_time: e.target.value })}
              style={selectStyle}
            />
          </div>

          <div>
            <FieldLabel>Platforms</FieldLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PLATFORM_ORDER.map((p) => (
                <Checkbox
                  key={p}
                  label={PLATFORM_META[p].label}
                  checked={(local.platforms || []).includes(p)}
                  onChange={() => togglePlatform(p)}
                />
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Content mix</FieldLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Checkbox
                label="Use campaigns"
                checked={!!local.content_mix?.campaigns}
                onChange={(v) => setMix("campaigns", v)}
              />
              <Checkbox
                label="Use content pillars"
                checked={!!local.content_mix?.pillars}
                onChange={(v) => setMix("pillars", v)}
              />
              <Checkbox
                label="Use buyer signals"
                checked={!!local.content_mix?.signals}
                onChange={(v) => setMix("signals", v)}
              />
            </div>
          </div>

          <Toggle
            label="Notify by email"
            checked={!!local.notify_email}
            onChange={(v) => set({ notify_email: v })}
          />

          <button
            onClick={() => onSave(local)}
            disabled={saving}
            style={{
              marginTop: 8,
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: "var(--cth-command-crimson)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: "var(--cth-command-muted)",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

const selectStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--cth-command-border)",
  background: "var(--cth-command-panel-soft)",
  color: "var(--cth-command-ink)",
  fontSize: 14,
};

function Checkbox({ label, checked, onChange }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        fontSize: 14,
        color: "var(--cth-command-ink)",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 16, height: 16, accentColor: "var(--cth-command-crimson)" }}
      />
      {label}
    </label>
  );
}

export default function ContentQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [busyItem, setBusyItem] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null); // { type: "success" | "info", text }
  const [higgsfieldConnected, setHiggsfieldConnected] = useState(false);
  const [modelByItem, setModelByItem] = useState({}); // item_id -> model_id

  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = unwrap(await apiClient.get("/api/content-automation/queue"));
      setItems(res?.items || []);
      setError("");
    } catch (e) {
      setError(e?.payload?.detail || e?.message || "Failed to load queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = unwrap(await apiClient.get("/api/content-automation/settings"));
      if (res?.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...res.settings });
      }
    } catch {
      /* keep defaults */
    }
  }, []);

  const loadHiggsfield = useCallback(async () => {
    try {
      const r = unwrap(await apiClient.get("/api/integrations/higgsfield"));
      setHiggsfieldConnected(!!r?.connected);
    } catch {
      setHiggsfieldConnected(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
    loadSettings();
    loadHiggsfield();
  }, [loadQueue, loadSettings, loadHiggsfield]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    setNotice(null);
    try {
      const res = unwrap(
        await apiClient.post("/api/content-automation/generate", {})
      );
      await loadQueue();
      const count = Number(res?.item_count ?? 0);
      if (count === 0) {
        setNotice({
          type: "info",
          text: "No content generated — add an active campaign, content pillars in Brand Foundation, or confirm a buyer signal first.",
        });
      } else {
        setNotice({
          type: "success",
          text: `Generated ${count} posts ready for review.`,
        });
      }
    } catch (e) {
      setError(e?.payload?.detail || e?.message || "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const patchItem = async (item, patch) => {
    try {
      const res = unwrap(
        await apiClient.patch(
          `/api/content-automation/queue/${item.item_id}`,
          patch
        )
      );
      const updated = res?.item;
      if (updated) {
        setItems((list) =>
          list.map((it) => (it.item_id === item.item_id ? { ...it, ...updated } : it))
        );
      }
    } catch (e) {
      setError(e?.payload?.detail || e?.message || "Update failed.");
    }
  };

  const pushItem = async (item) => {
    try {
      await apiClient.post(
        `/api/content-automation/queue/${item.item_id}/push-to-social`,
        {}
      );
      setItems((list) =>
        list.map((it) =>
          it.item_id === item.item_id ? { ...it, status: "pushed" } : it
        )
      );
    } catch (e) {
      setError(e?.payload?.detail || e?.message || "Push to social failed.");
    }
  };

  const selectModel = useCallback((itemId, model) => {
    setModelByItem((m) => ({ ...m, [itemId]: model }));
  }, []);

  const generateVisual = async (item, modelId) => {
    setBusyItem(item.item_id);
    setError("");
    try {
      const res = unwrap(
        await apiClient.post(
          `/api/content-automation/queue/${item.item_id}/generate-visual`,
          { model_id: modelId || DEFAULT_VISUAL_MODEL }
        )
      );
      if (res?.visual_url) {
        setItems((list) =>
          list.map((it) =>
            it.item_id === item.item_id
              ? { ...it, visual_url: res.visual_url }
              : it
          )
        );
      }
    } catch (e) {
      setError(e?.payload?.detail || e?.message || "Visual generation failed.");
    } finally {
      setBusyItem(null);
    }
  };

  const deleteVisual = async (item) => {
    setError("");
    try {
      await apiClient.delete(
        `/api/content-automation/queue/${item.item_id}/visual`
      );
      setItems((list) =>
        list.map((it) =>
          it.item_id === item.item_id ? { ...it, visual_url: null } : it
        )
      );
    } catch (e) {
      setError(e?.payload?.detail || e?.message || "Failed to remove visual.");
    }
  };

  const saveSettings = async (next) => {
    setSavingSettings(true);
    try {
      const res = unwrap(
        await apiClient.post("/api/content-automation/settings", next)
      );
      if (res?.settings) setSettings({ ...DEFAULT_SETTINGS, ...res.settings });
      setSettingsOpen(false);
    } catch (e) {
      setError(e?.payload?.detail || e?.message || "Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  // Client-side filtering.
  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (platformFilter !== "all" && it.platform !== platformFilter) return false;
      if (statusFilter !== "all" && (it.status || "pending") !== statusFilter)
        return false;
      return true;
    });
  }, [items, platformFilter, statusFilter]);

  // Group by run, preserving newest-first order.
  const groups = useMemo(() => {
    const map = new Map();
    for (const it of filtered) {
      const key = it.generation_run_id || "ungrouped";
      if (!map.has(key)) map.set(key, { runId: key, date: it.created_at, items: [] });
      map.get(key).items.push(it);
    }
    return Array.from(map.values());
  }, [filtered]);

  return (
    <DashboardLayout>
      <style>{`@keyframes cth-spin{to{transform:rotate(360deg)}}.cth-spin{animation:cth-spin 1s linear infinite}.cth-thumb{transition:opacity .15s ease}.cth-thumb:hover{opacity:.82}`}</style>
      <div style={{ padding: "28px 32px", maxWidth: 980, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 22,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: SERIF,
                fontSize: 40,
                fontWeight: 600,
                color: "var(--cth-command-ink)",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Content Queue
            </h1>
            <p
              style={{
                marginTop: 6,
                fontSize: 15,
                color: "var(--cth-command-muted)",
                maxWidth: 560,
              }}
            >
              Review, edit, and approve auto-generated platform-native content
              before posting.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setSettingsOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 16px",
                borderRadius: 10,
                border: "1px solid var(--cth-command-border)",
                background: "var(--cth-command-panel)",
                color: "var(--cth-command-ink)",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              <SettingsIcon size={16} /> Settings
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: "var(--cth-command-crimson)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: generating ? "not-allowed" : "pointer",
                opacity: generating ? 0.65 : 1,
              }}
            >
              {generating ? (
                <Loader2 size={16} className="cth-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {generating ? "Generating…" : "Generate Now"}
            </button>
          </div>
        </div>

        {error ? (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(180,67,67,0.1)",
              border: "1px solid var(--cth-command-error)",
              color: "var(--cth-command-error)",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        ) : null}

        {notice ? (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              background:
                notice.type === "success"
                  ? "rgba(45,106,79,0.12)"
                  : "var(--cth-command-panel-soft)",
              border: `1px solid ${
                notice.type === "success"
                  ? "var(--cth-command-success)"
                  : "var(--cth-command-border)"
              }`,
              color:
                notice.type === "success"
                  ? "var(--cth-command-success)"
                  : "var(--cth-command-ink)",
              fontSize: 14,
            }}
          >
            <span>{notice.text}</span>
            <button
              onClick={() => setNotice(null)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                flexShrink: 0,
                display: "inline-flex",
              }}
              aria-label="Dismiss"
            >
              <XIcon size={16} />
            </button>
          </div>
        ) : null}

        {/* Filters */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill
              active={platformFilter === "all"}
              onClick={() => setPlatformFilter("all")}
              accentColor="var(--cth-command-ink)"
            >
              All
            </Pill>
            {PLATFORM_ORDER.map((p) => (
              <Pill
                key={p}
                active={platformFilter === p}
                onClick={() => setPlatformFilter(p)}
                accentColor={PLATFORM_META[p].color}
              >
                {PLATFORM_META[p].label}
              </Pill>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STATUS_FILTERS.map((s) => (
              <Pill
                key={s.key}
                active={statusFilter === s.key}
                onClick={() => setStatusFilter(s.key)}
                accentColor="var(--cth-command-crimson)"
              >
                {s.label}
              </Pill>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "var(--cth-command-muted)",
              padding: 40,
              justifyContent: "center",
            }}
          >
            <Loader2 size={20} className="cth-spin" /> Loading queue…
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              background: "#1a0828",
              borderRadius: 18,
              padding: "44px 32px",
              textAlign: "center",
            }}
          >
            <Sparkles
              size={30}
              style={{ color: "var(--cth-command-gold)", marginBottom: 14 }}
            />
            <h3
              style={{
                fontFamily: SERIF,
                fontSize: 26,
                fontWeight: 600,
                color: "var(--cth-command-ivory)",
                margin: "0 0 10px",
              }}
            >
              Your content queue is empty
            </h3>
            <p
              style={{
                color: "var(--cth-command-blush)",
                fontSize: 15,
                lineHeight: 1.6,
                maxWidth: 520,
                margin: "0 auto 22px",
              }}
            >
              Hit Generate Now to create 21 platform-native posts from your brand
              data — campaigns, content pillars, and buyer signals combined.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 22px",
                borderRadius: 10,
                border: "none",
                background: "var(--cth-command-crimson)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                cursor: generating ? "not-allowed" : "pointer",
                opacity: generating ? 0.65 : 1,
              }}
            >
              {generating ? (
                <Loader2 size={16} className="cth-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {generating ? "Generating…" : "Generate Now"}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: 36,
              textAlign: "center",
              color: "var(--cth-command-muted)",
              fontSize: 15,
            }}
          >
            No items match the current filters.
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.runId} style={{ marginBottom: 28 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    color: "var(--cth-command-muted)",
                  }}
                >
                  Run · {formatRunDate(group.date)}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--cth-command-muted)",
                  }}
                >
                  ({group.items.length})
                </span>
                <span
                  style={{
                    flex: 1,
                    height: 1,
                    background: "var(--cth-command-border)",
                  }}
                />
              </div>
              {group.items.map((it) => (
                <QueueItemCard
                  key={it.item_id}
                  item={it}
                  onPatch={patchItem}
                  onPush={pushItem}
                  onGenerateVisual={generateVisual}
                  onDeleteVisual={deleteVisual}
                  busy={busyItem}
                  higgsfieldConnected={higgsfieldConnected}
                  selectedModel={modelByItem[it.item_id] || DEFAULT_VISUAL_MODEL}
                  onSelectModel={selectModel}
                />
              ))}
            </div>
          ))
        )}
      </div>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={saveSettings}
        saving={savingSettings}
      />
    </DashboardLayout>
  );
}
