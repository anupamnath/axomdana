const express = require('express');
const db = require('../config/database');

const router = express.Router();

// GET /api/hero-slides - Get active hero slides for landing page
router.get('/hero-slides', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM hero_slides WHERE is_active = TRUE ORDER BY sort_order ASC, created_at DESC'
        );
        res.json({ slides: result.rows });
    } catch (err) {
        console.error('Get hero slides error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/settings/public - Get public settings (tagline, upi_id, etc.)
router.get('/settings/public', async (req, res) => {
    try {
        const result = await db.query(
            "SELECT key, value FROM settings WHERE key IN ('hero_tagline', 'upi_id')"
        );
        const settings = {};
        result.rows.forEach((row) => {
            settings[row.key] = row.value;
        });
        res.json({ settings });
    } catch (err) {
        console.error('Get public settings error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
