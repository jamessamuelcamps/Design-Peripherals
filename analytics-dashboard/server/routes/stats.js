import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { WEB, MOBILE } from '../events.js';
import { fetchEventTotals } from '../mixpanel.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const snapshotPath = join(__dirname, '../data/snapshot.json');

function loadSnapshot() {
  return JSON.parse(readFileSync(snapshotPath, 'utf8'));
}

function sumEvents(events, totals) {
  return events.reduce((sum, e) => sum + (totals[e] ?? 0), 0);
}

async function fetchLive(platform) {
  const config = platform === 'mobile' ? MOBILE : WEB;
  const secret = platform === 'mobile'
    ? process.env.MIXPANEL_MOBILE_SECRET
    : process.env.MIXPANEL_WEB_SECRET;

  const allEvents = [
    ...new Set([
      ...config.sections.flatMap(s => s.events),
      ...config.paymentBreakdown.flatMap(p => p.events),
      ...config.onboardingFunnel.map(f => f.event),
      ...config.featureAdoption.map(f => f.event),
    ]),
  ];

  const totals = await fetchEventTotals(config.projectId, secret, allEvents);

  return {
    sections: config.sections
      .map(({ name, events }) => ({ name, count: sumEvents(events, totals) }))
      .sort((a, b) => b.count - a.count),
    payments: config.paymentBreakdown
      .map(({ name, events }) => ({ name, count: sumEvents(events, totals) }))
      .sort((a, b) => b.count - a.count),
    funnel: config.onboardingFunnel.map(({ step, event }) => ({
      step,
      count: totals[event] ?? 0,
    })),
    adoption: config.featureAdoption
      .map(({ name, event }) => ({ name, count: totals[event] ?? 0 }))
      .sort((a, b) => b.count - a.count),
  };
}

export async function statsHandler(req, res) {
  const platform = req.query.platform === 'mobile' ? 'mobile' : 'web';
  const hasCredentials = !!(platform === 'mobile'
    ? process.env.MIXPANEL_MOBILE_SECRET
    : process.env.MIXPANEL_WEB_SECRET);

  if (hasCredentials) {
    const data = await fetchLive(platform);
    return res.json({ ...data, source: 'live' });
  }

  const snapshot = loadSnapshot();
  const data = snapshot[platform];
  res.json({ ...data, source: 'snapshot', refreshedAt: snapshot.refreshedAt });
}
