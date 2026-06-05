import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Search,
  UsersRound,
} from "lucide-react";
import { DashboardLayout } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import { usePlan } from "../context/PlanContext";
import apiClient from "../lib/apiClient";
import { API_PATHS } from "../lib/apiPaths";
import AvatarCard from "../components/audience/AvatarCard";
import PortraitGenModal from "../components/audience/PortraitGenModal";
import AvatarEditor from "./AvatarEditor";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";

const PLAN_AVATAR_LIMITS = {
  foundation: 3,
  structure: 5,
  house: 10,
  estate: Infinity,
};

function getAvatarLimitForPlan(plan) {
  const tier = String(plan || "foundation").toLowerCase();
  return PLAN_AVATAR_LIMITS[tier] ?? PLAN_AVATAR_LIMITS.foundation;
}

const PAGE_STYLE = {
  background: "var(--cth-command-blush)",
  minHeight: "100vh",
};

const BODY_WRAP_STYLE = {
  padding: "28px 24px 96px",
  maxWidth: 1200,
  margin: "0 auto",
  fontFamily: SANS,
};

const CARD_STYLE = {
  background: "var(--cth-command-panel)",
  border: "0.5px solid var(--cth-command-border)",
  borderRadius: 12,
};

const PRIMARY_CTA_STYLE = {
  background: "var(--cth-command-crimson)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "9px 18px",
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  textDecoration: "none",
};

const UPGRADE_CTA_STYLE = {
  ...PRIMARY_CTA_STYLE,
};

const SECONDARY_BUTTON_STYLE = {
  background: "transparent",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 999,
  padding: "10px 18px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

function parseLimitFromError(message) {
  if (typeof message !== "string") return null;
  const match = message.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return null;
  return { used: Number(match[1]), limit: Number(match[2]) };
}

function SkeletonCard() {
  return (
    <div
      style={{
        ...CARD_STYLE,
        padding: 22,
        height: 188,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
      aria-hidden="true"
    >
      <div
        style={{
          height: 14,
          width: "55%",
          borderRadius: 3,
          background: "var(--cth-command-panel-soft)",
        }}
      />
      <div
        style={{
          height: 11,
          width: "30%",
          borderRadius: 3,
          background: "var(--cth-command-panel-soft)",
        }}
      />
      <div style={{ flex: 1 }} />
      <div
        style={{
          height: 11,
          width: "92%",
          borderRadius: 3,
          background: "var(--cth-command-panel-soft)",
        }}
      />
      <div
        style={{
          height: 11,
          width: "78%",
          borderRadius: 3,
          background: "var(--cth-command-panel-soft)",
        }}
      />
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div
      style={{
        ...CARD_STYLE,
        padding: "72px 28px",
        textAlign: "center",
        background:
          "linear-gradient(160deg, var(--cth-command-panel) 0%, color-mix(in srgb, var(--cth-command-gold) 6%, var(--cth-command-panel)) 100%)",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          background: "var(--cth-command-purple)",
          color: "var(--cth-command-gold)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 22,
        }}
      >
        <UsersRound size={26} />
      </div>
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: 34,
          fontWeight: 600,
          color: "var(--cth-command-ink)",
          letterSpacing: "-0.01em",
          margin: 0,
          lineHeight: 1.15,
        }}
      >
        Define your first audience.
      </h2>
      <p
        style={{
          fontFamily: SANS,
          fontSize: 14,
          color: "var(--cth-command-muted)",
          margin: "14px auto 28px",
          maxWidth: 520,
          lineHeight: 1.6,
        }}
      >
        Avatars are the people your brand serves. Every campaign, asset, and
        AI-generated piece pulls from the avatar you select, so the more honest
        your avatar, the sharper your output.
      </p>
      <button type="button" onClick={onCreate} style={PRIMARY_CTA_STYLE}>
        <Plus size={16} />
        Create Your First Avatar
      </button>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div
      style={{
        ...CARD_STYLE,
        padding: "56px 28px",
        textAlign: "center",
        borderColor:
          "color-mix(in srgb, var(--cth-danger) 30%, var(--cth-command-border))",
        background:
          "color-mix(in srgb, var(--cth-danger) 6%, var(--cth-command-panel))",
      }}
    >
      <AlertCircle
        size={28}
        style={{ color: "var(--cth-danger)", marginBottom: 14 }}
      />
      <h3
        style={{
          fontFamily: SERIF,
          fontSize: 22,
          fontWeight: 600,
          color: "var(--cth-command-ink)",
          margin: 0,
        }}
      >
        We couldn't load your avatars.
      </h3>
      <p
        style={{
          fontFamily: SANS,
          fontSize: 13,
          color: "var(--cth-command-muted)",
          margin: "10px auto 22px",
          maxWidth: 440,
        }}
      >
        Something went wrong reaching the audience service. Try again — if it
        keeps happening, let us know.
      </p>
      <button type="button" onClick={onRetry} style={SECONDARY_BUTTON_STYLE}>
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  );
}

export default function Audience() {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();
  const { plan } = usePlan();

  const [avatars, setAvatars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const planLimit = getAvatarLimitForPlan(plan);
  const [limit, setLimit] = useState(planLimit);
  useEffect(() => { setLimit(planLimit); }, [planLimit]);

  const loadAvatars = useCallback(async () => {
    if (!activeWorkspaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(API_PATHS.audience.avatars);
      const list = Array.isArray(data?.avatars) ? data.avatars : [];
      setAvatars(list);
    } catch (err) {
      const parsed = parseLimitFromError(err?.message);
      if (parsed) setLimit(parsed.limit);
      setError(err);
      toast.error("Couldn't load avatars. Try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    loadAvatars();
  }, [loadAvatars]);

  const used = avatars.length;
  const atLimit = used >= limit;

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Avatar editor modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorAvatarId, setEditorAvatarId] = useState(null); // null => create
  const openCreate = useCallback(() => {
    setEditorAvatarId(null);
    setEditorOpen(true);
  }, []);
  const openEdit = useCallback((id) => {
    setEditorAvatarId(id);
    setEditorOpen(true);
  }, []);
  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditorAvatarId(null);
    loadAvatars();
  }, [loadAvatars]);

  // Portrait generation
  const [models, setModels] = useState([]);
  const [genAvatar, setGenAvatar] = useState(null);
  const [genPrompt, setGenPrompt] = useState("");
  const [genModelId, setGenModelId] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);

  const openPortraitGen = useCallback(
    async (avatar) => {
      setGenAvatar(avatar);
      setGenLoading(true);
      setGenPrompt(avatar.portrait_prompt || "");
      setGenModelId("");
      try {
        let list = models;
        if (!list.length) {
          const res = await apiClient.get(API_PATHS.audience.portraitModels);
          list = Array.isArray(res?.models) ? res.models : [];
          setModels(list);
        }
        // Default to the model that produced the last portrait, else the first.
        const defaultModel =
          avatar.portrait_model && list.some((m) => m.id === avatar.portrait_model)
            ? avatar.portrait_model
            : list[0]?.id || "";
        setGenModelId(defaultModel);

        // Regenerate pre-fills the last prompt; first time drafts one via Zuri.
        if (avatar.portrait_prompt) {
          setGenPrompt(avatar.portrait_prompt);
        } else {
          const draft = await apiClient.post(
            API_PATHS.audience.draftPortraitPrompt(avatar.id),
            {}
          );
          setGenPrompt((draft?.prompt || "").trim());
        }
      } catch (err) {
        toast.error("Couldn't start portrait generation. Try again.");
      } finally {
        setGenLoading(false);
      }
    },
    [models]
  );

  const handleGeneratePortrait = useCallback(
    async (prompt, modelId) => {
      if (!genAvatar) return;
      const avatarId = genAvatar.id;
      setGenAvatar(null);
      setGeneratingId(avatarId);
      try {
        const res = await apiClient.post(
          API_PATHS.audience.generatePortrait(avatarId),
          { prompt, model_id: modelId }
        );
        if (res?.avatar) {
          setAvatars((prev) => prev.map((a) => (a.id === avatarId ? res.avatar : a)));
        }
      } catch (err) {
        toast.error("Portrait generation failed. Try again.");
      } finally {
        setGeneratingId(null);
      }
    },
    [genAvatar]
  );

  // Upload a user-supplied photo as the avatar's portrait. Mirrors the generate
  // flow: posts to upload-portrait, then swaps the returned avatar into state.
  const handleUploadPortrait = useCallback(async (avatar, file) => {
    if (!avatar || !file) return;
    setUploadingId(avatar.id);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiClient.post(API_PATHS.audience.uploadPortrait(avatar.id), fd);
      if (res?.avatar) {
        setAvatars((prev) => prev.map((a) => (a.id === avatar.id ? res.avatar : a)));
      }
      toast.success("Portrait updated.");
    } catch (err) {
      toast.error("Photo upload failed. Try again.");
    } finally {
      setUploadingId(null);
    }
  }, []);

  const displayedAvatars = avatars
    .filter((a) =>
      !searchQuery ||
      (a.name || a.avatar_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortOrder === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const handleCreate = openCreate;
  const handleUpgrade = () => navigate("/billing");

  const handleDeleteAvatar = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/api/audience/avatars/${deleteTarget.id}`);
      setAvatars((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setDeleting(false);
    }
  };

  const headerAction = atLimit ? (
    <button type="button" onClick={handleUpgrade} style={UPGRADE_CTA_STYLE}>
      <ArrowUpRight size={16} />
      Upgrade to add more avatars
    </button>
  ) : (
    <button type="button" onClick={handleCreate} style={PRIMARY_CTA_STYLE}>
      <Plus size={16} />
      Create New Avatar
    </button>
  );

  return (
    <DashboardLayout>
      <header className="cth-page-header">
        <div className="min-w-0 flex-1">
          <h1
            className="text-2xl md:text-[32px] leading-tight truncate"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}
          >
            Audience
          </h1>
          <p
            className="text-xs md:text-sm truncate"
            style={{ margin: "6px 0 0 0", color: "var(--cth-command-muted)", fontFamily: "'DM Sans', sans-serif" }}
          >
            {`${avatars.length} avatar${avatars.length !== 1 ? "s" : ""} · ${used} of ${limit === Infinity ? "∞" : limit} used`}
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {headerAction}
        </div>
      </header>

      <div style={PAGE_STYLE}>
        <div style={BODY_WRAP_STYLE}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 0",
              borderBottom: "1px solid var(--cth-command-border)",
              marginBottom: 32,
            }}
          >
            <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--cth-command-muted)",
                }}
              />
              <input
                type="text"
                placeholder="Search avatars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  paddingLeft: 32,
                  paddingRight: 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                  border: "0.5px solid var(--cth-command-border)",
                  borderRadius: 8,
                  background: "var(--cth-command-panel)",
                  color: "var(--cth-command-ink)",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "0.5px solid var(--cth-command-border)",
                borderRadius: 8,
                background: "var(--cth-command-panel)",
                color: "var(--cth-command-ink)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : error ? (
            <ErrorState onRetry={loadAvatars} />
          ) : avatars.length === 0 ? (
            <EmptyState onCreate={handleCreate} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedAvatars.map((avatar) => (
                <AvatarCard
                  key={avatar.id}
                  avatar={avatar}
                  isGenerating={generatingId === avatar.id}
                  isUploading={uploadingId === avatar.id}
                  onGeneratePortrait={openPortraitGen}
                  onUploadPortrait={handleUploadPortrait}
                  onOpen={() => openEdit(avatar.id)}
                  onEdit={() => openEdit(avatar.id)}
                  onDelete={() => setDeleteTarget(avatar)}
                  onSetPrimary={async () => {
                    try {
                      await apiClient.post(`/api/audience/avatars/${avatar.id}/set-primary`);
                      await loadAvatars();
                    } catch (err) {
                      console.error("Set primary failed", err);
                    }
                  }}
                />
              ))}
            </div>
          )}

        </div>
      </div>
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "var(--cth-command-panel)",
              border: "0.5px solid var(--cth-command-border)",
              padding: 32,
              maxWidth: 400,
              width: "90%",
              borderRadius: 12,
            }}
          >
            <h3 style={{ margin: "0 0 8px", color: "var(--cth-command-ink)", fontFamily: SERIF, fontWeight: 500 }}>
              Delete Avatar
            </h3>
            <p
              style={{
                margin: "0 0 24px",
                color: "var(--cth-command-muted)",
                fontSize: 14,
              }}
            >
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.name || deleteTarget.avatar_name}</strong>?
              This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{
                  padding: "8px 16px",
                  border: "0.5px solid var(--cth-command-border)",
                  background: "transparent",
                  color: "var(--cth-command-ink)",
                  cursor: "pointer",
                  borderRadius: 7,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAvatar}
                disabled={deleting}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  background: "var(--cth-command-crimson)",
                  color: "#fff",
                  cursor: deleting ? "not-allowed" : "pointer",
                  borderRadius: 7,
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {genAvatar && (
        <PortraitGenModal
          avatar={genAvatar}
          models={models}
          prompt={genPrompt}
          onPromptChange={setGenPrompt}
          modelId={genModelId}
          onModelChange={setGenModelId}
          loading={genLoading}
          onGenerate={handleGeneratePortrait}
          onClose={() => setGenAvatar(null)}
        />
      )}

      {editorOpen && (
        <AvatarEditor
          avatarId={editorAvatarId}
          isNew={!editorAvatarId}
          onClose={closeEditor}
        />
      )}
    </DashboardLayout>
  );
}
