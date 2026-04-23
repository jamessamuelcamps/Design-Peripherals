require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./db/database');

const studiesRouter = require('./routes/studies');
const responsesRouter = require('./routes/responses');
const publicRouter = require('./routes/public');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/studies', studiesRouter);
app.use('/api/studies/:id/responses', responsesRouter);
app.use('/api/public', publicRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
