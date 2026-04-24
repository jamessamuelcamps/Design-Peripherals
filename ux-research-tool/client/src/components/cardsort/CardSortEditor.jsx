import styles from './CardSortEditor.module.css';

export default function LabelList({ items, onChange, itemNoun, minCount }) {
  function add() {
    onChange([...items, { id: crypto.randomUUID(), label: '' }]);
  }

  function update(i, label) {
    onChange(items.map((item, idx) => idx === i ? { ...item, label } : item));
  }

  function remove(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  return (
    <div className={styles.list}>
      {items.length === 0 && (
        <p className={styles.empty}>No {itemNoun}s yet. Add one below.</p>
      )}
      {items.map((item, i) => (
        <div key={item.id} className={styles.row}>
          <input
            className={styles.rowInput}
            value={item.label}
            onChange={e => update(i, e.target.value)}
            placeholder={`${itemNoun} ${i + 1}`}
          />
          <button
            className={styles.deleteBtn}
            onClick={() => remove(i)}
            disabled={items.length <= minCount}
            title={items.length <= minCount ? `Minimum ${minCount} required` : `Delete`}
          >
            Delete
          </button>
        </div>
      ))}
      <button className={styles.addBtn} onClick={add}>+ Add {itemNoun}</button>
    </div>
  );
}
