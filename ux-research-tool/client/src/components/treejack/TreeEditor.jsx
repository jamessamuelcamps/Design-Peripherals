import { useState } from 'react';
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

function addChildAt(tree, path) {
  return updateAt(tree, path, node => ({
    ...node,
    children: [...node.children, { _id: crypto.randomUUID(), label: 'New item', children: [] }],
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

// ── Exported helpers for parent to add/strip internal _id fields ──────────

export function addIds(node) {
  return { _id: crypto.randomUUID(), ...node, children: (node.children || []).map(addIds) };
}

export function stripIds(node) {
  const { _id, ...rest } = node;
  return { ...rest, children: node.children.map(stripIds) };
}

// ── TreeNode ──────────────────────────────────────────────────────────────

function TreeNode({ node, path, tree, onChange, isRoot }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function startEdit() {
    setDraft(node.label);
    setEditing(true);
  }

  function commit() {
    const label = draft.trim() || node.label;
    onChange(renameAt(tree, path, label));
    setEditing(false);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEditing(false);
  }

  return (
    <div className={styles.node}>
      <div className={`${styles.nodeRow} ${isRoot ? styles.nodeRoot : ''}`}>
        <div className={styles.nodeLabel}>
          {editing ? (
            <input
              className={styles.labelInput}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={onKeyDown}
              autoFocus
            />
          ) : (
            <span>{node.label}</span>
          )}
        </div>
        <div className={styles.nodeActions}>
          {!editing && <button className={styles.nodeBtn} onClick={startEdit}>Rename</button>}
          <button className={styles.nodeBtn} onClick={() => onChange(addChildAt(tree, path))}>
            + Child
          </button>
          {!isRoot && (
            <button
              className={`${styles.nodeBtn} ${styles.nodeBtnDanger}`}
              onClick={() => onChange(removeAt(tree, path))}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {node.children.length > 0 && (
        <div className={styles.children}>
          {node.children.map((child, i) => (
            <TreeNode
              key={child._id}
              node={child}
              path={[...path, i]}
              tree={tree}
              onChange={onChange}
              isRoot={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── TreeEditor ────────────────────────────────────────────────────────────

export default function TreeEditor({ tree, onChange }) {
  return (
    <div className={styles.editor}>
      <TreeNode node={tree} path={[]} tree={tree} onChange={onChange} isRoot />
    </div>
  );
}
