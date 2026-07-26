import { useEffect, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { GripVertical } from "lucide-react";
import { z } from "zod";
import apiClient from "../../lib/apiClient";
import { API_PATHS } from "../../lib/apiPaths";
import { Empty, Modal, Pill } from "./WorkspacePrimitives";
import { WORK_STATUS_COLUMNS, formatDateTime } from "./workspaceRoutes";
import { errorText } from "./workspaceRecords";

const noteSchema = z.object({ html: z.string().max(25000, "Workspace notes are too long.") });

function SortableCard({ item, onOpen }) {
  const sortable = useSortable({ id: item.id });
  return (
    <article ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }} className={`ws-work-card${sortable.isDragging ? " dragging" : ""}`}>
      <button className="ws-drag-handle" {...sortable.attributes} {...sortable.listeners} aria-label={`Move ${item.title}`}><GripVertical size={16} /></button>
      <button className="ws-work-card-main" onClick={() => onOpen(item)}><strong>{item.title}</strong><span>{item.type} · {item.owner}</span><small>{item.dueAt ? formatDateTime(item.dueAt) : "No deadline"}</small></button>
    </article>
  );
}

function Notes({ item, workspaceId, reload }) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Add workspace-scoped notes and next actions…" }),
      Link.configure({ openOnClick: false }),
    ],
    content: item?.raw?.workspace_notes || item?.raw?.notes || "",
  }, [item?.id]);

  const save = async () => {
    const parsed = noteSchema.safeParse({ html: editor?.getHTML() || "" });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message);
      return;
    }
    setSaving(true);
    try {
      await apiClient.patch(API_PATHS.workspace.settings(workspaceId), {
        active_work_notes: { [item.id]: parsed.data.html },
      });
      setMessage("Notes saved.");
      await reload();
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ws-editor-wrap">
      <div className="ws-editor-toolbar">
        <button onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
        <button onClick={() => editor?.chain().focus().toggleBulletList().run()}>List</button>
        <button onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>Heading</button>
      </div>
      <EditorContent editor={editor} className="ws-editor" />
      {message ? <div className="ws-inline-message">{message}</div> : null}
      <button className="ws-btn primary" onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save Notes"}</button>
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

  useEffect(() => setItems(data.workItems), [data.workItems]);

  const dragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const reordered = arrayMove(
      items,
      items.findIndex((item) => item.id === active.id),
      items.findIndex((item) => item.id === over.id)
    );
    setItems(reordered);
    try {
      await apiClient.patch(API_PATHS.workspace.settings(data.activeWorkspaceId), {
        active_work_order: reordered.map((item) => item.id),
      });
      setMessage("Workbench order saved.");
    } catch (error) {
      setMessage(`Order updated on screen. ${errorText(error)}`);
    }
  };

  return (
    <article className="ws-panel">
      <div className="ws-panel-head"><div><h2>Active Workbench</h2><p>Drag to reorder work. Open an item to add TipTap notes.</p></div><Pill tone="gold">{items.length} active</Pill></div>
      {message ? <div className="ws-inline-message">{message}</div> : null}
      {items.length ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}>
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
      <Modal open={Boolean(selected)} onOpenChange={(next) => !next && setSelected(null)} title={selected?.title || "Work item"} description="Workspace-scoped notes and next actions.">
        {selected ? <Notes item={selected} workspaceId={data.activeWorkspaceId} reload={data.reload} /> : null}
      </Modal>
    </article>
  );
}
