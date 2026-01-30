const express = require('express');
const router = express.Router();
const Measurement = require('../models/Measurement');

const isValidDate = (d) => d instanceof Date && !isNaN(d);

router.get('/', async (req, res) => {
    try {
        const { field, start_date, end_date } = req.query;

        const allowedFields = ['field1', 'field2', 'field3'];
        if (!allowedFields.includes(field)) {
            return res.status(400).json({ error: `Invalid field: ${field}` });
        }

        const start = new Date(start_date);
        const end = new Date(end_date);

        if (!isValidDate(start) || !isValidDate(end)) {
            return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
        }

        const data = await Measurement.find({
            timestamp: { $gte: start, $lte: end }
        }).select(`timestamp ${field}`).sort({ timestamp: 1 });

        if (data.length === 0) {
            return res.status(404).json({ error: "No data found for the selected time range." });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

router.get('/metrics', async (req, res) => {
    try {
        const { field, start_date, end_date } = req.query;
        const start = new Date(start_date);
        const end = new Date(end_date);

        const count = await Measurement.countDocuments({
            timestamp: { $gte: start, $lte: end }
        });

        if (count === 0) {
            return res.status(404).json({ error: "No metrics available for this period." });
        }

        const stats = await Measurement.aggregate([
            { $match: { timestamp: { $gte: start, $lte: end } } },
            { $group: {
                _id: null,
                avg: { $avg: `$${field}` },
                min: { $min: `$${field}` },
                max: { $max: `$${field}` },
                stdDev: { $stdDevPop: `$${field}` }
            }},
            { $project: {
                _id: 0,
                avg: { $round: ["$avg", 2] },
                min: { $round: ["$min", 2] },
                max: { $round: ["$max", 2] },
                stdDev: { $round: ["$stdDev", 2] }
            }}
        ]);

        res.json(stats[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;