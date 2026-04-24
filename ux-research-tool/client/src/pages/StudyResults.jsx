import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, LabelList, Tooltip,
} from 'recharts';
import api from '../api/client';
import { useTitle } from '../hooks/useTitle';
import styles from './StudyResults.module.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function avg(arr) {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

function pct(n, total) {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

// ── Treejack: outcome classification ─────────────────────────────────────────

function classifyOutcome(taskResult, taskConfig) {
  const correctNode = taskConfig.correct_answer?.[taskConfig.correct_answer.length - 1];
  const isCorrect   = taskResult.answer === correctNode;
  const direct      = taskResult.backtrack_count === 0;
  if (isCorrect && direct)  return 'direct_success';
  if (isCorrect && !direct) return 'indirect_success';
  if (!isCorrect && direct) return 'direct_failure';
  return 'indirect_failure';
}

const OUTCOME_META = {
  direct_success:   { label: 'Direct success',   color: '#16a34a', bg: '#dcfce7', text: '#166534' },
  indirect_success: { label: 'Indirect success',  color: '#ca8a04', bg: '#fef9c3', text: '#713f12' },
  direct_failure:   { label: 'Direct failure',    color: '#dc2626', bg: '#fee2e2', text: '#991b1b' },
  indirect_failure: { label: 'Indirect failure',  color: '#ea580c', bg: '#ffedd5', text: '#9a3412' },
};
const OUTCOME_KEYS = ['direct_success', 'indirect_success', 'direct_failure', 'indirect_failure'];

// ── Shared components ─────────────────────────────────────────────────────────

function Breadcrumb({ path }) {
  if (!path?.length) return <span className={styles.muted}>—</span>;
  return (
    <span className={styles.breadcrumb}>
      {path.map((label, i) => (
        <span key={i}>
          {i > 0 && <span className={styles.breadcrumbSep}>›</span>}
          <span className={styles.breadcrumbNode}>{label}</span>
        </span>
      ))}
    </span>
  );
}

function OutcomeBadge({ outcome }) {
  const meta = OUTCOME_META[outcome];
  return (
    <span className={styles.badge} style={{ background: meta.bg, color: meta.text }}>
      {meta.label}
    </span>
  );
}

function EmptyState({ study }) {
  const link = study.status === 'published'
    ? `${window.location.origin}/s/${study.public_token}`
    : null;
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyStateMsg}>
        No responses yet.{' '}
        {link ? 'Share the study link to get started.' : 'Publish the study to start collecting responses.'}
      </p>
      {link && (
        <a href={link} target="_blank" rel="noreferrer" className={styles.emptyStateLink}>
          {link}
        </a>
      )}
    </div>
  );
}

// ── Treejack: outcome stacked bar ─────────────────────────────────────────────

function OutcomeBar({ counts, total }) {
  const data = [{
    name: '',
    direct_success:   pct(counts.direct_success,   total),
    indirect_success: pct(counts.indirect_success, total),
    direct_failure:   pct(counts.direct_failure,   total),
    indirect_failure: pct(counts.indirect_failure, total),
  }];
  const lf = v => (v >= 8 ? `${v}%` : '');

  return (
    <div>
      <ResponsiveContainer width="100%" height={44}>
        <BarChart layout="vertical" data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis type="category" dataKey="name" hide width={0} />
          <Tooltip
            formatter={(v, name) => [`${v}%`, OUTCOME_META[name].label]}
            contentStyle={{ fontSize: 13 }}
            cursor={false}
          />
          <Bar dataKey="direct_success"   stackId="a" fill="#16a34a" radius={[4,0,0,4]} isAnimationActive={false}>
            <LabelList dataKey="direct_success"   position="inside" fill="#fff" style={{ fontSize: 12, fontWeight: 600 }} formatter={lf} />
          </Bar>
          <Bar dataKey="indirect_success" stackId="a" fill="#ca8a04" isAnimationActive={false}>
            <LabelList dataKey="indirect_success" position="inside" fill="#fff" style={{ fontSize: 12, fontWeight: 600 }} formatter={lf} />
          </Bar>
          <Bar dataKey="direct_failure"   stackId="a" fill="#dc2626" isAnimationActive={false}>
            <LabelList dataKey="direct_failure"   position="inside" fill="#fff" style={{ fontSize: 12, fontWeight: 600 }} formatter={lf} />
          </Bar>
          <Bar dataKey="indirect_failure" stackId="a" fill="#ea580c" radius={[0,4,4,0]} isAnimationActive={false}>
            <LabelList dataKey="indirect_failure" position="inside" fill="#fff" style={{ fontSize: 12, fontWeight: 600 }} formatter={lf} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className={styles.barLegend}>
        {OUTCOME_KEYS.map(k => (
          <span key={k} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: OUTCOME_META[k].color }} />
            {OUTCOME_META[k].label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Treejack: individual view ─────────────────────────────────────────────────

function TreejackIndividualView({ responses, taskMap, study }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!responses.length) return <EmptyState study={study} />;

  return (
    <div className={styles.responseList}>
      {responses.map(resp => {
        const isOpen = expandedId === resp.id;
        return (
          <div key={resp.id} className={styles.responseCard}>
            <button
              className={styles.responseHeader}
              onClick={() => setExpandedId(isOpen ? null : resp.id)}
            >
              <div className={styles.responseInfo}>
                <span className={styles.responseName}>{resp.participant_name}</span>
                <span className={styles.responseEmail}>{resp.participant_email}</span>
              </div>
              <div className={styles.responseRight}>
                <span className={styles.responseDate}>{formatDate(resp.completed_at)}</span>
                <span className={styles.chevron}>{isOpen ? '▾' : '▸'}</span>
              </div>
            </button>

            {isOpen && (
              <div className={styles.responseBody}>
                {resp.data.tasks.map((taskResult, i) => {
                  const taskConfig = taskMap[taskResult.task_id];
                  if (!taskConfig) return null;
                  const outcome = classifyOutcome(taskResult, taskConfig);
                  return (
                    <div key={taskResult.task_id} className={styles.taskRow}>
                      <p className={styles.taskNum}>Task {i + 1}</p>
                      <p className={styles.taskQuestion}>{taskConfig.question}</p>
                      <div className={styles.taskMeta}>
                        <div className={styles.taskMetaItem}>
                          <span className={styles.taskMetaLabel}>Path taken</span>
                          <Breadcrumb path={taskResult.path_taken} />
                        </div>
                        <div className={styles.taskMetaRow}>
                          <div className={styles.taskMetaItem}>
                            <span className={styles.taskMetaLabel}>Outcome</span>
                            <OutcomeBadge outcome={outcome} />
                          </div>
                          <div className={styles.taskMetaItem}>
                            <span className={styles.taskMetaLabel}>Time</span>
                            <span className={styles.taskMetaValue}>{taskResult.time_taken_seconds}s</span>
                          </div>
                          <div className={styles.taskMetaItem}>
                            <span className={styles.taskMetaLabel}>Backtracks</span>
                            <span className={styles.taskMetaValue}>{taskResult.backtrack_count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Treejack: aggregate view ──────────────────────────────────────────────────

function TreejackAggregateView({ study, responses }) {
  if (!responses.length) return <EmptyState study={study} />;

  return (
    <div className={styles.aggregateList}>
      {study.config.tasks.map((task, i) => {
        const taskResults = responses.flatMap(r =>
          r.data.tasks.filter(t => t.task_id === task.id)
        );
        const total = taskResults.length;
        const counts = { direct_success: 0, indirect_success: 0, direct_failure: 0, indirect_failure: 0 };
        taskResults.forEach(tr => { counts[classifyOutcome(tr, task)]++; });

        const successRate = pct(counts.direct_success + counts.indirect_success, total);
        const avgTime     = avg(taskResults.map(t => t.time_taken_seconds));

        const pathFreq = {};
        taskResults.forEach(tr => {
          const key = (tr.path_taken || []).join(' › ');
          pathFreq[key] = (pathFreq[key] || 0) + 1;
        });
        const topPaths = Object.entries(pathFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

        return (
          <div key={task.id} className={styles.aggregateCard}>
            <p className={styles.aggregateTaskNum}>Task {i + 1}</p>
            <h3 className={styles.aggregateQuestion}>{task.question}</h3>
            <OutcomeBar counts={counts} total={total} />
            <div className={styles.statsRow}>
              <div className={styles.statBlock}>
                <span className={styles.statValue}>{successRate}%</span>
                <span className={styles.statLabel}>Success rate</span>
              </div>
              <div className={styles.statBlock}>
                <span className={styles.statValue}>{avgTime}s</span>
                <span className={styles.statLabel}>Avg. time</span>
              </div>
              <div className={styles.statBlock}>
                <span className={styles.statValue}>{total}</span>
                <span className={styles.statLabel}>Responses</span>
              </div>
            </div>
            {topPaths.length > 0 && (
              <div className={styles.topPaths}>
                <p className={styles.topPathsHeading}>Most common paths</p>
                {topPaths.map(([pathStr, count]) => (
                  <div key={pathStr} className={styles.topPathRow}>
                    <span className={styles.topPathStr}>{pathStr || '—'}</span>
                    <span className={styles.topPathCount}>{count} · {pct(count, total)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Card Sort: individual view ────────────────────────────────────────────────

function CardSortIndividualView({ responses, study }) {
  const [expandedId, setExpandedId] = useState(null);
  const categoryMap = Object.fromEntries(study.config.categories.map(c => [c.id, c.label]));
  const cardMap     = Object.fromEntries(study.config.cards.map(c => [c.id, c.label]));

  if (!responses.length) return <EmptyState study={study} />;

  return (
    <div className={styles.responseList}>
      {responses.map(resp => {
        const isOpen = expandedId === resp.id;
        return (
          <div key={resp.id} className={styles.responseCard}>
            <button
              className={styles.responseHeader}
              onClick={() => setExpandedId(isOpen ? null : resp.id)}
            >
              <div className={styles.responseInfo}>
                <span className={styles.responseName}>{resp.participant_name}</span>
                <span className={styles.responseEmail}>{resp.participant_email}</span>
              </div>
              <div className={styles.responseRight}>
                <span className={styles.responseDate}>{formatDate(resp.completed_at)}</span>
                <span className={styles.chevron}>{isOpen ? '▾' : '▸'}</span>
              </div>
            </button>

            {isOpen && (
              <div className={styles.responseBody}>
                <div className={styles.placementList}>
                  {(resp.data.placements || []).map(p => (
                    <div key={p.card_id} className={styles.placementRow}>
                      <span className={styles.placementCard}>{cardMap[p.card_id] ?? p.card_id}</span>
                      <span className={styles.placementArrow}>→</span>
                      <span className={styles.placementCategory}>{categoryMap[p.category_id] ?? p.category_id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Card Sort: heatmap cell colour ────────────────────────────────────────────

function heatmapStyle(p) {
  if (p === 0) return { background: '#fff', color: '#9ca3af' };
  const alpha = p / 100;
  return {
    background: `rgba(22, 163, 74, ${alpha})`,
    color: p >= 55 ? '#fff' : '#111827',
  };
}

// ── Card Sort: aggregate view ─────────────────────────────────────────────────

function CardSortAggregateView({ study, responses }) {
  if (!responses.length) return <EmptyState study={study} />;

  const { cards, categories } = study.config;
  const total = responses.length;

  // Build frequency table: cardId → categoryId → count
  const freq = {};
  cards.forEach(c => {
    freq[c.id] = {};
    categories.forEach(cat => { freq[c.id][cat.id] = 0; });
  });
  responses.forEach(r => {
    (r.data.placements || []).forEach(p => {
      if (freq[p.card_id] && freq[p.card_id][p.category_id] !== undefined) {
        freq[p.card_id][p.category_id]++;
      }
    });
  });

  // Card agreement summary: for each card, find modal category
  const cardSummary = cards.map(card => {
    const catCounts = categories.map(cat => ({ cat, count: freq[card.id][cat.id] }));
    const modal = catCounts.reduce((best, cur) => cur.count > best.count ? cur : best, catCounts[0]);
    const modalPct = pct(modal.count, total);
    return { card, modalCat: modal.cat, modalPct };
  });

  // Category fill: avg cards placed per category across all responses
  const categoryFill = categories.map(cat => {
    const avgCards = responses.reduce((sum, r) => {
      const placed = (r.data.placements || []).filter(p => p.category_id === cat.id).length;
      return sum + placed;
    }, 0) / total;
    return { cat, avgCards: Math.round(avgCards * 10) / 10 };
  }).sort((a, b) => b.avgCards - a.avgCards);

  return (
    <div className={styles.aggregateList}>

      {/* 1. Agreement matrix */}
      <div className={styles.aggregateCard}>
        <h3 className={styles.aggregateSectionTitle}>Agreement matrix</h3>
        <p className={styles.aggregateSectionDesc}>
          % of participants who placed each card in each category. Bold = most common placement per card.
        </p>
        <div className={styles.matrixWrap}>
          <table className={styles.matrix}>
            <thead>
              <tr>
                <th className={styles.matrixCorner} />
                {categories.map(cat => (
                  <th key={cat.id} className={styles.matrixColHead}>{cat.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cards.map(card => {
                const rowMax = Math.max(...categories.map(cat => freq[card.id][cat.id]));
                return (
                  <tr key={card.id}>
                    <td className={styles.matrixRowHead}>{card.label}</td>
                    {categories.map(cat => {
                      const count  = freq[card.id][cat.id];
                      const p      = pct(count, total);
                      const isMax  = count === rowMax && count > 0;
                      const cs     = heatmapStyle(p);
                      return (
                        <td
                          key={cat.id}
                          className={[styles.matrixCell, isMax ? styles.matrixCellMax : ''].join(' ')}
                          style={cs}
                          title={`${card.label} → ${cat.label}: ${count}/${total} (${p}%)`}
                        >
                          {p > 0 ? `${p}%` : '—'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Card agreement summary */}
      <div className={styles.aggregateCard}>
        <h3 className={styles.aggregateSectionTitle}>Card agreement</h3>
        <p className={styles.aggregateSectionDesc}>
          The most common category for each card and how strongly participants agreed.
        </p>
        <div className={styles.agreementList}>
          {cardSummary.map(({ card, modalCat, modalPct }) => (
            <div key={card.id} className={styles.agreementRow}>
              <div className={styles.agreementTop}>
                <span className={styles.agreementCardLabel}>{card.label}</span>
                <span className={styles.agreementCatLabel}>
                  {modalCat.label} · {modalPct}%
                </span>
              </div>
              <div className={styles.agreementBarWrap}>
                <div
                  className={styles.agreementBarFill}
                  style={{
                    width: `${modalPct}%`,
                    background: modalPct >= 50 ? '#16a34a' : '#f59e0b',
                  }}
                />
              </div>
              {modalPct < 50 && (
                <p className={styles.agreementWarning}>
                  ⚠ Low agreement — consider revisiting this card or category
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Category fill */}
      <div className={styles.aggregateCard}>
        <h3 className={styles.aggregateSectionTitle}>Category fill</h3>
        <p className={styles.aggregateSectionDesc}>
          Average number of cards placed in each category per participant.
        </p>
        <div className={styles.fillList}>
          {categoryFill.map(({ cat, avgCards }) => (
            <div key={cat.id} className={styles.fillRow}>
              <span className={styles.fillCatLabel}>{cat.label}</span>
              <span className={styles.fillCount}>{avgCards} cards avg.</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudyResults() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [study, setStudy]         = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [tab, setTab]             = useState('individual');
  const [closing, setClosing]     = useState(false);

  useTitle(study ? `${study.title} — Results` : null);

  useEffect(() => {
    Promise.all([
      api.get(`/studies/${id}`),
      api.get(`/studies/${id}/responses`),
    ])
      .then(([studyRes, respRes]) => {
        setStudy(studyRes.data);
        setResponses(respRes.data);
      })
      .catch(() => setError('Failed to load study data. Is the server running?'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleClose() {
    if (!window.confirm('Close this study? Participants will no longer be able to submit responses.')) return;
    setClosing(true);
    try {
      await api.post(`/studies/${id}/close`);
      window.location.reload();
    } catch {
      setClosing(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.skeletonHeader} />
        <div className={styles.skeletonTabs} />
        {[1, 2, 3].map(i => <div key={i} className={styles.skeletonCard} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorBanner}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  const taskMap = Object.fromEntries((study.config.tasks || []).map(t => [t.id, t]));

  const IndividualView = study.type === 'card_sort'
    ? <CardSortIndividualView responses={responses} study={study} />
    : <TreejackIndividualView responses={responses} taskMap={taskMap} study={study} />;

  const AggregateView = study.type === 'card_sort'
    ? <CardSortAggregateView study={study} responses={responses} />
    : <TreejackAggregateView study={study} responses={responses} />;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <button className={styles.backLink} onClick={() => navigate('/')}>← Studies</button>
          <h1 className={styles.title}>{study.title}</h1>
          <span className={styles.statusBadge} data-status={study.status}>{study.status}</span>
        </div>
        {study.status === 'published' && (
          <button className={styles.closeBtn} onClick={handleClose} disabled={closing}>
            {closing ? 'Closing…' : 'Close study'}
          </button>
        )}
      </div>

      <div className={styles.tabs}>
        <button
          className={[styles.tab, tab === 'individual' ? styles.tabActive : ''].join(' ')}
          onClick={() => setTab('individual')}
        >
          Individual responses
          <span className={styles.tabCount}>{responses.length}</span>
        </button>
        <button
          className={[styles.tab, tab === 'aggregate' ? styles.tabActive : ''].join(' ')}
          onClick={() => setTab('aggregate')}
        >
          Aggregate results
        </button>
      </div>

      {tab === 'individual' ? IndividualView : AggregateView}
    </div>
  );
}
