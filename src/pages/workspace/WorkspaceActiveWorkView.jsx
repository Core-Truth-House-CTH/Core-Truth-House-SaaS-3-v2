import { useEffect, useMemo, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { GripVertical, LockKeyhole } from "lucide-react";
import { z } from "zod";
import { Empty, Modal, Pill } from "./WorkspacePrimitives";
import { WORK_STATUS_COLUMNS, formatDateTime } from "./workspaceRoutes";

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

function Notes({ item, workspaceId }) {
  const [message, setMessage] = useState("");
  const initialContent = useMemo(() => {
    try {
      return localStorage.getItem(noteKey(workspaceId, item.id)) || item?.raw?.notes || "";
    } catch {
      return item?.raw?.notes || "";
    }
  }, [item, workspaceId]);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Add a private browser draft…" }),
      Link.configure({ openOnClick: false }),
    ],
    content: initialContent,
  }, [item?.id, initialContent]);

  const save = () => {
    const parsed = noteSchema.safeParse({ html: editor?.getHTML() || "" });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message);
      return;
    }
    try {
      localStorage.setItem(noteKey(workspaceId, item.id), parsed.data.html);
      setMessage("Private browser draft saved. It is not shared with workspace members.");
    } catch {
      setMessage("This browser could not store the draft.");
    }
  };

  return (
    <div className="ws-editor-wrap">
      <div className="ws-privacy-card"><LockKeyhole size={17} /><div><strong>Private browser draft</strong><p>The live backend does not yet expose shared work-item notes. This draft remains on this device only.</p></div></div>
      <div className="ws-editor-toolbar">
        <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()}>List</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>Heading</button>
      </div>
      <EditorContent editor={editor} className="ws-editor" />
      {message ? <div className="ws-inline-message">{message}</div> : null}
      <button type="button" className="ws-btn primary" onClick={save}>Save Private Draft</button>
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
    try {
      const saved = JSON.parse(localStorage.getItem(orderKey(data.activeWorkspaceId)) || "[]");
      if (Array.isArray(saved) && saved.length) {
        const index = new Map(saved.map((id, position) => [id, position]));
        ordered.sort((a, b) => (index.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (index.get(b.id) ?? Number.MAX_SAFE_INTEGER));
      }
    } catch {
      ordered = [...data.workItems];
    }
    setItems(ordered);
  }, [data.activeWorkspaceId, data.workItems]);

  const dragEnd = ({ active, over }) => {
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
    try {
      localStorage.setItem(orderKey(data.activeWorkspaceId), JSON.stringify(reordered.map((item) => item.id)));
      setMessage("Personal board order saved in this browser.");
    } catch {
      setMessage("Board reordered for this session, but the browser could not retain it.");
    }
  };

  return (
    <article className="ws-panel">
      <div className="ws-panel-head"><div><h2>Active Workbench</h2><p>Drag within a status column to create a personal browser order. Open an item for a private TipTap draft.</p></div><Pill tone="gold">{items.length} active</Pill></div>
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
      <Modal open={Boolean(selected)} onOpenChange={(next) => !next && setSelected(null)} title={selected?.title || "Work item"} description="Private drafting for the selected work item.">
        {selected ? <Notes item={selected} workspaceId={data.activeWorkspaceId} /> : null}
      </Modal>
    </article>
  );
}
