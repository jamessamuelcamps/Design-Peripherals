const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

const router = Router();

const VALID_TYPES = ['treejack', 'card_sort'];

function parseStudy(row) {
  if (!row) return null;
  return { ...row, config: JSON.parse(row.config) };
}

// GET /api/studies
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT s.id, s.title, s.type, s.status, s.public_token, s.created_at, s.updated_at,
             COUNT(r.id) AS response_count
      FROM studies s
      LEFT JOIN responses r ON r.study_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/studies
router.post('/', (req, res) => {
  try {
    const { title, type, config } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: "type must be 'treejack' or 'card_sort'" });
    }
    if (config === undefined || config === null) {
      return res.status(400).json({ error: 'config is required' });
    }

    let configString;
    try {
      configString = typeof config === 'string' ? (JSON.parse(config), config) : JSON.stringify(config);
    } catch {
      return res.status(400).json({ error: 'config must be valid JSON' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO studies (id, title, type, config) VALUES (?, ?, ?, ?)
    `).run(id, title.trim(), type, configString);

    const study = parseStudy(db.prepare('SELECT * FROM studies WHERE id = ?').get(id));
    res.status(201).json(study);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/studies/:id
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM studies WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Study not found' });
    res.json(parseStudy(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/studies/:id
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM studies WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Study not found' });

    const { title, config, status } = req.body;
    const fields = [];
    const values = [];

    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ error: 'title cannot be empty' });
      fields.push('title = ?');
      values.push(title.trim());
    }
    if (config !== undefined) {
      let configString;
      try {
        configString = typeof config === 'string' ? (JSON.parse(config), config) : JSON.stringify(config);
      } catch {
        return res.status(400).json({ error: 'config must be valid JSON' });
      }
      fields.push('config = ?');
      values.push(configString);
    }
    if (status !== undefined) {
      if (!['draft', 'published', 'closed'].includes(status)) {
        return res.status(400).json({ error: "status must be 'draft', 'published', or 'closed'" });
      }
      fields.push('status = ?');
      values.push(status);
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(req.params.id);

    db.prepare(`UPDATE studies SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const updated = parseStudy(db.prepare('SELECT * FROM studies WHERE id = ?').get(req.params.id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/studies/:id
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM studies WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Study not found' });

    db.transaction(() => {
      db.prepare('DELETE FROM responses WHERE study_id = ?').run(req.params.id);
      db.prepare('DELETE FROM studies WHERE id = ?').run(req.params.id);
    })();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/studies/:id/publish
router.post('/:id/publish', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM studies WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Study not found' });

    let config;
    try {
      config = JSON.parse(existing.config);
    } catch {
      return res.status(400).json({ error: 'Study config is invalid JSON' });
    }

    if (!config || typeof config !== 'object' || Object.keys(config).length === 0) {
      return res.status(400).json({ error: 'Study config is empty — populate the study before publishing' });
    }

    if (existing.type === 'treejack') {
      if (!Array.isArray(config.tasks) || config.tasks.length === 0) {
        return res.status(400).json({ error: 'Treejack study must have at least one task before publishing' });
      }
      if (!config.tree || !config.tree.label) {
        return res.status(400).json({ error: 'Treejack study must have a tree defined before publishing' });
      }
    }

    if (existing.type === 'card_sort') {
      if (!Array.isArray(config.cards) || config.cards.length < 3) {
        return res.status(400).json({ error: 'Card sort study must have at least 3 cards before publishing' });
      }
      if (!Array.isArray(config.categories) || config.categories.length < 2) {
        return res.status(400).json({ error: 'Card sort study must have at least 2 categories before publishing' });
      }
    }

    const token = existing.public_token || uuidv4();
    db.prepare(`
      UPDATE studies SET status = 'published', public_token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(token, req.params.id);

    const updated = parseStudy(db.prepare('SELECT * FROM studies WHERE id = ?').get(req.params.id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/studies/:id/close
router.post('/:id/close', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM studies WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Study not found' });

    db.prepare(`
      UPDATE studies SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.params.id);

    const updated = parseStudy(db.prepare('SELECT * FROM studies WHERE id = ?').get(req.params.id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
