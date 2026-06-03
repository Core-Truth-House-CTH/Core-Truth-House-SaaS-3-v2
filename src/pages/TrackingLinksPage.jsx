import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/Layout';
import { useWorkspace } from '../context/WorkspaceContext';
import apiClient from '../lib/apiClient';
import { API_PATHS } from '../lib/apiPaths';
import { toast } from 'sonner';
import { Link2, Copy, Pencil, Trash2, Plus, X, ChevronDown, ChevronRight, Tag, Lock } from 'lucide-react';
import { usePlan } from '../context/PlanContext';

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";

const PAGE_STYLE = { background: 'var(--cth-command-blush)', minHeight: '100vh' };

const CARD_STYLE = {
  background: 'var(--cth-command-panel)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 12,
};

const INPUT_STYLE = {
  width: '100%',
  background: 'var(--cth-command-panel)',
  color: 'var(--cth-command-ink)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 8,
  padding: '8px 12px',
  fontFamily: SANS,
  fontSize: 13,
  outline: 'none',
};

const LABEL_STYLE = {
  display: 'block',
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--cth-command-muted)',
  marginBottom: 6,
};

const PRIMARY_BTN = {
  background: 'var(--cth-command-crimson)',
  color: 'var(--cth-command-ivory)',
  border: 'none',
  borderRadius: 8,
  padding: '9px 16px',
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.03em',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
};

const GHOST_BTN = {
  background: 'transparent',
  color: 'var(--cth-command-ink)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 8,
  padding: '9px 16px',
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};

// Buyer signal levels 1-5 (matches backend SIGNAL_LEVELS).
const SIGNAL_LEVELS = [
  { value: 1, label: '1 · Recognition' },
  { value: 2, label: '2 · Problem Ownership' },
  { value: 3, label: '3 · Solution Curiosity' },
  { value: 4, label: '4 · Offer Curiosity' },
  { value: 5, label: '5 · Purchase Movement' },
];

const SOURCE_PLATFORMS = [
  'Instagram', 'LinkedIn', 'TikTok', 'YouTube', 'Email', 'Podcast',
  'X / Twitter', 'Facebook', 'Threads', 'Website', 'Other',
];

const CTA_TYPES = [
  'Book a call', 'Join waitlist', 'View pricing', 'Download diagnostic',
  'Start checkout', 'Read content', 'Watch video', 'Other',
];

// Conversion event types — must match backend CONVERSION_EVENT_TYPES exactly
// (mail.py). These exact strings are sent as event_type.
const EVENT_TYPES = [
  'Booked call', 'Joined waitlist', 'Clicked pricing',
  'Downloaded diagnostic', 'Started checkout', 'Purchased',
];

// Funnel Snapshot (Component C). Five-stage path matching backend FUNNEL_STAGES.
// Keyword tokens mirror the backend's _funnel_stage_for (mail.py) so the snapshot
// agrees with the dashboard drop-off card. Unlike the backend catch-all (which
// routes everything unmatched to Content Post), links whose cta_type/name match
// no funnel stage are surfaced as "Unassigned" rather than dropped or hidden.
const FUNNEL_STAGES = ['Content Post', 'Diagnostic Page', 'Results Page', 'Pricing Page', 'Checkout'];

function funnelStageFor(link) {
  const hay = [link.cta_type, link.link_role, link.link_name, link.label]
    .map((v) => String(v || '').toLowerCase())
    .join(' ');
  if (['checkout', 'purchase', 'buy'].some((t) => hay.includes(t))) return 'Checkout';
  if (['pricing', 'price', 'offer'].some((t) => hay.includes(t))) return 'Pricing Page';
  if (hay.includes('result')) return 'Results Page';
  if (['diagnostic', 'quiz', 'assessment'].some((t) => hay.includes(t))) return 'Diagnostic Page';
  // Content Post only when there's no cta_type at all, or it reads as content.
  if (!String(link.cta_type || '').trim() || hay.includes('content')) return 'Content Post';
  return 'Unassigned';
}

const EMPTY_FORM = {
  link_name: '',
  target_url: '',
  source_platform: '',
  campaign_id: '',
  offer_id: '',
  signal_level: '',
  cta_type: '',
  notes: '',
  is_active: true,
};

// Tier gating (Component D) — Structure and above. Mirrors CustomerJourney.
const LOCKED_PLANS = new Set(['free', 'audit', 'foundation']);

function LockedView() {
  return (
    <DashboardLayout>
      <header className="cth-page-header" style={{ background: '#fff', borderBottom: '0.5px solid #e8d5d0' }}>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-[32px] leading-tight truncate" style={{ fontFamily: SERIF, fontWeight: 600, color: '#1a0828', margin: 0 }}>
            Tracking Links
          </h1>
          <p className="text-xs md:text-sm truncate" style={{ margin: '6px 0 0 0', color: '#7c6576', fontFamily: SANS }}>
            Create trackable links and watch buyer signal move through your funnel.
          </p>
        </div>
      </header>
      <div className="flex-1 overflow-auto" style={PAGE_STYLE}>
        <div className="mx-auto max-w-3xl px-4 py-16 md:px-8 md:py-24">
          <div style={{ background: '#fff', border: '0.5px solid #e8d5d0', borderRadius: 12, padding: 40, textAlign: 'center' }}>
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center"
              style={{ borderRadius: 10, background: 'color-mix(in srgb, #5d0012 12%, transparent)', color: '#5d0012' }}
            >
              <Lock size={22} />
            </div>
            <p style={{ fontFamily: SANS, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7c6576', margin: '18px 0 0' }}>
              Structure Plan Required
            </p>
            <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 500, color: '#1a0828', margin: '8px 0 0', lineHeight: 1.2 }}>
              Tracking Links
            </h2>
            <p style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.65, color: '#7c6576', margin: '14px auto 24px', maxWidth: 520 }}>
              Create trackable links, tag conversions, and watch buyer signal move through your funnel.
              Available on The Structure plan and above.
            </p>
            <a
              href="/billing"
              className="inline-flex items-center gap-2"
              style={{ background: '#5d0012', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 22px', fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', cursor: 'pointer', textDecoration: 'none' }}
            >
              Upgrade to Structure
              <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function DashboardCard({ label, value, hint }) {
  return (
    <div style={{ ...CARD_STYLE, padding: '14px 16px', minHeight: 92, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--cth-command-muted)' }}>
        {label}
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: 'var(--cth-command-ink)', lineHeight: 1.1, marginTop: 8 }}>
        {value ?? '—'}
      </div>
      {hint ? (
        <div style={{ fontFamily: SANS, fontSize: 10.5, color: 'var(--cth-command-muted)', marginTop: 4 }}>{hint}</div>
      ) : null}
    </div>
  );
}

function TrackingLinksContent() {
  const { activeWorkspace } = useWorkspace();
  const { plan } = usePlan();
  const workspaceId = activeWorkspace?.id || activeWorkspace?.workspace_id || '';
  const isLocked = LOCKED_PLANS.has(String(plan || 'free').toLowerCase());

  const [links, setLinks] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [offers, setOffers] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [confirmedSignals, setConfirmedSignals] = useState([]);
  const [funnelCampaignId, setFunnelCampaignId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fld = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const campaignName = useCallback(
    (id) => campaigns.find((c) => c.id === id)?.name || '',
    [campaigns]
  );
  const offerName = useCallback(
    (id) => offers.find((o) => o.id === id)?.name || '',
    [offers]
  );

  const loadAll = useCallback(async () => {
    if (!workspaceId || isLocked) return;
    setIsLoading(true);
    try {
      const [linksRes, dashRes, campRes, offerRes, signalsRes] = await Promise.all([
        apiClient.get(API_PATHS.trackingLinks.list).catch(() => ({ tracking_links: [] })),
        apiClient.get(API_PATHS.trackingLinks.dashboard).catch(() => null),
        apiClient.get(API_PATHS.campaigns.list).catch(() => ({ campaigns: [] })),
        apiClient.get(API_PATHS.offers.list).catch(() => ({ offers: [] })),
        apiClient.get(API_PATHS.buyerSignals.list({ status: 'confirmed' })).catch(() => ({ signals: [] })),
      ]);
      setLinks(Array.isArray(linksRes?.tracking_links) ? linksRes.tracking_links : []);
      setDashboard(dashRes || null);
      setCampaigns(Array.isArray(campRes?.campaigns) ? campRes.campaigns : []);
      setOffers(Array.isArray(offerRes?.offers) ? offerRes.offers : []);
      // Client-side confirmed filter is the safety net in case the query param is ignored.
      const allSignals = Array.isArray(signalsRes?.signals) ? signalsRes.signals : [];
      setConfirmedSignals(allSignals.filter((s) => String(s?.status).toLowerCase() === 'confirmed'));
    } catch (e) {
      console.error('Failed to load tracking links:', e);
      toast.error('Could not load tracking links.');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, isLocked]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  }

  function openEdit(link) {
    setEditingId(link.id);
    setForm({
      link_name: link.link_name || link.label || '',
      target_url: link.target_url || '',
      source_platform: link.source_platform || link.platform || '',
      campaign_id: link.campaign_id || '',
      offer_id: link.offer_id || '',
      signal_level: link.signal_level || '',
      cta_type: link.cta_type || '',
      notes: link.notes || '',
      is_active: link.is_active !== false,
    });
    setEditorOpen(true);
  }

  async function handleSave() {
    if (!form.link_name.trim()) {
      toast.error('Give the link a name.');
      return;
    }
    if (!/^https?:\/\//i.test(form.target_url.trim())) {
      toast.error('Destination URL must start with http:// or https://');
      return;
    }
    setIsSaving(true);
    const payload = {
      link_name: form.link_name.trim(),
      label: form.link_name.trim(),
      target_url: form.target_url.trim(),
      source_platform: form.source_platform,
      source_type: 'manual',
      campaign_id: form.campaign_id || null,
      offer_id: form.offer_id || null,
      signal_level: form.signal_level === '' ? null : Number(form.signal_level),
      cta_type: form.cta_type,
      notes: form.notes,
      is_active: form.is_active,
    };
    try {
      if (editingId) {
        await apiClient.patch(API_PATHS.trackingLinks.byId(editingId), payload);
        toast.success('Link updated.');
      } else {
        await apiClient.post(API_PATHS.trackingLinks.create, payload);
        toast.success('Link created.');
      }
      setEditorOpen(false);
      await loadAll();
    } catch (e) {
      console.error('Save failed:', e);
      toast.error(e.response?.data?.detail || 'Could not save link.');
    } finally {
      setIsSaving(false);
    }
  }

  const [pendingDelete, setPendingDelete] = useState(null);
  async function confirmDelete() {
    const link = pendingDelete;
    setPendingDelete(null);
    if (!link) return;
    try {
      await apiClient.delete(API_PATHS.trackingLinks.byId(link.id));
      toast.success('Link deleted.');
      await loadAll();
    } catch (e) {
      console.error('Delete failed:', e);
      toast.error('Could not delete link.');
    }
  }

  // ---- Conversion Notes (Component A) ----
  const [expandedId, setExpandedId] = useState(null);
  const [conversionsByLink, setConversionsByLink] = useState({});
  const [convLoadingId, setConvLoadingId] = useState(null);
  const [tagForm, setTagForm] = useState({ event_type: '', note: '' });
  const [isTagging, setIsTagging] = useState(false);

  const loadConversions = useCallback(async (linkId) => {
    setConvLoadingId(linkId);
    try {
      const res = await apiClient.get(API_PATHS.trackingLinks.conversions(linkId));
      setConversionsByLink((prev) => ({
        ...prev,
        [linkId]: Array.isArray(res?.conversions) ? res.conversions : [],
      }));
    } catch (e) {
      console.error('Failed to load conversions:', e);
      toast.error('Could not load conversion tags.');
    } finally {
      setConvLoadingId(null);
    }
  }, []);

  function toggleExpand(link) {
    setTagForm({ event_type: '', note: '' });
    if (expandedId === link.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(link.id);
    if (!conversionsByLink[link.id]) loadConversions(link.id);
  }

  async function handleAddTag(linkId) {
    if (!tagForm.event_type) {
      toast.error('Pick an event type.');
      return;
    }
    setIsTagging(true);
    try {
      await apiClient.post(API_PATHS.trackingLinks.conversions(linkId), {
        event_type: tagForm.event_type,
        note: tagForm.note.trim(),
      });
      toast.success('Conversion tagged.');
      setTagForm({ event_type: '', note: '' });
      await loadConversions(linkId);
    } catch (e) {
      console.error('Tag failed:', e);
      toast.error(e.response?.data?.detail || 'Could not tag conversion.');
    } finally {
      setIsTagging(false);
    }
  }

  function copyTrackingUrl(link) {
    const url = link.tracking_url || (link.tracking_id ? `${window.location.origin}/api/mail/r/${link.tracking_id}` : '');
    if (!url) {
      toast.error('No trackable URL on this link.');
      return;
    }
    navigator.clipboard.writeText(url).then(
      () => toast.success('Trackable URL copied.'),
      () => toast.error('Copy failed.')
    );
  }

  const cards = [
    { label: 'Total clicks', value: dashboard?.total_clicks ?? 0 },
    { label: 'Top source', value: dashboard?.top_source || '—' },
    { label: 'Highest signal level', value: dashboard?.highest_signal_level ? `Level ${dashboard.highest_signal_level}` : '—' },
    { label: 'Best campaign', value: dashboard?.best_campaign || '—' },
    { label: 'Drop-off stage', value: dashboard?.drop_off_stage || '—' },
    { label: 'Recommended next action', value: dashboard?.recommended_next_action || '—', isAction: true },
  ];

  // Signal Movement (Component B) — confirmed signals grouped by level 1–5.
  const signalCountsByLevel = SIGNAL_LEVELS.map((lvl) => {
    const count = confirmedSignals.filter(
      (s) => Number(s.confirmed_level ?? s.level ?? s.suggested_level) === lvl.value
    ).length;
    return { ...lvl, count };
  });
  const signalMax = Math.max(1, ...signalCountsByLevel.map((l) => l.count));
  const signalTotal = confirmedSignals.length;

  // Funnel Snapshot (Component C) — per-campaign click path across five stages.
  const selectedFunnelId = funnelCampaignId || campaigns[0]?.id || '';
  const funnelLinks = links.filter((l) => l.campaign_id === selectedFunnelId);
  const funnelStageClicks = FUNNEL_STAGES.map((stage) => {
    const stageLinks = funnelLinks.filter((l) => funnelStageFor(l) === stage);
    const clicks = stageLinks.reduce((sum, l) => sum + (Number(l.click_count) || 0), 0);
    return { stage, clicks, links: stageLinks.length };
  });
  const funnelUnassigned = funnelLinks.filter((l) => funnelStageFor(l) === 'Unassigned');
  const funnelUnassignedClicks = funnelUnassigned.reduce((s, l) => s + (Number(l.click_count) || 0), 0);
  const funnelMaxClicks = Math.max(1, ...funnelStageClicks.map((s) => s.clicks));

  if (isLocked) return <LockedView />;

  return (
    <DashboardLayout>
      <div className="flex flex-col" style={PAGE_STYLE} data-testid="tracking-links-page">
        <header className="cth-page-header">
          <div className="min-w-0 flex-1">
            <h1
              className="text-2xl md:text-[32px] leading-tight truncate"
              style={{ fontFamily: SERIF, fontWeight: 600, color: 'var(--cth-command-ink)', margin: 0 }}
            >
              Tracking Links
            </h1>
            <p
              className="text-xs md:text-sm truncate"
              style={{ margin: '6px 0 0 0', color: 'var(--cth-command-muted)', fontFamily: SANS }}
            >
              Create trackable links and watch buyer signal move through your funnel.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button type="button" onClick={openCreate} style={PRIMARY_BTN} data-testid="new-link-btn">
              <Plus size={15} /> New link
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto" style={{ padding: '20px 24px' }}>
          {/* Dashboard cards */}
          <div
            className="grid"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 20 }}
          >
            {cards.map((c) => (
              <DashboardCard
                key={c.label}
                label={c.label}
                value={
                  c.isAction
                    ? <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 500, lineHeight: 1.4, color: 'var(--cth-command-ink)' }}>{c.value}</span>
                    : c.value
                }
              />
            ))}
          </div>

          {/* Signal Movement (Component B) */}
          <div style={{ ...CARD_STYLE, padding: '16px 18px', marginBottom: 20 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <div>
                <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: 'var(--cth-command-ink)', margin: 0 }}>
                  Signal Movement
                </h2>
                <p style={{ fontFamily: SANS, fontSize: 11.5, color: 'var(--cth-command-muted)', margin: '3px 0 0' }}>
                  Confirmed buyer signals across the five levels.
                </p>
              </div>
              <span style={{ fontFamily: SANS, fontSize: 11, color: 'var(--cth-command-muted)' }}>
                {signalTotal} confirmed
              </span>
            </div>

            {signalTotal === 0 ? (
              <div style={{ fontFamily: SANS, fontSize: 12.5, color: 'var(--cth-command-muted)', padding: '6px 0' }}>
                No confirmed signals yet. Confirm signals in the Signal Inbox and they roll up here.
              </div>
            ) : (
              <div className="flex flex-col" style={{ gap: 9 }}>
                {signalCountsByLevel.map((lvl) => (
                  <div key={lvl.value} className="flex items-center gap-3">
                    <span style={{ fontFamily: SANS, fontSize: 11, color: 'var(--cth-command-muted)', width: 132, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lvl.label}
                    </span>
                    <div style={{ flex: 1, height: 18, background: 'var(--cth-command-panel-soft)', borderRadius: 5, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${(lvl.count / signalMax) * 100}%`,
                          height: '100%',
                          background: 'var(--cth-command-crimson)',
                          borderRadius: 5,
                          minWidth: lvl.count > 0 ? 4 : 0,
                          transition: 'width 0.2s',
                        }}
                      />
                    </div>
                    <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: 'var(--cth-command-ink)', width: 28, textAlign: 'right', flexShrink: 0 }}>
                      {lvl.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Funnel Snapshot (Component C) */}
          <div style={{ ...CARD_STYLE, padding: '16px 18px', marginBottom: 20 }}>
            <div className="flex items-center justify-between gap-3 flex-wrap" style={{ marginBottom: 14 }}>
              <div>
                <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: 'var(--cth-command-ink)', margin: 0 }}>
                  Funnel Snapshot
                </h2>
                <p style={{ fontFamily: SANS, fontSize: 11.5, color: 'var(--cth-command-muted)', margin: '3px 0 0' }}>
                  Clicks along the conversion path for one campaign.
                </p>
              </div>
              <select
                style={{ ...INPUT_STYLE, width: 'auto', minWidth: 200 }}
                value={selectedFunnelId}
                onChange={(e) => setFunnelCampaignId(e.target.value)}
                disabled={campaigns.length === 0}
              >
                {campaigns.length === 0 ? <option value="">No campaigns</option> : null}
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {campaigns.length === 0 ? (
              <div style={{ fontFamily: SANS, fontSize: 12.5, color: 'var(--cth-command-muted)', padding: '6px 0' }}>
                Create a campaign and assign tracking links to it to see the funnel.
              </div>
            ) : funnelLinks.length === 0 ? (
              <div style={{ fontFamily: SANS, fontSize: 12.5, color: 'var(--cth-command-muted)', padding: '6px 0' }}>
                No tracking links assigned to this campaign yet.
              </div>
            ) : (
              <>
                <div className="flex flex-col" style={{ gap: 4 }}>
                  {funnelStageClicks.map((s, i) => {
                    const prev = i > 0 ? funnelStageClicks[i - 1].clicks : null;
                    const drop = prev !== null && prev > 0 ? prev - s.clicks : null;
                    const dropPct = drop !== null && prev > 0 ? Math.round((drop / prev) * 100) : null;
                    return (
                      <div key={s.stage}>
                        {i > 0 ? (
                          <div className="flex items-center" style={{ paddingLeft: 140, height: 16 }}>
                            {drop !== null && drop > 0 ? (
                              <span style={{ fontFamily: SANS, fontSize: 9.5, color: 'var(--cth-command-error)', letterSpacing: '0.02em' }}>
                                ↓ {drop} lost ({dropPct}%)
                              </span>
                            ) : (
                              <span style={{ fontFamily: SANS, fontSize: 9.5, color: 'var(--cth-command-muted)' }}>↓</span>
                            )}
                          </div>
                        ) : null}
                        <div className="flex items-center gap-3">
                          <span style={{ fontFamily: SANS, fontSize: 11.5, color: 'var(--cth-command-ink)', fontWeight: 500, width: 128, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.stage}
                          </span>
                          <div style={{ flex: 1, height: 22, background: 'var(--cth-command-panel-soft)', borderRadius: 5, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: `${(s.clicks / funnelMaxClicks) * 100}%`, height: '100%', background: 'var(--cth-command-crimson)', borderRadius: 5, minWidth: s.clicks > 0 ? 4 : 0, transition: 'width 0.2s' }} />
                          </div>
                          <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: 'var(--cth-command-ink)', width: 36, textAlign: 'right', flexShrink: 0 }}>
                            {s.clicks}
                          </span>
                          <span style={{ fontFamily: SANS, fontSize: 9.5, color: 'var(--cth-command-muted)', width: 52, flexShrink: 0 }}>
                            {s.links} link{s.links === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {funnelUnassigned.length > 0 ? (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--cth-command-border)', fontFamily: SANS, fontSize: 11, color: 'var(--cth-command-muted)' }}>
                    <strong style={{ color: 'var(--cth-command-ink)', fontWeight: 600 }}>Unassigned:</strong> {funnelUnassigned.length} link{funnelUnassigned.length === 1 ? '' : 's'} ({funnelUnassignedClicks} click{funnelUnassignedClicks === 1 ? '' : 's'}) — a CTA type that doesn't map to a funnel stage. Not counted in the path above.
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* Link manager */}
          <div style={{ ...CARD_STYLE, padding: 0, overflow: 'hidden' }}>
            <div className="flex items-center justify-between" style={{ padding: '14px 18px', borderBottom: '1px solid var(--cth-command-border)' }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: 'var(--cth-command-ink)', margin: 0 }}>
                Your tracking links
              </h2>
              <span style={{ fontFamily: SANS, fontSize: 11, color: 'var(--cth-command-muted)' }}>
                {links.length} link{links.length === 1 ? '' : 's'}
              </span>
            </div>

            {isLoading ? (
              <div style={{ padding: 40, textAlign: 'center', fontFamily: SANS, fontSize: 13, color: 'var(--cth-command-muted)' }}>
                Loading…
              </div>
            ) : links.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Link2 size={28} style={{ color: 'var(--cth-command-muted)', margin: '0 auto 10px' }} />
                <p style={{ fontFamily: SANS, fontSize: 13, color: 'var(--cth-command-muted)', margin: 0 }}>
                  No tracking links yet. Create your first one to start collecting buyer signal.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {links.map((link) => {
                  const active = link.is_active !== false;
                  const isExpanded = expandedId === link.id;
                  const tags = conversionsByLink[link.id] || [];
                  return (
                    <div key={link.id} style={{ borderBottom: '1px solid var(--cth-command-border)' }}>
                    <div
                      className="flex items-center gap-3"
                      style={{ padding: '12px 18px' }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleExpand(link)}
                        title={isExpanded ? 'Collapse' : 'Conversion notes'}
                        style={{ ...iconBtn, flexShrink: 0 }}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-2" style={{ marginBottom: 3 }}>
                          <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: 'var(--cth-command-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {link.link_name || link.label || 'Untitled link'}
                          </span>
                          <span
                            style={{
                              fontFamily: SANS, fontSize: 9, fontWeight: 600, padding: '1px 7px', borderRadius: 999,
                              background: active ? 'var(--cth-command-panel-soft)' : 'transparent',
                              color: active ? 'var(--cth-command-success)' : 'var(--cth-command-muted)',
                              border: `1px solid ${active ? 'var(--cth-command-success)' : 'var(--cth-command-border)'}`,
                            }}
                          >
                            {active ? 'Active' : 'Inactive'}
                          </span>
                          {link.signal_level ? (
                            <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, padding: '1px 7px', borderRadius: 999, background: 'var(--cth-command-panel-soft)', color: 'var(--cth-command-muted)', border: '1px solid var(--cth-command-border)' }}>
                              Signal {link.signal_level}
                            </span>
                          ) : null}
                        </div>
                        <div style={{ fontFamily: SANS, fontSize: 11, color: 'var(--cth-command-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {[link.source_platform || link.platform, campaignName(link.campaign_id), offerName(link.offer_id)].filter(Boolean).join(' · ') || link.target_url}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 64 }}>
                        <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: 'var(--cth-command-ink)', lineHeight: 1 }}>
                          {link.click_count || 0}
                        </div>
                        <div style={{ fontFamily: SANS, fontSize: 9, color: 'var(--cth-command-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          clicks
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button type="button" onClick={() => copyTrackingUrl(link)} title="Copy trackable URL" style={iconBtn}>
                          <Copy size={15} />
                        </button>
                        <button type="button" onClick={() => openEdit(link)} title="Edit" style={iconBtn}>
                          <Pencil size={15} />
                        </button>
                        <button type="button" onClick={() => setPendingDelete(link)} title="Delete" style={{ ...iconBtn, color: 'var(--cth-command-error)' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div style={{ padding: '4px 18px 16px 41px', background: 'var(--cth-command-panel-soft)' }}>
                        <div style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--cth-command-muted)', margin: '8px 0 8px' }}>
                          Conversion notes
                        </div>

                        {convLoadingId === link.id ? (
                          <div style={{ fontFamily: SANS, fontSize: 12, color: 'var(--cth-command-muted)', padding: '6px 0' }}>Loading…</div>
                        ) : tags.length === 0 ? (
                          <div style={{ fontFamily: SANS, fontSize: 12, color: 'var(--cth-command-muted)', padding: '2px 0 8px' }}>
                            No conversions tagged yet. Log what happened below.
                          </div>
                        ) : (
                          <div className="flex flex-col" style={{ gap: 6, marginBottom: 10 }}>
                            {tags.map((t) => (
                              <div key={t.id} className="flex items-center gap-2" style={{ fontFamily: SANS, fontSize: 12 }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9.5, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'var(--cth-command-panel)', color: 'var(--cth-command-ink)', border: '1px solid var(--cth-command-border)', flexShrink: 0 }}>
                                  <Tag size={10} /> {t.event_type}
                                </span>
                                {t.note ? <span style={{ color: 'var(--cth-command-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.note}</span> : null}
                                <span style={{ color: 'var(--cth-command-muted)', fontSize: 10.5, marginLeft: 'auto', flexShrink: 0 }}>{fmtDate(t.created_at)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add tag form */}
                        <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                          <select
                            style={{ ...INPUT_STYLE, width: 'auto', flex: '0 0 auto', minWidth: 170 }}
                            value={tagForm.event_type}
                            onChange={(e) => setTagForm((p) => ({ ...p, event_type: e.target.value }))}
                          >
                            <option value="">Event type…</option>
                            {EVENT_TYPES.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                          </select>
                          <input
                            style={{ ...INPUT_STYLE, flex: 1 }}
                            value={tagForm.note}
                            onChange={(e) => setTagForm((p) => ({ ...p, note: e.target.value }))}
                            placeholder="Optional note"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddTag(link.id)}
                            disabled={isTagging}
                            style={{ ...PRIMARY_BTN, flexShrink: 0, opacity: isTagging ? 0.6 : 1 }}
                          >
                            <Plus size={14} /> Add tag
                          </button>
                        </div>
                      </div>
                    ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Editor modal */}
        {editorOpen ? (
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setEditorOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(13,0,16,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ ...CARD_STYLE, borderRadius: 14, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto' }}
            >
              <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--cth-command-border)' }}>
                <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: 'var(--cth-command-ink)', margin: 0 }}>
                  {editingId ? 'Edit tracking link' : 'New tracking link'}
                </h2>
                <button type="button" onClick={() => setEditorOpen(false)} style={{ ...iconBtn }}><X size={18} /></button>
              </div>

              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={LABEL_STYLE}>Link name</label>
                  <input style={INPUT_STYLE} value={form.link_name} onChange={(e) => fld('link_name', e.target.value)} placeholder="e.g. IG bio → diagnostic" />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Destination URL</label>
                  <input style={INPUT_STYLE} value={form.target_url} onChange={(e) => fld('target_url', e.target.value)} placeholder="https://" />
                </div>
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={LABEL_STYLE}>Source platform</label>
                    <select style={INPUT_STYLE} value={form.source_platform} onChange={(e) => fld('source_platform', e.target.value)}>
                      <option value="">Select…</option>
                      {SOURCE_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>CTA type</label>
                    <select style={INPUT_STYLE} value={form.cta_type} onChange={(e) => fld('cta_type', e.target.value)}>
                      <option value="">Select…</option>
                      {CTA_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={LABEL_STYLE}>Campaign</label>
                    <select style={INPUT_STYLE} value={form.campaign_id} onChange={(e) => fld('campaign_id', e.target.value)}>
                      <option value="">None</option>
                      {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Offer</label>
                    <select style={INPUT_STYLE} value={form.offer_id} onChange={(e) => fld('offer_id', e.target.value)}>
                      <option value="">None</option>
                      {offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Buyer signal level</label>
                  <select style={INPUT_STYLE} value={form.signal_level} onChange={(e) => fld('signal_level', e.target.value)}>
                    <option value="">Not set</option>
                    {SIGNAL_LEVELS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Notes</label>
                  <textarea style={{ ...INPUT_STYLE, minHeight: 64, resize: 'vertical' }} value={form.notes} onChange={(e) => fld('notes', e.target.value)} placeholder="Anything worth remembering about this link." />
                </div>
                <label className="flex items-center gap-2" style={{ fontFamily: SANS, fontSize: 13, color: 'var(--cth-command-ink)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={(e) => fld('is_active', e.target.checked)} />
                  Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-2" style={{ padding: '14px 20px', borderTop: '1px solid var(--cth-command-border)' }}>
                <button type="button" onClick={() => setEditorOpen(false)} style={GHOST_BTN}>Cancel</button>
                <button type="button" onClick={handleSave} disabled={isSaving} style={{ ...PRIMARY_BTN, opacity: isSaving ? 0.6 : 1 }}>
                  {isSaving ? 'Saving…' : editingId ? 'Save changes' : 'Create link'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Delete confirm */}
        {pendingDelete ? (
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setPendingDelete(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(13,0,16,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ ...CARD_STYLE, borderRadius: 12, width: '100%', maxWidth: 420, padding: 24 }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: 'var(--cth-command-ink)', margin: 0 }}>Delete tracking link</h2>
              <p style={{ fontFamily: SANS, fontSize: 13, color: 'var(--cth-command-muted)', margin: '10px 0 20px', lineHeight: 1.55 }}>
                This permanently deletes “{pendingDelete.link_name || pendingDelete.label || 'this link'}” and its conversion tags. This cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setPendingDelete(null)} style={GHOST_BTN}>Cancel</button>
                <button type="button" onClick={confirmDelete} style={PRIMARY_BTN}>Delete</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

const iconBtn = {
  background: 'transparent',
  border: 'none',
  color: 'var(--cth-command-muted)',
  cursor: 'pointer',
  padding: 6,
  borderRadius: 8,
  display: 'inline-flex',
  alignItems: 'center',
};

export default function TrackingLinksPage() {
  return <TrackingLinksContent />;
}
