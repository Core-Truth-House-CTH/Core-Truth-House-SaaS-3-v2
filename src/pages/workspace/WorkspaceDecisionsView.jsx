import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, Compass, Plus, RotateCcw } from "lucide-react";
import { z } from "zod";
import {
  createWorkspaceDecision,
  updateWorkspaceDecision,
} from "./workspaceApi";
import { errorText } from "./workspaceRecords";
import { Empty, Modal, Pill, SelectField } from "./WorkspacePrimitives";
import { formatDateTime, workspaceIconForType } from "./workspaceRoutes";

const decisionSchema = z.object({
  title: z.string().trim().min(2, "Add a clear decision title.").max(200),
  description: z.string().trim().max(5000),
  due_at: z.string().optional(),
  source: z.enum(["workspace", "campaign", "offer", "content", "operations"]),
});

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in_review", label: "In Review" },
  { value: "resolved", label: "Resolved" },
  { value: "archived", label: "Archived" },
];

function DecisionCard({ decision, busy, onStatus }) {
  return (
    <article className="ws-decision-card">
      <div className="ws-decision-head">
        <div>
          <strong>{decision.title}</strong>
          <p>{decision.description || "No supporting context added."}</p>
        </div>
        <Pill tone={decision.status === "resolved" ? "green" : decision.status === "in_review" ? "gold" : "default"}>
          {decision.status.replace("_", " ")}
        </Pill>
      </div>
      <div className="ws-asset-meta">
        <span>{decision.source}</span>
        <span>{decision.dueAt ? `Due ${formatDateTime(decision.dueAt)}` : `Updated ${formatDateTime(decision.updatedAt || decision.createdAt)}`}</span>
      </div>
      <div className="ws-decision-actions">
        {decision.status === "resolved" ? (
          <button type="button" className="ws-btn secondary compact" onClick={() => onStatus(decision, "open")} disabled={busy === decision.id}>
            <RotateCcw size={15} /> Reopen
          </button>
        ) : (
          <>
            <button type="button" className="ws-btn secondary compact" onClick={() => onStatus(decision, "in_review")} disabled={busy === decision.id}>
              Review
            </button>
            <button type="button" className="ws-btn primary compact" onClick={() => onStatus(decision, "resolved")} disabled={busy === decision.id}>
              <CheckCircle2 size={15} /> Resolve
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export default function WorkspaceDecisionsView({ data, navigate }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("active");
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_at: "",
    source: "workspace",
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  const filtered = useMemo(() => data.decisions.filter((decision) => {
    if (filter === "all") return true;
    if (filter === "active") return !["resolved", "archived"].includes(decision.status);
    return decision.status === filter;
  }), [data.decisions, filter]);

  const fallbackReviewItems = data.workItems.filter((item) => item.status === "review");

  const createDecision = async (event) => {
    event.preventDefault();
    setMessage("");
    const parsed = decisionSchema.safeParse(form);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message || "Check the decision details.");
      return;
    }
    setBusy("create");
    try {
      await createWorkspaceDecision({
        title: parsed.data.title,
        description: parsed.data.description,
        source: parsed.data.source,
        due_at: parsed.data.due_at ? new Date(parsed.data.due_at).toISOString() : null,
      });
      setOpen(false);
      setForm({ title: "", description: "", due_at: "", source: "workspace" });
      setMessage("Decision added to this Workspace.");
      await data.reload();
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy("");
    }
  };

  const updateStatus = async (decision, status) => {
    setBusy(decision.id);
    setMessage("");
    try {
      await updateWorkspaceDecision(decision.id, { status });
      setMessage(`Decision marked ${status.replace("_", " ")}.`);
      await data.reload();
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy("");
    }
  };

  if (!data.companionAvailable) {
    return (
      <div className="ws-grid two">
        <article className="ws-panel">
          <div className="ws-panel-head"><div><h2>Work Awaiting Review</h2><p>Verified campaigns and offers currently marked for review.</p></div><Pill tone="gold">{fallbackReviewItems.length} open</Pill></div>
          {fallbackReviewItems.length ? (
            <div className="ws-project-grid">
              {fallbackReviewItems.map((item) => {
                const Icon = workspaceIconForType(item.type);
                return (
                  <button key={item.id} className="ws-project-card" onClick={() => navigate("/workspace/active-work")}>
                    <Icon size={19} /><strong>{item.title}</strong><p>{item.owner}</p><Pill tone="gold">Awaiting review</Pill>
                  </button>
                );
              })}
            </div>
          ) : <Empty icon={Compass} title="No verified review items" description="Items will appear when a campaign or offer source returns a review status." />}
        </article>
        <article className="ws-panel soft">
          <div className="ws-panel-head"><div><h2>Decision Service Unavailable</h2><p>The companion API has not answered, so no decision count or record is being invented.</p></div><Compass size={21} /></div>
          <button className="ws-btn secondary" onClick={() => navigate("/workspace/active-work")}>Open Active Workbench</button>
        </article>
      </div>
    );
  }

  return (
    <article className="ws-panel">
      <div className="ws-panel-head">
        <div><h2>Strategic Decision Queue</h2><p>Create, review, resolve, and reopen tenant-scoped decisions.</p></div>
        <button type="button" className="ws-btn primary" onClick={() => setOpen(true)}><Plus size={16} /> Add Decision</button>
      </div>
      <div className="ws-filters">
        <SelectField value={filter} onValueChange={setFilter} label="Filter decisions" options={[
          { value: "active", label: "Active decisions" },
          ...statusOptions,
          { value: "all", label: "All decisions" },
        ]} />
      </div>
      {message ? <div className="ws-inline-message">{message}</div> : null}
      {filtered.length ? <div className="ws-decision-grid">{filtered.map((decision) => (
        <DecisionCard key={decision.id} decision={decision} busy={busy} onStatus={(item, status) => void updateStatus(item, status)} />
      ))}</div> : <Empty icon={Compass} title="No decisions in this view" description="Add a decision when the Workspace needs a clear owner and resolution state." />}

      <Modal open={open} onOpenChange={setOpen} title="Add Workspace Decision" description="This record will be visible only inside the active tenant Workspace.">
        <form className="ws-form" onSubmit={createDecision}>
          <label><span>Decision title</span><input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></label>
          <label><span>Context</span><textarea rows="5" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
          <label><span>Source</span><select value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}><option value="workspace">Workspace</option><option value="campaign">Campaign</option><option value="offer">Offer</option><option value="content">Content</option><option value="operations">Operations</option></select></label>
          <label><span>Due date</span><input type="datetime-local" value={form.due_at} onChange={(event) => setForm((current) => ({ ...current, due_at: event.target.value }))} /></label>
          {message ? <div className="ws-inline-message">{message}</div> : null}
          <div className="ws-dialog-actions"><Dialog.Close type="button" className="ws-btn secondary">Cancel</Dialog.Close><button className="ws-btn primary" disabled={busy === "create"}>{busy === "create" ? "Adding…" : "Add Decision"}</button></div>
        </form>
      </Modal>
    </article>
  );
}
