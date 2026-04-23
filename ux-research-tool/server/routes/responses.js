const { Router } = require('express');
const db = require('../db/database');

const router = Router({ mergeParams: true });

function parseResponse(row) {
  return { ...row, data: JSON.parse(row.data) };
}

// GET /api/studies/:id/responses
router.get('/', (req, res) => {
  try {
    const study = db.prepare('SELECT id FROM studies WHERE id = ?').get(req.params.id);
    if (!study) return res.status(404).json({ error: 'Study not found' });

    const rows = db.prepare(`
      SELECT id, participant_name, participant_email, data, completed_at
      FROM responses
      WHERE study_id = ?
      ORDER BY completed_at ASC
    `).all(req.params.id);

    res.json(rows.map(parseResponse));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/studies/:id/responses/:responseId
router.get('/:responseId', (req, res) => {
  try {
    const study = db.prepare('SELECT id FROM studies WHERE id = ?').get(req.params.id);
    if (!study) return res.status(404).json({ error: 'Study not found' });

    const row = db.prepare(`
      SELECT id, participant_name, participant_email, data, completed_at
      FROM responses
      WHERE id = ? AND study_id = ?
    `).get(req.params.responseId, req.params.id);

    if (!row) return res.status(404).json({ error: 'Response not found' });

    res.json(parseResponse(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
