import { useEffect, useMemo, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import DOMPurify from "dompurify";
import { GripVertical, LockKeyhole, Users } from "lucide-react";
import { z } from "zod";
import { Empty, Modal, Pill } from "./WorkspacePrimitives";
import { WORK_STATUS_COLUMNS, formatDateTime } from "./workspaceRoutes";
import { patchWorkspaceWorkbench } from "./workspaceApi";
import { errorText } from "./workspaceRecords";

const noteSchema = z.object({ html: z.string().max(25000, "Workspace notes are too long.") });
const orderKey = (workspaceId) => `cth:workspace:${workspaceId}:active-work-order`;
const noteKey = (workspaceId, itemId) => `cth:workspace:${workspaceId}:work-note:${itemId}`;

function SortableCard({ item, onOpen }) {
  const sortable = useSortable({ id: item.id });
  return (
    <article ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }} className={`ws-work-card${sortable.isDragging ? " dragging" : ""}`}>
      <button className="ws-drag-handle" {...sortable.attributes} {...sortable.listeners} aria-label={`Move ${item.title}`}><GripVertical size={16} /></button>
      <button className="ws-work-card-main" onClick={() => onOpen(item)}><strong>{item.title}</strong><span>{item.type} · {item.owner}</span><small>{item.dueAt ? formatDateTime(item.dueAt) : "No deadline"}</small></button>
    </article>
  );
}

function Notes({ item, data }) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const sharedContent = data.controls?.active_work_notes?.[item.id] || "";
  const initialContent = useMemo(() => {
    let browserContent = "";
    try {
      browserContent = localStorage.getItem(noteKey(data.activeWorkspaceId, item.id)) || "";
    } catch {
      browserContent = "";
    }
    return DOMPurify.sanitize(sharedContent || browserContent || item?.raw?.notes || "");
  }, [data.activeWorkspaceId, item, sharedContent]);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: data.companionAvailable ? "Add shared Workspace notes…" : "Add a private browser draft…" }),
      Link.configure({ openOnClick: false }),
    ],
    content: initialContent,
  }, [item?.id, initialContent]);

  const saveBrowserDraft = (html, prefix = "") => {
    try {
      localStorage.setItem(noteKey(data.activeWorkspaceId, item.id), html);
      setMessage(`${prefix}Private browser draft saved on this device.`.trim());
    } catch {
      setMessage(`${prefix}The browser could not retain the private draft.`.trim());
    }
  };

  const save = async () => {
    const html = DOMPurify.sanitize(editor?.getHTML() || "");
    const parsed = noteSchema.safeParse({ html });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message);
      return;
    }

    if (!data.companionAvailable) {
      saveBrowserDraft(parsed.data.html);
      return;
    }

    setSaving(true);
    try {
      await patchWorkspaceWorkbench({ active_work_notes: { [item.id]: parsed.data.html } });
      setMessage("Shared Workspace note saved for authorized members.");
      await data.reload();
    } catch (error) {
      saveBrowserDraft(parsed.data.html, `${errorText(error)} `);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ws-editor-wrap">
      <div className="ws-privacy-card">
        {data.companionAvailable ? <Users size={17} /> : <LockKeyhole size={17} />}
        <div>
          <strong>{data.companionAvailable ? "Shared tenant note" : "Private browser draft"}</strong>
          <p>{data.companionAvailable ? "Authorized Workspace members can read this note. HTML is sanitized before storage." : "The companion API is unavailable, so this draft remains on this device only."}</p>
        </div>
      </div>
      <div className="ws-editor-toolbar">
        <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()}>List</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>Heading</button>
      </div>
      <EditorContent editor={editor} className="ws-editor" />
      {message ? <div className="ws-inline-message">{message}</div> : null}
      <button type="button" className="ws-btn primary" onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : data.companionAvailable ? "Save Shared Note" : "Save Private Draft"}</button>
    </div>
  );
}

export default function WorkspaceActiveWorkView({ data }) {
  const [items, setItems] = useState(data.workItems);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    let ordered = [...data.workItems];
    let saved = data.companionAvailable ? data.controls?.active_work_order : null;
    if (!Array.isArray(saved) || !saved.length) {
      try {
        saved = JSON.parse(localStorage.getItem(orderKey(data.activeWorkspaceId)) || "[]");
      } catch {
        saved = [];
      }
    }
    if (Array.isArray(saved) && saved.length) {
      const index = new Map(saved.map((id, position) => [id, position]));
      ordered.sort((a, b) => (index.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (index.get(b.id) ?? Number.MAX_SAFE_INTEGER));
    }
    setItems(ordered);
  }, [data.activeWorkspaceId, data.companionAvailable, data.controls, data.workItems]);

  const saveBrowserOrder = (reordered, prefix = "") => {
    try {
      localStorage.setItem(orderKey(data.activeWorkspaceId), JSON.stringify(reordered.map((item) => item.id)));
      setMessage(`${prefix}Personal board order saved in this browser.`.trim());
    } catch {
      setMessage(`${prefix}Board reordered for this session, but the browser could not retain it.`.trim());
    }
  };

  const dragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const activeItem = items.find((item) => item.id === active.id);
    const overItem = items.find((item) => item.id === over.id);
    if (!activeItem || !overItem || activeItem.status !== overItem.status) return;
    const reordered = arrayMove(
      items,
      items.findIndex((item) => item.id === active.id),
      items.findIndex((item) => item.id === over.id)
    );
    setItems(reordered);

    if (!data.companionAvailable) {
      saveBrowserOrder(reordered);
      return;
    }

    try {
      await patchWorkspaceWorkbench({ active_work_order: reordered.map((item) => item.id) });
      setMessage("Shared Workspace board order saved.");
      await data.reload();
    } catch (error) {
      saveBrowserOrder(reordered, `${errorText(error)} `);
    }
  };

  return (
    <article className="ws-panel">
      <div className="ws-panel-head"><div><h2>Active Workbench</h2><p>Drag within a status column. Ordering and TipTap notes are shared when the Workspace companion API is available, with an honest browser-only fallback.</p></div><Pill tone="gold">{items.length} active</Pill></div>
      {message ? <div className="ws-inline-message">{message}</div> : null}
      {items.length ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void dragEnd(event)}>
          <div className="ws-board">
            {WORK_STATUS_COLUMNS.map((column) => {
              const columnItems = items.filter((item) => item.status === column.id);
              return (
                <section key={column.id} className="ws-board-column">
                  <header><span>{column.label}</span><small>{columnItems.length}</small></header>
                  <SortableContext items={columnItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                    <div className="ws-board-list">{columnItems.map((item) => <SortableCard key={item.id} item={item} onOpen={setSelected} />)}</div>
                  </SortableContext>
                </section>
              );
            })}
          </div>
        </DndContext>
      ) : <Empty title="No active work yet" description="Campaigns and offers saved in the House will appear here." />}
      <Modal open={Boolean(selected)} onOpenChange={(next) => !next && setSelected(null)} title={selected?.title || "Work item"} description="Notes and next actions for the selected work item.">
        {selected ? <Notes item={selected} data={data} /> : null}
      </Modal>
    </article>
  );
}
