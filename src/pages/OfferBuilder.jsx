import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '../components/Layout';
import { useWorkspace } from '../context/WorkspaceContext';
import { useBrandHealth } from '../context/BrandHealthContext';
import { useUser } from '../hooks/useAuth';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  DollarSign,
  Users,
  Target,
  Loader2,
  X,
  Check,
  Clipboard,
  RefreshCw,
  Link2,
  Search,
} from 'lucide-react';
import TrackingLinkManager from "../components/mail/TrackingLinkManager";
import apiClient from '../lib/apiClient';
import API_PATHS from '../lib/apiPaths';

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";

const PAGE_STYLE = {
  background: 'var(--cth-command-blush)',
  minHeight: '100vh',
};

const CARD_STYLE = {
  background: 'var(--cth-command-panel)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 12,
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
  fontSize: 24,
  fontWeight: 600,
  color: 'var(--cth-command-ink)',
  margin: 0,
  letterSpacing: '-0.005em',
  lineHeight: 1.2,
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
  margin: 0,
};

const INPUT_STYLE = {
  width: '100%',
  background: 'var(--cth-command-panel)',
  color: 'var(--cth-command-ink)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 8,
  padding: '10px 14px',
  fontFamily: SANS,
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

const TEXTAREA_STYLE = {
  ...INPUT_STYLE,
  lineHeight: 1.55,
  resize: 'vertical',
};

const PRIMARY_CTA_STYLE = {
  background: 'var(--cth-command-purple)',
  color: 'var(--cth-command-gold)',
  border: 'none',
  borderRadius: 8,
  padding: '10px 18px',
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

const SECONDARY_BUTTON_STYLE = {
  background: 'transparent',
  color: 'var(--cth-command-ink)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 8,
  padding: '10px 18px',
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

const DESTRUCTIVE_BUTTON_STYLE = {
  background: 'var(--cth-command-crimson)',
  color: 'var(--cth-command-ivory)',
  border: 'none',
  borderRadius: 8,
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

const ICON_BUTTON_STYLE = {
  background: 'transparent',
  color: 'var(--cth-command-muted)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 8,
  padding: 8,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  price_cadence: 'one-time',
  features: '',
  target_audience: '',
  transformation: '',
  sales_page_url: '',
  checkout_url: '',
  booking_url: '',
  checkout_processor: '',
  slug: '',
};

const CHECKOUT_PROCESSORS = [
  { value: '', label: 'Select processor' },
  { value: 'stripe', label: 'Stripe Payment Links' },
  { value: 'gumroad', label: 'Gumroad' },
  { value: 'thrivecart', label: 'ThriveCart' },
  { value: 'samcart', label: 'SamCart' },
  { value: 'kajabi', label: 'Kajabi' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'square', label: 'Square' },
  { value: 'custom', label: 'Custom' },
];

function processorHelper(value) {
  if (!value) return '';
  if (value === 'stripe') return 'Create a payment link in your Stripe dashboard and paste it above.';
  if (value === 'gumroad') return 'Use your Gumroad product URL.';
  if (value === 'custom') return 'Paste any checkout URL.';
  const label = CHECKOUT_PROCESSORS.find((p) => p.value === value)?.label || value;
  return `Paste your ${label} checkout link.`;
}

const PUBLIC_OFFER_HOST = 'coretruthhouse.com';

const CADENCE_OPTIONS = [
  { value: 'one-time', label: 'One-time', cardLabel: 'one-time payment' },
  { value: 'monthly', label: 'Monthly', cardLabel: 'per month' },
  { value: 'quarterly', label: 'Quarterly', cardLabel: 'per quarter' },
  { value: 'annual', label: 'Annual', cardLabel: 'per year' },
];

const CADENCE_CARD_LABEL = CADENCE_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.cardLabel }),
  {}
);

const OFFER_SECTIONS = [
  { id: 'basics', label: 'Basics', desc: 'Name the offer, say what it is, and set how it is priced.' },
  { id: 'audience', label: 'Audience', desc: 'Who is this offer built for and what does it promise to change for them.' },
  { id: 'links', label: 'Links', desc: 'Where buyers go to learn more, check out, or book.' },
  { id: 'features', label: 'Features', desc: "What's included — one per line." },
];

const CUSTOM_AUDIENCE = '__custom__';

function getOfferSectionDone(section, form) {
  if (section === 'basics') return Boolean((form.name || '').trim());
  if (section === 'audience') return Boolean((form.target_audience || '').trim());
  if (section === 'links')
    return Boolean((form.sales_page_url || '').trim() || (form.checkout_url || '').trim() || (form.booking_url || '').trim());
  if (section === 'features') return Boolean((form.features || '').trim());
  return false;
}

function normalizeOffer(raw) {
  return {
    id: raw?.id || raw?.offer_id || `offer-${Date.now()}`,
    name: raw?.name || '',
    description: raw?.description || '',
    price: raw?.price ?? 0,
    price_cadence: raw?.price_cadence || 'one-time',
    features: Array.isArray(raw?.features) ? raw.features : [],
    target_audience: raw?.target_audience || '',
    transformation: raw?.transformation || '',
    sales_page_url: raw?.sales_page_url || '',
    checkout_url: raw?.checkout_url || '',
    booking_url: raw?.booking_url || '',
    slug: raw?.slug || '',
    checkout_processor: raw?.checkout_processor || '',
    status: raw?.status || 'draft',
    sales_copy: raw?.sales_copy || '',
    created_at: raw?.created_at || '',
    updated_at: raw?.updated_at || '',
  };
}

// Offers have no stored status — derive it. Draft = no price OR no audience.
function getOfferStatus(offer) {
  const priceSet = Number(offer?.price) > 0;
  const audienceSet = Boolean((offer?.target_audience || '').trim());
  return priceSet && audienceSet ? 'active' : 'draft';
}

function hasOfferFormContent(formData) {
  if ((formData.name || '').trim()) return true;
  if ((formData.description || '').trim()) return true;
  if ((formData.price || '').toString().trim()) return true;
  if ((formData.features || '').trim()) return true;
  if ((formData.target_audience || '').trim()) return true;
  if ((formData.transformation || '').trim()) return true;
  if ((formData.sales_page_url || '').trim()) return true;
  if ((formData.checkout_url || '').trim()) return true;
  if ((formData.booking_url || '').trim()) return true;
  return false;
}

function StatTile({ label, value, subtitle }) {
  return (
    <div
      style={{
        ...CARD_STYLE,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        minWidth: 200,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--cth-command-crimson)',
            display: 'inline-block',
          }}
        />
        <p style={{ ...SECTION_LABEL_STYLE, fontSize: 10, letterSpacing: '0.2em' }}>
          {label}
        </p>
      </div>
      <p
        style={{
          fontFamily: SERIF,
          fontSize: 32,
          fontWeight: 600,
          color: 'var(--cth-command-ink)',
          lineHeight: 1,
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </p>
      {subtitle ? (
        <p style={{ ...MUTED_STYLE, fontSize: 11 }}>{subtitle}</p>
      ) : null}
    </div>
  );
}

function OfferBuilderContent() {
  const { user } = useUser();
  const { currentWorkspace } = useWorkspace();
  const { refresh: refreshBrandHealth } = useBrandHealth();

  const workspaceId =
    currentWorkspace?.id ||
    currentWorkspace?.workspace_id ||
    '';
  const userId = user?.id || '';

  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [savingOffer, setSavingOffer] = useState(false);

  const [generatingCopy, setGeneratingCopy] = useState(null);
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [generatedCopyOffer, setGeneratedCopyOffer] = useState(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  // Confirmation modal state
  const [pendingDeleteOffer, setPendingDeleteOffer] = useState(null);
  const [pendingGenerateOffer, setPendingGenerateOffer] = useState(null);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  // Tracking links drawer state
  const [viewingTrackingLinks, setViewingTrackingLinks] = useState(null);

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  // Modal section-nav + audience avatars
  const [activeOfferSection, setActiveOfferSection] = useState('basics');
  const [audienceAvatars, setAudienceAvatars] = useState([]);
  const [audienceCustom, setAudienceCustom] = useState(false);

  // Public offer URL: workspace slug + (optional) custom domain, copy feedback
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [copiedUrlId, setCopiedUrlId] = useState(null);
  const [togglingPublishId, setTogglingPublishId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(API_PATHS.audience.avatars);
        const list = Array.isArray(res?.avatars) ? res.avatars : Array.isArray(res) ? res : [];
        if (!cancelled) setAudienceAvatars(list.map((a) => a?.name).filter(Boolean));
      } catch (err) {
        if (!cancelled) setAudienceAvatars([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch the workspace slug (and any connected custom domain) so we can show
  // the public offer-page URL on published offers.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get('/api/workspaces/my-slug');
        if (cancelled) return;
        setWorkspaceSlug(res?.slug || '');
        setCustomDomain(res?.custom_domain || '');
      } catch (err) {
        if (!cancelled) {
          setWorkspaceSlug('');
          setCustomDomain('');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  // Subdomain-based offer URL: {workspace-slug}.coretruthhouse.com/offers/{offer-slug}
  // (Serving from a tenant custom domain remains deferred to a Cloudflare step.)
  const buildOfferUrl = useCallback(
    (offer, withProtocol = false) => {
      if (!workspaceSlug || !offer?.slug) return '';
      const path = `${workspaceSlug}.${PUBLIC_OFFER_HOST}/offers/${offer.slug}`;
      return withProtocol ? `https://${path}` : path;
    },
    [workspaceSlug]
  );

  const copyOfferUrl = useCallback(async (offer) => {
    const url = `https://${workspaceSlug}.${PUBLIC_OFFER_HOST}/offers/${offer.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrlId(offer.id);
      setTimeout(() => setCopiedUrlId(null), 1600);
    } catch (err) {
      console.error('Failed to copy offer URL:', err);
    }
  }, [workspaceSlug]);

  const offerCountSubtitle = useMemo(
    () => `${offers.length} offer${offers.length !== 1 ? 's' : ''} created`,
    [offers.length]
  );

  const loadOffers = useCallback(async () => {
    if (!workspaceId) {
      setOffers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.get('/api/offers', {
        params: {
          user_id: userId,
          workspace_id: workspaceId,
        },
      });
      const nextOffers = Array.isArray(response?.offers)
        ? response.offers
        : Array.isArray(response)
        ? response
        : [];

      setOffers(nextOffers.map(normalizeOffer));
    } catch (err) {
      console.error('Failed to load offers:', err);
      setOffers([]);
      setError(err?.message || 'Failed to load offers.');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, userId]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const handleTogglePublish = useCallback(async (offer) => {
    if (!offer?.id) return;
    const nextStatus = offer.status === 'published' ? 'draft' : 'published';
    setTogglingPublishId(offer.id);
    setError('');
    try {
      await apiClient.put(`/api/offers/${offer.id}`, { status: nextStatus });
      await loadOffers();
      refreshBrandHealth();
    } catch (err) {
      console.error('Publish toggle error:', err);
      setError(err?.message || 'Failed to update publish status.');
    } finally {
      setTogglingPublishId(null);
    }
  }, [loadOffers, refreshBrandHealth]);

  const handleOpenModal = useCallback((offer = null) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData({
        name: offer.name || '',
        description: offer.description || '',
        price: offer.price?.toString() || '',
        price_cadence: offer.price_cadence || 'one-time',
        features: Array.isArray(offer.features) ? offer.features.join('\n') : '',
        target_audience: offer.target_audience || '',
        transformation: offer.transformation || '',
        sales_page_url: offer.sales_page_url || offer.salesPageUrl || offer.sales_page || offer.url || '',
        checkout_url: offer.checkout_url || offer.checkoutUrl || offer.checkout_page_url || '',
        booking_url: offer.booking_url || offer.bookingUrl || offer.booking_link || '',
        checkout_processor: offer.checkout_processor || '',
        slug: offer.slug || '',
      });
    } else {
      setEditingOffer(null);
      setFormData(EMPTY_FORM);
    }

    setActiveOfferSection('basics');
    setAudienceCustom(false);
    setShowModal(true);
    setError('');
  }, []);

  const handleCloseModalImmediate = useCallback(() => {
    setShowModal(false);
    setEditingOffer(null);
    setFormData(EMPTY_FORM);
    setError('');
  }, []);

  const handleCloseModal = useCallback(() => {
    if (hasOfferFormContent(formData)) {
      setConfirmDiscardOpen(true);
      return;
    }
    handleCloseModalImmediate();
  }, [formData, handleCloseModalImmediate]);

  const handleSaveOffer = async () => {
    if (!formData.name.trim()) return;

    const payload = {
      user_id: userId,
      workspace_id: workspaceId,
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price) || 0,
      price_cadence: formData.price_cadence || 'one-time',
      features: formData.features
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
      target_audience: formData.target_audience.trim(),
      transformation: formData.transformation.trim(),
      sales_page_url: formData.sales_page_url?.trim() || '',
      checkout_url: formData.checkout_url?.trim() || '',
      booking_url: formData.booking_url?.trim() || '',
      checkout_processor: formData.checkout_processor || '',
    };

    setSavingOffer(true);
    setError('');

    try {
      if (editingOffer?.id) {
        await apiClient.put(`/api/offers/${editingOffer.id}`, payload);
      } else {
        await apiClient.post('/api/offers', payload);
      }

      await loadOffers();
      refreshBrandHealth();
      handleCloseModalImmediate();
    } catch (err) {
      console.error('Save error:', err);
      setError(err?.message || 'Failed to save offer.');
    } finally {
      setSavingOffer(false);
    }
  };

  const handleDeleteOffer = (offer) => {
    if (!offer?.id) return;
    setPendingDeleteOffer(offer);
  };

  const performDeleteOffer = async () => {
    const offer = pendingDeleteOffer;
    setPendingDeleteOffer(null);
    if (!offer?.id) return;

    setError('');

    try {
      await apiClient.delete(`/api/offers/${offer.id}`);
      await loadOffers();
      refreshBrandHealth();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err?.message || 'Failed to delete offer.');
    }
  };

  const runGenerateCopy = async (offer) => {
    if (!offer?.id) return;

    setGeneratingCopy(offer.id);
    setGeneratedCopy('');
    setGeneratedCopyOffer(offer);
    setError('');

    try {
      const response = await apiClient.post('/api/offers/generate', null, {
        params: { offer_id: offer.id },
      });

      setGeneratedCopy(
        response?.sales_copy ||
          response?.copy ||
          'No sales copy was returned.'
      );
    } catch (err) {
      console.error('Generate error:', err);
      setGeneratedCopy('Failed to generate copy. Please try again.');
    } finally {
      setGeneratingCopy(null);
    }
  };

  const handleGenerateCopy = (offer) => {
    if (!offer?.id) return;
    setPendingGenerateOffer(offer);
  };

  const handleConfirmGenerate = () => {
    const offer = pendingGenerateOffer;
    setPendingGenerateOffer(null);
    if (offer) runGenerateCopy(offer);
  };

  const handleRegenerateCopy = () => {
    if (generatedCopyOffer) runGenerateCopy(generatedCopyOffer);
  };

  const handleCopyToClipboard = async (text) => {
    const value = typeof text === 'string' ? text : generatedCopy;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 1600);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleCloseGeneratedCopy = () => {
    setGeneratedCopy('');
    setGeneratedCopyOffer(null);
    setCopiedFeedback(false);
  };

  const totalFeatures = useMemo(
    () => offers.reduce((sum, offer) => sum + (offer.features?.length || 0), 0),
    [offers]
  );

  const displayedOffers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return offers
      .filter((o) =>
        !q ||
        (o.name || '').toLowerCase().includes(q) ||
        (o.description || '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (sortOrder === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sortOrder === 'price') return (b.price || 0) - (a.price || 0);
        if (sortOrder === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [offers, searchQuery, sortOrder]);

  return (
    <DashboardLayout>
      <header className="cth-page-header">
        <div className="min-w-0 flex-1">
          <h1
            className="text-2xl md:text-[32px] leading-tight truncate"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}
          >
            Offer Builder
          </h1>
          <p
            className="text-xs md:text-sm truncate"
            style={{ margin: "6px 0 0 0", color: "var(--cth-command-muted)", fontFamily: "'DM Sans', sans-serif" }}
          >
            {`${offers.length} offer${offers.length !== 1 ? 's' : ''}`} · Build and manage every offer your brand delivers.
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <button
            type="button"
            data-testid="create-offer-btn"
            onClick={() => handleOpenModal()}
            style={{
              padding: '9px 18px',
              background: 'var(--cth-command-crimson)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={14} /> New offer
          </button>
        </div>
      </header>

      <div
        className="flex-1 overflow-auto px-4 py-7 md:px-8"
        style={PAGE_STYLE}
        data-testid="offer-builder-page"
      >
        <div className="mx-auto max-w-[1200px] space-y-6">
          {error ? (
            <div
              style={{
                ...CARD_STYLE,
                borderColor: 'color-mix(in srgb, var(--cth-danger) 35%, var(--cth-command-border))',
                background: 'color-mix(in srgb, var(--cth-danger) 8%, var(--cth-command-panel))',
                padding: 14,
                color: 'var(--cth-danger)',
                fontFamily: SANS,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div
              className="flex items-center justify-center"
              style={{ ...CARD_STYLE, minHeight: 240 }}
            >
              <div
                className="inline-flex items-center gap-3"
                style={{ fontFamily: SANS, color: 'var(--cth-command-muted)' }}
              >
                <Loader2
                  size={18}
                  className="animate-spin"
                  style={{ color: 'var(--cth-command-crimson)' }}
                />
                Loading offers...
              </div>
            </div>
          ) : offers.length === 0 ? (
            <div
              style={{
                ...CARD_STYLE,
                padding: 60,
                textAlign: 'center',
              }}
            >
              <div
                className="mx-auto flex items-center justify-center"
                style={{
                  ...CARD_STYLE,
                  background: 'var(--cth-command-panel-soft)',
                  width: 56,
                  height: 56,
                }}
              >
                <Package size={22} style={{ color: 'var(--cth-command-muted)' }} />
              </div>
              <h3
                style={{
                  ...SECTION_HEADING_STYLE,
                  fontSize: 22,
                  marginTop: 16,
                }}
              >
                No offers yet
              </h3>
              <p
                style={{
                  ...MUTED_STYLE,
                  fontSize: 13,
                  margin: '8px auto 20px',
                  maxWidth: 480,
                  lineHeight: 1.6,
                }}
              >
                Create your first irresistible offer to start selling.
              </p>
              <button
                type="button"
                onClick={() => handleOpenModal()}
                style={PRIMARY_CTA_STYLE}
              >
                <Plus size={14} />
                Create Your First Offer
              </button>
            </div>
          ) : (
            <>
              {/* Search + sort toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  className="flex items-center gap-2"
                  style={{
                    flex: 1,
                    maxWidth: 340,
                    background: 'var(--cth-command-panel)',
                    border: '1px solid var(--cth-command-border)',
                    borderRadius: 8,
                    padding: '8px 12px',
                  }}
                >
                  <Search size={14} style={{ color: 'var(--cth-command-muted)', flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Search offers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: 'var(--cth-command-ink)',
                      fontFamily: SANS,
                      fontSize: 13,
                    }}
                  />
                </div>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--cth-command-border)',
                    borderRadius: 8,
                    background: 'var(--cth-command-panel)',
                    color: 'var(--cth-command-ink)',
                    fontFamily: SANS,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="name">Name A-Z</option>
                  <option value="price">Price high-low</option>
                </select>
              </div>

              {displayedOffers.length === 0 ? (
                <div style={{ ...CARD_STYLE, padding: 40, textAlign: 'center' }}>
                  <p style={{ ...MUTED_STYLE, fontSize: 13 }}>
                    No offers match "{searchQuery}".
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {displayedOffers.map((offer) => {
                    const isPublished = offer.status === 'published';
                    const isDraft = !isPublished;
                    const hasCopy = Boolean((offer.sales_copy || '').trim());
                    const priceSet = Number(offer.price) > 0;
                    const hasCheckout = Boolean((offer.checkout_url || '').trim());
                    const offerUrl = buildOfferUrl(offer);
                    const showOfferPage = isPublished && hasCheckout && Boolean(offerUrl);
                    const isToggling = togglingPublishId === offer.id;
                    return (
                      <div
                        key={offer.id}
                        data-testid={`offer-card-${offer.id}`}
                        style={{
                          ...CARD_STYLE,
                          padding: 0,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          borderColor: hasCopy ? 'var(--cth-command-gold)' : 'var(--cth-command-border)',
                        }}
                      >
                        <div
                          style={{
                            height: 3,
                            background: isDraft
                              ? 'var(--cth-command-border)'
                              : 'linear-gradient(90deg, var(--cth-command-crimson), var(--cth-command-cinnabar))',
                          }}
                        />

                        <div style={{ padding: '16px 16px 12px', flex: 1 }}>
                          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                            <span
                              style={{
                                fontFamily: SANS,
                                fontSize: 9,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                padding: '3px 8px',
                                borderRadius: 20,
                                background: isDraft
                                  ? 'var(--cth-command-panel-soft)'
                                  : 'color-mix(in srgb, var(--cth-command-success) 12%, var(--cth-command-panel))',
                                color: isDraft ? 'var(--cth-command-muted)' : 'var(--cth-command-success)',
                                border: `1px solid ${isDraft ? 'var(--cth-command-border)' : 'color-mix(in srgb, var(--cth-command-success) 35%, var(--cth-command-border))'}`,
                              }}
                            >
                              {isPublished ? 'Published' : 'Draft'}
                            </span>
                            {hasCopy ? (
                              <span className="inline-flex items-center gap-1" style={{ fontFamily: SANS, fontSize: 9, color: 'var(--cth-command-gold)' }}>
                                <Sparkles size={11} /> Copy ready
                              </span>
                            ) : null}
                          </div>

                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, lineHeight: 1, color: priceSet ? 'var(--cth-command-crimson)' : 'var(--cth-command-muted)' }}>
                              {priceSet ? `$${offer.price}` : '—'}
                            </div>
                            <div style={{ fontFamily: SANS, fontSize: 9, color: 'var(--cth-command-muted)', marginTop: 3, letterSpacing: '0.04em' }}>
                              {priceSet ? (CADENCE_CARD_LABEL[offer.price_cadence] || 'one-time payment') : 'Price not set'}
                            </div>
                          </div>

                          <h3 style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 500, lineHeight: 1.35, margin: '0 0 6px', color: isDraft ? 'var(--cth-command-muted)' : 'var(--cth-command-ink)' }}>
                            {offer.name || 'Untitled offer'}
                          </h3>

                          {(offer.transformation || offer.description) ? (
                            <p
                              style={{
                                fontFamily: SANS,
                                fontSize: 11,
                                lineHeight: 1.6,
                                color: 'var(--cth-command-muted)',
                                margin: '0 0 10px',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {offer.transformation || offer.description}
                            </p>
                          ) : null}

                          <span
                            className="inline-flex items-center gap-1"
                            style={{
                              fontFamily: SANS,
                              fontSize: 10,
                              padding: '3px 8px',
                              borderRadius: 20,
                              background: 'var(--cth-command-panel-soft)',
                              border: '1px solid var(--cth-command-border)',
                              color: 'var(--cth-command-muted)',
                            }}
                          >
                            <Users size={10} />
                            {offer.target_audience ? `For: ${offer.target_audience}` : 'No audience linked'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2" style={{ padding: '10px 16px', borderTop: '1px solid var(--cth-command-border)' }}>
                          <button
                            type="button"
                            data-testid={`edit-offer-${offer.id}`}
                            onClick={() => handleOpenModal(offer)}
                            style={{ flex: 1, fontFamily: SANS, fontSize: 11, fontWeight: 500, color: 'var(--cth-command-ink)', background: 'var(--cth-command-panel)', border: '1px solid var(--cth-command-border)', borderRadius: 6, padding: '6px', cursor: 'pointer' }}
                          >
                            {isDraft ? 'Edit & complete' : 'Edit'}
                          </button>

                          <button
                            type="button"
                            data-testid={`tracking-links-${offer.id}`}
                            onClick={() => setViewingTrackingLinks(offer)}
                            aria-label={`Tracking links for ${offer.name}`}
                            style={{ ...ICON_BUTTON_STYLE, borderRadius: 6, padding: 7 }}
                          >
                            <Link2 size={14} />
                          </button>

                          <button
                            type="button"
                            data-testid={`delete-offer-${offer.id}`}
                            onClick={() => handleDeleteOffer(offer)}
                            aria-label={`Delete ${offer.name}`}
                            style={{ fontFamily: SANS, fontSize: 11, color: 'var(--cth-command-crimson)', background: 'transparent', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Publish toggle */}
                        <div
                          className="flex items-center justify-between"
                          style={{ padding: '10px 16px', borderTop: '1px solid var(--cth-command-border)' }}
                        >
                          <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: 'var(--cth-command-ink)' }}>
                            Published
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isPublished}
                            disabled={isToggling}
                            data-testid={`publish-toggle-${offer.id}`}
                            onClick={() => handleTogglePublish(offer)}
                            aria-label={isPublished ? `Unpublish ${offer.name}` : `Publish ${offer.name}`}
                            style={{
                              position: 'relative',
                              width: 38,
                              height: 22,
                              borderRadius: 999,
                              border: 'none',
                              cursor: isToggling ? 'wait' : 'pointer',
                              background: isPublished ? 'var(--cth-command-success)' : 'var(--cth-command-border)',
                              transition: 'background 0.2s ease',
                              opacity: isToggling ? 0.6 : 1,
                              flexShrink: 0,
                            }}
                          >
                            <span
                              style={{
                                position: 'absolute',
                                top: 2,
                                left: isPublished ? 18 : 2,
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                background: '#fff',
                                transition: 'left 0.2s ease',
                              }}
                            />
                          </button>
                        </div>

                        {/* Offer page URL (published + has checkout only) */}
                        {showOfferPage ? (
                          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--cth-command-border)', background: 'var(--cth-command-panel-soft)' }}>
                            <div style={{ fontFamily: SANS, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--cth-command-muted)', marginBottom: 6 }}>
                              Offer page
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={`https://${offerUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-testid={`offer-url-${offer.id}`}
                                style={{ flex: 1, minWidth: 0, fontFamily: SANS, fontSize: 11, color: 'var(--cth-command-crimson)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                title={offerUrl}
                              >
                                {offerUrl}
                              </a>
                              <button
                                type="button"
                                onClick={() => copyOfferUrl(offer)}
                                data-testid={`copy-offer-url-${offer.id}`}
                                aria-label="Copy offer page URL"
                                style={{ ...ICON_BUTTON_STYLE, borderRadius: 6, padding: 6, flexShrink: 0 }}
                              >
                                {copiedUrlId === offer.id ? <Check size={13} style={{ color: 'var(--cth-command-success)' }} /> : <Clipboard size={13} />}
                              </button>
                            </div>
                            <div style={{ fontFamily: SANS, fontSize: 10, color: 'var(--cth-command-muted)', marginTop: 6, lineHeight: 1.45 }}>
                              Share this link to let buyers view and purchase your offer.
                            </div>
                            <div style={{ fontFamily: SANS, fontSize: 10, fontStyle: 'italic', color: 'var(--cth-command-muted)', marginTop: 4, lineHeight: 1.45, opacity: 0.85 }}>
                              Requires wildcard subdomain SSL — contact support to activate.
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}

                  {/* Add another offer */}
                  <button
                    type="button"
                    data-testid="add-offer-card"
                    onClick={() => handleOpenModal()}
                    style={{
                      background: 'transparent',
                      border: '1px dashed var(--cth-command-border)',
                      borderRadius: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '32px 16px',
                      cursor: 'pointer',
                      minHeight: 220,
                      color: 'var(--cth-command-muted)',
                      fontFamily: SANS,
                      fontSize: 12,
                    }}
                  >
                    <Package size={20} style={{ color: 'var(--cth-command-border)' }} />
                    Add another offer
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tracking Links drawer */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          pointerEvents: viewingTrackingLinks ? 'auto' : 'none',
          visibility: viewingTrackingLinks ? 'visible' : 'hidden',
        }}
        aria-hidden={!viewingTrackingLinks}
      >
        <div
          onClick={() => setViewingTrackingLinks(null)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(13, 0, 16, 0.5)',
            opacity: viewingTrackingLinks ? 1 : 0,
            transition: 'opacity 220ms ease',
          }}
        />
        <div
          role="dialog"
          aria-label="Tracking Links"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100vh',
            width: 520,
            maxWidth: '92vw',
            background: 'var(--cth-command-panel)',
            borderLeft: '1px solid var(--cth-command-border)',
            zIndex: 51,
            display: 'flex',
            flexDirection: 'column',
            transform: viewingTrackingLinks ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 280ms ease',
            boxShadow: '-12px 0 40px rgba(13, 0, 16, 0.18)',
          }}
        >
          {viewingTrackingLinks ? (
            <>
              <div
                className="flex items-start justify-between gap-4"
                style={{
                  padding: 24,
                  borderBottom: '1px solid var(--cth-command-border)',
                }}
              >
                <div className="min-w-0 flex-1">
                  <p style={SECTION_LABEL_STYLE}>Tracking Links</p>
                  <h2 style={{ ...SECTION_HEADING_STYLE, marginTop: 6 }}>
                    {viewingTrackingLinks.name || 'Untitled offer'}
                  </h2>
                  <p style={{ ...MUTED_STYLE, marginTop: 6, fontSize: 12 }}>
                    Create tracked links for this offer's sales page, checkout page, booking link, or CTA.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingTrackingLinks(null)}
                  aria-label="Close drawer"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 6,
                    color: 'var(--cth-command-muted)',
                    display: 'inline-flex',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto" style={{ padding: 24 }}>
                <TrackingLinkManager
                  title="Offer Tracking Links"
                  subtitle="Create tracked links for this offer's sales page, checkout page, booking link, or CTA."
                  defaultLabel={`${viewingTrackingLinks.name || 'Offer'} CTA`}
                  defaultUrl={
                    viewingTrackingLinks.sales_page_url ||
                    viewingTrackingLinks.checkout_url ||
                    viewingTrackingLinks.booking_url ||
                    ''
                  }
                  context={{
                    source: 'offer_builder',
                    offer_id: viewingTrackingLinks.id || '',
                    metadata: {
                      offer_name: viewingTrackingLinks.name || '',
                      offer_price: viewingTrackingLinks.price || 0,
                      sales_page_url: viewingTrackingLinks.sales_page_url || '',
                      checkout_url: viewingTrackingLinks.checkout_url || '',
                      booking_url: viewingTrackingLinks.booking_url || '',
                    },
                  }}
                />
              </div>

              <div
                className="flex items-center justify-end gap-3"
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid var(--cth-command-border)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewingTrackingLinks(null)}
                  style={SECONDARY_BUTTON_STYLE}
                >
                  Close
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Create / edit modal — Phase 3 section-nav */}
      {showModal ? (() => {
        const doneCount = OFFER_SECTIONS.filter((s) => getOfferSectionDone(s.id, formData)).length;
        const secIdx = OFFER_SECTIONS.findIndex((s) => s.id === activeOfferSection);
        const activeSec = OFFER_SECTIONS[secIdx] || OFFER_SECTIONS[0];
        const prevSec = secIdx > 0 ? OFFER_SECTIONS[secIdx - 1] : null;
        const nextSec = secIdx < OFFER_SECTIONS.length - 1 ? OFFER_SECTIONS[secIdx + 1] : null;
        const canZuri = Boolean(editingOffer?.id);
        const zuriBusy = canZuri && generatingCopy === editingOffer.id;
        const zuriCopy =
          (generatedCopyOffer?.id && editingOffer?.id && generatedCopyOffer.id === editingOffer.id
            ? generatedCopy
            : '') || editingOffer?.sales_copy || '';
        const audienceInList = audienceAvatars.includes(formData.target_audience);
        const isCustomAudience =
          audienceCustom || (Boolean(formData.target_audience) && !audienceInList);
        const audienceSelectValue = isCustomAudience ? CUSTOM_AUDIENCE : formData.target_audience || '';

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editingOffer ? 'Edit Offer' : 'New Offer'}
            onClick={handleCloseModal}
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(13, 0, 16, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <div
              data-testid="offer-modal"
              onClick={(e) => e.stopPropagation()}
              style={{ ...CARD_STYLE, borderRadius: 14, width: '100%', maxWidth: 820, maxHeight: '90dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              {/* Header */}
              <div className="flex items-start justify-between" style={{ padding: '18px 24px 16px', borderBottom: '1px solid var(--cth-command-border)', background: 'var(--cth-command-panel)', flexShrink: 0, gap: 16 }}>
                <div className="min-w-0">
                  <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: 'var(--cth-command-ink)', margin: 0, lineHeight: 1.2 }}>
                    {editingOffer ? (formData.name || 'Edit offer') : 'Create a new offer'}
                  </h3>
                  <p style={{ fontFamily: SANS, fontSize: 11, color: 'var(--cth-command-muted)', margin: '3px 0 0' }}>
                    Edit offer details and generate sales copy.
                  </p>
                </div>
                <div className="flex items-center" style={{ gap: 10, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: SANS, fontSize: 10, color: 'var(--cth-command-muted)', marginBottom: 4 }}>
                      {doneCount} of {OFFER_SECTIONS.length} complete
                    </div>
                    <div style={{ width: 80, height: 3, background: 'var(--cth-command-border)', borderRadius: 2, overflow: 'hidden', marginLeft: 'auto' }}>
                      <div style={{ height: '100%', width: `${Math.round((doneCount / OFFER_SECTIONS.length) * 100)}%`, background: 'var(--cth-command-success)', borderRadius: 2, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                  <button type="button" onClick={handleCloseModal} aria-label="Close modal" style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--cth-command-panel-soft)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cth-command-muted)', flexShrink: 0 }}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Body: section nav + field area */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '148px 1fr', overflow: 'hidden', minHeight: 0 }}>
                {/* Section nav */}
                <div style={{ borderRight: '1px solid var(--cth-command-border)', padding: '14px 0', background: 'var(--cth-command-panel-soft)', overflowY: 'auto' }}>
                  <div style={{ fontFamily: SANS, fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--cth-command-muted)', padding: '0 14px 8px', fontWeight: 600 }}>Sections</div>
                  {OFFER_SECTIONS.map((s) => {
                    const isActive = s.id === activeOfferSection;
                    const done = getOfferSectionDone(s.id, formData);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setActiveOfferSection(s.id)}
                        data-testid={`offer-section-${s.id}`}
                        className="text-left"
                        style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '8px 14px', cursor: 'pointer', border: 'none', borderLeft: `2px solid ${isActive ? 'var(--cth-command-crimson)' : 'transparent'}`, background: isActive ? 'var(--cth-command-panel)' : 'transparent' }}
                      >
                        {isActive ? (
                          <Edit2 size={12} style={{ color: 'var(--cth-command-crimson)', flexShrink: 0 }} />
                        ) : done ? (
                          <Check size={12} style={{ color: 'var(--cth-command-success)', flexShrink: 0 }} />
                        ) : (
                          <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid var(--cth-command-border)', flexShrink: 0 }} />
                        )}
                        <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: isActive ? 500 : 400, color: isActive ? 'var(--cth-command-crimson)' : 'var(--cth-command-muted)' }}>{s.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Field area */}
                <div style={{ padding: '20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: 'var(--cth-command-ink)', marginBottom: 2 }}>{activeSec.label}</div>
                    <div style={{ fontFamily: SANS, fontSize: 11, color: 'var(--cth-command-muted)', lineHeight: 1.5 }}>{activeSec.desc}</div>
                  </div>

                  {activeOfferSection === 'basics' ? (
                    <>
                      <div className="flex flex-col" style={{ gap: 5 }}>
                        <label style={FIELD_LABEL_STYLE}>Offer name *</label>
                        <input data-testid="offer-name" type="text" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="e.g., Brand Strategy Intensive" style={INPUT_STYLE} />
                      </div>
                      <div className="flex flex-col" style={{ gap: 5 }}>
                        <label style={FIELD_LABEL_STYLE}>Description</label>
                        <textarea data-testid="offer-description" value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} placeholder="What is this offer about?" rows={3} style={TEXTAREA_STYLE} />
                      </div>
                      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="flex flex-col" style={{ gap: 5 }}>
                          <label style={FIELD_LABEL_STYLE}>Price ($)</label>
                          <input data-testid="offer-price" type="number" value={formData.price} onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))} placeholder="0" style={INPUT_STYLE} />
                        </div>
                        <div className="flex flex-col" style={{ gap: 5 }}>
                          <label style={FIELD_LABEL_STYLE}>Cadence</label>
                          <select data-testid="offer-cadence" value={formData.price_cadence} onChange={(e) => setFormData((p) => ({ ...p, price_cadence: e.target.value }))} style={INPUT_STYLE}>
                            {CADENCE_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                          </select>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {activeOfferSection === 'audience' ? (
                    <>
                      <div className="flex flex-col" style={{ gap: 5 }}>
                        <label style={FIELD_LABEL_STYLE}>Target audience</label>
                        <select
                          data-testid="offer-audience"
                          value={audienceSelectValue}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === CUSTOM_AUDIENCE) {
                              setAudienceCustom(true);
                            } else {
                              setAudienceCustom(false);
                              setFormData((p) => ({ ...p, target_audience: v }));
                            }
                          }}
                          style={INPUT_STYLE}
                        >
                          <option value="">Select an audience…</option>
                          {audienceAvatars.map((n) => (<option key={n} value={n}>{n}</option>))}
                          <option value={CUSTOM_AUDIENCE}>Custom…</option>
                        </select>
                        {isCustomAudience ? (
                          <input data-testid="offer-audience-custom" type="text" value={formData.target_audience} onChange={(e) => setFormData((p) => ({ ...p, target_audience: e.target.value }))} placeholder="Describe who this offer is for" style={{ ...INPUT_STYLE, marginTop: 6 }} />
                        ) : null}
                      </div>
                      <div className="flex flex-col" style={{ gap: 5 }}>
                        <label style={FIELD_LABEL_STYLE}>Transformation promise</label>
                        <textarea data-testid="offer-transformation" value={formData.transformation} onChange={(e) => setFormData((p) => ({ ...p, transformation: e.target.value }))} placeholder="What outcome will they achieve?" rows={3} style={TEXTAREA_STYLE} />
                      </div>
                    </>
                  ) : null}

                  {activeOfferSection === 'links' ? (
                    <>
                      <div className="flex flex-col" style={{ gap: 5 }}>
                        <label style={FIELD_LABEL_STYLE}>Sales page URL</label>
                        <input data-testid="offer-sales-page-url" type="url" value={formData.sales_page_url || ''} onChange={(e) => setFormData((p) => ({ ...p, sales_page_url: e.target.value }))} placeholder="https://yourdomain.com/sales-page" style={INPUT_STYLE} />
                      </div>
                      <div className="flex flex-col" style={{ gap: 5 }}>
                        <label style={FIELD_LABEL_STYLE}>Checkout URL</label>
                        <input data-testid="offer-checkout-url" type="url" value={formData.checkout_url || ''} onChange={(e) => setFormData((p) => ({ ...p, checkout_url: e.target.value }))} placeholder="https://checkout.yourdomain.com/offer" style={INPUT_STYLE} />
                      </div>
                      <div className="flex flex-col" style={{ gap: 5 }}>
                        <label style={FIELD_LABEL_STYLE}>Checkout processor</label>
                        <select
                          data-testid="offer-checkout-processor"
                          value={formData.checkout_processor || ''}
                          onChange={(e) => setFormData((p) => ({ ...p, checkout_processor: e.target.value }))}
                          style={INPUT_STYLE}
                        >
                          {CHECKOUT_PROCESSORS.map((proc) => (
                            <option key={proc.value || 'none'} value={proc.value}>{proc.label}</option>
                          ))}
                        </select>
                        {processorHelper(formData.checkout_processor) ? (
                          <span style={{ fontFamily: SANS, fontSize: 11, color: 'var(--cth-command-muted)', lineHeight: 1.5 }}>
                            {processorHelper(formData.checkout_processor)}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-col" style={{ gap: 5 }}>
                        <label style={FIELD_LABEL_STYLE}>Booking URL</label>
                        <input data-testid="offer-booking-url" type="url" value={formData.booking_url || ''} onChange={(e) => setFormData((p) => ({ ...p, booking_url: e.target.value }))} placeholder="https://calendly.com/your-offer" style={INPUT_STYLE} />
                      </div>
                    </>
                  ) : null}

                  {activeOfferSection === 'features' ? (
                    <div className="flex flex-col" style={{ gap: 5 }}>
                      <label style={FIELD_LABEL_STYLE}>Features (one per line)</label>
                      <textarea data-testid="offer-features" value={formData.features} onChange={(e) => setFormData((p) => ({ ...p, features: e.target.value }))} placeholder={'1:1 Strategy Session\nCustom Brand Playbook\n30-Day Support'} rows={5} style={TEXTAREA_STYLE} />
                    </div>
                  ) : null}

                  {/* Zuri sales-copy card */}
                  <div style={{ background: '#1a0828', borderRadius: 10, padding: '13px 15px' }} data-testid="zuri-sales-copy">
                    <div className="flex items-center gap-2" style={{ marginBottom: 9 }}>
                      <img src="/zuri.png" alt="Zuri" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      <span style={{ fontFamily: SANS, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a6090' }}>Zuri · sales copy</span>
                    </div>

                    {!canZuri ? (
                      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.7)' }}>
                        Save the offer first, then Zuri can write your sales copy.
                      </div>
                    ) : zuriBusy ? (
                      <div className="flex items-center gap-2" style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
                        <Loader2 size={14} className="animate-spin" /> Zuri is writing your sales copy…
                      </div>
                    ) : zuriCopy ? (
                      <>
                        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 13, lineHeight: 1.55, color: '#e8dff0', marginBottom: 8, whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto' }} data-testid="zuri-copy-text">
                          {zuriCopy}
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => handleCopyToClipboard(zuriCopy)} className="inline-flex items-center gap-1" style={{ fontFamily: SANS, fontSize: 10, fontWeight: 500, color: 'var(--cth-command-crimson)', background: 'transparent', border: '0.5px solid rgba(224,78,53,0.4)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}>
                            {copiedFeedback ? <Check size={10} /> : <Clipboard size={10} />}
                            {copiedFeedback ? 'Copied!' : 'Copy to clipboard'}
                          </button>
                          <button type="button" onClick={() => runGenerateCopy(editingOffer)} style={{ fontFamily: SANS, fontSize: 10, color: '#7a6090', background: 'transparent', border: '0.5px solid rgba(122,96,144,0.3)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}>
                            Regenerate
                          </button>
                        </div>
                        <div style={{ fontFamily: SANS, fontSize: 10, color: '#5a4868', marginTop: 6 }}>Uses AI credits each time · Copy is ready to paste into your sales page</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.82)', marginBottom: 9 }}>
                          Let Zuri write conversion-focused sales copy from this offer's details.
                        </div>
                        <button type="button" onClick={() => runGenerateCopy(editingOffer)} data-testid="zuri-generate-btn" className="inline-flex items-center gap-1.5" style={{ fontFamily: SANS, fontSize: 10, fontWeight: 500, color: 'var(--cth-command-crimson)', background: 'transparent', border: '0.5px solid rgba(224,78,53,0.4)', borderRadius: 5, padding: '5px 11px', cursor: 'pointer' }}>
                          <Sparkles size={12} /> Write sales copy
                        </button>
                        <div style={{ fontFamily: SANS, fontSize: 10, color: '#5a4868', marginTop: 6 }}>Uses AI credits each time · Copy is ready to paste into your sales page</div>
                      </>
                    )}
                  </div>

                  {error ? (
                    <div style={{ ...CARD_STYLE, borderColor: 'color-mix(in srgb, var(--cth-danger) 35%, var(--cth-command-border))', background: 'color-mix(in srgb, var(--cth-danger) 8%, var(--cth-command-panel))', padding: 12, fontFamily: SANS, fontSize: 13, color: 'var(--cth-danger)' }}>
                      {error}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between" style={{ padding: '12px 22px', borderTop: '1px solid var(--cth-command-border)', background: 'var(--cth-command-panel-soft)', flexShrink: 0, gap: 10 }}>
                <button type="button" onClick={() => prevSec && setActiveOfferSection(prevSec.id)} disabled={!prevSec} data-testid="offer-prev-section" style={{ fontFamily: SANS, fontSize: 12, color: 'var(--cth-command-muted)', background: 'var(--cth-command-panel)', border: '1px solid var(--cth-command-border)', borderRadius: 7, padding: '7px 14px', cursor: prevSec ? 'pointer' : 'default', opacity: prevSec ? 1 : 0.4 }}>
                  {prevSec ? `← ${prevSec.label}` : '← Previous'}
                </button>
                <div className="flex items-center" style={{ gap: 10 }}>
                  <button type="button" onClick={handleCloseModal} style={{ fontFamily: SANS, fontSize: 12, color: 'var(--cth-command-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  <button type="button" data-testid="save-offer-btn" onClick={handleSaveOffer} disabled={!formData.name.trim() || savingOffer} className="inline-flex items-center gap-1.5" style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: '#fff', background: 'var(--cth-command-success)', border: 'none', borderRadius: 7, padding: '7px 18px', cursor: (!formData.name.trim() || savingOffer) ? 'not-allowed' : 'pointer', opacity: (!formData.name.trim() || savingOffer) ? 0.65 : 1 }}>
                    {savingOffer ? (<><Loader2 size={13} className="animate-spin" /> Saving…</>) : 'Save offer'}
                  </button>
                </div>
                <button type="button" onClick={() => nextSec && setActiveOfferSection(nextSec.id)} disabled={!nextSec} data-testid="offer-next-section" style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: '#fff', background: 'var(--cth-command-crimson)', border: 'none', borderRadius: 7, padding: '7px 18px', cursor: nextSec ? 'pointer' : 'default', opacity: nextSec ? 1 : 0.4 }}>
                  {nextSec ? `${nextSec.label} →` : 'Last'}
                </button>
              </div>
            </div>
          </div>
        );
      })() : null}

      {/* Confirm: Delete Offer */}
      {pendingDeleteOffer ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Delete Offer"
          onClick={() => setPendingDeleteOffer(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            background: 'rgba(13, 0, 16, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ ...CARD_STYLE, width: '100%', maxWidth: 480, padding: 28 }}
          >
            <h2 style={{ ...SECTION_HEADING_STYLE, fontSize: 22 }}>Delete Offer</h2>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 14,
                color: 'var(--cth-command-muted)',
                margin: '12px 0 0',
                lineHeight: 1.6,
              }}
            >
              This will permanently delete this offer and all its tracking links. This cannot be undone.
            </p>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 13,
                fontStyle: 'italic',
                color: 'var(--cth-command-muted)',
                margin: '8px 0 24px',
                wordBreak: 'break-word',
              }}
            >
              {pendingDeleteOffer.name || 'Untitled offer'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteOffer(null)}
                style={SECONDARY_BUTTON_STYLE}
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-delete-offer-btn"
                onClick={performDeleteOffer}
                style={DESTRUCTIVE_BUTTON_STYLE}
              >
                Delete Offer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Confirm: Discard Changes */}
      {confirmDiscardOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Discard Changes"
          onClick={() => setConfirmDiscardOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            background: 'rgba(13, 0, 16, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ ...CARD_STYLE, width: '100%', maxWidth: 480, padding: 28 }}
          >
            <h2 style={{ ...SECTION_HEADING_STYLE, fontSize: 22 }}>Discard Changes</h2>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 14,
                color: 'var(--cth-command-muted)',
                margin: '12px 0 24px',
                lineHeight: 1.6,
              }}
            >
              You have unsaved changes that will be lost if you close this.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDiscardOpen(false)}
                style={SECONDARY_BUTTON_STYLE}
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDiscardOpen(false);
                  handleCloseModalImmediate();
                }}
                style={DESTRUCTIVE_BUTTON_STYLE}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

export default function OfferBuilder() {
  return <OfferBuilderContent />;
}
