import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useTitle } from '../hooks/useTitle';
import styles from './ParticipantLanding.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ParticipantLanding() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [study, setStudy]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');

  useTitle(study?.title ?? null);

  useEffect(() => {
    api.get(`/public/${token}`)
      .then(res => setStudy(res.data))
      .catch(() => setUnavailable(true))
      .finally(() => setLoading(false));
  }, [token]);

  const emailValid = EMAIL_RE.test(email.trim());
  const canStart   = name.trim().length > 0 && emailValid;

  function handleStart(e) {
    e.preventDefault();
    if (!canStart) return;
    const n  = name.trim();
    const em = email.trim();
    sessionStorage.setItem(`participant_${token}_name`, n);
    sessionStorage.setItem(`participant_${token}_email`, em);
    navigate(`/s/${token}/exercise`, { state: { name: n, email: em } });
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonText} />
          <div className={styles.skeletonText} style={{ width: '70%' }} />
          <div className={styles.skeletonInput} />
          <div className={styles.skeletonInput} />
          <div className={styles.skeletonBtn} />
        </div>
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.unavailable}>This study is not available.</p>
          <p className={styles.muted} style={{ marginTop: 8 }}>
            The link may have expired or the study has been closed.
          </p>
        </div>
      </div>
    );
  }

  const taskCount = study.config?.tasks?.length ?? 0;
  const isCardSort = study.type === 'card_sort';

  const instructions = isCardSort
    ? "You'll be shown a set of items. Drag each one into the category that makes most sense to you."
    : `This study has ${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}. For each one, you'll be asked to find something in a menu structure. Click through the menu to find your answer.`;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{study.title}</h1>
        <p className={styles.instructions}>{instructions}</p>

        <form onSubmit={handleStart} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">Your name</label>
            <input
              id="name"
              className={styles.input}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
              autoFocus
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Your email</label>
            <input
              id="email"
              className={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <button className={styles.startBtn} type="submit" disabled={!canStart}>
            Start
          </button>
        </form>
      </div>
    </div>
  );
}
