const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function studyByToken(token) {
  return db.prepare('SELECT * FROM studies WHERE public_token = ?').get(token);
}

function stripCorrectAnswers(config) {
  if (!Array.isArray(config.tasks)) return config;
  return {
    ...config,
    tasks: config.tasks.map(({ correct_answer, ...rest }) => rest),
  };
}

// GET /api/public/:token
router.get('/:token', (req, res) => {
  try {
    const study = studyByToken(req.params.token);
    if (!study) return res.status(404).json({ error: 'Study not found' });
    if (study.status !== 'published') return res.status(403).json({ error: 'Study is not available' });

    let config = JSON.parse(study.config);
    if (study.type === 'treejack') config = stripCorrectAnswers(config);

    res.json({ id: study.id, title: study.title, type: study.type, config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/public/:token/respond
router.post('/:token/respond', (req, res) => {
  try {
    const study = studyByToken(req.params.token);
    if (!study) return res.status(404).json({ error: 'Study not found' });
    if (study.status !== 'published') return res.status(403).json({ error: 'Study is not accepting responses' });

    const { participant_name, participant_email, data } = req.body;

    if (!participant_name || !String(participant_name).trim()) {
      return res.status(400).json({ error: 'participant_name is required' });
    }
    if (!participant_email || !String(participant_email).trim()) {
      return res.status(400).json({ error: 'participant_email is required' });
    }
    if (!EMAIL_RE.test(String(participant_email).trim())) {
      return res.status(400).json({ error: 'participant_email must be a valid email address' });
    }
    if (data === undefined || data === null) {
      return res.status(400).json({ error: 'data is required' });
    }

    const id = uuidv4();
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);

    db.prepare(`
      INSERT INTO responses (id, study_id, participant_name, participant_email, data)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, study.id, String(participant_name).trim(), String(participant_email).trim(), dataString);

    const row = db.prepare('SELECT * FROM responses WHERE id = ?').get(id);
    res.status(201).json({ ...row, data: JSON.parse(row.data) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
