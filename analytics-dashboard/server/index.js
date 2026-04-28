import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { statsHandler } from './routes/stats.js';
import { trendHandler } from './routes/trend.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.get('/api/stats', statsHandler);
app.get('/api/trend', trendHandler);

app.get('/api/meta', (_, res) => {
  const snapshot = JSON.parse(readFileSync(join(__dirname, 'data/snapshot.json'), 'utf8'));
  const hasWebCreds = !!process.env.MIXPANEL_WEB_SECRET;
  const hasMobileCreds = !!process.env.MIXPANEL_MOBILE_SECRET;
  res.json({
    snapshotRefreshedAt: snapshot.refreshedAt,
    windowDays: snapshot.windowDays,
    liveData: { web: hasWebCreds, mobile: hasMobileCreds },
  });
});

app.listen(PORT, () => console.log(`Analytics server → http://localhost:${PORT}`));
