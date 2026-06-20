const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/delivery-images - Get approved delivery images
// Query: product_id (optional), featured (optional), limit
router.get('/', async (req, res) => {
    const { product_id, featured, limit = 24 } = req.query;
    const params = [];
    let whereClause = 'WHERE di.is_approved = TRUE';

    if (product_id) {
        params.push(product_id);
        whereClause += ` AND di.product_id = $${params.length}`;
    }
    if (featured === 'true') {
        whereClause += ' AND di.is_featured = TRUE';
    }

    const lim = Math.min(Math.max(parseInt(limit) || 24, 1), 100);
    params.push(lim);

    try {
        const result = await db.query(
            `SELECT di.id, di.product_id, di.image_url, di.caption, di.customer_name, di.location,
                    di.is_featured, di.created_at,
                    p.name AS product_name, p.slug AS product_slug
             FROM delivery_images di
             LEFT JOIN products p ON p.id = di.product_id
             ${whereClause}
             ORDER BY di.is_featured DESC, di.created_at DESC
             LIMIT $${params.length}`,
            params
        );
        res.json({ images: result.rows });
    } catch (err) {
        console.error('Get delivery images error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/delivery-images - Submit a delivery image (any logged-in user)
router.post(
    '/',
    authenticate,
    [
        body('image_url').trim().isLength({ min: 1, max: 500 }),
        body('caption').optional({ checkFalsy: true }).isLength({ max: 255 }),
        body('customer_name').optional({ checkFalsy: true }).isLength({ max: 120 }),
        body('location').optional({ checkFalsy: true }).isLength({ max: 120 }),
        body('product_id').optional({ checkFalsy: true }).isInt({ min: 1 }),
        body('order_id').optional({ checkFalsy: true }).isInt({ min: 1 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { image_url, caption, customer_name, location, product_id, order_id } = req.body;

        try {
            // If an order_id is provided, verify the order belongs to the user
            if (order_id) {
                const orderRes = await db.query(
                    'SELECT id FROM orders WHERE id = $1 AND user_id = $2',
                    [order_id, req.user.id]
                );
                if (orderRes.rows.length === 0) {
                    return res.status(403).json({ error: 'Order not found.' });
                }
            }

            const result = await db.query(
                `INSERT INTO delivery_images
                    (user_id, order_id, product_id, image_url, caption, customer_name, location, is_approved)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
                 RETURNING id, image_url, caption, customer_name, location, is_featured, is_approved, created_at`,
                [
                    req.user.id,
                    order_id || null,
                    product_id || null,
                    image_url,
                    caption || null,
                    customer_name || req.user.name,
                    location || null,
                ]
            );

            res.status(201).json({
                image: result.rows[0],
                message: 'Thank you for sharing! Your delivery photo is now visible on our site.',
            });
        } catch (err) {
            console.error('Submit delivery image error:', err);
            res.status(500).json({ error: 'Server error.' });
        }
    }
);

// DELETE /api/delivery-images/:id - User can delete their own, admin can delete any
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const imgRes = await db.query(
            'SELECT user_id FROM delivery_images WHERE id = $1',
            [req.params.id]
        );
        if (imgRes.rows.length === 0) {
            return res.status(404).json({ error: 'Image not found.' });
        }
        const ownerId = imgRes.rows[0].user_id;
        if (ownerId !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ error: 'Forbidden.' });
        }
        await db.query('DELETE FROM delivery_images WHERE id = $1', [req.params.id]);
        res.json({ message: 'Image deleted.' });
    } catch (err) {
        console.error('Delete delivery image error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;