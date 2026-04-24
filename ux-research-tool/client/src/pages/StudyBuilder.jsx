import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import TreeEditor, { addIds, stripIds } from '../components/treejack/TreeEditor';
import TaskList from '../components/treejack/TaskList';
import LabelList from '../components/cardsort/CardSortEditor';
import { useTitle } from '../hooks/useTitle';
import styles from './StudyBuilder.module.css';

// ── Shared sub-components ─────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cls = { draft: styles.badgeDraft, published: styles.badgePublished, closed: styles.badgeClosed }[status];
  return <span className={`${styles.badge} ${cls}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

function PublishModal({ url, onClose }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.publishModal} onClick={e => e.stopPropagation()}>
        <h2>Study published</h2>
        <p>Share this link with participants to start collecting responses.</p>
        <div className={styles.urlRow}>
          <span className={styles.urlDisplay} title={url}>{url}</span>
          <button className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`} onClick={copy}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
        <button className={styles.publishModalDone} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

// ── StudyBuilder ──────────────────────────────────────────────────────────

export default function StudyBuilder() {
  const { id } = useParams();

  const [study, setStudy]           = useState(null);
  useTitle(study ? `Edit — ${study.title}` : null);
  const [title, setTitle]           = useState('');
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishModal, setPublishModal] = useState(null);
  const [feedback, setFeedback]     = useState(null);

  // Treejack state
  const [tree, setTree]   = useState(() => addIds({ label: 'Home', children: [] }));
  const [tasks, setTasks] = useState([]);

  // Card sort state
  const [cards, setCards]           = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get(`/studies/${id}`).then(res => {
      const s = res.data;
      setStudy(s);
      setTitle(s.title);
      const cfg = s.config || {};

      if (s.type === 'treejack') {
        setTree(addIds(cfg.tree?.label ? cfg.tree : { label: 'Home', children: [] }));
        setTasks((cfg.tasks || []).map(t => ({ ...t, _id: crypto.randomUUID() })));
      } else {
        setCards(cfg.cards || []);
        setCategories(cfg.categories || []);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  function flash(type, msg) {
    setFeedback({ type, msg });
    if (type === 'success') setTimeout(() => setFeedback(null), 2000);
  }

  function getConfig() {
    if (study.type === 'treejack') {
      return {
        tree: stripIds(tree),
        tasks: tasks.map(({ _id, ...t }) => t),
      };
    }
    return { cards, categories };
  }

  function validate() {
    if (study.type === 'treejack') {
      if (!tasks.length) return 'Add at least one task before publishing.';
      for (let i = 0; i < tasks.length; i++) {
        if (!tasks[i].question?.trim()) return `Task ${i + 1} needs a question.`;
        if (!tasks[i].correct_answer?.length) return `Task ${i + 1} needs a correct answer.`;
      }
    } else {
      if (cards.length < 3) return 'Add at least 3 cards before publishing.';
      if (categories.length < 2) return 'Add at least 2 categories before publishing.';
      for (let i = 0; i < cards.length; i++) {
        if (!cards[i].label.trim()) return `Card ${i + 1} needs a label.`;
      }
      for (let i = 0; i < categories.length; i++) {
        if (!categories[i].label.trim()) return `Category ${i + 1} needs a label.`;
      }
    }
    return null;
  }

  async function handleTitleBlur() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === study.title) return;
    try {
      await api.put(`/studies/${id}`, { title: trimmed });
      setStudy(s => ({ ...s, title: trimmed }));
    } catch {
      // silent — Save button will also persist it
    }
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await api.put(`/studies/${id}`, {
        title: title.trim() || study.title,
        config: getConfig(),
      });
      setStudy(s => ({ ...s, ...res.data }));
      flash('success', 'Saved');
    } catch (err) {
      flash('error', err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    const err = validate();
    if (err) { flash('error', err); return; }

    setPublishing(true);
    setFeedback(null);
    try {
      await api.put(`/studies/${id}`, {
        title: title.trim() || study.title,
        config: getConfig(),
      });
      const res = await api.post(`/studies/${id}/publish`);
      setStudy(s => ({ ...s, ...res.data }));
      setPublishModal({ url: `${window.location.origin}/s/${res.data.public_token}` });
    } catch (err) {
      flash('error', err.response?.data?.error || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  }

  if (loading) return <p className={styles.loading}>Loading…</p>;

  const topBar = (
    <div className={styles.topBar}>
      <Link to="/" className={styles.backLink}>← Studies</Link>
      <div className={styles.topActions}>
        {feedback && (
          <span className={`${styles.feedbackMsg} ${feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess}`}>
            {feedback.msg}
          </span>
        )}
        <button className={styles.btnSecondary} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button className={styles.btnPrimary} onClick={handlePublish} disabled={publishing}>
          {publishing ? 'Publishing…' : 'Publish'}
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      {topBar}

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Study details</h2>
        <input
          className={styles.titleInput}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Study title"
        />
      </section>

      {study.type === 'treejack' && (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Tree</h2>
            <TreeEditor tree={tree} onChange={setTree} />
          </section>
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Tasks</h2>
            <TaskList tasks={tasks} tree={tree} onChange={setTasks} />
          </section>
        </>
      )}

      {study.type === 'card_sort' && (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Cards</h2>
            <LabelList
              items={cards}
              onChange={setCards}
              itemNoun="card"
              minCount={0}
            />
          </section>
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Categories</h2>
            <LabelList
              items={categories}
              onChange={setCategories}
              itemNoun="category"
              minCount={0}
            />
          </section>
        </>
      )}

      {publishModal && (
        <PublishModal url={publishModal.url} onClose={() => setPublishModal(null)} />
      )}
    </div>
  );
}
