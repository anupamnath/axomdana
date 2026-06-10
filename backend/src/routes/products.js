const express = require('express');
const db = require('../config/database');

const router = express.Router();

// GET /api/products - List all products with optional category filter
router.get('/', async (req, res) => {
    const { category, search, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let paramIndex = 1;

    let whereClause = 'WHERE 1=1';

    if (category) {
        whereClause += ` AND category = $${paramIndex++}`;
        params.push(category);
    }

    if (search) {
        whereClause += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        paramIndex++;
        params.push(`%${search}%`);
    }

    try {
        // Count total - separate query without ORDER BY/LIMIT
        const countResult = await db.query(`SELECT COUNT(*) FROM products ${whereClause}`, params);
        const total = parseInt(countResult.rows[0].count);

        // Fetch products with pagination
        const dataSql = `SELECT * FROM products ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        const dataParams = [...params, parseInt(limit), offset];
        const result = await db.query(dataSql, dataParams);

        res.json({
            products: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        console.error('Get products error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/products/categories - List all categories
router.get('/categories', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category'
        );
        res.json({ categories: result.rows.map((r) => r.category) });
    } catch (err) {
        console.error('Get categories error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/products/:slug - Get single product by slug
router.get('/:slug', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products WHERE slug = $1', [req.params.slug]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.json({ product: result.rows[0] });
    } catch (err) {
        console.error('Get product error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
