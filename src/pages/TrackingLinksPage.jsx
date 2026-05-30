import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/Layout';
import { useWorkspace } from '../context/WorkspaceContext';
import apiClient from '../lib/apiClient';
import { API_PATHS } from '../lib/apiPaths';
import { toast } from 'sonner';
import { Link2, Copy, Pencil, Trash2, Plus, X } from 'lucide-react';

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
  const workspaceId = activeWorkspace?.id || activeWorkspace?.workspace_id || '';

  const [links, setLinks] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [offers, setOffers] = useState([]);
  const [dashboard, setDashboard] = useState(null);
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
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      const [linksRes, dashRes, campRes, offerRes] = await Promise.all([
        apiClient.get(API_PATHS.trackingLinks.list).catch(() => ({ tracking_links: [] })),
        apiClient.get(API_PATHS.trackingLinks.dashboard).catch(() => null),
        apiClient.get(API_PATHS.campaigns.list).catch(() => ({ campaigns: [] })),
        apiClient.get(API_PATHS.offers.list).catch(() => ({ offers: [] })),
      ]);
      setLinks(Array.isArray(linksRes?.tracking_links) ? linksRes.tracking_links : []);
      setDashboard(dashRes || null);
      setCampaigns(Array.isArray(campRes?.campaigns) ? campRes.campaigns : []);
      setOffers(Array.isArray(offerRes?.offers) ? offerRes.offers : []);
    } catch (e) {
      console.error('Failed to load tracking links:', e);
      toast.error('Could not load tracking links.');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

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
                  return (
                    <div
                      key={link.id}
                      className="flex items-center gap-3"
                      style={{ padding: '12px 18px', borderBottom: '1px solid var(--cth-command-border)' }}
                    >
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
