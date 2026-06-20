const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/reviews/product/:productId - Get approved reviews for a product
// Query params: page, limit, sort (recent|helpful)
router.get('/product/:productId', async (req, res) => {
    const { productId } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    const offset = (page - 1) * limit;
    const sort = req.query.sort === 'helpful' ? 'helpful_count DESC, created_at DESC' : 'created_at DESC';

    try {
        // Summary: average rating + counts per star
        const summaryRes = await db.query(
            `SELECT
                COUNT(*)::int AS total,
                COALESCE(AVG(rating), 0)::numeric(10,2) AS average,
                COUNT(*) FILTER (WHERE rating = 5)::int AS five,
                COUNT(*) FILTER (WHERE rating = 4)::int AS four,
                COUNT(*) FILTER (WHERE rating = 3)::int AS three,
                COUNT(*) FILTER (WHERE rating = 2)::int AS two,
                COUNT(*) FILTER (WHERE rating = 1)::int AS one,
                COALESCE(AVG(delivery_rating), 0)::numeric(10,2) AS avg_delivery,
                COALESCE(AVG(quality_rating), 0)::numeric(10,2) AS avg_quality
             FROM product_reviews
             WHERE product_id = $1 AND is_approved = TRUE`,
            [productId]
        );

        const countRes = await db.query(
            'SELECT COUNT(*)::int AS total FROM product_reviews WHERE product_id = $1 AND is_approved = TRUE',
            [productId]
        );
        const total = countRes.rows[0].total;

        const reviewsRes = await db.query(
            `SELECT r.id, r.product_id, r.user_id, r.rating, r.title, r.body,
                    r.delivery_rating, r.quality_rating, r.created_at,
                    u.name AS user_name,
                    COALESCE(
                        (SELECT json_agg(ri.image_url ORDER BY ri.sort_order, ri.id)
                           FROM review_images ri WHERE ri.review_id = r.id),
                        '[]'::json
                    ) AS images
             FROM product_reviews r
             JOIN users u ON u.id = r.user_id
             WHERE r.product_id = $1 AND r.is_approved = TRUE
             ORDER BY ${sort}
             LIMIT $2 OFFSET $3`,
            [productId, limit, offset]
        );

        res.json({
            reviews: reviewsRes.rows,
            summary: summaryRes.rows[0],
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (err) {
        console.error('Get reviews error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/reviews/eligibility/:productId - Check if current user is eligible to review
router.get('/eligibility/:productId', authenticate, async (req, res) => {
    const { productId } = req.params;
    try {
        // User must have a delivered order containing this product
        const orderRes = await db.query(
            `SELECT DISTINCT o.id, o.created_at
             FROM orders o
             JOIN order_items oi ON oi.order_id = o.id
             WHERE o.user_id = $1
               AND oi.product_id = $2
               AND o.status IN ('delivered', 'completed')
             ORDER BY o.created_at DESC
             LIMIT 1`,
            [req.user.id, productId]
        );

        const eligible = orderRes.rows.length > 0;

        // Check if user has already submitted a review
        const existingRes = await db.query(
            'SELECT id, is_approved, is_rejected FROM product_reviews WHERE user_id = $1 AND product_id = $2',
            [req.user.id, productId]
        );

        res.json({
            eligible,
            can_review: eligible && existingRes.rows.length === 0,
            existing_review: existingRes.rows[0] || null,
            verified_order: eligible ? { id: orderRes.rows[0].id } : null,
        });
    } catch (err) {
        console.error('Review eligibility check error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/reviews - Submit a new review (verified buyers only)
router.post(
    '/',
    authenticate,
    [
        body('product_id').isInt({ min: 1 }),
        body('rating').isInt({ min: 1, max: 5 }),
        body('title').optional({ checkFalsy: true }).isLength({ max: 120 }),
        body('body').trim().isLength({ min: 10, max: 2000 }),
        body('delivery_rating').optional({ checkFalsy: true }).isInt({ min: 1, max: 5 }),
        body('quality_rating').optional({ checkFalsy: true }).isInt({ min: 1, max: 5 }),
        body('images').optional().isArray({ max: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { product_id, rating, title, body: reviewBody, delivery_rating, quality_rating, images } = req.body;

        try {
            // 1. Verify the user has a delivered order containing this product
            const orderRes = await db.query(
                `SELECT 1 FROM orders o
                 JOIN order_items oi ON oi.order_id = o.id
                 WHERE o.user_id = $1 AND oi.product_id = $2
                   AND o.status IN ('delivered', 'completed')
                 LIMIT 1`,
                [req.user.id, product_id]
            );
            if (orderRes.rows.length === 0) {
                return res.status(403).json({
                    error: 'You can only review products from a delivered order.',
                });
            }

            // 2. Check for existing review (UNIQUE constraint)
            const existingRes = await db.query(
                'SELECT id FROM product_reviews WHERE user_id = $1 AND product_id = $2',
                [req.user.id, product_id]
            );
            if (existingRes.rows.length > 0) {
                return res.status(409).json({ error: 'You have already reviewed this product.' });
            }

            // 3. Insert review (is_approved defaults to FALSE - admin moderation)
            const insertRes = await db.query(
                `INSERT INTO product_reviews
                    (product_id, user_id, rating, title, body, delivery_rating, quality_rating)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id, product_id, user_id, rating, title, body, delivery_rating, quality_rating, is_approved, created_at`,
                [product_id, req.user.id, rating, title || null, reviewBody, delivery_rating || null, quality_rating || null]
            );
            const review = insertRes.rows[0];

            // 4. Insert images (if any)
            if (Array.isArray(images) && images.length > 0) {
                for (let i = 0; i < images.length; i++) {
                    await db.query(
                        'INSERT INTO review_images (review_id, image_url, sort_order) VALUES ($1, $2, $3)',
                        [review.id, images[i], i]
                    );
                }
            }

            res.status(201).json({
                review,
                message: 'Review submitted! It will appear after admin approval.',
            });
        } catch (err) {
            console.error('Submit review error:', err);
            res.status(500).json({ error: 'Server error.' });
        }
    }
);

// DELETE /api/reviews/:id - User can delete their own review
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const reviewRes = await db.query(
            'SELECT user_id FROM product_reviews WHERE id = $1',
            [req.params.id]
        );
        if (reviewRes.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found.' });
        }
        if (reviewRes.rows[0].user_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ error: 'Forbidden.' });
        }
        await db.query('DELETE FROM product_reviews WHERE id = $1', [req.params.id]);
        res.json({ message: 'Review deleted.' });
    } catch (err) {
        console.error('Delete review error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;