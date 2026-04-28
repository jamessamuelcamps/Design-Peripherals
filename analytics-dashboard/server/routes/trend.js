import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { WEB, MOBILE } from '../events.js';
import { fetchWeeklyTrend } from '../mixpanel.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const snapshotPath = join(__dirname, '../data/snapshot.json');

export async function trendHandler(req, res) {
  const platform = req.query.platform === 'mobile' ? 'mobile' : 'web';
  const hasCredentials = !!(platform === 'mobile'
    ? process.env.MIXPANEL_MOBILE_SECRET
    : process.env.MIXPANEL_WEB_SECRET);

  if (hasCredentials) {
    const config = platform === 'mobile' ? MOBILE : WEB;
    const secret = platform === 'mobile'
      ? process.env.MIXPANEL_MOBILE_SECRET
      : process.env.MIXPANEL_WEB_SECRET;
    const series = await fetchWeeklyTrend(config.projectId, secret, '$session_start');
    return res.json({ series, source: 'live' });
  }

  const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  res.json({ series: snapshot[platform].trend, source: 'snapshot', refreshedAt: snapshot.refreshedAt });
}
