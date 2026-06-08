import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Mail,
  Save,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Plug,
  ShieldCheck,
  AtSign,
} from "lucide-react";
import { DashboardLayout } from "../components/Layout";
import apiClient from "../lib/apiClient";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";

const PAGE_STYLE = {
  background: "var(--cth-command-panel-soft)",
  minHeight: "100%",
};

const CARD_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: 24,
};

const LABEL_STYLE = {
  display: "block",
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--cth-command-muted)",
  marginBottom: 8,
};

const INPUT_STYLE = {
  width: "100%",
  background: "var(--cth-command-panel-soft)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: "11px 14px",
  fontFamily: SANS,
  fontSize: 14,
  color: "var(--cth-command-ink)",
  outline: "none",
};

const PRIMARY_BUTTON_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "var(--cth-command-purple)",
  color: "var(--cth-command-gold)",
  border: "none",
  borderRadius: 4,
  padding: "11px 20px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.04em",
  cursor: "pointer",
};

const SECTION_EYEBROW = {
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--cth-command-crimson)",
  margin: 0,
};

const CARD_TITLE = {
  fontFamily: SERIF,
  fontSize: 24,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  margin: "6px 0 0",
  letterSpacing: "-0.005em",
  lineHeight: 1.2,
};

const HELPER_TEXT = {
  fontFamily: SANS,
  fontSize: 13,
  lineHeight: 1.6,
  color: "var(--cth-command-muted)",
  margin: 0,
};

const COMING_SOON = [
  {
    id: "convertkit",
    name: "ConvertKit",
    description: "Sync subscribers and broadcasts with your ConvertKit account.",
    icon: Mail,
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Send and track email directly through a connected Google mailbox.",
    icon: AtSign,
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Push audiences and campaigns to your Mailchimp lists.",
    icon: Mail,
  },
];

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.tone === "error";
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "11px 16px",
        borderRadius: 4,
        background: isError ? "var(--cth-command-error)" : "var(--cth-command-ink)",
        color: "var(--cth-command-ivory)",
        fontFamily: SANS,
        fontSize: 13,
        fontWeight: 500,
        boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
      }}
    >
      {!isError ? <CheckCircle2 size={16} /> : null}
      <span>{toast.message}</span>
    </div>
  );
}

function normalizeList(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  return [];
}

export default function EmailSettings() {
  const [fromName, setFromName] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [integration, setIntegration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, tone = "success") => setToast({ message, tone });

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(id);
  }, [toast]);

  const apiKeyLast4 = integration?.settings?.api_key_last4 || "";
  const connected = useMemo(() => Boolean(apiKeyLast4), [apiKeyLast4]);

  const applyIntegration = useCallback((record) => {
    setIntegration(record || null);
    const settings = record?.settings || {};
    setFromName(String(settings.from_name || ""));
    setFromAddress(String(settings.from_address || ""));
  }, []);

  const loadIntegration = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get("/api/mail/integrations");
      const saved = normalizeList(data, "integrations");
      const resend = saved.find((item) => item.provider === "resend");
      applyIntegration(resend || null);
    } catch {
      showToast("Unable to load email settings.", "error");
    } finally {
      setLoading(false);
    }
  }, [applyIntegration]);

  useEffect(() => {
    loadIntegration();
  }, [loadIntegration]);

  const handleSaveSender = async () => {
    setSaving(true);
    try {
      const res = await apiClient.post("/api/mail/integrations", {
        provider: "resend",
        settings: {
          from_name: fromName.trim(),
          from_address: fromAddress.trim(),
        },
      });
      if (res?.integration) applyIntegration(res.integration);
      showToast("Sender identity saved.");
    } catch (err) {
      showToast(
        err?.response?.data?.detail || err?.message || "Unable to save sender identity.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async () => {
    const key = apiKey.trim();
    if (!key) {
      showToast("Enter your Resend API key to connect.", "error");
      return;
    }
    setConnecting(true);
    try {
      const res = await apiClient.post("/api/mail/integrations", {
        provider: "resend",
        credentials: { api_key: key },
      });
      if (res?.integration) applyIntegration(res.integration);
      setApiKey("");
      showToast("Resend connected.");
    } catch (err) {
      showToast(
        err?.response?.data?.detail || err?.message || "Unable to connect Resend.",
        "error"
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setConnecting(true);
    try {
      const res = await apiClient.post("/api/mail/integrations", {
        provider: "resend",
        status: "not_connected",
        clear_credentials: true,
      });
      if (res?.integration) applyIntegration(res.integration);
      showToast("Resend disconnected.");
    } catch (err) {
      showToast(
        err?.response?.data?.detail || err?.message || "Unable to disconnect Resend.",
        "error"
      );
    } finally {
      setConnecting(false);
    }
  };

  return (
    <DashboardLayout>
      <header className="cth-page-header">
        <div className="min-w-0 flex-1">
          <h1
            className="text-2xl md:text-[32px] leading-tight truncate"
            style={{ fontFamily: SERIF, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}
          >
            Email Settings
          </h1>
          <p
            className="text-xs md:text-sm truncate"
            style={{ margin: "6px 0 0 0", color: "var(--cth-command-muted)", fontFamily: SANS }}
          >
            Configure how the platform sends emails on your behalf.
          </p>
        </div>
      </header>

      <div style={PAGE_STYLE} className="px-4 py-6 md:px-7 md:py-8">
        <div className="mx-auto w-full max-w-[820px] space-y-6">
          {/* ============ Section 1 — Sender identity ============ */}
          <section style={CARD_STYLE}>
            <p style={SECTION_EYEBROW}>Sender configuration</p>
            <h2 style={CARD_TITLE}>Sender identity</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label style={LABEL_STYLE} htmlFor="from-name">From name</label>
                <input
                  id="from-name"
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="e.g. Shake at Core Truth House"
                  style={INPUT_STYLE}
                  disabled={loading}
                />
              </div>
              <div>
                <label style={LABEL_STYLE} htmlFor="from-email">From email</label>
                <input
                  id="from-email"
                  type="email"
                  value={fromAddress}
                  onChange={(e) => setFromAddress(e.target.value)}
                  placeholder="e.g. hello@yourdomain.com"
                  style={INPUT_STYLE}
                  disabled={loading}
                />
              </div>
            </div>

            <p style={{ ...HELPER_TEXT, marginTop: 14 }}>
              This is the name and email address your subscribers and clients will see when
              they receive emails from the platform.
            </p>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSender}
                disabled={saving || loading}
                style={{ ...PRIMARY_BUTTON_STYLE, opacity: saving || loading ? 0.7 : 1 }}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? "Saving…" : "Save sender identity"}
              </button>
            </div>
          </section>

          {/* ============ Section 2 — Resend integration ============ */}
          <section style={CARD_STYLE}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p style={SECTION_EYEBROW}>Integration</p>
                <h2 style={CARD_TITLE}>Resend</h2>
              </div>
              {connected ? (
                <span
                  className="inline-flex items-center gap-1.5"
                  style={{
                    background: "color-mix(in srgb, var(--cth-command-success) 12%, var(--cth-command-panel))",
                    color: "var(--cth-command-success)",
                    border: "1px solid color-mix(in srgb, var(--cth-command-success) 35%, var(--cth-command-border))",
                    borderRadius: 4,
                    padding: "5px 12px",
                    fontFamily: SANS,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  <CheckCircle2 size={13} />
                  Connected
                </span>
              ) : null}
            </div>

            <p style={{ ...HELPER_TEXT, marginTop: 14 }}>
              Connect your own Resend account to send emails from your custom domain. When
              connected, all platform emails sent on your behalf will use your Resend API key
              and sender address.
            </p>

            {connected ? (
              <div
                className="mt-5"
                style={{
                  background: "var(--cth-command-panel-soft)",
                  border: "1px solid var(--cth-command-border)",
                  borderRadius: 4,
                  padding: 18,
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2" style={{ fontFamily: SANS, fontSize: 13, color: "var(--cth-command-ink)" }}>
                      <ShieldCheck size={15} style={{ color: "var(--cth-command-success)" }} />
                      <span style={{ fontWeight: 600 }}>API key</span>
                      <span style={{ fontFamily: SANS, letterSpacing: "0.1em", color: "var(--cth-command-muted)" }}>
                        ••••••••{apiKeyLast4}
                      </span>
                    </div>
                    {integration?.settings?.from_address ? (
                      <div className="flex items-center gap-2" style={{ fontFamily: SANS, fontSize: 13, color: "var(--cth-command-muted)" }}>
                        <AtSign size={15} />
                        <span>{integration.settings.from_address}</span>
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={connecting}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: "transparent",
                      color: "var(--cth-command-crimson)",
                      border: "1px solid color-mix(in srgb, var(--cth-command-crimson) 35%, var(--cth-command-border))",
                      borderRadius: 4,
                      padding: "10px 18px",
                      fontFamily: SANS,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: connecting ? "not-allowed" : "pointer",
                      opacity: connecting ? 0.7 : 1,
                    }}
                  >
                    {connecting ? <Loader2 size={15} className="animate-spin" /> : null}
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <label style={LABEL_STYLE} htmlFor="resend-key">Resend API key</label>
                <input
                  id="resend-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="re_••••••••••••••••"
                  autoComplete="off"
                  style={INPUT_STYLE}
                  disabled={connecting || loading}
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <a
                    href="https://resend.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5"
                    style={{
                      fontFamily: SANS,
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--cth-command-crimson)",
                      textDecoration: "none",
                    }}
                  >
                    Get your API key at resend.com
                    <ExternalLink size={13} />
                  </a>
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={connecting || loading}
                    style={{ ...PRIMARY_BUTTON_STYLE, opacity: connecting || loading ? 0.7 : 1 }}
                  >
                    {connecting ? <Loader2 size={15} className="animate-spin" /> : <Plug size={15} />}
                    {connecting ? "Connecting…" : "Connect"}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ============ Section 3 — Coming soon integrations ============ */}
          <section>
            <p style={{ ...SECTION_EYEBROW, color: "var(--cth-command-muted)", marginBottom: 12 }}>
              More integrations coming soon
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {COMING_SOON.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.id}
                    style={{
                      background: "var(--cth-command-panel)",
                      border: "1px solid var(--cth-command-border)",
                      borderRadius: 4,
                      padding: 16,
                      opacity: 0.7,
                    }}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center"
                        style={{
                          borderRadius: 4,
                          background: "color-mix(in srgb, var(--cth-command-gold) 12%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--cth-command-gold) 32%, transparent)",
                          color: "var(--cth-command-crimson)",
                        }}
                      >
                        <Icon size={17} />
                      </div>
                      <span
                        style={{
                          background: "var(--cth-command-panel-soft)",
                          color: "var(--cth-command-muted)",
                          border: "1px solid var(--cth-command-border)",
                          borderRadius: 4,
                          padding: "3px 8px",
                          fontFamily: SANS,
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                        }}
                      >
                        Coming soon
                      </span>
                    </div>
                    <h3
                      style={{
                        fontFamily: SERIF,
                        fontSize: 18,
                        fontWeight: 600,
                        color: "var(--cth-command-ink)",
                        margin: 0,
                      }}
                    >
                      {item.name}
                    </h3>
                    <p style={{ ...HELPER_TEXT, fontSize: 12, marginTop: 4 }}>{item.description}</p>
                  </article>
                );
              })}
            </div>
          </section>

          {/* ============ Zuri card ============ */}
          <div style={{ background: "#1a0828", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "var(--cth-command-cinnabar)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 8, fontWeight: 600, color: "var(--cth-command-ivory)" }}>Z</span>
              </div>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 8,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--cth-command-muted)",
                }}
              >
                Zuri · Sender Trust
              </span>
            </div>
            <div
              style={{
                fontFamily: SERIF,
                fontSize: 15,
                color: "var(--cth-command-blush)",
                fontStyle: "italic",
                lineHeight: 1.55,
              }}
            >
              "Your sender email is a brand signal. Using a custom domain rather than a shared
              platform address builds trust before the email is opened."
            </div>
          </div>
        </div>
      </div>

      <Toast toast={toast} />
    </DashboardLayout>
  );
}
