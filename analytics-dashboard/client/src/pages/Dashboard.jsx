import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { PlatformToggle } from '../components/PlatformToggle.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { useDashboard } from '../hooks/useDashboard.js';
import styles from './Dashboard.module.css';

const NAVY   = '#0f3460';
const ACCENT = '#e94560';
const MUTED  = '#6b7280';

const SECTION_COLORS = [
  '#0f3460', '#16213e', '#1a3a5c', '#1e4d7b', '#2563a0',
  '#2d7ac5', '#3a92e0',
];

function fmt(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function SectionChart({ data }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Traffic by Section</h3>
      <p className={styles.cardSub}>Total screen / page views · 90 days</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 12, fill: MUTED }} tickFormatter={fmt} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: '#374151' }} width={130} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => [v.toLocaleString(), 'Events']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={SECTION_COLORS[i % SECTION_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrendChart({ data }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Weekly Sessions</h3>
      <p className={styles.cardSub}>Session starts · last 90 days</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: MUTED }}
            tickFormatter={(d) => d.slice(5)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 12, fill: MUTED }} tickFormatter={fmt} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            formatter={(v) => [v.toLocaleString(), 'Sessions']}
            labelFormatter={(d) => `Week of ${d}`}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Line type="monotone" dataKey="count" stroke={NAVY} strokeWidth={2.5} dot={{ r: 3, fill: NAVY }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PaymentsChart({ data }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Payment Flow Breakdown</h3>
      <p className={styles.cardSub}>Activity by payment type · 90 days</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 12, fill: MUTED }} tickFormatter={fmt} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: '#374151' }} width={140} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => [v.toLocaleString(), 'Events']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
          <Bar dataKey="count" fill={ACCENT} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function FunnelChart({ data, title }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardSub}>Drop-off through key steps · 90 days</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ left: 8, right: 24, top: 8, bottom: 48 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="step" tick={{ fontSize: 11, fill: MUTED }} angle={-25} textAnchor="end" axisLine={false} tickLine={false} interval={0} />
          <YAxis tick={{ fontSize: 12, fill: MUTED }} tickFormatter={fmt} axisLine={false} tickLine={false} width={40} />
          <Tooltip formatter={(v) => [v.toLocaleString(), 'Users']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={`rgba(15,52,96,${0.9 - (i / data.length) * 0.5})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AdoptionRow({ adoption }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Feature Adoption</h3>
      <p className={styles.cardSub}>Action completions · 90 days</p>
      <div className={styles.statRow}>
        {adoption.map((item) => (
          <StatCard key={item.name} name={item.name} count={item.count} />
        ))}
      </div>
    </div>
  );
}

function formatRefreshed(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function Dashboard({ platform, onPlatformChange }) {
  const { stats, trend, meta, loading, error } = useDashboard(platform);
  const isLive = meta?.liveData?.[platform];
  const refreshedAt = formatRefreshed(meta?.snapshotRefreshedAt);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Business Banking</h1>
          <span className={styles.badge}>90-day view</span>
          {!loading && meta && (
            <span className={isLive ? styles.badgeLive : styles.badgeSnapshot}>
              {isLive ? 'Live' : `Snapshot · ${refreshedAt}`}
            </span>
          )}
        </div>
        <PlatformToggle platform={platform} onChange={onPlatformChange} />
      </header>

      {error && (
        <div className={styles.error}>
          <strong>Could not load data:</strong> {error}
        </div>
      )}

      {loading && !error && (
        <div className={styles.loading}>Loading data from Mixpanel…</div>
      )}

      {!loading && !error && stats && trend && (
        <div className={styles.grid}>
          <div className={styles.fullWidth}>
            <TrendChart data={trend} />
          </div>
          <div className={styles.halfWidth}>
            <SectionChart data={stats.sections} />
          </div>
          <div className={styles.halfWidth}>
            <PaymentsChart data={stats.payments} />
          </div>
          <div className={styles.halfWidth}>
            <FunnelChart
              data={stats.funnel}
              title={platform === 'web' ? 'Add New Company' : 'New Customer Onboarding'}
            />
          </div>
          <div className={styles.halfWidth}>
            <AdoptionRow adoption={stats.adoption} />
          </div>
        </div>
      )}
    </div>
  );
}
