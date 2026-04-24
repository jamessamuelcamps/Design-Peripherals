import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useTitle } from '../hooks/useTitle';
import styles from './StudiesList.module.css';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function TypeBadge({ type }) {
  const cls   = type === 'treejack' ? styles.badgeTreejack : styles.badgeCardSort;
  const label = type === 'treejack' ? 'Treejack' : 'Card Sort';
  return <span className={`${styles.badge} ${cls}`}>{label}</span>;
}

function StatusBadge({ status }) {
  const cls = {
    published: styles.badgePublished,
    closed:    styles.badgeClosed,
  }[status] ?? styles.badgeDraft;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`${styles.badge} ${cls}`}>{label}</span>;
}

function IconPencil() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path
        d="M10.5 1.5 13.5 4.5 5 13H2V10Z"
        stroke="currentColor" strokeWidth="1.4"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M2.5 4.5h10M6 4.5V3a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 4.5l.75 7a.5.5 0 0 0 .5.5h5.5a.5.5 0 0 0 .5-.5l.75-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 7v3M9 7v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function StudiesList() {
  useTitle('Studies');
  const navigate = useNavigate();

  const [studies, setStudies]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [deleting, setDeleting]       = useState(null);
  const [confirmStudy, setConfirmStudy] = useState(null);

  useEffect(() => {
    api.get('/studies')
      .then(res => setStudies(res.data))
      .catch(() => setError('Failed to load studies. Is the server running?'))
      .finally(() => setLoading(false));
  }, []);

  function handleDelete(e, study) {
    e.stopPropagation();
    setConfirmStudy(study);
  }

  async function handleConfirmDelete() {
    const study = confirmStudy;
    setConfirmStudy(null);
    setDeleting(study.id);
    try {
      await api.delete(`/studies/${study.id}`);
      setStudies(prev => prev.filter(s => s.id !== study.id));
    } catch {
      alert('Failed to delete study. Please try again.');
    } finally {
      setDeleting(null);
    }
  }

  const drafts    = studies.filter(s => s.status === 'draft');
  const published = studies.filter(s => s.status !== 'draft');

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Studies</h1>
        <Link to="/studies/new" className={styles.btnPrimary}>+ New Study</Link>
      </div>

      {loading ? (
        <div className={styles.skeletonList}>
          {[1, 2, 3].map(i => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : error ? (
        <div className={styles.errorBanner}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : studies.length === 0 ? (
        <p className={styles.empty}>No studies yet. Create your first one.</p>
      ) : (
        <div className={styles.sections}>

          {drafts.length > 0 && (
            <section>
              <h2 className={styles.sectionHeading}>Drafts</h2>
              <div className={styles.tableWrap}>
                <div className={styles.tableScroll}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.colType}>Type</th>
                        <th>Title</th>
                        <th className={styles.colDate}>Date created</th>
                        <th className={styles.colCreatedBy}>Created by</th>
                        <th className={styles.thActions} />
                      </tr>
                    </thead>
                    <tbody>
                      {drafts.map(study => (
                        <tr key={study.id}>
                          <td><TypeBadge type={study.type} /></td>
                          <td className={styles.titleCell}>{study.title}</td>
                          <td className={styles.dateCell}>{formatDate(study.created_at)}</td>
                          <td className={styles.createdByCell}>{study.created_by ?? '—'}</td>
                          <td className={styles.actionsCell}>
                            <Link
                              to={`/studies/${study.id}/edit`}
                              className={styles.iconBtn}
                              title="Edit"
                            >
                              <IconPencil />
                            </Link>
                            <button
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              onClick={e => handleDelete(e, study)}
                              disabled={deleting === study.id}
                              title="Delete"
                            >
                              {deleting === study.id ? '…' : <IconTrash />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {published.length > 0 && (
            <section>
              <h2 className={styles.sectionHeading}>Published</h2>
              <div className={styles.tableWrap}>
                <div className={styles.tableScroll}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.colType}>Type</th>
                        <th>Title</th>
                        <th className={styles.colDate}>Date created</th>
                        <th className={styles.colCreatedBy}>Created by</th>
                        <th>Status</th>
                        <th>Responses</th>
                        <th className={styles.thActions} />
                      </tr>
                    </thead>
                    <tbody>
                      {published.map(study => (
                        <tr
                          key={study.id}
                          className={styles.clickableRow}
                          onClick={() => navigate(`/studies/${study.id}/results`)}
                        >
                          <td><TypeBadge type={study.type} /></td>
                          <td className={styles.titleCell}>{study.title}</td>
                          <td className={styles.dateCell}>{formatDate(study.created_at)}</td>
                          <td className={styles.createdByCell}>{study.created_by ?? '—'}</td>
                          <td><StatusBadge status={study.status} /></td>
                          <td>{study.response_count}</td>
                          <td className={styles.actionsCell}>
                            <button
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              onClick={e => handleDelete(e, study)}
                              disabled={deleting === study.id}
                              title="Delete"
                            >
                              {deleting === study.id ? '…' : <IconTrash />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

        </div>
      )}

      {confirmStudy && (
        <div className={styles.modalOverlay} onClick={() => setConfirmStudy(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Delete study?</h2>
            <p className={styles.modalBody}>
              <strong>"{confirmStudy.title}"</strong> and all its responses will be permanently deleted.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setConfirmStudy(null)}>
                Cancel
              </button>
              <button className={styles.modalDelete} onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
