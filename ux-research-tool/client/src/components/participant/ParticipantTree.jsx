import { useState } from 'react';
import styles from './ParticipantTree.module.css';

function TreeNode({ node, indexPath, labelPath, expanded, onToggle, selectedPath, onSelect, isRoot }) {
  const pathKey = indexPath.join(',');
  const isExpanded = isRoot || expanded.has(pathKey);
  const hasChildren = node.children.length > 0;

  const isSelected =
    !isRoot &&
    selectedPath !== null &&
    selectedPath.length === labelPath.length &&
    labelPath.every((l, i) => selectedPath[i] === l);

  function handleToggle(e) {
    e.stopPropagation();
    onToggle(pathKey);
  }

  function handleSelect(e) {
    e.stopPropagation();
    onSelect(labelPath);
  }

  return (
    <div className={styles.node}>
      <div className={`${styles.row} ${isSelected ? styles.rowSelected : ''}`}>
        {/* Expand / collapse arrow */}
        {!isRoot && hasChildren ? (
          <button className={styles.toggle} onClick={handleToggle} aria-label={isExpanded ? 'Collapse' : 'Expand'}>
            {isExpanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className={styles.toggleGap} />
        )}

        <span className={`${styles.label} ${isRoot ? styles.labelRoot : ''}`}>{node.label}</span>

        {!isRoot && (
          <button
            className={`${styles.selectBtn} ${isSelected ? styles.selectBtnActive : ''}`}
            onClick={handleSelect}
          >
            {isSelected ? 'Selected ✓' : 'Select this'}
          </button>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className={`${styles.children} ${isRoot ? styles.childrenRoot : ''}`}>
          {node.children.map((child, i) => (
            <TreeNode
              key={i}
              node={child}
              indexPath={[...indexPath, i]}
              labelPath={[...labelPath, child.label]}
              expanded={expanded}
              onToggle={onToggle}
              selectedPath={selectedPath}
              onSelect={onSelect}
              isRoot={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ParticipantTree({ tree, selectedPath, onSelect }) {
  const [expanded, setExpanded] = useState(new Set());

  function toggle(pathKey) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(pathKey)) next.delete(pathKey);
      else next.add(pathKey);
      return next;
    });
  }

  return (
    <div className={styles.tree}>
      <TreeNode
        node={tree}
        indexPath={[]}
        labelPath={[]}
        expanded={expanded}
        onToggle={toggle}
        selectedPath={selectedPath}
        onSelect={onSelect}
        isRoot
      />
    </div>
  );
}
