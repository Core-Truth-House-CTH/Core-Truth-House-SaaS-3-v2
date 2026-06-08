import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useUser } from '../hooks/useAuth';
import { DashboardLayout } from '../components/Layout';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  User,
  Instagram,
  Linkedin,
  Facebook,
  Twitter,
  Youtube,
  Globe,
  Save,
  Bell,
  CreditCard,
  ChevronRight,
  Check,
  CheckCircle,
  XCircle,
  Loader2,
  Music,
  Link2,
  Building2,
  Mail,
  Palette,
  Trash2,
  Plus,
  ExternalLink,
  Plug,
  Zap,
  Workflow,
} from 'lucide-react';
import { usePlan } from '../context/PlanContext';
import { NotificationPreferences } from '../components/NotificationPreferences';
import { IOSInstallInstructions } from '../pwa/PWAProvider';
import apiClient from "../lib/apiClient";
import { toast } from 'sonner';
import MailIntegrationsSettings from "../components/mail/MailIntegrationsSettings";
import SocialConnectionsSection from "../components/SocialConnectionsSection";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";
const MONO = "'DM Mono', ui-monospace, 'SF Mono', Menlo, monospace";

// Brand Identity — font options per role (must match Identity Studio families).
const BI_DISPLAY_FONTS = ['Cormorant Garamond', 'Fraunces', 'Playfair Display', 'Libre Baskerville'];
const BI_BODY_FONTS = ['DM Sans', 'Manrope', 'Inter', 'Plus Jakarta Sans'];

// Canonical two font roles, mirroring Identity Studio so saved data round-trips.
const BI_DEFAULT_FONTS = [
  { id: 'display', role: 'display', label: 'Display / Heading', family: 'Cormorant Garamond', source: 'system' },
  { id: 'body', role: 'body', label: 'Body / UI', family: 'DM Sans', source: 'system' },
];

const BI_DEFAULT_COLORS = [
  { id: 'primary', role: 'primary', label: 'Primary', hex: '#AF0024' },
  { id: 'secondary', role: 'secondary', label: 'Secondary', hex: '#1A0828' },
];

function biIsValidHex(value) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

function biMergeFonts(saved) {
  const list = Array.isArray(saved) ? saved : [];
  return BI_DEFAULT_FONTS.map((def, i) => {
    const match =
      list.find((f) => f.id === def.id) ||
      list.find((f) => f.role === def.role) ||
      list[i];
    if (!match) return { ...def };
    return { ...def, family: match.family || def.family, source: match.source || 'system' };
  });
}

// Integrations tab — coming-soon providers (non-clickable cards).
const INTEGRATIONS_COMING_SOON = [
  { id: 'convertkit', name: 'ConvertKit', description: 'Sync subscribers and broadcasts with your ConvertKit account.', icon: Mail },
  { id: 'zapier', name: 'Zapier', description: 'Trigger thousands of apps when things happen in your workspace.', icon: Zap },
  { id: 'make', name: 'Make', description: 'Build visual automations across your tools with Make scenarios.', icon: Workflow },
];

const PAGE_STYLE = {
  background: 'var(--cth-command-blush)',
  minHeight: '100vh',
};

const CARD_STYLE = {
  background: 'var(--cth-command-panel)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 12,
};

const INNER_CARD_STYLE = {
  background: 'var(--cth-command-panel)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 10,
};

const SECTION_LABEL_STYLE = {
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--cth-command-muted)',
  margin: 0,
};

const SECTION_HEADING_STYLE = {
  fontFamily: SERIF,
  fontSize: 22,
  fontWeight: 500,
  color: 'var(--cth-command-ink)',
  margin: 0,
  letterSpacing: '-0.005em',
  lineHeight: 1.25,
};

const SUBHEAD_STYLE = {
  fontFamily: SERIF,
  fontSize: 17,
  fontWeight: 600,
  color: 'var(--cth-command-ink)',
  margin: 0,
  letterSpacing: '-0.005em',
  lineHeight: 1.3,
};

const BODY_STYLE = {
  fontFamily: SANS,
  fontSize: 13,
  lineHeight: 1.6,
  color: 'var(--cth-command-ink)',
  margin: 0,
};

const MUTED_STYLE = {
  fontFamily: SANS,
  fontSize: 12,
  lineHeight: 1.55,
  color: 'var(--cth-command-muted)',
  margin: 0,
};

const FIELD_LABEL_STYLE = {
  display: 'block',
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  color: 'var(--cth-command-ink)',
  marginBottom: 6,
};

const INPUT_STYLE = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'var(--cth-command-panel)',
  color: 'var(--cth-command-ink)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 7,
  padding: '9px 12px',
  fontFamily: SANS,
  fontSize: 13,
  outline: 'none',
};

const TEXTAREA_STYLE = {
  ...INPUT_STYLE,
  padding: '10px 12px',
  lineHeight: 1.55,
  resize: 'vertical',
};

const PRIMARY_CTA_STYLE = {
  background: 'var(--cth-command-purple)',
  color: 'var(--cth-command-gold)',
  border: 'none',
  borderRadius: 7,
  padding: '10px 18px',
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const PRIMARY_CTA_SMALL_STYLE = {
  ...PRIMARY_CTA_STYLE,
  padding: '6px 12px',
  fontSize: 11,
};

const SECONDARY_BUTTON_STYLE = {
  background: 'transparent',
  color: 'var(--cth-command-ink)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 7,
  padding: '10px 18px',
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};

const DESTRUCTIVE_BUTTON_STYLE = {
  background: 'var(--cth-command-crimson)',
  color: 'var(--cth-command-ivory)',
  border: 'none',
  borderRadius: 7,
  padding: '10px 18px',
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const DESTRUCTIVE_BUTTON_SMALL_STYLE = {
  ...DESTRUCTIVE_BUTTON_STYLE,
  padding: '6px 12px',
  fontSize: 11,
};

function statusColor(value) {
  if (value === 'verified') return 'var(--cth-command-success)';
  if (value === 'failed') return 'var(--cth-danger)';
  return 'var(--cth-command-muted)';
}

function Modal({ open, onClose, children, ariaLabel }) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(13, 0, 16, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          ...CARD_STYLE,
          width: '100%',
          maxWidth: 480,
          padding: 28,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function Settings() {
  const { user } = useUser();
  const { plan, isSuperAdmin } = usePlan();
  const { activeWorkspace, refreshWorkspaces } = useWorkspace();
  const [searchParams] = useSearchParams();

  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    display_name: '',
    bio: '',
    website: '',
  });

  const [brandName, setBrandName] = useState('');
  const [brandNameSaving, setBrandNameSaving] = useState(false);

  const [socials, setSocials] = useState({
    instagram: '',
    linkedin: '',
    facebook: '',
    twitter: '',
    tiktok: '',
    youtube: '',
  });

  const [notifications, setNotifications] = useState({
    weekly_digest: true,
    billing_alerts: true,
    team_invites: true,
    ai_usage_alerts: true,
  });

  const [domainData, setDomainData] = useState(null);
  const [domainInput, setDomainInput] = useState('');
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainLoading, setDomainLoading] = useState(false);
  const [dnsVerifying, setDnsVerifying] = useState(false);
  const [dnsResult, setDnsResult] = useState(null);

  const [confirmRenameOpen, setConfirmRenameOpen] = useState(false);
  const [confirmRemoveDomainOpen, setConfirmRemoveDomainOpen] = useState(false);

  const canUseDomain = isSuperAdmin || ['house', 'estate'].includes(String(plan || '').toLowerCase());
  const canUseBrandIdentity = isSuperAdmin || ['house', 'estate'].includes(String(plan || '').toLowerCase());

  // Brand Identity (House+) — colors + fonts synced with Identity Studio.
  const [biColors, setBiColors] = useState(BI_DEFAULT_COLORS);
  const [biFonts, setBiFonts] = useState(BI_DEFAULT_FONTS);
  const [biLoading, setBiLoading] = useState(false);
  const [biSaving, setBiSaving] = useState(false);
  const [biSaved, setBiSaved] = useState(false);
  const [biConfirmDeleteIndex, setBiConfirmDeleteIndex] = useState(null);
  const biColorLabelFocusRef = React.useRef('');

  // Integrations — Higgsfield connect state (no plan gating).
  const [hfLoading, setHfLoading] = useState(false);
  const [hfConnected, setHfConnected] = useState(false);
  const [hfLast4, setHfLast4] = useState('');
  const [hfApiKey, setHfApiKey] = useState('');
  const [hfApiSecret, setHfApiSecret] = useState('');
  const [hfSaving, setHfSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user?.id]);

  useEffect(() => {
    if (activeWorkspace) {
      setBrandName(activeWorkspace.brand_name || activeWorkspace.name || '');
    }
  }, [activeWorkspace]);

  useEffect(() => {
    if (activeTab === 'domain' && canUseDomain) loadDomain();
  }, [activeTab, canUseDomain]);

  useEffect(() => {
    const nextTab = searchParams.get('tab') || 'profile';
    // Foundation / Structure users may not reach Brand Identity — bounce to profile.
    if (nextTab === 'brand-identity' && !canUseBrandIdentity) {
      setActiveTab('profile');
      return;
    }
    setActiveTab(nextTab);
  }, [searchParams, canUseBrandIdentity]);

  // If the plan resolves after mount and the user is sitting on a gated tab, redirect.
  useEffect(() => {
    if (activeTab === 'brand-identity' && !canUseBrandIdentity) {
      setActiveTab('profile');
    }
  }, [activeTab, canUseBrandIdentity]);

  useEffect(() => {
    if (activeTab === 'brand-identity' && canUseBrandIdentity) loadBrandIdentity();
  }, [activeTab, canUseBrandIdentity, user?.id]);

  useEffect(() => {
    if (activeTab === 'integrations') loadHiggsfield();
  }, [activeTab]);

  const loadDomain = async () => {
    if (!activeWorkspace?.id) return;
    if (!user?.id) return;
    setDomainLoading(true);

    try {
      const res = await apiClient.get("/custom-domain", { params: { workspace_id: activeWorkspace?.id || '', user_id: user.id } });
      if (res.data.domain) {
        setDomainData(res.data.domain);
        setDomainInput(res.data.domain.domain || '');
      }
    } catch {
      // Domain may not exist yet.
    } finally {
      setDomainLoading(false);
    }
  };

  const saveDomain = async () => {
    if (!activeWorkspace?.id) {
      toast.error("No active workspace found. Please refresh.");
      return;
    }
    if (!domainInput.trim()) return;
    setDomainSaving(true);

    try {
      await apiClient.post("/custom-domain", {
        domain: domainInput.trim(),
        workspace_id: activeWorkspace?.id || '',
        user_id: user?.id,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      loadDomain();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to save domain');
    } finally {
      setDomainSaving(false);
    }
  };

  const requestRemoveDomain = () => {
    setConfirmRemoveDomainOpen(true);
  };

  const performRemoveDomain = async () => {
    if (!activeWorkspace?.id) {
      toast.error("No active workspace found. Please refresh.");
      return;
    }
    setConfirmRemoveDomainOpen(false);
    try {
      await apiClient.delete('/custom-domain', {
        params: {
          workspace_id: activeWorkspace?.id || '',
          user_id: user?.id || '',
        },
      });
      setDomainData(null);
      setDomainInput('');
      setDnsResult(null);
    } catch {
      toast.error('Failed to remove domain');
    }
  };

  const verifyDns = async () => {
    if (!activeWorkspace?.id) {
      toast.error("No active workspace found. Please refresh.");
      return;
    }
    setDnsVerifying(true);
    setDnsResult(null);

    try {
      const res = await apiClient.post("/custom-domain/verify", {}, { params: { workspace_id: activeWorkspace?.id || '', user_id: user?.id } });
      setDnsResult(res.data);
      loadDomain();
    } catch (e) {
      setDnsResult({
        verified: false,
        error: e.response?.data?.detail || 'Verification failed',
      });
    } finally {
      setDnsVerifying(false);
    }
  };

  const loadBrandIdentity = async () => {
    if (!user?.id) return;
    setBiLoading(true);
    try {
      const res = await apiClient.get('/api/identity', { params: { user_id: user.id } });
      if (Array.isArray(res?.colors) && res.colors.length > 0) {
        setBiColors(res.colors);
      }
      if (Array.isArray(res?.fonts) && res.fonts.length > 0) {
        setBiFonts(biMergeFonts(res.fonts));
      }
    } catch (e) {
      // No identity yet — keep defaults.
    } finally {
      setBiLoading(false);
    }
  };

  const persistBrandIdentity = async (nextColors, nextFonts) => {
    await apiClient.post('/api/identity/save', {
      workspace_id: activeWorkspace?.id || activeWorkspace?.workspace_id || '',
      colors: nextColors,
      fonts: nextFonts,
    });
  };

  const biFontFamily = (roleId) =>
    biFonts.find((f) => f.id === roleId)?.family || (roleId === 'display' ? 'Cormorant Garamond' : 'DM Sans');

  const handleBiFontChange = (roleId, family) => {
    setBiFonts((prev) => prev.map((f) => (f.id === roleId ? { ...f, family, source: 'system' } : f)));
  };

  const handleBiColorHexChange = (index, hex) => {
    setBiColors((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], hex };
      return next;
    });
  };

  const handleBiColorLabelChange = (index, label) => {
    setBiColors((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], label, role: label };
      return next;
    });
  };

  // Auto-save a color rename on blur, only when the name actually changed —
  // same interaction as Identity Studio.
  const handleBiColorLabelBlur = async (value) => {
    if (value === biColorLabelFocusRef.current) return;
    try {
      await persistBrandIdentity(biColors, biFonts);
    } catch (e) {
      toast.error('Could not save color name. Please try again.');
    }
  };

  const handleBiAddColor = () => {
    setBiColors((prev) => [
      ...prev,
      { id: `color-custom-${prev.length}`, role: 'custom', label: 'New Color', hex: '#000000' },
    ]);
  };

  const performBiDeleteColor = async (index) => {
    const prevColors = biColors;
    const nextColors = biColors.filter((_, i) => i !== index);
    setBiConfirmDeleteIndex(null);
    setBiColors(nextColors);
    try {
      await persistBrandIdentity(nextColors, biFonts);
    } catch (e) {
      setBiColors(prevColors);
      toast.error('Could not delete color. Please try again.');
    }
  };

  const requestBiDeleteColor = (index) => {
    if (biColors.length <= 1) {
      setBiConfirmDeleteIndex(index);
    } else {
      performBiDeleteColor(index);
    }
  };

  const handleSaveBrandIdentity = async () => {
    setBiSaving(true);
    try {
      await persistBrandIdentity(biColors, biFonts);
      setBiSaved(true);
      setTimeout(() => setBiSaved(false), 2000);
      toast.success('Brand identity updated.');
    } catch (e) {
      console.error('Save brand identity failed', e);
      toast.error('Could not save brand identity. Please try again.');
    } finally {
      setBiSaving(false);
    }
  };

  const loadHiggsfield = async () => {
    setHfLoading(true);
    try {
      const res = await apiClient.get('/api/integrations/higgsfield');
      setHfConnected(!!res?.connected);
      setHfLast4(res?.api_key_last4 || '');
    } catch (e) {
      // Not connected yet, or workspace not resolved.
      setHfConnected(false);
      setHfLast4('');
    } finally {
      setHfLoading(false);
    }
  };

  const handleConnectHiggsfield = async () => {
    if (!hfApiKey.trim() || !hfApiSecret.trim()) {
      toast.error('Enter both your API key and API secret.');
      return;
    }
    setHfSaving(true);
    try {
      const res = await apiClient.post('/api/integrations/higgsfield', {
        api_key: hfApiKey.trim(),
        api_secret: hfApiSecret.trim(),
      });
      setHfConnected(true);
      setHfLast4(res?.api_key_last4 || hfApiKey.trim().slice(-4));
      setHfApiKey('');
      setHfApiSecret('');
      toast.success('Higgsfield connected.');
    } catch (e) {
      toast.error(e.message || 'Failed to connect Higgsfield.');
    } finally {
      setHfSaving(false);
    }
  };

  const handleDisconnectHiggsfield = async () => {
    setHfSaving(true);
    try {
      await apiClient.delete('/api/integrations/higgsfield');
      setHfConnected(false);
      setHfLast4('');
      toast.success('Higgsfield disconnected.');
    } catch (e) {
      toast.error(e.message || 'Failed to disconnect Higgsfield.');
    } finally {
      setHfSaving(false);
    }
  };

  const loadSettings = async () => {
    if (!user?.id) return;

    try {
      const res = await apiClient.get("/settings", { params: { user_id: user.id } });
      if (res.data.profile) setProfile(res.data.profile);
      if (res.data.socials) setSocials(res.data.socials);
      if (res.data.notifications) setNotifications(res.data.notifications);
    } catch {
      // No settings yet.
    }

    if (activeWorkspace) {
      setBrandName(activeWorkspace.brand_name || activeWorkspace.name || '');
    }
  };

  const requestSaveBrandName = () => {
    if (!activeWorkspace?.id || !brandName.trim()) return;
    setConfirmRenameOpen(true);
  };

  const performSaveBrandName = async () => {
    setConfirmRenameOpen(false);
    if (!activeWorkspace?.id || !brandName.trim()) return;
    setBrandNameSaving(true);

    try {
      await apiClient.put(`/workspaces/${activeWorkspace.id}`, {
        brand_name: brandName.trim(),
      });

      await refreshWorkspaces();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save brand name:', e);
      toast.error('Failed to save brand name. Please try again.');
    } finally {
      setBrandNameSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      await apiClient.post("/settings", {
        user_id: user?.id,
        profile,
        socials,
        notifications,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Save settings failed', e);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'workspace', label: 'Workspace', icon: Building2 },
    ...(canUseBrandIdentity ? [{ id: 'brand-identity', label: 'Brand Identity', icon: Palette }] : []),
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'socials', label: 'Social Media', icon: Instagram },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'mail', label: 'Mail Integrations', icon: Mail },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    ...(canUseDomain ? [{ id: 'domain', label: 'Custom Domain', icon: Link2 }] : []),
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  ];

  const socialFields = [
    { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@yourbrand' },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'linkedin.com/in/yourname' },
    { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'facebook.com/yourpage' },
    { key: 'twitter', label: 'X (Twitter)', icon: Twitter, placeholder: '@yourhandle' },
    { key: 'tiktok', label: 'TikTok', icon: Music, placeholder: '@yourtiktok' },
    { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'youtube.com/@yourchannel' },
  ];

  const sidebar = (
    <aside
      className="md:sticky md:top-4 md:self-start"
      style={{
        background: 'var(--cth-command-purple)',
        borderRadius: 12,
        border: '1px solid var(--cth-command-border)',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <nav style={{ padding: '12px 0' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              data-testid={`settings-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: active
                  ? 'color-mix(in srgb, var(--cth-command-ivory) 8%, var(--cth-command-purple))'
                  : 'transparent',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                borderLeft: `3px solid ${active ? 'var(--cth-command-crimson)' : 'transparent'}`,
                padding: '10px 16px',
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                color: active
                  ? 'var(--cth-command-ivory)'
                  : 'color-mix(in srgb, var(--cth-command-ivory) 78%, var(--cth-command-purple))',
                textAlign: 'left',
                cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <DashboardLayout>
      <header className="cth-page-header">
        <div className="min-w-0 flex-1">
          <h1
            className="text-2xl md:text-[32px] leading-tight truncate"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}
          >
            Settings
          </h1>
          <p
            className="text-xs md:text-sm truncate"
            style={{ margin: "6px 0 0 0", color: "var(--cth-command-muted)", fontFamily: "'DM Sans', sans-serif" }}
          >
            Manage your profile, social links, and preferences
          </p>
        </div>
      </header>

      <div
        className="flex-1 overflow-auto px-4 py-7 md:px-8"
        style={PAGE_STYLE}
        data-testid="settings-page"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-5 md:flex-row md:gap-6">
            <div className="md:w-[220px] md:shrink-0">{sidebar}</div>

            <main className="min-w-0 flex-1">
              {activeTab === 'workspace' && (
                <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                  <h2 style={SECTION_HEADING_STYLE}>Brand / Workspace Name</h2>
                  <p style={{ ...MUTED_STYLE, marginTop: 8, marginBottom: 20 }}>
                    This name appears throughout the platform and in your exported materials.
                  </p>

                  <div className="mb-5">
                    <label style={FIELD_LABEL_STYLE}>Brand Name</label>
                    <input
                      data-testid="brand-name-input"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Enter your brand name..."
                      style={INPUT_STYLE}
                    />
                  </div>

                  <button
                    data-testid="save-brand-name-btn"
                    onClick={requestSaveBrandName}
                    disabled={brandNameSaving || !brandName.trim()}
                    type="button"
                    style={{
                      ...PRIMARY_CTA_STYLE,
                      opacity: brandNameSaving || !brandName.trim() ? 0.65 : 1,
                      cursor: brandNameSaving || !brandName.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {brandNameSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {brandNameSaving ? 'Saving...' : 'Save Brand Name'}
                  </button>

                  <div
                    className="mt-6 pt-5"
                    style={{ borderTop: '1px solid var(--cth-command-border)' }}
                  >
                    <p style={{ ...SECTION_LABEL_STYLE, marginBottom: 8 }}>Current Workspace ID</p>
                    <div
                      style={{
                        ...INNER_CARD_STYLE,
                        background: 'var(--cth-command-panel-soft)',
                        padding: 12,
                        fontFamily: MONO,
                        fontSize: 12,
                        color: 'var(--cth-command-muted)',
                      }}
                    >
                      {activeWorkspace?.id || ', '}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'brand-identity' && canUseBrandIdentity && (
                <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                  <h2 style={SECTION_HEADING_STYLE}>Brand Identity</h2>
                  <p style={{ ...MUTED_STYLE, marginTop: 8, marginBottom: 24 }}>
                    Your core brand colors and fonts. These power your templates, exports, and AI-generated content.
                  </p>

                  {biLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2
                        size={20}
                        className="animate-spin"
                        style={{ color: 'var(--cth-command-crimson)' }}
                      />
                    </div>
                  ) : (
                    <>
                      {/* Brand colors */}
                      <p style={{ ...SECTION_LABEL_STYLE, marginBottom: 14 }}>Brand colors</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {biColors.map((color, index) => {
                          const pickerValue = biIsValidHex(color.hex) ? color.hex : '#000000';
                          const swatchBg = biIsValidHex(color.hex) ? color.hex : (color.hex || '#000000');
                          return (
                            <div
                              key={color.id || index}
                              className="group"
                              style={{
                                ...INNER_CARD_STYLE,
                                background: 'var(--cth-command-panel-soft)',
                                padding: 12,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                              }}
                            >
                              {/* Color circle — click opens native picker */}
                              <div
                                className="relative shrink-0"
                                style={{ width: 36, height: 36 }}
                                title="Click to change color"
                              >
                                <div
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: swatchBg,
                                    border: '1px solid var(--cth-command-border)',
                                  }}
                                />
                                <input
                                  type="color"
                                  value={pickerValue}
                                  onChange={(e) => handleBiColorHexChange(index, (e.target.value || '').toUpperCase())}
                                  aria-label={`Pick color for ${color.label || color.role || 'swatch'}`}
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0,
                                    cursor: 'pointer',
                                    border: 'none',
                                    padding: 0,
                                    background: 'transparent',
                                  }}
                                />
                              </div>

                              <div style={{ minWidth: 0, flex: 1 }}>
                                {biConfirmDeleteIndex === index ? (
                                  <div data-testid={`bi-color-delete-confirm-${index}`}>
                                    <p style={{ ...MUTED_STYLE, margin: '0 0 8px', color: 'var(--cth-command-ink)' }}>
                                      This is your only brand color. Delete it?
                                    </p>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                      <button
                                        type="button"
                                        data-testid={`bi-color-delete-yes-${index}`}
                                        onClick={() => performBiDeleteColor(index)}
                                        style={{ ...DESTRUCTIVE_BUTTON_SMALL_STYLE }}
                                      >
                                        Delete
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setBiConfirmDeleteIndex(null)}
                                        style={{ ...SECONDARY_BUTTON_STYLE, padding: '6px 12px', fontSize: 11 }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <input
                                      data-testid={`bi-color-name-${index}`}
                                      value={color.label || ''}
                                      onChange={(e) => handleBiColorLabelChange(index, e.target.value)}
                                      onFocus={(e) => { biColorLabelFocusRef.current = e.target.value; }}
                                      onBlur={(e) => handleBiColorLabelBlur(e.target.value)}
                                      placeholder="Color name"
                                      className="w-full bg-transparent border-0 p-0 focus:outline-none"
                                      style={{
                                        fontFamily: SANS,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: 'var(--cth-command-ink)',
                                      }}
                                    />
                                    <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--cth-command-muted)', textTransform: 'uppercase' }}>
                                      {color.hex}
                                    </span>
                                  </>
                                )}
                              </div>

                              {biConfirmDeleteIndex !== index && (
                                <button
                                  type="button"
                                  data-testid={`bi-color-delete-${index}`}
                                  onClick={() => requestBiDeleteColor(index)}
                                  aria-label={`Delete ${color.label || color.role || 'color'}`}
                                  title="Delete color"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    border: '1px solid var(--cth-command-border)',
                                    background: 'transparent',
                                    color: 'var(--cth-command-crimson)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          data-testid="bi-add-color-btn"
                          onClick={handleBiAddColor}
                          style={{
                            minHeight: 60,
                            border: '1px dashed var(--cth-command-border)',
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            cursor: 'pointer',
                            background: 'var(--cth-command-panel-soft)',
                            color: 'var(--cth-command-muted)',
                            fontFamily: SANS,
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          <Plus size={15} />
                          Add color
                        </button>
                      </div>

                      {/* Brand fonts */}
                      <p style={{ ...SECTION_LABEL_STYLE, marginTop: 28, marginBottom: 14 }}>Brand fonts</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label style={FIELD_LABEL_STYLE}>Display font</label>
                          <select
                            data-testid="bi-font-display"
                            value={biFontFamily('display')}
                            onChange={(e) => handleBiFontChange('display', e.target.value)}
                            style={INPUT_STYLE}
                          >
                            {BI_DISPLAY_FONTS.map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={FIELD_LABEL_STYLE}>Body font</label>
                          <select
                            data-testid="bi-font-body"
                            value={biFontFamily('body')}
                            onChange={(e) => handleBiFontChange('body', e.target.value)}
                            style={INPUT_STYLE}
                          >
                            {BI_BODY_FONTS.map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <p style={{ ...MUTED_STYLE, marginTop: 20 }}>
                        Changes here sync with your Identity Studio. For full brand configuration including logo and assets, visit{' '}
                        <Link
                          to="/identity-studio"
                          style={{ color: 'var(--cth-command-crimson)', fontWeight: 600, textDecoration: 'none' }}
                        >
                          Identity Studio
                        </Link>
                        .
                      </p>

                      <div className="flex justify-end pt-6">
                        <button
                          data-testid="bi-save-btn"
                          onClick={handleSaveBrandIdentity}
                          disabled={biSaving}
                          type="button"
                          style={{
                            ...PRIMARY_CTA_STYLE,
                            background: biSaved ? 'var(--cth-command-success)' : 'var(--cth-command-purple)',
                            color: biSaved ? 'var(--cth-command-ivory)' : 'var(--cth-command-gold)',
                            cursor: biSaving ? 'wait' : 'pointer',
                          }}
                        >
                          {biSaving ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : biSaved ? (
                            <Check size={15} />
                          ) : (
                            <Save size={15} />
                          )}
                          {biSaving ? 'Saving...' : biSaved ? 'Saved!' : 'Save Brand Identity'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'profile' && (
                <div>
                  <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                    <div className="mb-6 flex items-center gap-4">
                      <div
                        className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full"
                        style={{
                          background: 'var(--cth-command-panel-soft)',
                          border: '1px solid var(--cth-command-border)',
                        }}
                      >
                        {user?.imageUrl ? (
                          <img src={user.imageUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <User size={28} style={{ color: 'var(--cth-command-muted)' }} />
                        )}
                      </div>

                      <div>
                        <div
                          style={{
                            fontFamily: SERIF,
                            fontSize: 18,
                            fontWeight: 600,
                            color: 'var(--cth-command-ink)',
                            letterSpacing: '-0.005em',
                          }}
                        >
                          {user?.fullName || 'Your Name'}
                        </div>
                        <div style={{ ...MUTED_STYLE, marginTop: 2, fontSize: 13 }}>
                          {user?.primaryEmailAddress?.emailAddress}
                        </div>
                        <a
                          href="https://accounts.clerk.dev/user"
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-block',
                            marginTop: 6,
                            fontFamily: SANS,
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--cth-command-crimson)',
                            textDecoration: 'none',
                          }}
                        >
                          Update photo & name via Clerk →
                        </a>
                      </div>
                    </div>

                    <div className="mb-5">
                      <label style={FIELD_LABEL_STYLE}>Clerk User ID</label>
                      <div
                        style={{
                          ...CARD_STYLE,
                          background: 'var(--cth-command-panel-soft)',
                          padding: 12,
                          fontFamily: MONO,
                          fontSize: 12,
                          color: 'var(--cth-command-muted)',
                        }}
                      >
                        {user?.id || ', '}
                      </div>
                    </div>

                    <div className="mb-5">
                      <label style={FIELD_LABEL_STYLE}>Bio / Short Description</label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        placeholder="A short description of your brand or role..."
                        rows={3}
                        style={TEXTAREA_STYLE}
                      />
                    </div>

                    <div>
                      <label style={FIELD_LABEL_STYLE}>Website URL</label>
                      <div className="relative">
                        <Globe
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2"
                          style={{ color: 'var(--cth-command-muted)' }}
                        />
                        <input
                          value={profile.website}
                          onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                          placeholder="https://yourbrand.com"
                          style={{ ...INPUT_STYLE, paddingLeft: 36 }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <IOSInstallInstructions />
                  </div>
                </div>
              )}

              {activeTab === 'socials' && (
                <>
                  <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                    <SocialConnectionsSection />
                  </div>

                  <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                    <h2 style={SECTION_HEADING_STYLE}>Social Media Handles</h2>
                    <p style={{ ...MUTED_STYLE, marginTop: 8, marginBottom: 20 }}>
                      These are used in your Brand Kit Export and Content Studio context.
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                      {socialFields.map((field) => {
                        const Icon = field.icon;

                        return (
                          <div key={field.key}>
                            <label style={FIELD_LABEL_STYLE}>{field.label}</label>
                            <div className="relative">
                              <Icon
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2"
                                style={{ color: 'var(--cth-command-muted)' }}
                              />
                              <input
                                data-testid={`social-${field.key}`}
                                value={socials[field.key]}
                                onChange={(e) => setSocials({ ...socials, [field.key]: e.target.value })}
                                placeholder={field.placeholder}
                                style={{ ...INPUT_STYLE, paddingLeft: 36 }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'notifications' && (
                <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                  <NotificationPreferences />
                </div>
              )}

              {activeTab === 'mail' && (
                <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                  <MailIntegrationsSettings />
                </div>
              )}

              {activeTab === 'integrations' && (
                <>
                  {/* Section 1 — Higgsfield */}
                  <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 style={SECTION_HEADING_STYLE}>Higgsfield</h2>
                        <p style={{ ...MUTED_STYLE, marginTop: 8, maxWidth: 560 }}>
                          Connect your own Higgsfield account to use your credits for AI image and video
                          generation in Studios. Get your credentials at cloud.higgsfield.ai.
                        </p>
                      </div>
                      {hfConnected && (
                        <span
                          data-testid="higgsfield-connected-badge"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            flexShrink: 0,
                            background: 'color-mix(in srgb, var(--cth-command-success) 14%, var(--cth-command-panel))',
                            color: 'var(--cth-command-success)',
                            border: '1px solid color-mix(in srgb, var(--cth-command-success) 35%, var(--cth-command-border))',
                            borderRadius: 20,
                            padding: '4px 12px',
                            fontFamily: SANS,
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                          }}
                        >
                          <CheckCircle size={13} />
                          Connected
                        </span>
                      )}
                    </div>

                    {hfLoading ? (
                      <div className="flex justify-center p-8">
                        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--cth-command-crimson)' }} />
                      </div>
                    ) : hfConnected ? (
                      <div className="mt-5">
                        <label style={FIELD_LABEL_STYLE}>API key</label>
                        <div
                          style={{
                            ...INNER_CARD_STYLE,
                            background: 'var(--cth-command-panel-soft)',
                            padding: 12,
                            fontFamily: MONO,
                            fontSize: 13,
                            color: 'var(--cth-command-muted)',
                            letterSpacing: '0.08em',
                          }}
                        >
                          {`•••• •••• •••• ${hfLast4 || '••••'}`}
                        </div>
                        <div className="flex justify-end mt-5">
                          <button
                            data-testid="higgsfield-disconnect-btn"
                            onClick={handleDisconnectHiggsfield}
                            disabled={hfSaving}
                            type="button"
                            style={{
                              ...DESTRUCTIVE_BUTTON_STYLE,
                              opacity: hfSaving ? 0.65 : 1,
                              cursor: hfSaving ? 'wait' : 'pointer',
                            }}
                          >
                            {hfSaving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            {hfSaving ? 'Disconnecting...' : 'Disconnect'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label style={FIELD_LABEL_STYLE}>API key</label>
                            <input
                              data-testid="higgsfield-api-key"
                              type="password"
                              value={hfApiKey}
                              onChange={(e) => setHfApiKey(e.target.value)}
                              placeholder="Your Higgsfield API key"
                              autoComplete="off"
                              style={INPUT_STYLE}
                            />
                          </div>
                          <div>
                            <label style={FIELD_LABEL_STYLE}>API secret</label>
                            <input
                              data-testid="higgsfield-api-secret"
                              type="password"
                              value={hfApiSecret}
                              onChange={(e) => setHfApiSecret(e.target.value)}
                              placeholder="Your Higgsfield API secret"
                              autoComplete="off"
                              style={INPUT_STYLE}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 mt-5 flex-wrap">
                          <a
                            href="https://cloud.higgsfield.ai"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontFamily: SANS,
                              fontSize: 12,
                              fontWeight: 600,
                              color: 'var(--cth-command-crimson)',
                              textDecoration: 'none',
                            }}
                          >
                            Get your credentials at cloud.higgsfield.ai
                            <ExternalLink size={13} />
                          </a>

                          <button
                            data-testid="higgsfield-connect-btn"
                            onClick={handleConnectHiggsfield}
                            disabled={hfSaving || !hfApiKey.trim() || !hfApiSecret.trim()}
                            type="button"
                            style={{
                              ...PRIMARY_CTA_STYLE,
                              opacity: hfSaving || !hfApiKey.trim() || !hfApiSecret.trim() ? 0.65 : 1,
                              cursor: hfSaving || !hfApiKey.trim() || !hfApiSecret.trim() ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {hfSaving ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />}
                            {hfSaving ? 'Connecting...' : 'Connect'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 2 — Coming soon */}
                  <div className="mb-5">
                    <p style={{ ...SECTION_LABEL_STYLE, marginBottom: 12 }}>More integrations coming soon</p>
                    <div className="grid gap-4 md:grid-cols-3">
                      {INTEGRATIONS_COMING_SOON.map((item) => {
                        const Icon = item.icon;
                        return (
                          <article
                            key={item.id}
                            style={{ ...INNER_CARD_STYLE, padding: 16, opacity: 0.7 }}
                          >
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center"
                                style={{
                                  borderRadius: 8,
                                  background: 'color-mix(in srgb, var(--cth-command-gold) 12%, transparent)',
                                  border: '1px solid color-mix(in srgb, var(--cth-command-gold) 32%, transparent)',
                                  color: 'var(--cth-command-crimson)',
                                }}
                              >
                                <Icon size={17} />
                              </div>
                              <span
                                style={{
                                  background: 'var(--cth-command-panel-soft)',
                                  color: 'var(--cth-command-muted)',
                                  border: '1px solid var(--cth-command-border)',
                                  borderRadius: 20,
                                  padding: '3px 8px',
                                  fontFamily: SANS,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  letterSpacing: '0.12em',
                                  textTransform: 'uppercase',
                                }}
                              >
                                Coming soon
                              </span>
                            </div>
                            <h3
                              style={{
                                fontFamily: SERIF,
                                fontSize: 18,
                                fontWeight: 500,
                                color: 'var(--cth-command-ink)',
                                margin: 0,
                              }}
                            >
                              {item.name}
                            </h3>
                            <p style={{ ...MUTED_STYLE, fontSize: 12, marginTop: 4 }}>{item.description}</p>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'domain' && canUseDomain && (
                <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                  <h2 style={SECTION_HEADING_STYLE}>Custom Domain</h2>
                  <p style={{ ...MUTED_STYLE, marginTop: 8, marginBottom: 20 }}>
                    Map your own domain to your brand workspace. Available on The House and The Estate plans.
                  </p>

                  {domainLoading ? (
                    <div className="flex justify-center p-5">
                      <Loader2
                        size={20}
                        className="animate-spin"
                        style={{ color: 'var(--cth-command-crimson)' }}
                      />
                    </div>
                  ) : (
                    <>
                      {domainData && (
                        <div
                          className="mb-4"
                          style={{
                            ...INNER_CARD_STYLE,
                            background: 'var(--cth-command-panel-soft)',
                            padding: 16,
                          }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div
                                style={{
                                  fontFamily: SANS,
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: 'var(--cth-command-ink)',
                                }}
                              >
                                {domainData.domain}
                              </div>
                              <div
                                style={{
                                  fontFamily: SANS,
                                  fontSize: 11,
                                  marginTop: 6,
                                  color: statusColor(domainData.status),
                                }}
                              >
                                Status:{' '}
                                {domainData.status === 'verified'
                                  ? 'Verified'
                                  : domainData.status === 'failed'
                                  ? 'DNS Verification Failed'
                                  : 'Pending Verification'}
                              </div>

                              {domainData.dns_error && domainData.status !== 'verified' && (
                                <div
                                  style={{
                                    marginTop: 6,
                                    fontFamily: SANS,
                                    fontSize: 10,
                                    color: 'var(--cth-danger)',
                                  }}
                                >
                                  {domainData.dns_error}
                                </div>
                              )}

                              {domainData.last_checked && (
                                <div style={{ ...MUTED_STYLE, marginTop: 6, fontSize: 10 }}>
                                  Last checked: {new Date(domainData.last_checked).toLocaleString()}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {domainData.status !== 'verified' && (
                                <button
                                  data-testid="verify-dns-btn"
                                  onClick={verifyDns}
                                  disabled={dnsVerifying}
                                  type="button"
                                  style={{
                                    ...PRIMARY_CTA_SMALL_STYLE,
                                    opacity: dnsVerifying ? 0.65 : 1,
                                    cursor: dnsVerifying ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  {dnsVerifying ? 'Checking...' : 'Verify DNS'}
                                </button>
                              )}

                              <button
                                onClick={requestRemoveDomain}
                                type="button"
                                style={DESTRUCTIVE_BUTTON_SMALL_STYLE}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <label style={FIELD_LABEL_STYLE}>Domain Name</label>
                      <div className="flex gap-2">
                        <input
                          data-testid="custom-domain-input"
                          value={domainInput}
                          onChange={(e) => setDomainInput(e.target.value)}
                          placeholder="yourbrand.com"
                          style={{ ...INPUT_STYLE, flex: 1 }}
                        />

                        <button
                          data-testid="save-domain-btn"
                          onClick={saveDomain}
                          disabled={domainSaving || !domainInput.trim()}
                          type="button"
                          style={{
                            ...PRIMARY_CTA_STYLE,
                            whiteSpace: 'nowrap',
                            opacity: !domainInput.trim() ? 0.65 : 1,
                            cursor: !domainInput.trim() ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {domainSaving ? 'Saving...' : 'Save Domain'}
                        </button>
                      </div>

                      <div
                        className="mt-4"
                        style={{
                          ...INNER_CARD_STYLE,
                          background: 'color-mix(in srgb, var(--cth-command-crimson) 6%, var(--cth-command-panel))',
                          borderColor: 'color-mix(in srgb, var(--cth-command-crimson) 25%, var(--cth-command-border))',
                          padding: 16,
                        }}
                      >
                        <div
                          style={{
                            ...SECTION_LABEL_STYLE,
                            color: 'var(--cth-command-crimson)',
                          }}
                        >
                          DNS Configuration
                        </div>
                        <div style={{ ...MUTED_STYLE, marginTop: 8, fontSize: 12 }}>
                          Point your domain&apos;s DNS to our servers by adding a CNAME record:
                          <br />
                          <code
                            style={{
                              display: 'inline-block',
                              marginTop: 6,
                              background: 'var(--cth-command-panel-soft)',
                              border: '1px solid var(--cth-command-border)',
                              borderRadius: 8,
                              padding: '4px 8px',
                              fontFamily: MONO,
                              fontSize: 11,
                              color: 'var(--cth-command-ink)',
                            }}
                          >
                            CNAME yourbrand.com → app.coretruthhouse.com
                          </code>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                  <h2 style={SECTION_HEADING_STYLE}>Billing & Plan</h2>
                  <p style={{ ...MUTED_STYLE, marginTop: 8, marginBottom: 20 }}>
                    Manage your subscription, view invoices, and purchase credit top-ups.
                  </p>

                  <Link to="/billing" style={PRIMARY_CTA_STYLE}>
                    Go to Billing & Plans <ChevronRight size={15} />
                  </Link>
                </div>
              )}

              {activeTab !== 'billing' &&
                activeTab !== 'domain' &&
                activeTab !== 'mail' &&
                activeTab !== 'brand-identity' &&
                activeTab !== 'integrations' && (
                  <div className="flex justify-end pt-2">
                    <button
                      data-testid="settings-save-btn"
                      onClick={handleSave}
                      disabled={saving}
                      type="button"
                      style={{
                        ...PRIMARY_CTA_STYLE,
                        background: saved
                          ? 'var(--cth-command-success)'
                          : 'var(--cth-command-purple)',
                        color: saved ? 'var(--cth-command-ivory)' : 'var(--cth-command-gold)',
                        cursor: saving ? 'wait' : 'pointer',
                      }}
                    >
                      {saving ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : saved ? (
                        <Check size={15} />
                      ) : (
                        <Save size={15} />
                      )}
                      {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
                    </button>
                  </div>
                )}
            </main>
          </div>
        </div>
      </div>

      {/* Modals */}

      <Modal
        open={confirmRenameOpen}
        onClose={() => setConfirmRenameOpen(false)}
        ariaLabel="Rename Workspace"
      >
        <h2 style={SECTION_HEADING_STYLE}>Rename Workspace</h2>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 14,
            color: 'var(--cth-command-muted)',
            margin: '12px 0 24px',
            lineHeight: 1.6,
          }}
        >
          Renaming your workspace will update it across the platform. This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmRenameOpen(false)}
            style={SECONDARY_BUTTON_STYLE}
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="confirm-rename-btn"
            onClick={performSaveBrandName}
            style={DESTRUCTIVE_BUTTON_STYLE}
          >
            Confirm Rename
          </button>
        </div>
      </Modal>

      <Modal
        open={confirmRemoveDomainOpen}
        onClose={() => setConfirmRemoveDomainOpen(false)}
        ariaLabel="Remove Custom Domain"
      >
        <h2 style={SECTION_HEADING_STYLE}>Remove Custom Domain</h2>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 14,
            color: 'var(--cth-command-muted)',
            margin: '12px 0 24px',
            lineHeight: 1.6,
          }}
        >
          Are you sure you want to remove this domain? Your workspace will revert to the default URL.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmRemoveDomainOpen(false)}
            style={SECONDARY_BUTTON_STYLE}
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="confirm-remove-domain-btn"
            onClick={performRemoveDomain}
            style={DESTRUCTIVE_BUTTON_STYLE}
          >
            Remove Domain
          </button>
        </div>
      </Modal>

      <Modal
        open={!!dnsResult}
        onClose={() => setDnsResult(null)}
        ariaLabel="DNS Verification Result"
      >
        <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
          {dnsResult?.verified ? (
            <CheckCircle size={32} style={{ color: 'var(--cth-command-success)' }} />
          ) : (
            <XCircle size={32} style={{ color: 'var(--cth-command-crimson)' }} />
          )}
          <h2 style={SECTION_HEADING_STYLE}>
            {dnsResult?.verified ? 'Domain Verified' : 'Verification Failed'}
          </h2>
        </div>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 14,
            color: 'var(--cth-command-muted)',
            margin: '0 0 24px',
            lineHeight: 1.6,
          }}
        >
          {dnsResult?.verified
            ? 'Your domain has been successfully verified and is now active.'
            : dnsResult?.error || 'DNS verification could not be completed. Check your CNAME record and try again.'}
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setDnsResult(null)}
            style={PRIMARY_CTA_STYLE}
          >
            Close
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
