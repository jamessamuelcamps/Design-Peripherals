import { useState, useCallback } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './TreeEditor.module.css';

// ── Pure tree mutation helpers ────────────────────────────────────────────

function updateAt(tree, path, fn) {
  if (path.length === 0) return fn(tree);
  const [i, ...rest] = path;
  return {
    ...tree,
    children: tree.children.map((c, idx) => idx === i ? updateAt(c, rest, fn) : c),
  };
}

function addChildAt(tree, path, childId) {
  return updateAt(tree, path, node => ({
    ...node,
    children: [...node.children, { _id: childId, label: 'New item', children: [] }],
  }));
}

function removeAt(tree, path) {
  const parentPath = path.slice(0, -1);
  const idx = path[path.length - 1];
  return updateAt(tree, parentPath, node => ({
    ...node,
    children: node.children.filter((_, i) => i !== idx),
  }));
}

function renameAt(tree, path, label) {
  return updateAt(tree, path, node => ({ ...node, label }));
}

function moveNodeAt(tree, path, delta) {
  const parentPath = path.slice(0, -1);
  const idx = path[path.length - 1];
  return updateAt(tree, parentPath, node => {
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= node.children.length) return node;
    const children = [...node.children];
    [children[idx], children[newIdx]] = [children[newIdx], children[idx]];
    return { ...node, children };
  });
}

function findNodeById(tree, id) {
  if (tree._id === id) return tree;
  for (const child of tree.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

function findParentPath(tree, targetId, currentPath = []) {
  for (let i = 0; i < tree.children.length; i++) {
    if (tree.children[i]._id === targetId) return currentPath;
    const result = findParentPath(tree.children[i], targetId, [...currentPath, i]);
    if (result !== null) return result;
  }
  return null;
}

function getNodeAt(tree, path) {
  return path.reduce((node, i) => node.children[i], tree);
}

// ── Exported helpers for parent to add/strip internal _id fields ──────────

export function addIds(node) {
  return { _id: crypto.randomUUID(), ...node, children: (node.children || []).map(addIds) };
}

export function stripIds(node) {
  const { _id, ...rest } = node;
  return { ...rest, children: node.children.map(stripIds) };
}

// ── Icons ─────────────────────────────────────────────────────────────────

function ChevronUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GrabIcon() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden="true">
      <circle cx="3.5" cy="4"  r="1.4" />
      <circle cx="8.5" cy="4"  r="1.4" />
      <circle cx="3.5" cy="8"  r="1.4" />
      <circle cx="8.5" cy="8"  r="1.4" />
      <circle cx="3.5" cy="12" r="1.4" />
      <circle cx="8.5" cy="12" r="1.4" />
    </svg>
  );
}

// ── TreeNode ──────────────────────────────────────────────────────────────

function TreeNode({ node, path, tree, onChange, isRoot, focusId, onNewChild, siblingCount }) {
  const [editing, setEditing] = useState(() => node._id === focusId);
  const [draft, setDraft]     = useState(() => node._id === focusId ? node.label : '');

  const selectOnMount = useCallback(el => { if (el) { el.focus(); el.select(); } }, []);

  const idx     = path[path.length - 1];
  const isFirst = idx === 0;
  const isLast  = idx === siblingCount - 1;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node._id, disabled: isRoot });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  function startEdit() { setDraft(node.label); setEditing(true); }

  function commit() {
    const label = draft.trim() || node.label;
    onChange(renameAt(tree, path, label));
    setEditing(false);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEditing(false);
  }

  function handleAddChild() {
    const childId = crypto.randomUUID();
    onChange(addChildAt(tree, path, childId));
    onNewChild(childId);
  }

  return (
    <div ref={setNodeRef} style={style} className={styles.node}>
      <div className={`${styles.nodeRow} ${isRoot ? styles.nodeRoot : ''}`}>
        {!isRoot && (
          <span className={styles.grabHandle} {...listeners} {...attributes} aria-label="Drag to reorder">
            <GrabIcon />
          </span>
        )}

        <div className={styles.nodeLabel}>
          {editing ? (
            <input
              className={styles.labelInput}
              ref={selectOnMount}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={onKeyDown}
            />
          ) : (
            <span className={styles.labelText} onClick={startEdit}>{node.label}</span>
          )}
        </div>

        <div className={styles.nodeActions}>
          <button className={styles.nodeBtn} onClick={handleAddChild}>+ Child</button>
          {!isRoot && (
            <>
              <button
                className={`${styles.nodeBtn} ${styles.nodeBtnDanger}`}
                onClick={() => onChange(removeAt(tree, path))}
              >
                Delete
              </button>
              <button
                className={`${styles.nodeBtn} ${styles.nodeBtnIcon}`}
                onClick={() => onChange(moveNodeAt(tree, path, -1))}
                disabled={isFirst}
                title="Move up"
              >
                <ChevronUpIcon />
              </button>
              <button
                className={`${styles.nodeBtn} ${styles.nodeBtnIcon}`}
                onClick={() => onChange(moveNodeAt(tree, path, 1))}
                disabled={isLast}
                title="Move down"
              >
                <ChevronDownIcon />
              </button>
            </>
          )}
        </div>
      </div>

      {node.children.length > 0 && (
        <SortableContext items={node.children.map(c => c._id)} strategy={verticalListSortingStrategy}>
          <div className={styles.children}>
            {node.children.map((child, i) => (
              <TreeNode
                key={child._id}
                node={child}
                path={[...path, i]}
                tree={tree}
                onChange={onChange}
                isRoot={false}
                focusId={focusId}
                onNewChild={onNewChild}
                siblingCount={node.children.length}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}

// ── TreeEditor ────────────────────────────────────────────────────────────

export default function TreeEditor({ tree, onChange }) {
  const [activeId, setActiveId] = useState(null);
  const [focusId, setFocusId]   = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const activeNode = activeId ? findNodeById(tree, activeId) : null;

  function handleDragStart({ active }) {
    setActiveId(active.id);
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const parentPath     = findParentPath(tree, active.id);
    const overParentPath = findParentPath(tree, over.id);

    if (!parentPath || !overParentPath) return;
    if (parentPath.join(',') !== overParentPath.join(',')) return;

    const parentNode = getNodeAt(tree, parentPath);
    const oldIdx = parentNode.children.findIndex(c => c._id === active.id);
    const newIdx = parentNode.children.findIndex(c => c._id === over.id);

    if (oldIdx === -1 || newIdx === -1) return;

    onChange(updateAt(tree, parentPath, n => ({
      ...n,
      children: arrayMove(n.children, oldIdx, newIdx),
    })));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.editor}>
        <TreeNode
          node={tree} path={[]} tree={tree} onChange={onChange} isRoot
          focusId={focusId} onNewChild={setFocusId}
        />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeNode && (
          <div className={`${styles.nodeRow} ${styles.dragOverlay}`}>
            <span className={styles.grabHandle}><GrabIcon /></span>
            <span className={styles.nodeLabel}>{activeNode.label}</span>
            {activeNode.children.length > 0 && (
              <span className={styles.dragChildBadge}>
                +{activeNode.children.length} {activeNode.children.length === 1 ? 'child' : 'children'}
              </span>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
