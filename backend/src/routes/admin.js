const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAdmin } = require('../middleware/admin');
const { sendOrderConfirmation, sendOrderStatusUpdate } = require('../utils/email');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(requireAdmin);

// =====================
// DASHBOARD STATS
// =====================

// GET /api/admin/dashboard - Get dashboard statistics
router.get('/dashboard', async (req, res) => {
    try {
        const [productCount, userCount, orderCount, revenueResult, recentOrders] = await Promise.all([
            db.query('SELECT COUNT(*) FROM products'),
            db.query('SELECT COUNT(*) FROM users'),
            db.query('SELECT COUNT(*) FROM orders'),
            db.query('SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE status != $1', ['cancelled']),
            db.query(
                `SELECT o.id, o.status, o.total, o.created_at, u.name as user_name
           FROM orders o JOIN users u ON o.user_id = u.id
           ORDER BY o.created_at DESC LIMIT 5`
            ),
        ]);

        res.json({
            stats: {
                totalProducts: parseInt(productCount.rows[0].count),
                totalUsers: parseInt(userCount.rows[0].count),
                totalOrders: parseInt(orderCount.rows[0].count),
                totalRevenue: parseFloat(revenueResult.rows[0].revenue),
            },
            recentOrders: recentOrders.rows,
        });
    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// =====================
// PRODUCTS CRUD
// =====================

// GET /api/admin/products - List all products (with pagination)
router.get('/products', async (req, res) => {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let paramIndex = 1;
    let whereClause = 'WHERE 1=1';

    if (search) {
        whereClause += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
    }

    try {
        const countResult = await db.query(`SELECT COUNT(*) FROM products ${whereClause}`, params);
        const total = parseInt(countResult.rows[0].count);

        const result = await db.query(
            `SELECT * FROM products ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            [...params, parseInt(limit), offset]
        );

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
        console.error('Admin list products error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/admin/products - Create a product
router.post(
    '/products',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('slug').trim().notEmpty().withMessage('Slug is required'),
        body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, slug, description, price, image_url, category, stock } = req.body;

        try {
            // Check slug uniqueness
            const existing = await db.query('SELECT id FROM products WHERE slug = $1', [slug]);
            if (existing.rows.length > 0) {
                return res.status(409).json({ error: 'A product with this slug already exists.' });
            }

            const result = await db.query(
                `INSERT INTO products (name, slug, description, price, image_url, category, stock)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
                [name, slug, description || null, price, image_url || null, category || null, stock]
            );

            res.status(201).json({ product: result.rows[0] });
        } catch (err) {
            console.error('Create product error:', err);
            res.status(500).json({ error: 'Server error.' });
        }
    }
);

// PUT /api/admin/products/:id - Update a product
router.put(
    '/products/:id',
    [
        body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
        body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { name, slug, description, price, image_url, category, stock } = req.body;

        try {
            // Check product exists
            const existing = await db.query('SELECT * FROM products WHERE id = $1', [id]);
            if (existing.rows.length === 0) {
                return res.status(404).json({ error: 'Product not found.' });
            }

            // If slug is being changed, check uniqueness
            if (slug && slug !== existing.rows[0].slug) {
                const slugCheck = await db.query('SELECT id FROM products WHERE slug = $1 AND id != $2', [slug, id]);
                if (slugCheck.rows.length > 0) {
                    return res.status(409).json({ error: 'Another product already uses this slug.' });
                }
            }

            const product = existing.rows[0];
            const updatedName = name !== undefined ? name : product.name;
            const updatedSlug = slug !== undefined ? slug : product.slug;
            const updatedDescription = description !== undefined ? description : product.description;
            const updatedPrice = price !== undefined ? price : product.price;
            const updatedImageUrl = image_url !== undefined ? image_url : product.image_url;
            const updatedCategory = category !== undefined ? category : product.category;
            const updatedStock = stock !== undefined ? stock : product.stock;

            const result = await db.query(
                `UPDATE products
           SET name = $1, slug = $2, description = $3, price = $4,
               image_url = $5, category = $6, stock = $7, updated_at = NOW()
           WHERE id = $8
           RETURNING *`,
                [updatedName, updatedSlug, updatedDescription, updatedPrice, updatedImageUrl, updatedCategory, updatedStock, id]
            );

            res.json({ product: result.rows[0] });
        } catch (err) {
            console.error('Update product error:', err);
            res.status(500).json({ error: 'Server error.' });
        }
    }
);

// DELETE /api/admin/products/:id - Delete a product
router.delete('/products/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.json({ message: 'Product deleted successfully.' });
    } catch (err) {
        console.error('Delete product error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// =====================
// USERS MANAGEMENT
// =====================

// GET /api/admin/users - List all users
router.get('/users', async (req, res) => {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let paramIndex = 1;
    let whereClause = 'WHERE 1=1';

    if (search) {
        whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
    }

    try {
        const countResult = await db.query(`SELECT COUNT(*) FROM users ${whereClause}`, params);
        const total = parseInt(countResult.rows[0].count);

        const result = await db.query(
            `SELECT id, name, email, is_admin, created_at, updated_at
           FROM users ${whereClause}
           ORDER BY created_at DESC
           LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            [...params, parseInt(limit), offset]
        );

        res.json({
            users: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        console.error('Admin list users error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/admin/users/:id - Get single user with order count
router.get('/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const userResult = await db.query(
            'SELECT id, name, email, is_admin, created_at, updated_at FROM users WHERE id = $1',
            [id]
        );
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const orderResult = await db.query(
            'SELECT COUNT(*) as order_count, COALESCE(SUM(total), 0) as total_spent FROM orders WHERE user_id = $1',
            [id]
        );

        res.json({
            user: {
                ...userResult.rows[0],
                orderCount: parseInt(orderResult.rows[0].order_count),
                totalSpent: parseFloat(orderResult.rows[0].total_spent),
            },
        });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PUT /api/admin/users/:id - Update user (name, email, is_admin)
router.put(
    '/users/:id',
    [
        body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
        body('email').optional().isEmail().withMessage('Valid email is required'),
        body('is_admin').optional().isBoolean().withMessage('is_admin must be a boolean'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { name, email, is_admin, password } = req.body;

        try {
            const existing = await db.query('SELECT * FROM users WHERE id = $1', [id]);
            if (existing.rows.length === 0) {
                return res.status(404).json({ error: 'User not found.' });
            }

            // If email is being changed, check uniqueness
            if (email && email !== existing.rows[0].email) {
                const emailCheck = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
                if (emailCheck.rows.length > 0) {
                    return res.status(409).json({ error: 'Email already in use.' });
                }
            }

            const user = existing.rows[0];
            const updatedName = name !== undefined ? name : user.name;
            const updatedEmail = email !== undefined ? email : user.email;
            const updatedIsAdmin = is_admin !== undefined ? is_admin : user.is_admin;

            let query, params;
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                query = `UPDATE users SET name = $1, email = $2, is_admin = $3, password = $4, updated_at = NOW() WHERE id = $5 RETURNING id, name, email, is_admin, created_at, updated_at`;
                params = [updatedName, updatedEmail, updatedIsAdmin, hashedPassword, id];
            } else {
                query = `UPDATE users SET name = $1, email = $2, is_admin = $3, updated_at = NOW() WHERE id = $4 RETURNING id, name, email, is_admin, created_at, updated_at`;
                params = [updatedName, updatedEmail, updatedIsAdmin, id];
            }

            const result = await db.query(query, params);
            res.json({ user: result.rows[0] });
        } catch (err) {
            console.error('Update user error:', err);
            res.status(500).json({ error: 'Server error.' });
        }
    }
);

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Don't allow deleting yourself
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'You cannot delete your own account.' });
        }

        const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json({ message: 'User deleted successfully.' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// =====================
// ORDERS MANAGEMENT
// =====================

// GET /api/admin/orders - List all orders
router.get('/orders', async (req, res) => {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let paramIndex = 1;
    let whereClause = 'WHERE 1=1';

    if (status) {
        whereClause += ` AND o.status = $${paramIndex++}`;
        params.push(status);
    }

    try {
        const countResult = await db.query(
            `SELECT COUNT(*) FROM orders o ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        const result = await db.query(
            `SELECT o.id, o.status, o.total, o.shipping_address, o.remarks, o.created_at,
              u.id as user_id, u.name as user_name, u.email as user_email,
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
           JOIN users u ON o.user_id = u.id
           JOIN order_items oi ON o.id = oi.order_id
           JOIN products p ON oi.product_id = p.id
           ${whereClause}
           GROUP BY o.id, u.id, u.name, u.email
           ORDER BY o.created_at DESC
           LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            [...params, parseInt(limit), offset]
        );

        res.json({
            orders: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        console.error('Admin list orders error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/admin/orders/:id - Get single order details
router.get('/orders/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            `SELECT o.id, o.status, o.total, o.shipping_address, o.remarks, o.created_at, o.updated_at,
              u.id as user_id, u.name as user_name, u.email as user_email,
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
           JOIN users u ON o.user_id = u.id
           JOIN order_items oi ON o.id = oi.order_id
           JOIN products p ON oi.product_id = p.id
           WHERE o.id = $1
           GROUP BY o.id, u.id, u.name, u.email`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        res.json({ order: result.rows[0] });
    } catch (err) {
        console.error('Get order error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PUT /api/admin/orders/:id/status - Update order status
router.put(
    '/orders/:id/status',
    [
        body('status')
            .trim()
            .notEmpty()
            .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
            .withMessage('Invalid status value'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { status } = req.body;

        try {
            const existing = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
            if (existing.rows.length === 0) {
                return res.status(404).json({ error: 'Order not found.' });
            }

            // If cancelling, restore stock
            if (status === 'cancelled' && existing.rows[0].status !== 'cancelled') {
                const items = await db.query(
                    'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
                    [id]
                );
                for (const item of items.rows) {
                    await db.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [
                        item.quantity,
                        item.product_id,
                    ]);
                }
            }

            const result = await db.query(
                'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                [status, id]
            );

            res.json({ order: result.rows[0] });
        } catch (err) {
            console.error('Update order status error:', err);
            res.status(500).json({ error: 'Server error.' });
        }
    }
);

// PUT /api/admin/orders/:id/remarks - Update order remarks
router.put(
    '/orders/:id/remarks',
    [
        body('remarks').optional().isString().withMessage('Remarks must be a string').trim(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { remarks } = req.body;

        try {
            const existing = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
            if (existing.rows.length === 0) {
                return res.status(404).json({ error: 'Order not found.' });
            }

            const result = await db.query(
                'UPDATE orders SET remarks = $1, updated_at = NOW() WHERE id = $2 RETURNING id, remarks',
                [remarks || null, id]
            );

            res.json({ order: result.rows[0] });
        } catch (err) {
            console.error('Update order remarks error:', err);
            res.status(500).json({ error: 'Server error.' });
        }
    }
);

// DELETE /api/admin/orders/:id - Delete an order
router.delete('/orders/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM orders WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found.' });
        }
        res.json({ message: 'Order deleted successfully.' });
    } catch (err) {
        console.error('Delete order error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// =====================
// HERO SLIDES MANAGEMENT
// =====================

// GET /api/admin/hero-slides - List all hero slides
router.get('/hero-slides', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM hero_slides ORDER BY sort_order ASC, created_at DESC'
        );
        res.json({ slides: result.rows });
    } catch (err) {
        console.error('Get hero slides error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/admin/hero-slides - Create a hero slide
router.post(
    '/hero-slides',
    [
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('image_url').trim().notEmpty().withMessage('Image URL is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, subtitle, image_url, sort_order, is_active } = req.body;

        try {
            const result = await db.query(
                `INSERT INTO hero_slides (title, subtitle, image_url, sort_order, is_active)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
                [title, subtitle || null, image_url, sort_order || 0, is_active !== undefined ? is_active : true]
            );

            res.status(201).json({ slide: result.rows[0] });
        } catch (err) {
            console.error('Create hero slide error:', err);
            res.status(500).json({ error: 'Server error.' });
        }
    }
);

// PUT /api/admin/hero-slides/:id - Update a hero slide
router.put(
    '/hero-slides/:id',
    [
        body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
        body('image_url').optional().trim().notEmpty().withMessage('Image URL cannot be empty'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { title, subtitle, image_url, sort_order, is_active } = req.body;

        try {
            const existing = await db.query('SELECT * FROM hero_slides WHERE id = $1', [id]);
            if (existing.rows.length === 0) {
                return res.status(404).json({ error: 'Hero slide not found.' });
            }

            const slide = existing.rows[0];
            const result = await db.query(
                `UPDATE hero_slides
           SET title = $1, subtitle = $2, image_url = $3,
               sort_order = $4, is_active = $5, updated_at = NOW()
           WHERE id = $6
           RETURNING *`,
                [
                    title !== undefined ? title : slide.title,
                    subtitle !== undefined ? subtitle : slide.subtitle,
                    image_url !== undefined ? image_url : slide.image_url,
                    sort_order !== undefined ? sort_order : slide.sort_order,
                    is_active !== undefined ? is_active : slide.is_active,
                    id,
                ]
            );

            res.json({ slide: result.rows[0] });
        } catch (err) {
            console.error('Update hero slide error:', err);
            res.status(500).json({ error: 'Server error.' });
        }
    }
);

// DELETE /api/admin/hero-slides/:id - Delete a hero slide
router.delete('/hero-slides/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM hero_slides WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Hero slide not found.' });
        }
        res.json({ message: 'Hero slide deleted successfully.' });
    } catch (err) {
        console.error('Delete hero slide error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// =====================
// EMAIL NOTIFICATIONS
// =====================

// POST /api/admin/orders/:id/send-confirmation - Send order confirmation email
router.post('/orders/:id/send-confirmation', async (req, res) => {
    const { id } = req.params;

    try {
        const orderResult = await db.query(
            `SELECT o.*, u.name as user_name, u.email as user_email
           FROM orders o JOIN users u ON o.user_id = u.id
           WHERE o.id = $1`,
            [id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        const order = orderResult.rows[0];
        const result = await sendOrderConfirmation(order, order.user_email, order.user_name);

        if (result.success) {
            res.json({ message: 'Confirmation email sent successfully.', messageId: result.messageId });
        } else {
            res.status(500).json({ error: 'Failed to send email. SMTP may not be configured.', details: result.error });
        }
    } catch (err) {
        console.error('Send confirmation email error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/admin/orders/:id/send-status-update - Send order status update email
router.post('/orders/:id/send-status-update', async (req, res) => {
    const { id } = req.params;

    try {
        const orderResult = await db.query(
            `SELECT o.*, u.name as user_name, u.email as user_email
           FROM orders o JOIN users u ON o.user_id = u.id
           WHERE o.id = $1`,
            [id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        const order = orderResult.rows[0];
        const result = await sendOrderStatusUpdate(order, order.user_email, order.user_name);

        if (result.success) {
            res.json({ message: 'Status update email sent successfully.', messageId: result.messageId });
        } else {
            res.status(500).json({ error: 'Failed to send email. SMTP may not be configured.', details: result.error });
        }
    } catch (err) {
        console.error('Send status update email error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// =====================
// SETTINGS
// =====================

// GET /api/admin/settings - Get all settings
router.get('/settings', async (req, res) => {
    try {
        const result = await db.query('SELECT key, value, updated_at FROM settings ORDER BY key');
        const settings = {};
        result.rows.forEach((row) => {
            settings[row.key] = row.value;
        });
        res.json({ settings });
    } catch (err) {
        console.error('Get settings error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PUT /api/admin/settings/:key - Update a setting
router.put(
    '/settings/:key',
    [
        body('value').trim().notEmpty().withMessage('Value is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { key } = req.params;
        const { value } = req.body;

        try {
            const result = await db.query(
                `INSERT INTO settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key)
         DO UPDATE SET value = $2, updated_at = NOW()
         RETURNING *`,
                [key, value]
            );

            res.json({ setting: result.rows[0] });
        } catch (err) {
            console.error('Update setting error:', err);
            res.status(500).json({ error: 'Server error.' });
        }
    }
);

module.exports = router;
