import styles from './StatCard.module.css';

export function StatCard({ name, count }) {
  return (
    <div className={styles.card}>
      <span className={styles.count}>{count.toLocaleString()}</span>
      <span className={styles.name}>{name}</span>
    </div>
  );
}
