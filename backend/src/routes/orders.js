const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateInvoice } = require('../utils/invoice');

const router = express.Router();

router.use(authenticate);

// Helper: fetch order with items
const fetchOrder = async (orderId, userId = null) => {
    const params = [orderId];
    let userClause = '';
    if (userId) {
        userClause = ' AND o.user_id = $2';
        params.push(userId);
    }
    const result = await db.query(
        `SELECT o.id, o.status, o.total, o.shipping_address, o.phone, o.email,
                o.payment_method, o.payment_status, o.upi_transaction_id, o.invoice_number, o.remarks, o.created_at,
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'name', p.name,
              'price', oi.price,
              'quantity', oi.quantity,
              'image_url', p.image_url
            )
          ) AS items
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1${userClause}
       GROUP BY o.id`,
        params
    );
    return result.rows[0] || null;
};

// GET /api/orders - Get user's orders
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT o.id, o.status, o.total, o.shipping_address, o.phone, o.email,
                    o.payment_method, o.payment_status, o.upi_transaction_id, o.invoice_number, o.remarks, o.created_at,
              json_agg(
                json_build_object(
                  'id', oi.id,
                  'product_id', oi.product_id,
                  'name', p.name,
                  'price', oi.price,
                  'quantity', oi.quantity,
                  'image_url', p.image_url
                )
              ) AS items
           FROM orders o
           JOIN order_items oi ON o.id = oi.order_id
           JOIN products p ON oi.product_id = p.id
           WHERE o.user_id = $1
           GROUP BY o.id
           ORDER BY o.created_at DESC`,
            [req.user.id]
        );
        res.json({ orders: result.rows });
    } catch (err) {
        console.error('Get orders error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/orders/:id - Get single order
router.get('/:id', async (req, res) => {
    try {
        const order = await fetchOrder(req.params.id, req.user.id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
        }
        res.json({ order });
    } catch (err) {
        console.error('Get order error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/orders - Create order from cart
router.post(
    '/',
    [
        body('shipping_address').trim().notEmpty().withMessage('Shipping address is required'),
        body('phone').trim().notEmpty().withMessage('Phone number is required'),
        body('email').isEmail().withMessage('Valid email is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { shipping_address, phone, email } = req.body;
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // Get user's cart with product details
            const cartResult = await client.query(
                `SELECT ci.product_id, ci.quantity, p.price, p.stock, p.name
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.user_id = $1`,
                [req.user.id]
            );

            if (cartResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Cart is empty.' });
            }

            // Validate cart-level minimum: total quantity must be at least 5 bags
            let total = 0;
            let totalQuantity = 0;
            for (const item of cartResult.rows) {
                if (item.quantity > item.stock) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        error: `Insufficient stock for "${item.name}". Available: ${item.stock}`,
                    });
                }
                totalQuantity += item.quantity;
                total += parseFloat(item.price) * item.quantity;
            }

            if (totalQuantity < 5) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: `Minimum order quantity is 5 bags total. Your cart has only ${totalQuantity} bag(s). Please add more items.`,
                });
            }

            // Generate invoice number
            const invoiceNumber = 'INV-' + Date.now();

            // Create order
            const orderResult = await client.query(
                `INSERT INTO orders (user_id, total, shipping_address, phone, email, payment_method, payment_status, invoice_number)
         VALUES ($1, $2, $3, $4, $5, 'upi', 'pending', $6) RETURNING id`,
                [req.user.id, total, shipping_address, phone, email, invoiceNumber]
            );
            const orderId = orderResult.rows[0].id;

            // Create order items and decrement stock
            for (const item of cartResult.rows) {
                await client.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                    [orderId, item.product_id, item.quantity, item.price]
                );
                await client.query(
                    'UPDATE products SET stock = stock - $1 WHERE id = $2',
                    [item.quantity, item.product_id]
                );
            }

            // Clear cart
            await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

            await client.query('COMMIT');

            // Fetch the created order
            const order = await fetchOrder(orderId);
            res.status(201).json({ order });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Create order error:', err);
            res.status(500).json({ error: 'Server error.' });
        } finally {
            client.release();
        }
    }
);

// POST /api/orders/buy-now - Create order for a single product (Buy Now)
router.post(
    '/buy-now',
    [
        body('product_id').isInt({ min: 1 }).withMessage('Product ID is required'),
        body('quantity').isInt({ min: 5 }).withMessage('Minimum order quantity is 5 bags'),
        body('shipping_address').trim().notEmpty().withMessage('Shipping address is required'),
        body('phone').trim().notEmpty().withMessage('Phone number is required'),
        body('email').isEmail().withMessage('Valid email is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { product_id, quantity, shipping_address, phone, email } = req.body;
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // Get product
            const productResult = await client.query(
                'SELECT id, name, price, stock FROM products WHERE id = $1',
                [product_id]
            );

            if (productResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Product not found.' });
            }

            const product = productResult.rows[0];

            if (quantity > product.stock) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
                });
            }

            const total = parseFloat(product.price) * quantity;
            const invoiceNumber = 'INV-' + Date.now();

            // Create order
            const orderResult = await client.query(
                `INSERT INTO orders (user_id, total, shipping_address, phone, email, payment_method, payment_status, invoice_number)
         VALUES ($1, $2, $3, $4, $5, 'upi', 'pending', $6) RETURNING id`,
                [req.user.id, total, shipping_address, phone, email, invoiceNumber]
            );
            const orderId = orderResult.rows[0].id;

            // Create order item and decrement stock
            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderId, product_id, quantity, product.price]
            );
            await client.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2',
                [quantity, product_id]
            );

            await client.query('COMMIT');

            // Fetch the created order
            const order = await fetchOrder(orderId);
            res.status(201).json({ order });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Buy now error:', err);
            res.status(500).json({ error: 'Server error.' });
        } finally {
            client.release();
        }
    }
);

// PUT /api/orders/:id/payment - Update payment status (UPI confirmation)
router.put(
    '/:id/payment',
    [
        body('payment_status').trim().isIn(['paid', 'failed']).withMessage('Payment status must be "paid" or "failed"'),
        body('upi_transaction_id').optional().trim().notEmpty().withMessage('UPI transaction ID is required when paid'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { payment_status, upi_transaction_id } = req.body;

        try {
            // Check order exists and belongs to user
            const existing = await db.query(
                'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
                [id, req.user.id]
            );
            if (existing.rows.length === 0) {
                return res.status(404).json({ error: 'Order not found.' });
            }

            if (existing.rows[0].payment_status === 'paid') {
                return res.status(400).json({ error: 'Payment already completed for this order.' });
            }

            const result = await db.query(
                `UPDATE orders SET payment_status = $1, upi_transaction_id = $2, updated_at = NOW()
         WHERE id = $3 AND user_id = $4 RETURNING *`,
                [payment_status, upi_transaction_id || null, id, req.user.id]
            );

            // If paid, also update order status to confirmed
            if (payment_status === 'paid') {
                await db.query(
                    'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
                    ['confirmed', id]
                );
            }

            const order = await fetchOrder(id, req.user.id);
            res.json({ order });
        } catch (err) {
            console.error('Update payment error:', err);
            res.status(500).json({ error: 'Server error.' });
        }
    }
);

// GET /api/orders/:id/invoice - Download invoice PDF
router.get('/:id/invoice', async (req, res) => {
    try {
        const order = await fetchOrder(req.params.id, req.user.id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        // Get user info
        const userResult = await db.query('SELECT name, email FROM users WHERE id = $1', [req.user.id]);
        const user = userResult.rows[0] || { name: 'Customer', email: order.email };

        const pdfBuffer = await generateInvoice(order, user);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.invoice_number || order.id}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
    } catch (err) {
        console.error('Invoice generation error:', err);
        res.status(500).json({ error: 'Failed to generate invoice.' });
    }
});

module.exports = router;
