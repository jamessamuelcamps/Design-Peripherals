import { useTitle } from '../hooks/useTitle';
import styles from './ParticipantDone.module.css';

export default function ParticipantDone() {
  useTitle('Done');
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.check}>✓</div>
        <h1 className={styles.title}>Thank you</h1>
        <p className={styles.message}>Your response has been submitted.</p>
      </div>
    </div>
  );
}
