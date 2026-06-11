import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '../components/Layout';
import { useWorkspace } from '../context/WorkspaceContext';
import { useBrandHealth } from '../context/BrandHealthContext';
import { useUser } from '../hooks/useAuth';
import { BrandGuidelinesExportButton } from '../components/shared/BrandGuidelinesExport';
import IdentityStudioAssets from '../components/shared/IdentityStudioAssets';
import apiClient from "../lib/apiClient";
import { toast } from 'sonner';
import { Check, Pencil, Circle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

function isValidHex(value) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

function isValidPartialHex(value) {
  if (!value) return true;
  return /^#?[0-9a-fA-F]{0,6}$/.test(String(value));
}

function isValidFullHex(value) {
  if (!value || typeof value !== 'string') return false;
  const stripped = value.trim();
  return /^#?[0-9a-fA-F]{3}$/.test(stripped) || /^#?[0-9a-fA-F]{6}$/.test(stripped);
}

function normalizeHex(value) {
  if (!value || typeof value !== 'string') return '';
  let v = value.trim().replace(/^#/, '').toUpperCase();
  if (v.length === 3) {
    v = v.split('').map((c) => c + c).join('');
  }
  return v.length === 6 ? `#${v}` : value;
}

function isCssVarReference(value) {
  return typeof value === 'string' && value.trim().startsWith('var(');
}

const DEFAULT_COLORS = [
  { id: 'primary', role: 'primary', label: 'Primary', hex: 'var(--cth-brand-primary)' },
  { id: 'secondary', role: 'secondary', label: 'Secondary', hex: 'var(--cth-command-cinnabar)' },
  { id: 'accent', role: 'accent', label: 'Accent', hex: 'var(--cth-command-muted)' },
  { id: 'background', role: 'background', label: 'Background', hex: 'var(--cth-surface-deep)' },
  { id: 'text', role: 'text', label: 'Text', hex: 'var(--cth-on-dark)' },
];

// Two font roles per the reference: a display/heading face and a body/UI face.
// Each role carries its source so an uploaded font can round-trip and re-load
// via the FontFace API on reload.
const DEFAULT_FONTS = [
  {
    id: 'display',
    role: 'display',
    label: 'Display / Heading',
    family: 'Cormorant Garamond',
    source: 'system',
    asset_id: '',
    url: '',
    preview: 'The quick brown fox jumps over the lazy dog',
    usage: 'Used for page titles, section headers, and card headings',
  },
  {
    id: 'body',
    role: 'body',
    label: 'Body / UI',
    family: 'DM Sans',
    source: 'system',
    asset_id: '',
    url: '',
    preview:
      'The quick brown fox jumps over the lazy dog. Brand infrastructure is not a marketing problem — it is a structural one.',
    usage: 'Used for paragraphs, labels, navigation, and UI text',
  },
];

// Merge saved fonts onto the two canonical roles so the page always renders
// exactly two role cards (with static usage copy) regardless of legacy data.
function mergeLoadedFonts(saved) {
  const list = Array.isArray(saved) ? saved : [];
  return DEFAULT_FONTS.map((def, i) => {
    const match =
      list.find((f) => f.id === def.id) ||
      list.find((f) => f.role === def.role) ||
      list[i];
    if (!match) return { ...def };
    return {
      ...def,
      family: match.family || def.family,
      source: match.source || 'system',
      asset_id: match.asset_id || '',
      url: match.url || '',
      preview: match.preview || def.preview,
    };
  });
}

// System / web fonts offered in every role selector. Uploaded fonts are appended
// at runtime as a separate <optgroup>.
const SYSTEM_FONT_OPTIONS = [
  'Cormorant Garamond',
  'Playfair Display',
  'DM Serif Display',
  'DM Sans',
  'Inter',
  'Plus Jakarta Sans',
  'Georgia',
  'Montserrat',
  'Poppins',
  'Lora',
  'Merriweather',
];

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";
const MONO = "'DM Mono', ui-monospace, 'SF Mono', Menlo, monospace";

const API = import.meta.env.VITE_BACKEND_URL;

// Stable family name for an uploaded font asset — reused so the same FontFace
// is registered once and selections round-trip across reloads.
function uploadedFontFamily(asset) {
  return asset?.label || asset?.filename || asset?.asset_id || '';
}

// Module-level cache of FontFace families already registered on document.fonts,
// so re-selecting or reloading the same font doesn't re-fetch it.
const loadedFontFamilies = new Set();

async function ensureFontLoaded(family, url) {
  if (!family || !url || typeof window === 'undefined' || !window.FontFace) return;
  if (loadedFontFamilies.has(family)) return;
  try {
    const absUrl = url.startsWith('http') ? url : `${API || ''}${url}`;
    const face = new FontFace(family, `url("${absUrl}")`);
    await face.load();
    document.fonts.add(face);
    loadedFontFamilies.add(family);
  } catch (e) {
    console.error('Font load failed:', family, e);
  }
}

function formatFontBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const PAGE_STYLE = {
  background: 'var(--cth-command-blush)',
  minHeight: '100vh',
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

const SECTION_SUBTEXT_STYLE = {
  fontFamily: SANS,
  fontSize: 13,
  color: 'var(--cth-command-muted)',
  margin: '4px 0 0',
  lineHeight: 1.55,
};

const CARD_STYLE = {
  background: 'var(--cth-command-panel)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 12,
};

const FIELD_LABEL_STYLE = {
  display: 'block',
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--cth-command-muted)',
  marginBottom: 6,
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
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const SAVE_BUTTON_STYLE = {
  background: 'var(--cth-command-crimson)',
  color: 'var(--cth-command-panel)',
  border: 'none',
  borderRadius: 8,
  padding: '10px 18px',
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
};

const SAVE_BUTTON_DISABLED_STYLE = {
  ...SAVE_BUTTON_STYLE,
  background: 'var(--cth-command-panel-soft)',
  color: 'var(--cth-command-muted)',
  cursor: 'not-allowed',
};

const SECTIONS = [
  { id: 'colors', label: 'Brand Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'assets', label: 'Brand Assets' },
];

const ZURI_GUIDANCE = {
  colors:
    'Strong palettes lead with one dominant color, then two or three supporting tones and a neutral. Keep enough contrast for legible text, and reuse the exact same hex values everywhere so recognition compounds over time.',
  typography:
    'Pair one distinctive display face for headlines with a highly legible workhorse for body copy. Two families is usually enough — let weight, size, and spacing build the hierarchy rather than adding more fonts.',
  assets:
    'Upload your primary logo plus the marks, icons, and lockups you actually reuse. Consistent assets across your content and guidelines are what make a brand read as intentional instead of improvised.',
};

function SectionStateIcon({ state }) {
  if (state === 'done') {
    return <Check size={12} style={{ color: 'var(--cth-command-success)', flexShrink: 0 }} />;
  }
  if (state === 'active') {
    return <Pencil size={12} style={{ color: 'var(--cth-command-crimson)', flexShrink: 0 }} />;
  }
  return <Circle size={12} style={{ color: 'var(--cth-command-border)', flexShrink: 0 }} />;
}

function IdentityStudioContent() {
  const { activeWorkspace } = useWorkspace();
  const { user } = useUser();
  const { refresh: refreshBrandHealth } = useBrandHealth();
  const userId = user?.id;

  const [activeSection, setActiveSection] = useState('colors');
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [fonts, setFonts] = useState(DEFAULT_FONTS);
  const [assets, setAssets] = useState([]);
  const [copiedHex, setCopiedHex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveToastVisible, setSaveToastVisible] = useState(false);
  const [draftRecovery, setDraftRecovery] = useState(null);
  const [hexErrors, setHexErrors] = useState({});
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [uploadedFonts, setUploadedFonts] = useState([]);
  const [fontUploading, setFontUploading] = useState(false);

  const originalColorsRef = useRef(null);
  const lastValidHexRef = useRef({});
  // Value of a color-name input when it gained focus, so blur can detect a real
  // rename and auto-save only when the name actually changed.
  const colorLabelFocusRef = useRef('');
  const errorTimersRef = useRef({});
  const fontInputRef = useRef(null);
  const fontUploadRoleRef = useRef(null);

  const workspaceId =
    activeWorkspace?.id || activeWorkspace?.workspace_id || '';
  const draftKey = `cth-identity-draft-${workspaceId || 'default'}`;

  useEffect(() => {
    if (!hasUnsaved) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsaved]);

  useEffect(() => {
    if (isLoading || !hasUnsaved) return undefined;
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            colors,
            fonts,
            savedAt: new Date().toISOString(),
          })
        );
      } catch (e) {
        // private mode / quota — skip silently
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [colors, fonts, hasUnsaved, isLoading, draftKey]);

  useEffect(() => {
    if (!userId) {
      const fallback = setTimeout(() => setIsLoading(false), 3000);
      return () => clearTimeout(fallback);
    }

    const loadData = async () => {
      try {
        const res = await apiClient.get("/api/identity", { params: { user_id: userId } });

        let nextColors = null;
        if (Array.isArray(res?.colors) && res.colors.length > 0) {
          setColors(res.colors);
          nextColors = res.colors;
        }

        if (Array.isArray(res?.fonts) && res.fonts.length > 0) {
          const merged = mergeLoadedFonts(res.fonts);
          setFonts(merged);
          // Re-register any persisted uploaded fonts so their previews render.
          merged.forEach((f) => {
            if (f?.source === 'uploaded' && f?.family && f?.url) {
              ensureFontLoaded(f.family, f.url);
            }
          });
        }

        // Brand assets are owned and loaded by the IdentityStudioAssets child
        // (via /api/media-upload/assets). The /api/identity payload does not
        // persist them, so parsing res.assets here was a dead duplicate load.

        if (originalColorsRef.current === null) {
          const baseline = nextColors || DEFAULT_COLORS;
          originalColorsRef.current = baseline.map((c) => ({ ...c }));
          baseline.forEach((c, i) => {
            if (typeof c?.hex === 'string' && c.hex.length > 0) {
              lastValidHexRef.current[i] = c.hex;
            }
          });
        }

        try {
          const draftRaw = localStorage.getItem(draftKey);
          if (draftRaw) {
            const draft = JSON.parse(draftRaw);
            if (
              draft &&
              Array.isArray(draft.colors) &&
              Array.isArray(draft.fonts) &&
              draft.colors.length > 0
            ) {
              setDraftRecovery(draft);
            }
          }
        } catch (e) {
          // ignore corrupt draft
        }
      } catch (err) {
        console.error('Failed to load identity studio data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId, draftKey]);

  // Load tenant-uploaded font files (category=font_file) and register each via
  // the FontFace API so they preview correctly and can be offered in selectors.
  const loadUploadedFonts = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await apiClient.get("/api/media-upload/assets", {
        params: { category: "font_file", workspace_id: workspaceId },
      });
      const list = Array.isArray(res?.assets) ? res.assets : [];
      setUploadedFonts(list);
      list.forEach((a) => {
        const fam = uploadedFontFamily(a);
        if (fam && a.preview_url) ensureFontLoaded(fam, a.preview_url);
      });
    } catch (e) {
      console.error('Failed to load uploaded fonts:', e);
      setUploadedFonts([]);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadUploadedFonts();
  }, [loadUploadedFonts]);

  // Pick a font for a role: system family or an uploaded asset (which we load
  // via FontFace before applying so the preview renders).
  const handleFontSelect = useCallback((roleId, value) => {
    if (value.startsWith('uploaded:')) {
      const assetId = value.slice('uploaded:'.length);
      const asset = uploadedFonts.find((a) => a.asset_id === assetId);
      if (!asset) return;
      const fam = uploadedFontFamily(asset);
      ensureFontLoaded(fam, asset.preview_url);
      setFonts((prev) =>
        prev.map((f) =>
          f.id === roleId
            ? { ...f, family: fam, source: 'uploaded', asset_id: asset.asset_id, url: asset.preview_url || '' }
            : f
        )
      );
    } else {
      setFonts((prev) =>
        prev.map((f) =>
          f.id === roleId
            ? { ...f, family: value, source: 'system', asset_id: '', url: '' }
            : f
        )
      );
    }
    setHasUnsaved(true);
  }, [uploadedFonts]);

  // The select's current value: an uploaded asset reference or the system family.
  const fontSelectValue = useCallback((font) => {
    if (font?.source === 'uploaded' && font?.asset_id) return `uploaded:${font.asset_id}`;
    return font?.family || '';
  }, []);

  function triggerFontUpload(roleId) {
    fontUploadRoleRef.current = roleId || null;
    fontInputRef.current?.click();
  }

  async function handleFontFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const ok = /\.(ttf|otf|woff|woff2)$/i.test(file.name);
    if (!ok) {
      toast.error('Unsupported font type. Use .ttf, .otf, .woff, or .woff2.');
      return;
    }

    const targetRole = fontUploadRoleRef.current;
    fontUploadRoleRef.current = null;
    setFontUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', 'font_file');
      formData.append('category', 'font_file');
      formData.append('label', file.name.replace(/\.[^/.]+$/, ''));
      formData.append('workspace_id', workspaceId || '');

      const res = await apiClient.post("/api/media-upload/upload-asset", formData);
      const asset = {
        asset_id: res.asset_id,
        filename: res.filename || file.name,
        file_type: res.file_type || file.type,
        file_size: res.file_size || file.size,
        category: 'font_file',
        label: res.label || file.name.replace(/\.[^/.]+$/, ''),
        preview_url: res.preview_url || '',
      };
      setUploadedFonts((prev) => [asset, ...prev]);
      const fam = uploadedFontFamily(asset);
      await ensureFontLoaded(fam, asset.preview_url);

      // If a specific role triggered the upload, assign the new font to it.
      if (targetRole) {
        setFonts((prev) =>
          prev.map((f) =>
            f.id === targetRole
              ? { ...f, family: fam, source: 'uploaded', asset_id: asset.asset_id, url: asset.preview_url || '' }
              : f
          )
        );
        setHasUnsaved(true);
      }
      toast.success('Font uploaded.');
    } catch (err) {
      console.error('Font upload failed:', err);
      toast.error(err.response?.data?.detail || 'Font upload failed.');
    } finally {
      setFontUploading(false);
    }
  }

  const handleDeleteUploadedFont = useCallback(async (assetId) => {
    if (!assetId) return;
    try {
      await apiClient.delete(`/api/media-upload/assets/${assetId}`);
      setUploadedFonts((prev) => prev.filter((a) => a.asset_id !== assetId));
      // Any role still pointing at this asset falls back to its default family.
      setFonts((prev) =>
        prev.map((f) => {
          if (f.source === 'uploaded' && f.asset_id === assetId) {
            const fallback = f.id === 'display' ? 'Cormorant Garamond' : 'DM Sans';
            setHasUnsaved(true);
            return { ...f, family: fallback, source: 'system', asset_id: '', url: '' };
          }
          return f;
        })
      );
    } catch (err) {
      console.error('Delete font failed:', err);
      toast.error('Could not delete font.');
    }
  }, []);

  const handleAssetsChange = useCallback((nextAssets) => {
    setAssets(Array.isArray(nextAssets) ? nextAssets : []);
    setHasUnsaved(true);
  }, []);

  // Populate assets from the child's initial fetch WITHOUT marking the form
  // dirty — viewing the tab should never flip hasUnsaved.
  const handleAssetsLoad = useCallback((nextAssets) => {
    setAssets(Array.isArray(nextAssets) ? nextAssets : []);
  }, []);

  const handleAddColor = useCallback(() => {
    setColors((prev) => [
      ...prev,
      { id: `color-custom-${prev.length}`, role: 'custom', label: 'New Color', hex: '#000000' },
    ]);
    setHasUnsaved(true);
  }, []);

  // Optimistically remove a color and persist the new colors array immediately.
  // The identity save endpoint replaces the whole colors array (partial update),
  // so deleting == saving the array without the removed item.
  const performDeleteColor = useCallback(
    async (index) => {
      const prevColors = colors;
      const nextColors = colors.filter((_, i) => i !== index);
      setConfirmDeleteIndex(null);
      setColors(nextColors);

      // Keep the position-indexed refs aligned after the removal.
      if (Array.isArray(originalColorsRef.current)) {
        originalColorsRef.current = originalColorsRef.current.filter((_, i) => i !== index);
      }
      const rebuiltHex = {};
      nextColors.forEach((c, i) => {
        if (typeof c?.hex === 'string' && c.hex.length > 0) rebuiltHex[i] = c.hex;
      });
      lastValidHexRef.current = rebuiltHex;
      setHexErrors({});

      try {
        await apiClient.post('/api/identity/save', {
          workspace_id: activeWorkspace?.id || activeWorkspace?.workspace_id || '',
          colors: nextColors,
        });
        refreshBrandHealth();
      } catch (err) {
        console.error('Delete color failed:', err);
        setColors(prevColors);
        toast.error('Could not delete color. Please try again.');
      }
    },
    [colors, activeWorkspace, refreshBrandHealth]
  );

  const requestDeleteColor = useCallback(
    (index) => {
      if (colors.length <= 1) {
        setConfirmDeleteIndex(index);
      } else {
        performDeleteColor(index);
      }
    },
    [colors, performDeleteColor]
  );

  const handleDeleteAsset = useCallback(
    async (assetId) => {
      if (!assetId) return;

      try {
        await apiClient.delete(`/api/media-upload/assets/${assetId}`);
        setAssets((prev) =>
          prev.filter((asset) => (asset.asset_id || asset.id) !== assetId)
        );
        setHasUnsaved(true);
        refreshBrandHealth();
      } catch (err) {
        console.error('Failed to delete asset:', err);
        throw err;
      }
    },
    [refreshBrandHealth]
  );

  const handleSave = useCallback(async () => {
    if (!userId) return;

    setIsSaving(true);
    try {
      await apiClient.post("/api/identity/save", {
        workspace_id: activeWorkspace?.id || activeWorkspace?.workspace_id || '',
        colors,
        fonts,
        assets,
      });
      setHasUnsaved(false);
      setSaveToastVisible(true);
      setTimeout(() => setSaveToastVisible(false), 2500);
      refreshBrandHealth();
      try {
        localStorage.removeItem(draftKey);
      } catch (e) {
        // ignore
      }
      setDraftRecovery(null);
    } catch (err) {
      console.error('Save failed:', err);
      toast.error("Could not save identity. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [userId, activeWorkspace, colors, fonts, assets, draftKey, refreshBrandHealth]);

  const handleResetColor = useCallback(
    (index) => {
      const original = originalColorsRef.current && originalColorsRef.current[index];
      if (!original) return;
      setColors((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], hex: original.hex };
        return next;
      });
      if (typeof original.hex === 'string' && original.hex.length > 0) {
        lastValidHexRef.current[index] = original.hex;
      }
      setHexErrors((prev) => {
        if (!(index in prev)) return prev;
        const next = { ...prev };
        delete next[index];
        return next;
      });
      setHasUnsaved(true);
    },
    []
  );

  const handleRestoreDraft = useCallback(() => {
    if (!draftRecovery) return;
    if (Array.isArray(draftRecovery.colors)) setColors(draftRecovery.colors);
    if (Array.isArray(draftRecovery.fonts)) setFonts(draftRecovery.fonts);
    setHasUnsaved(true);
    setDraftRecovery(null);
  }, [draftRecovery]);

  const handleDiscardDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
    } catch (e) {
      // ignore
    }
    setDraftRecovery(null);
  }, [draftKey]);

  const showHexErrorBriefly = useCallback((index) => {
    setHexErrors((prev) => ({ ...prev, [index]: true }));
    if (errorTimersRef.current[index]) {
      clearTimeout(errorTimersRef.current[index]);
    }
    errorTimersRef.current[index] = setTimeout(() => {
      setHexErrors((prev) => {
        if (!(index in prev)) return prev;
        const next = { ...prev };
        delete next[index];
        return next;
      });
      delete errorTimersRef.current[index];
    }, 2000);
  }, []);

  const handleHexChange = useCallback(
    (index, raw) => {
      setColors((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], hex: raw };
        return next;
      });
      setHasUnsaved(true);

      if (raw === '' || isValidPartialHex(raw)) {
        if (errorTimersRef.current[index]) {
          clearTimeout(errorTimersRef.current[index]);
          delete errorTimersRef.current[index];
        }
        setHexErrors((prev) => {
          if (!(index in prev)) return prev;
          const next = { ...prev };
          delete next[index];
          return next;
        });
      } else {
        setHexErrors((prev) => ({ ...prev, [index]: true }));
      }
    },
    []
  );

  const handleHexBlur = useCallback(
    (index) => {
      const current = colors[index]?.hex || '';

      if (isValidFullHex(current)) {
        const normalized = normalizeHex(current);
        setColors((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], hex: normalized };
          return next;
        });
        lastValidHexRef.current[index] = normalized;
        if (errorTimersRef.current[index]) {
          clearTimeout(errorTimersRef.current[index]);
          delete errorTimersRef.current[index];
        }
        setHexErrors((p) => {
          if (!(index in p)) return p;
          const r = { ...p };
          delete r[index];
          return r;
        });
        return;
      }

      if (current === '') {
        return;
      }

      const lastValid = lastValidHexRef.current[index];
      if (lastValid !== undefined) {
        setColors((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], hex: lastValid };
          return next;
        });
      }
      showHexErrorBriefly(index);
    },
    [colors, showHexErrorBriefly]
  );

  useEffect(() => {
    return () => {
      Object.values(errorTimersRef.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  const colorsLen = colors.length;
  const fontsLen = fonts.length;
  const assetsLen = assets.length;

  const identityScore =
    Math.round(
      (colorsLen >= 5 ? 40 : (colorsLen / 5) * 40) +
      (fontsLen >= 2 ? 40 : (fontsLen / 2) * 40) +
      (assetsLen >= 1 ? 20 : 0)
    ) || 0;

  const sectionDone = {
    colors: colorsLen >= 5,
    typography: fontsLen >= 2,
    assets: assetsLen >= 1,
  };
  const completedCount = SECTIONS.filter((s) => sectionDone[s.id]).length;
  const sectionIndex = SECTIONS.findIndex((s) => s.id === activeSection);
  const prevSection = sectionIndex > 0 ? SECTIONS[sectionIndex - 1] : null;
  const nextSection = sectionIndex < SECTIONS.length - 1 ? SECTIONS[sectionIndex + 1] : null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div
          className="flex items-center justify-center"
          style={PAGE_STYLE}
        >
          <div
            style={{
              fontFamily: SANS,
              color: 'var(--cth-command-muted)',
              padding: '120px 24px',
            }}
          >
            Loading...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div
        className="flex flex-col"
        style={PAGE_STYLE}
        data-testid="identity-studio-page"
      >
        <header className="cth-page-header">
          <div className="min-w-0 flex-1">
            <h1
              className="text-2xl md:text-[32px] leading-tight truncate"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}
            >
              Identity Studio
            </h1>
            <p
              className="text-xs md:text-sm truncate"
              style={{ margin: "6px 0 0 0", color: "var(--cth-command-muted)", fontFamily: "'DM Sans', sans-serif" }}
            >
              Define your brand visual language
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 11,
                    color: 'var(--cth-command-muted)',
                    marginBottom: 5,
                  }}
                >
                  {completedCount} of {SECTIONS.length} complete
                </div>
                <div
                  style={{
                    width: 120,
                    height: 3,
                    background: 'var(--cth-command-border)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    marginLeft: 'auto',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.round((completedCount / SECTIONS.length) * 100)}%`,
                      background: 'var(--cth-command-success)',
                      borderRadius: 2,
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>

              {hasUnsaved && (
                <span
                  className="flex items-center gap-1.5"
                  style={{
                    fontFamily: SANS,
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--cth-warning)',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--cth-warning)' }}
                  />
                  Unsaved
                </span>
              )}

              <BrandGuidelinesExportButton style={PRIMARY_CTA_STYLE} />

              <button
                onClick={handleSave}
                disabled={isSaving || !hasUnsaved}
                data-testid="save-btn"
                style={hasUnsaved && !isSaving ? SAVE_BUTTON_STYLE : SAVE_BUTTON_DISABLED_STYLE}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {/* Mobile section nav */}
          <div
            className="md:hidden overflow-x-auto flex gap-2 px-4 py-3"
            style={{ borderBottom: '1px solid var(--cth-command-border)', background: 'var(--cth-command-panel)' }}
          >
            {SECTIONS.map((section) => {
              const isActive = activeSection === section.id;
              const isDone = sectionDone[section.id];
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    flexShrink: 0,
                    padding: '6px 14px',
                    fontFamily: SANS,
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    background: isActive ? 'var(--cth-command-crimson)' : 'var(--cth-command-blush)',
                    color: isActive ? '#fff' : 'var(--cth-command-ink)',
                    border: '1px solid var(--cth-command-border)',
                    borderRadius: 999,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isDone ? '✓ ' : ''}{section.label}
                </button>
              );
            })}
          </div>

          <div className="mx-auto flex max-w-[1100px] flex-col md:flex-row">
            {/* Left section nav */}
            <aside
              className="hidden md:flex md:flex-col"
              style={{
                width: 148,
                flexShrink: 0,
                borderRight: '0.5px solid var(--cth-command-border)',
                background: 'var(--cth-command-blush)',
                padding: '16px 0',
              }}
            >
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 8,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--cth-command-muted)',
                  fontWeight: 600,
                  padding: '0 14px 8px',
                }}
              >
                Sections
              </div>
              {SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
                const state = isActive ? 'active' : sectionDone[section.id] ? 'done' : 'todo';
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    data-testid={`section-nav-${section.id}`}
                    className="text-left"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      width: '100%',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      border: 'none',
                      borderLeft: `2px solid ${isActive ? 'var(--cth-command-crimson)' : 'transparent'}`,
                      background: isActive ? 'var(--cth-command-panel)' : 'transparent',
                    }}
                  >
                    <SectionStateIcon state={state} />
                    <span
                      style={{
                        fontFamily: SANS,
                        fontSize: 11,
                        fontWeight: isActive ? 500 : 400,
                        color: isActive ? 'var(--cth-command-crimson)' : 'var(--cth-command-muted)',
                      }}
                    >
                      {section.label}
                    </span>
                  </button>
                );
              })}
            </aside>

            {/* Right section area */}
            <main className="min-w-0 flex-1" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {draftRecovery ? (
              <div
                data-testid="identity-draft-recovery-banner"
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                style={{
                  background: 'var(--cth-command-panel-soft)',
                  border: '1px solid var(--cth-command-gold)',
                  borderRadius: 8,
                  padding: '12px 20px',
                }}
              >
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: 13,
                    color: 'var(--cth-command-ink)',
                    margin: 0,
                    lineHeight: 1.55,
                  }}
                >
                  You have unsaved changes from a previous session.
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    data-testid="restore-draft-btn"
                    onClick={handleRestoreDraft}
                    style={{
                      background: 'var(--cth-command-purple)',
                      color: 'var(--cth-command-gold)',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 14px',
                      fontFamily: SANS,
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                    }}
                  >
                    Restore Draft
                  </button>
                  <button
                    type="button"
                    data-testid="discard-draft-btn"
                    onClick={handleDiscardDraft}
                    style={{
                      background: 'transparent',
                      color: 'var(--cth-command-ink)',
                      border: '1px solid var(--cth-command-border)',
                      borderRadius: 8,
                      padding: '8px 14px',
                      fontFamily: SANS,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Discard Draft
                  </button>
                </div>
              </div>
            ) : null}

            {/* Brand Colors */}
            {activeSection === 'colors' && (
            <section style={{ ...CARD_STYLE, padding: 28 }}>
              <div className="flex items-start justify-between mb-5 gap-4">
                <div>
                  <h2 style={SECTION_HEADING_STYLE}>Brand Colors</h2>
                  <p style={SECTION_SUBTEXT_STYLE}>
                    Set the core palette for your brand system.
                  </p>
                </div>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--cth-command-muted)',
                  }}
                >
                  {colorsLen} colors
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--cth-command-muted)', marginTop: '4px', marginBottom: '16px' }}>
                Your brand colors create instant recognition. Consistent use builds visual trust over time.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {colors.map((color, index) => {
                  const lastValid = lastValidHexRef.current[index];
                  const currentHex = color.hex;
                  const isHexValid = isValidFullHex(currentHex);
                  const isCssVar = isCssVarReference(currentHex);
                  const swatchBackground = isHexValid
                    ? normalizeHex(currentHex)
                    : isCssVar
                    ? currentHex
                    : lastValid || currentHex || 'var(--cth-brand-primary)';
                  const pickerValue = isValidHex(swatchBackground) ? swatchBackground : '#000000';
                  const original =
                    originalColorsRef.current && originalColorsRef.current[index];
                  const showReset = Boolean(
                    original && (original.hex || '') !== (currentHex || '')
                  );
                  const hasError = Boolean(hexErrors[index]);

                  return (
                    <div
                      key={color.id || index}
                      style={{ ...CARD_STYLE, overflow: 'hidden' }}
                    >
                      {/* Color swatch — 64px tall, click to open native picker */}
                      <div
                        className="group w-full relative"
                        style={{
                          height: 64,
                          background: swatchBackground,
                        }}
                      >
                        <input
                          type="color"
                          value={pickerValue}
                          onChange={(e) => {
                            const picked = (e.target.value || '').toUpperCase();
                            setColors((prev) => {
                              const next = [...prev];
                              next[index] = { ...next[index], hex: picked };
                              return next;
                            });
                            if (isValidHex(picked)) {
                              lastValidHexRef.current[index] = picked;
                            }
                            setHasUnsaved(true);
                            setHexErrors((prev) => {
                              if (!(index in prev)) return prev;
                              const next = { ...prev };
                              delete next[index];
                              return next;
                            });
                          }}
                          aria-label={`Pick color for ${color.label || color.role || 'swatch'}`}
                          title="Click to change color"
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
                        <div
                          aria-hidden="true"
                          className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                          style={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            fontFamily: SANS,
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            color: 'var(--cth-command-ivory)',
                            background: 'rgba(13, 0, 16, 0.45)',
                            padding: '4px 8px',
                            borderRadius: 8,
                          }}
                        >
                          Click to change
                        </div>

                        <button
                          type="button"
                          data-testid={`color-delete-${index}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            requestDeleteColor(index);
                          }}
                          aria-label={`Delete ${color.label || color.role || 'color'}`}
                          title="Delete color"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            zIndex: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 24,
                            height: 24,
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--cth-command-ivory)',
                            background: 'rgba(13, 0, 16, 0.45)',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div style={{ padding: 16 }}>
                        {confirmDeleteIndex === index ? (
                          <div
                            data-testid={`color-delete-confirm-${index}`}
                            style={{
                              marginBottom: 14,
                              padding: '10px 12px',
                              borderRadius: 10,
                              background: 'var(--cth-command-panel-soft)',
                              border: '1px solid var(--cth-command-warning)',
                            }}
                          >
                            <p
                              style={{
                                fontFamily: SANS,
                                fontSize: 12,
                                fontWeight: 500,
                                color: 'var(--cth-command-ink)',
                                margin: '0 0 8px',
                                lineHeight: 1.4,
                              }}
                            >
                              This is your only brand color. Are you sure?
                            </p>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                data-testid={`color-delete-confirm-yes-${index}`}
                                onClick={() => performDeleteColor(index)}
                                style={{
                                  background: 'var(--cth-command-crimson)',
                                  color: 'var(--cth-command-ivory)',
                                  border: 'none',
                                  borderRadius: 8,
                                  padding: '5px 12px',
                                  fontFamily: SANS,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteIndex(null)}
                                style={{
                                  background: 'transparent',
                                  color: 'var(--cth-command-muted)',
                                  border: '1px solid var(--cth-command-border)',
                                  borderRadius: 8,
                                  padding: '5px 12px',
                                  fontFamily: SANS,
                                  fontSize: 11,
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : null}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={SECTION_LABEL_STYLE}>{color.role || 'color'}</p>
                            <input
                              value={color.label || ''}
                              onChange={(e) => {
                                const next = [...colors];
                                // Keep role in sync with the label so the bold
                                // caption above reflects the renamed color.
                                next[index] = { ...next[index], label: e.target.value, role: e.target.value };
                                setColors(next);
                                setHasUnsaved(true);
                              }}
                              onFocus={(e) => { colorLabelFocusRef.current = e.target.value; }}
                              onBlur={(e) => {
                                // Auto-save the rename when the founder tabs out
                                // or clicks away, only if the name actually changed.
                                if (e.target.value !== colorLabelFocusRef.current) {
                                  handleSave();
                                }
                              }}
                              className="w-full bg-transparent border-0 p-0 focus:outline-none"
                              style={{
                                fontFamily: SERIF,
                                fontSize: 18,
                                fontWeight: 600,
                                color: 'var(--cth-command-ink)',
                                marginTop: 6,
                                letterSpacing: '-0.005em',
                              }}
                              placeholder="Color label"
                            />
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {showReset ? (
                              <button
                                type="button"
                                onClick={() => handleResetColor(index)}
                                data-testid={`color-reset-${index}`}
                                className="hover:underline"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--cth-command-muted)',
                                  fontFamily: SANS,
                                  fontSize: 11,
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              >
                                Reset
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(color.hex || '');
                                setCopiedHex(color.hex || '');
                                setTimeout(() => setCopiedHex(null), 1600);
                              }}
                              style={{
                                background: 'transparent',
                                color: 'var(--cth-command-crimson)',
                                border: '1px solid var(--cth-command-border)',
                                borderRadius: 8,
                                padding: '5px 10px',
                                fontFamily: SANS,
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: '0.04em',
                                cursor: 'pointer',
                              }}
                            >
                              Copy
                            </button>
                          </div>
                        </div>

                        <div
                          style={{
                            ...CARD_STYLE,
                            padding: '10px 12px',
                            background: 'var(--cth-command-panel-soft)',
                            borderColor: hasError
                              ? 'var(--cth-command-crimson)'
                              : 'var(--cth-command-border)',
                          }}
                        >
                          <label style={FIELD_LABEL_STYLE}>Hex value</label>
                          <input
                            value={color.hex || ''}
                            onChange={(e) => handleHexChange(index, e.target.value)}
                            onBlur={() => handleHexBlur(index)}
                            className="w-full bg-transparent border-0 p-0 focus:outline-none"
                            style={{
                              fontFamily: MONO,
                              fontSize: 13,
                              color: 'var(--cth-command-ink)',
                              textTransform: 'uppercase',
                            }}
                            placeholder="#000000"
                          />
                        </div>
                        {hasError ? (
                          <p
                            style={{
                              fontFamily: SANS,
                              fontSize: 11,
                              fontWeight: 500,
                              color: 'var(--cth-command-crimson)',
                              margin: '6px 0 0',
                              letterSpacing: '0.02em',
                            }}
                          >
                            Enter a valid hex color (e.g. #AF0024)
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  data-testid="add-color-btn"
                  onClick={handleAddColor}
                  style={{
                    minHeight: 80,
                    border: '1px dashed var(--cth-command-border)',
                    borderRadius: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    cursor: 'pointer',
                    background: 'var(--cth-command-panel-soft)',
                    color: 'var(--cth-command-muted)',
                    fontFamily: SANS,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
                  Add color
                </button>
              </div>
            </section>
            )}

            {/* Typography */}
            {activeSection === 'typography' && (
            <section style={{ ...CARD_STYLE, padding: 28 }}>
              <div className="flex items-start justify-between mb-5 gap-4">
                <div>
                  <h2 style={SECTION_HEADING_STYLE}>Typography</h2>
                  <p style={SECTION_SUBTEXT_STYLE}>
                    Define your font system and preview it in context.
                  </p>
                </div>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--cth-command-muted)',
                  }}
                >
                  {fontsLen} styles
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--cth-command-muted)', marginTop: '4px', marginBottom: '16px' }}>
                Assign font roles for your brand. Upload your own fonts or choose from the system library.
              </p>

              {/* Hidden font file input — shared by all upload buttons */}
              <input
                ref={fontInputRef}
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleFontFileChange}
                style={{ display: 'none' }}
              />

              <div className="flex flex-col gap-4">
                {fonts.map((font) => {
                  const previewFamily = `${font.family || 'DM Sans'}, ${font.id === 'display' ? 'Georgia, serif' : 'sans-serif'}`;
                  const isDisplay = font.id === 'display';
                  return (
                    <div key={font.id} style={{ ...CARD_STYLE, borderRadius: 10, overflow: 'hidden' }}>
                      <div
                        className="flex items-center justify-between"
                        style={{ padding: '10px 14px', borderBottom: '1px solid var(--cth-command-border)' }}
                      >
                        <span style={{ ...SECTION_LABEL_STYLE, fontSize: 10 }}>{font.label}</span>
                        <span style={{ fontFamily: SANS, fontSize: 9, color: 'var(--cth-command-success)' }}>
                          {font.source === 'uploaded' ? 'Custom font' : 'System'}
                        </span>
                      </div>

                      <div style={{ padding: '12px 14px' }}>
                        <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                          <select
                            data-testid={`font-select-${font.id}`}
                            value={fontSelectValue(font)}
                            onChange={(e) => handleFontSelect(font.id, e.target.value)}
                            style={{ ...INPUT_STYLE, flex: 1 }}
                          >
                            <optgroup label="System fonts">
                              {SYSTEM_FONT_OPTIONS.map((option) => (
                                <option key={option} value={option} style={{ color: 'var(--cth-command-ink)' }}>{option}</option>
                              ))}
                            </optgroup>
                            {uploadedFonts.length > 0 ? (
                              <optgroup label="Uploaded fonts">
                                {uploadedFonts.map((a) => (
                                  <option
                                    key={a.asset_id}
                                    value={`uploaded:${a.asset_id}`}
                                    style={{ color: 'var(--cth-command-ink)' }}
                                  >
                                    {uploadedFontFamily(a)}
                                  </option>
                                ))}
                              </optgroup>
                            ) : null}
                          </select>

                          <button
                            type="button"
                            onClick={() => triggerFontUpload(font.id)}
                            disabled={fontUploading}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              fontFamily: SANS,
                              fontSize: 11,
                              color: 'var(--cth-command-crimson)',
                              background: 'transparent',
                              border: '1px solid var(--cth-command-border)',
                              borderRadius: 8,
                              padding: '7px 12px',
                              cursor: fontUploading ? 'default' : 'pointer',
                              whiteSpace: 'nowrap',
                              opacity: fontUploading ? 0.6 : 1,
                            }}
                          >
                            {fontUploading ? 'Uploading…' : 'Upload'}
                          </button>
                        </div>

                        <div
                          style={{
                            fontFamily: previewFamily,
                            fontWeight: isDisplay ? 500 : 400,
                            fontSize: isDisplay ? 22 : 13,
                            lineHeight: isDisplay ? 1.3 : 1.6,
                            color: isDisplay ? 'var(--cth-command-ink)' : 'var(--cth-command-muted)',
                            margin: 0,
                          }}
                        >
                          {font.preview}
                        </div>
                        <div style={{ fontFamily: SANS, fontSize: 9, color: 'var(--cth-command-muted)', marginTop: 6 }}>
                          {font.family} · {font.usage}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Uploaded fonts management list */}
              <div style={{ marginTop: 16 }}>
                <div style={{ ...SECTION_LABEL_STYLE, fontSize: 10, marginBottom: 8 }}>Uploaded fonts</div>
                {uploadedFonts.length === 0 ? (
                  <p style={{ fontFamily: SANS, fontSize: 11.5, color: 'var(--cth-command-muted)', margin: '0 0 8px' }}>
                    No uploaded fonts yet. Upload a font file to use it across your brand.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2" style={{ marginBottom: 8 }}>
                    {uploadedFonts.map((a) => {
                      const ext = (a.filename || '').split('.').pop()?.toUpperCase() || 'FONT';
                      return (
                        <div
                          key={a.asset_id}
                          className="flex items-center gap-2"
                          style={{
                            background: 'var(--cth-command-panel-soft)',
                            border: '1px solid var(--cth-command-border)',
                            borderRadius: 8,
                            padding: '8px 12px',
                          }}
                        >
                          <span style={{ fontFamily: SANS, fontSize: 11, color: 'var(--cth-command-ink)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.filename || uploadedFontFamily(a)}
                          </span>
                          <span
                            style={{
                              fontFamily: SANS,
                              fontSize: 9,
                              padding: '2px 7px',
                              borderRadius: 20,
                              background: 'var(--cth-command-panel)',
                              color: 'var(--cth-command-muted)',
                              border: '1px solid var(--cth-command-border)',
                            }}
                          >
                            {ext}{a.file_size ? ` · ${formatFontBytes(a.file_size)}` : ''}
                          </span>
                          <button
                            type="button"
                            data-testid={`delete-font-${a.asset_id}`}
                            onClick={() => handleDeleteUploadedFont(a.asset_id)}
                            style={{
                              fontFamily: SANS,
                              fontSize: 11,
                              color: 'var(--cth-command-error)',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px 4px',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => triggerFontUpload(null)}
                  disabled={fontUploading}
                  style={{
                    width: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    fontFamily: SANS,
                    fontSize: 11,
                    color: 'var(--cth-command-crimson)',
                    background: 'transparent',
                    border: '1px solid var(--cth-command-border)',
                    borderRadius: 8,
                    padding: '9px 12px',
                    cursor: fontUploading ? 'default' : 'pointer',
                    opacity: fontUploading ? 0.6 : 1,
                  }}
                >
                  {fontUploading ? 'Uploading…' : 'Upload a font file (.ttf .otf .woff .woff2)'}
                </button>
              </div>
            </section>
            )}

            {/* Brand Assets */}
            {activeSection === 'assets' && (
            <section style={{ ...CARD_STYLE, padding: 28 }}>
              <div className="mb-5">
                <h2 style={SECTION_HEADING_STYLE}>Brand Assets</h2>
                <p style={SECTION_SUBTEXT_STYLE}>
                  Upload, organize, edit, and delete your logos, icons, and brand files.
                </p>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--cth-command-muted)', marginTop: '4px', marginBottom: '16px' }}>
                Upload your logo, brand marks, and core visual assets. These are referenced across your content and guidelines.
              </p>

              <IdentityStudioAssets
                workspaceId={activeWorkspace?.id || activeWorkspace?.workspace_id || ''}
                assets={assets}
                onAssetsChange={handleAssetsChange}
                onAssetsLoad={handleAssetsLoad}
                onDeleteAsset={handleDeleteAsset}
              />
            </section>
            )}

            {/* Zuri inline suggestion — static per-section guidance (AI wiring deferred to a future per-section endpoint) */}
            <div style={{ background: '#1a0828', borderRadius: 10, padding: '13px 15px' }} data-testid="zuri-inline">
              <div className="flex items-center gap-2" style={{ marginBottom: 9 }}>
                <img
                  src="/zuri.png"
                  alt="Zuri"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: 8,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#7a6090',
                  }}
                >
                  Zuri · suggestion
                </span>
              </div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontStyle: 'italic',
                  fontSize: 15,
                  lineHeight: 1.45,
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                {ZURI_GUIDANCE[activeSection]}
              </div>
            </div>
            </div>

            {/* Page footer */}
            <div
              className="flex items-center justify-between"
              style={{
                marginTop: 'auto',
                padding: '14px 24px',
                borderTop: '0.5px solid var(--cth-command-border)',
                background: 'color-mix(in srgb, var(--cth-command-blush) 60%, var(--cth-command-panel))',
              }}
            >
              <button
                onClick={() => prevSection && setActiveSection(prevSection.id)}
                disabled={!prevSection}
                data-testid="prev-section-btn"
                className="inline-flex items-center gap-1.5"
                style={{
                  fontFamily: SANS,
                  fontSize: 12,
                  color: 'var(--cth-command-muted)',
                  background: 'var(--cth-command-panel)',
                  border: '0.5px solid var(--cth-command-border)',
                  borderRadius: 7,
                  padding: '7px 16px',
                  cursor: prevSection ? 'pointer' : 'default',
                  opacity: prevSection ? 1 : 0.4,
                }}
              >
                <ChevronLeft size={14} />
                {prevSection?.label || 'Previous'}
              </button>

              <span style={{ fontFamily: SANS, fontSize: 11, color: 'var(--cth-command-muted)' }}>
                {sectionIndex + 1} of {SECTIONS.length}
              </span>

              <button
                onClick={() => nextSection && setActiveSection(nextSection.id)}
                disabled={!nextSection}
                data-testid="next-section-btn"
                className="inline-flex items-center gap-1.5"
                style={{
                  fontFamily: SANS,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#fff',
                  background: 'var(--cth-command-crimson)',
                  border: 'none',
                  borderRadius: 7,
                  padding: '7px 20px',
                  cursor: nextSection ? 'pointer' : 'default',
                  opacity: nextSection ? 1 : 0.4,
                }}
              >
                {nextSection ? nextSection.label : 'Done'}
                <ChevronRight size={14} />
              </button>
            </div>
          </main>
          </div>
        </div>

        {copiedHex && (
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
            style={{
              background: 'var(--cth-command-purple)',
              color: 'var(--cth-command-gold)',
              padding: '10px 18px',
              borderRadius: 8,
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.04em',
              boxShadow: '0 12px 30px rgba(20,15,43,0.20)',
            }}
          >
            Copied {copiedHex}
          </div>
        )}

        {saveToastVisible && (
          <div
            data-testid="identity-save-toast"
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000,
              background: 'var(--cth-command-purple)',
              color: 'var(--cth-command-gold)',
              padding: '12px 20px',
              borderRadius: 8,
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.04em',
              boxShadow: '0 12px 30px rgba(20,15,43,0.20)',
            }}
          >
            Identity saved
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function IdentityStudio() {
  return <IdentityStudioContent />;
}
