const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

// GET /api/cart - Get user's cart
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT ci.id, ci.quantity, ci.product_id,
              p.name, p.price, p.mrp, p.wholesale_price, p.image_url, p.slug, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
            [req.user.id]
        );
        res.json({ cart: result.rows });
    } catch (err) {
        console.error('Get cart error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/cart - Add item to cart
router.post(
    '/',
    [
        body('product_id').isInt().withMessage('Product ID is required'),
        body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { product_id, quantity } = req.body;

        try {
            // Check product exists and has stock
            const product = await db.query('SELECT id, stock FROM products WHERE id = $1', [product_id]);
            if (product.rows.length === 0) {
                return res.status(404).json({ error: 'Product not found.' });
            }

            // Check if item already in cart
            const existing = await db.query(
                'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
                [req.user.id, product_id]
            );

            if (existing.rows.length > 0) {
                // Update quantity
                const newQty = existing.rows[0].quantity + quantity;
                if (newQty > product.rows[0].stock) {
                    return res.status(400).json({ error: 'Not enough stock available.' });
                }
                await db.query(
                    'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2',
                    [newQty, existing.rows[0].id]
                );
            } else {
                if (quantity > product.rows[0].stock) {
                    return res.status(400).json({ error: 'Not enough stock available.' });
                }
                await db.query(
                    'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
                    [req.user.id, product_id, quantity]
                );
            }

            // Return updated cart
            const cartResult = await db.query(
                `SELECT ci.id, ci.quantity, ci.product_id,
                p.name, p.price, p.mrp, p.wholesale_price, p.image_url, p.slug, p.stock
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.user_id = $1
         ORDER BY ci.created_at DESC`,
                [req.user.id]
            );

            res.json({ cart: cartResult.rows });
        } catch (err) {
            console.error('Add to cart error:', err);
            res.status(500).json({ error: 'Server error.' });
        }
    }
);

// PUT /api/cart/:id - Update cart item quantity
router.put(
    '/:id',
    [body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { quantity } = req.body;

        try {
            // Verify item belongs to user
            const item = await db.query(
                'SELECT ci.id, ci.product_id FROM cart_items ci WHERE ci.id = $1 AND ci.user_id = $2',
                [req.params.id, req.user.id]
            );

            if (item.rows.length === 0) {
                return res.status(404).json({ error: 'Cart item not found.' });
            }

            // Check stock
            const product = await db.query('SELECT stock FROM products WHERE id = $1', [item.rows[0].product_id]);
            if (quantity > product.rows[0].stock) {
                return res.status(400).json({ error: 'Not enough stock available.' });
            }

            await db.query('UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2', [
                quantity,
                req.params.id,
            ]);

            const cartResult = await db.query(
                `SELECT ci.id, ci.quantity, ci.product_id,
                p.name, p.price, p.mrp, p.wholesale_price, p.image_url, p.slug, p.stock
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.user_id = $1
         ORDER BY ci.created_at DESC`,
                [req.user.id]
            );

            res.json({ cart: cartResult.rows });
        } catch (err) {
            console.error('Update cart error:', err);
            res.status(500).json({ error: 'Server error.' });
        }
    }
);

// DELETE /api/cart/:id - Remove item from cart
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cart item not found.' });
        }

        const cartResult = await db.query(
            `SELECT ci.id, ci.quantity, ci.product_id,
              p.name, p.price, p.mrp, p.wholesale_price, p.image_url, p.slug, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
            [req.user.id]
        );

        res.json({ cart: cartResult.rows });
    } catch (err) {
        console.error('Delete cart item error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
