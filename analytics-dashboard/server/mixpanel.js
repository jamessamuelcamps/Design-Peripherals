const REGION = process.env.MIXPANEL_REGION || 'eu';
const BASE = `https://${REGION}.mixpanel.com/api/2.0`;
const CACHE_TTL = 60 * 60 * 1000;

const cache = new Map();

function auth(secret) {
  return 'Basic ' + Buffer.from(`${secret}:`).toString('base64');
}

function dateRange(days) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from_date: from.toISOString().split('T')[0],
    to_date: to.toISOString().split('T')[0],
  };
}

function sumDateCounts(dateCounts) {
  return Object.values(dateCounts).reduce((sum, v) => sum + (v || 0), 0);
}

async function cachedFetch(cacheKey, fetcher) {
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;
  const data = await fetcher();
  cache.set(cacheKey, { data, ts: Date.now() });
  return data;
}

export async function fetchEventTotals(projectId, secret, eventNames, days = 90) {
  const key = `totals:${projectId}:${days}:${eventNames.sort().join(',')}`;
  return cachedFetch(key, async () => {
    const { from_date, to_date } = dateRange(days);
    const url = new URL(`${BASE}/events`);
    url.searchParams.set('event', JSON.stringify(eventNames));
    url.searchParams.set('type', 'general');
    url.searchParams.set('unit', 'month');
    url.searchParams.set('from_date', from_date);
    url.searchParams.set('to_date', to_date);
    url.searchParams.set('project_id', String(projectId));

    const res = await fetch(url.toString(), { headers: { Authorization: auth(secret) } });
    if (!res.ok) throw new Error(`Mixpanel events API ${res.status}: ${await res.text()}`);

    const json = await res.json();
    const values = json?.data?.values ?? {};
    const totals = {};
    for (const [name, dateCounts] of Object.entries(values)) {
      totals[name] = sumDateCounts(dateCounts);
    }
    return totals;
  });
}

export async function fetchWeeklyTrend(projectId, secret, eventName, days = 90) {
  const key = `trend:${projectId}:${days}:${eventName}`;
  return cachedFetch(key, async () => {
    const { from_date, to_date } = dateRange(days);
    const url = new URL(`${BASE}/segmentation`);
    url.searchParams.set('event', eventName);
    url.searchParams.set('type', 'general');
    url.searchParams.set('unit', 'week');
    url.searchParams.set('from_date', from_date);
    url.searchParams.set('to_date', to_date);
    url.searchParams.set('project_id', String(projectId));

    const res = await fetch(url.toString(), { headers: { Authorization: auth(secret) } });
    if (!res.ok) throw new Error(`Mixpanel segmentation API ${res.status}: ${await res.text()}`);

    const json = await res.json();
    const dateCounts = json?.data?.values?.[eventName] ?? {};
    return Object.entries(dateCounts).map(([date, count]) => ({ date, count: count || 0 }));
  });
}
