import styles from './PlatformToggle.module.css';

export function PlatformToggle({ platform, onChange }) {
  return (
    <div className={styles.toggle}>
      <button
        className={platform === 'web' ? styles.active : styles.inactive}
        onClick={() => onChange('web')}
      >
        Web
      </button>
      <button
        className={platform === 'mobile' ? styles.active : styles.inactive}
        onClick={() => onChange('mobile')}
      >
        Mobile
      </button>
    </div>
  );
}
