import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import styles from './StudiesList.module.css';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function TypeBadge({ type }) {
  const cls = type === 'treejack' ? styles.badgeTreejack : styles.badgeCardSort;
  const label = type === 'treejack' ? 'Treejack' : 'Card Sort';
  return <span className={`${styles.badge} ${cls}`}>{label}</span>;
}

function StatusBadge({ status }) {
  const cls = {
    draft: styles.badgeDraft,
    published: styles.badgePublished,
    closed: styles.badgeClosed,
  }[status] ?? styles.badgeDraft;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`${styles.badge} ${cls}`}>{label}</span>;
}

export default function StudiesList() {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/studies')
      .then(res => setStudies(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Studies</h1>
        <Link to="/studies/new" className={styles.btnPrimary}>+ New Study</Link>
      </div>

      <div className={styles.tableWrap}>
        {loading ? (
          <p className={styles.loading}>Loading…</p>
        ) : studies.length === 0 ? (
          <p className={styles.empty}>No studies yet. Create your first one.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Responses</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {studies.map(study => (
                <tr key={study.id}>
                  <td className={styles.titleCell}>
                    {study.title}
                    <span className={styles.titleDate}>{formatDate(study.created_at)}</span>
                  </td>
                  <td><TypeBadge type={study.type} /></td>
                  <td><StatusBadge status={study.status} /></td>
                  <td>{study.response_count}</td>
                  <td>
                    <div className={styles.actions}>
                      <Link to={`/studies/${study.id}/results`} className={styles.actionLink}>Results</Link>
                      <Link to={`/studies/${study.id}/edit`} className={styles.actionLink}>Edit</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
