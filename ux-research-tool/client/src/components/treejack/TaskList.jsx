import { useState } from 'react';
import styles from './TaskList.module.css';

// Compute label path from root to node at `path` — excludes root itself
function labelPath(tree, path) {
  const labels = [];
  let node = tree;
  for (const idx of path) {
    node = node.children[idx];
    labels.push(node.label);
  }
  return labels;
}

// ── Answer picker modal ───────────────────────────────────────────────────

function PickerNode({ node, path, rootTree, currentAnswer, onSelect, isRoot }) {
  const path_labels = labelPath(rootTree, path);
  const isSelected = !isRoot && JSON.stringify(path_labels) === JSON.stringify(currentAnswer);

  return (
    <div className={styles.pickerNode}>
      <div
        className={[
          styles.pickerRow,
          isRoot ? styles.pickerRootRow : styles.pickerSelectable,
          isSelected ? styles.pickerSelected : '',
        ].filter(Boolean).join(' ')}
        onClick={!isRoot ? () => onSelect(path_labels) : undefined}
      >
        <span className={styles.pickerLabel}>{node.label}</span>
        {!isRoot && path_labels.length > 1 && (
          <span className={styles.pickerBreadcrumb}>{path_labels.join(' › ')}</span>
        )}
      </div>
      {node.children.length > 0 && (
        <div className={styles.pickerChildren}>
          {node.children.map((child, i) => (
            <PickerNode
              key={child._id || i}
              node={child}
              path={[...path, i]}
              rootTree={rootTree}
              currentAnswer={currentAnswer}
              onSelect={onSelect}
              isRoot={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AnswerPickerModal({ tree, currentAnswer, onSelect, onClose }) {
  const hasChildren = tree.children.length > 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.pickerModal} onClick={e => e.stopPropagation()}>
        <div className={styles.pickerModalHeader}>
          <span className={styles.pickerModalTitle}>Select correct answer</span>
          <button className={styles.pickerModalClose} onClick={onClose}>✕</button>
        </div>
        {hasChildren ? (
          <>
            <p className={styles.pickerHint}>Click a node to set it as the correct answer.</p>
            <div className={styles.pickerScroll}>
              <PickerNode
                node={tree}
                path={[]}
                rootTree={tree}
                currentAnswer={currentAnswer}
                onSelect={path => { onSelect(path); onClose(); }}
                isRoot
              />
            </div>
          </>
        ) : (
          <p className={styles.pickerEmpty}>
            Add child nodes to the tree first before setting an answer.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Task item ─────────────────────────────────────────────────────────────

function TaskItem({ task, index, tree, onChange, onDelete }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const answerLabel = task.correct_answer?.length
    ? task.correct_answer.join(' › ')
    : null;

  return (
    <div className={styles.task}>
      <div className={styles.taskHeader}>
        <span className={styles.taskIndex}>Task {index + 1}</span>
        <button className={styles.taskDeleteBtn} onClick={onDelete}>Delete</button>
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>Question</label>
        <input
          className={styles.fieldInput}
          value={task.question}
          onChange={e => onChange({ ...task, question: e.target.value })}
          placeholder="e.g. Where would you go to pay a supplier?"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>Correct answer</label>
        <div className={styles.answerRow}>
          <span className={`${styles.answerDisplay} ${!answerLabel ? styles.answerEmpty : ''}`}>
            {answerLabel ?? 'No answer set'}
          </span>
          <button className={styles.setAnswerBtn} onClick={() => setPickerOpen(true)}>
            Set answer
          </button>
        </div>
      </div>

      {pickerOpen && (
        <AnswerPickerModal
          tree={tree}
          currentAnswer={task.correct_answer}
          onSelect={path => onChange({ ...task, correct_answer: path })}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

// ── TaskList ──────────────────────────────────────────────────────────────

export default function TaskList({ tasks, tree, onChange }) {
  function addTask() {
    const id = crypto.randomUUID();
    onChange([...tasks, { _id: id, id, question: '', correct_answer: [] }]);
  }

  function updateTask(i, updated) {
    onChange(tasks.map((t, idx) => idx === i ? updated : t));
  }

  function deleteTask(i) {
    onChange(tasks.filter((_, idx) => idx !== i));
  }

  return (
    <div className={styles.list}>
      {tasks.length === 0 && (
        <p className={styles.empty}>No tasks yet. Add one below.</p>
      )}
      {tasks.map((task, i) => (
        <TaskItem
          key={task._id}
          task={task}
          index={i}
          tree={tree}
          onChange={updated => updateTask(i, updated)}
          onDelete={() => deleteTask(i)}
        />
      ))}
      <button className={styles.addTaskBtn} onClick={addTask}>+ Add task</button>
    </div>
  );
}
