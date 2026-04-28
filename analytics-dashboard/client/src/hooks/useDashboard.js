import { useState, useEffect } from 'react';

const BASE = 'http://localhost:3002';

export function useDashboard(platform) {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setStats(null);
    setTrend(null);

    Promise.all([
      fetch(`${BASE}/api/stats?platform=${platform}`).then(r => r.json()),
      fetch(`${BASE}/api/trend?platform=${platform}`).then(r => r.json()),
      fetch(`${BASE}/api/meta`).then(r => r.json()),
    ])
      .then(([statsData, trendData, metaData]) => {
        if (statsData.error) throw new Error(statsData.error);
        setStats(statsData);
        setTrend(trendData.series ?? []);
        setMeta(metaData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [platform]);

  return { stats, trend, meta, loading, error };
}
