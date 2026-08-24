import React, { useMemo, useState } from "react";
import { Check, Clapperboard, Film, ImagePlus, Route, ShieldCheck, Sparkles } from "lucide-react";

import ContentStudioShell from "../components/ContentStudioShell";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { PageHeader } from "../components/Primitives";
import { useAsyncResource, useMutation } from "../hooks/useAsyncResource";
import {
  approveProductionFrame,
  directProduction,
  generateProductionFrame,
  generateProductionMotion,
  listStoryboards,
} from "../api/contentStudioApi";
import { directStoryboard } from "../utilities/shotRouter";

function StatusPill({ children }) {
  return <span className="cs-badge">{children}</span>;
}

function ShotCard({ productionId, shot, onChanged }) {
  const frame = useMutation(() => generateProductionFrame(productionId, shot.id));
  const approve = useMutation(() => approveProductionFrame(productionId, shot.id));
  const motion = useMutation(() => generateProductionMotion(productionId, shot.id));
  const p = shot.production || {};
  const canGenerateFrame = p.still_required && p.frame_status === "needs-frame";
  const canApprove = p.approval_required && p.frame_status === "ready" && p.frame_approval !== "approved";
  const canGenerateMotion = !p.approval_required || p.frame_approval === "approved";

  const run = async (mutation) => {
    const result = await mutation.mutate();
    if (result.ok) onChanged?.(result.data);
  };

  return (
    <article className="cs-card cs-card-pad" style={{ minWidth: 250, flex: "1 1 250px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--cs-tuscany)", marginBottom: 5 }}>SHOT {Number(shot.order || 0) + 1}</div>
          <h3 className="cs-h2" style={{ fontSize: 17, margin: 0 }}>{shot.title || "Untitled shot"}</h3>
        </div>
        <StatusPill>{p.shot_type || "broll"}</StatusPill>
      </div>

      {shot.image_url ? (
        <img src={shot.image_url} alt={`${shot.title || "Shot"} production frame`} style={{ width: "100%", aspectRatio: "9 / 16", objectFit: "cover", borderRadius: "var(--cs-radius)", marginTop: 12 }} />
      ) : null}

      <p style={{ color: "var(--cs-ruby)", fontSize: 12.5, lineHeight: 1.55, minHeight: 58 }}>{shot.direction || "No direction yet."}</p>

      <div style={{ display: "grid", gap: 8, marginTop: 12, fontSize: 12 }}>
        <div><strong>Identity:</strong> {p.identity_critical ? "Protected" : "Not critical"}</div>
        <div><strong>Still:</strong> {p.still_provider || "Not required"}</div>
        <div><strong>Motion:</strong> {p.motion_provider || "Compositor"}</div>
        {p.audio_provider ? <div><strong>Audio:</strong> {p.audio_provider}</div> : null}
        <div><strong>Frame:</strong> {p.frame_status || "pending"}</div>
        <div><strong>Approval:</strong> {p.frame_approval || "pending"}</div>
        <div><strong>Continuity:</strong> {p.continuity_status || "pending"}</div>
      </div>

      {(frame.error || approve.error || motion.error) ? <ErrorState error={frame.error || approve.error || motion.error} compact /> : null}

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        {p.still_required ? (
          <button type="button" className="cs-btn cs-btn-secondary" disabled={!canGenerateFrame || frame.busy} onClick={() => run(frame)}>
            <ImagePlus size={13} aria-hidden="true" />
            {p.frame_status === "queued" ? "Frame queued" : p.frame_status === "ready" ? "Frame ready" : "Generate frame"}
          </button>
        ) : null}
        {p.approval_required ? (
          <button type="button" className="cs-btn cs-btn-secondary" disabled={!canApprove || approve.busy} onClick={() => run(approve)}>
            <Check size={13} aria-hidden="true" />
            {p.frame_approval === "approved" ? "Frame approved" : "Approve frame"}
          </button>
        ) : null}
        {p.motion_provider ? (
          <button type="button" className="cs-btn cs-btn-primary" disabled={!canGenerateMotion || motion.busy || p.motion_status === "queued"} onClick={() => run(motion)}>
            <Film size={13} aria-hidden="true" />
            {p.motion_status === "queued" ? "Motion queued" : "Generate motion"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function ProductionInner() {
  const boards = useAsyncResource(() => listStoryboards(), []);
  const [selectedId, setSelectedId] = useState(null);
  const [production, setProduction] = useState(null);
  const direct = useMutation((payload) => directProduction(payload));

  const items = boards.data?.storyboards || [];
  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) || items[0] || null,
    [items, selectedId],
  );

  const handleDirect = async () => {
    if (!selected) return;
    const localPlan = directStoryboard(selected);
    const result = await direct.mutate({ storyboard_id: selected.id, plan: localPlan });
    if (result.ok) setProduction(result.data);
  };

  return (
    <div className="cs-page">
      <PageHeader
        title="Production Director"
        subtitle="Turn an approved storyboard into controlled shots, approval gates, and model-routed production work."
        actions={selected ? (
          <button type="button" className="cs-btn cs-btn-primary" onClick={handleDirect} disabled={direct.busy}>
            <Sparkles size={14} aria-hidden="true" />
            {direct.busy ? "Directing…" : "Direct storyboard"}
          </button>
        ) : null}
      />

      <div className="cs-card cs-card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
          <div><Route size={18} /><div style={{ marginTop: 6, fontWeight: 600 }}>Shot Router</div><div style={{ fontSize: 12, color: "var(--cs-ruby)" }}>Classifies each scene before generation.</div></div>
          <div><ShieldCheck size={18} /><div style={{ marginTop: 6, fontWeight: 600 }}>Identity Gate</div><div style={{ fontSize: 12, color: "var(--cs-ruby)" }}>Identity-critical frames require approval first.</div></div>
          <div><Clapperboard size={18} /><div style={{ marginTop: 6, fontWeight: 600 }}>Motion Handoff</div><div style={{ fontSize: 12, color: "var(--cs-ruby)" }}>Approved frames become narrow motion jobs.</div></div>
        </div>
      </div>

      {boards.loading ? <LoadingState label="Loading storyboards" /> : boards.error ? <ErrorState error={boards.error} onRetry={boards.reload} /> : items.length === 0 ? (
        <EmptyState title="No storyboards to direct" description="Create a storyboard first, then return here for production." icon={Clapperboard} />
      ) : (
        <>
          <div className="cs-scroll-x" style={{ display: "flex", gap: 8, paddingBottom: 14 }}>
            {items.map((item) => (
              <button key={item.id} type="button" className={selected?.id === item.id ? "cs-btn cs-btn-primary" : "cs-btn cs-btn-secondary"} onClick={() => { setSelectedId(item.id); setProduction(null); }}>
                {item.title}
              </button>
            ))}
          </div>

          {direct.error ? <ErrorState error={direct.error} compact /> : null}

          {production ? (
            <section aria-label="Directed production plan">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                <h2 className="cs-h2" style={{ fontSize: 20 }}>Directed shots</h2>
                <StatusPill>{production.production_status || "directed"}</StatusPill>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {(production.scenes || []).map((shot) => <ShotCard key={shot.id} productionId={production.id} shot={shot} onChanged={setProduction} />)}
              </div>
            </section>
          ) : (
            <div className="cs-card cs-card-pad" style={{ textAlign: "center" }}>
              <Clapperboard size={24} style={{ marginBottom: 8 }} />
              <div style={{ fontWeight: 600 }}>{selected?.title}</div>
              <p style={{ color: "var(--cs-ruby)", marginBottom: 0 }}>Direct this storyboard to classify its shots and create the production approval path.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductionPage() {
  return (
    <ContentStudioShell title="Production Director">
      <ProductionInner />
    </ContentStudioShell>
  );
}
