const express = require('express');
const router = express.Router();
const Measurement = require('../models/Measurement');

const allowedFields = ['field1', 'field2', 'field3'];

function parseISODateOnly(dateStr) {
  if (typeof dateStr !== 'string') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;

  const d = new Date(dateStr + 'T00:00:00.000Z');
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

// GET /api/measurements?field=field1&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { field, start_date, end_date } = req.query;

    if (!field || !allowedFields.includes(field)) {
      return res.status(400).json({
        error: `Invalid or missing field. Allowed: ${allowedFields.join(', ')}`
      });
    }

    const start = parseISODateOnly(start_date);
    const end = parseISODateOnly(end_date);

    if (!start || !end) {
      return res.status(400).json({
        error: 'Invalid or missing date range. Use start_date and end_date in YYYY-MM-DD format.'
      });
    }

    if (start > end) {
      return res.status(400).json({ error: 'start_date must be <= end_date.' });
    }

    // inclusive end_date
    const endExclusive = new Date(end);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

    const query = { timestamp: { $gte: start, $lt: endExclusive } };
    const projection = { _id: 0, timestamp: 1, [field]: 1 };

    const data = await Measurement.find(query, projection).sort({ timestamp: 1 });

    if (!data.length) {
      return res.status(404).json({ error: 'No data found in the specified range.' });
    }

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/measurements/metrics?field=field1&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
router.get('/metrics', async (req, res) => {
  try {
    const { field, start_date, end_date } = req.query;

    if (!field || !allowedFields.includes(field)) {
      return res.status(400).json({
        error: `Invalid or missing field. Allowed: ${allowedFields.join(', ')}`
      });
    }

    // date range required for metrics (так лучше по заданию)
    const start = parseISODateOnly(start_date);
    const end = parseISODateOnly(end_date);

    if (!start || !end) {
      return res.status(400).json({
        error: 'Missing/invalid date range. Use start_date and end_date in YYYY-MM-DD format.'
      });
    }

    const endExclusive = new Date(end);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

    const stats = await Measurement.aggregate([
      { $match: { timestamp: { $gte: start, $lt: endExclusive } } },
      {
        $group: {
          _id: null,
          avg: { $avg: `$${field}` },
          min: { $min: `$${field}` },
          max: { $max: `$${field}` },
          stdDev: { $stdDevPop: `$${field}` }
        }
      },
      { $project: { _id: 0, avg: 1, min: 1, max: 1, stdDev: 1 } }
    ]);

    if (!stats.length || stats[0].avg === null) {
      return res.status(404).json({ error: 'No data found for metrics in the specified range.' });
    }

    const r = (x) => Math.round(x * 1000) / 1000;

    return res.json({
      avg: r(stats[0].avg),
      min: r(stats[0].min),
      max: r(stats[0].max),
      stdDev: r(stats[0].stdDev)
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
