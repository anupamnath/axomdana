const db = require('./database');
const bcrypt = require('bcryptjs');

const seed = async () => {
    console.log('Seeding database...');

    try {
        // Seed admin user
        const hashedPassword = await bcrypt.hash('#Teemo1234', 10);
        await db.query(
            `INSERT INTO users (name, email, password, is_admin)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (email) DO UPDATE SET password = $3, is_admin = $4`,
            ['Admin', 'admin@axomdana.in', hashedPassword, true]
        );
        console.log('Admin user seeded successfully.');

        // Seed animal feed / livestock feed products
        const products = [
            {
                name: 'Premium Poultry Feed - Starter',
                slug: 'premium-poultry-feed-starter',
                description: 'High-protein starter feed for chicks (0-6 weeks). Formulated with essential vitamins, minerals, and amino acids for optimal growth and immune system development.',
                price: 800.00,
                mrp: 950.00,
                wholesale_price: 800.00,
                is_featured: true,
                image_url: 'https://images.unsplash.com/photo-1559678197-90e9e0e0c7b0?w=600&q=80',
                category: 'Poultry Feed',
                stock: 500
            },
            {
                name: 'Premium Poultry Feed - Grower',
                slug: 'premium-poultry-feed-grower',
                description: 'Balanced grower feed for broilers and layers (6-20 weeks). Supports healthy weight gain and egg production with optimized calcium and protein levels.',
                price: 750.00,
                mrp: 880.00,
                wholesale_price: 750.00,
                is_featured: true,
                image_url: 'https://images.unsplash.com/photo-1597764690521-15b1e6c0c5e0?w=600&q=80',
                category: 'Poultry Feed',
                stock: 450
            },
            {
                name: 'Dairy Cattle Feed - High Yield',
                slug: 'dairy-cattle-feed-high-yield',
                description: 'Nutrient-rich feed for high-yielding dairy cows. Enriched with bypass protein, minerals, and energy sources to maximize milk production and fat content.',
                price: 1150.00,
                mrp: 1350.00,
                wholesale_price: 1150.00,
                is_featured: true,
                image_url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=600&q=80',
                category: 'Cattle Feed',
                stock: 300
            },
            {
                name: 'Dairy Cattle Feed - Standard',
                slug: 'dairy-cattle-feed-standard',
                description: 'Economical daily feed for dairy cattle. Complete nutritional profile with balanced roughage-to-concentrate ratio for maintenance and moderate milk production.',
                price: 950.00,
                image_url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&q=80',
                category: 'Cattle Feed',
                stock: 400
            },
            {
                name: 'Goat & Sheep Feed - Growth Plus',
                slug: 'goat-sheep-feed-growth-plus',
                description: 'Specially formulated feed for meat and dairy goats and sheep. High in digestible fiber and protein for superior weight gain and milk quality.',
                price: 680.00,
                mrp: 780.00,
                wholesale_price: 680.00,
                image_url: 'https://images.unsplash.com/photo-1480044965905-02098d419e96?w=600&q=80',
                category: 'Goat & Sheep Feed',
                stock: 350
            },
            {
                name: 'Fish Feed - Floating Pellets',
                slug: 'fish-feed-floating-pellets',
                description: 'Premium floating fish feed pellets for carp, tilapia, and catfish. Slow-sinking formula with 32% protein for efficient growth and water quality management.',
                price: 650.00,
                image_url: 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=600&q=80',
                category: 'Fish Feed',
                stock: 600
            },
            {
                name: 'Horse Feed - Performance Blend',
                slug: 'horse-feed-performance-blend',
                description: 'High-energy performance feed for working and sport horses. Fortified with electrolytes, joint supplements, and controlled starch for sustained energy.',
                price: 1400.00,
                mrp: 1600.00,
                wholesale_price: 1400.00,
                is_featured: true,
                image_url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&q=80',
                category: 'Horse Feed',
                stock: 150
            },
            {
                name: 'Pig Feed - Starter Crumble',
                slug: 'pig-feed-starter-crumble',
                description: 'Highly palatable starter crumble for weaned piglets. Contains milk proteins, organic acids, and digestive enzymes for smooth transition and rapid early growth.',
                price: 890.00,
                image_url: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=600&q=80',
                category: 'Pig Feed',
                stock: 250
            },
            {
                name: 'Mineral Mixture - Livestock',
                slug: 'mineral-mixture-livestock',
                description: 'Complete mineral and vitamin supplement for all livestock. Contains calcium, phosphorus, zinc, copper, selenium, and vitamins A, D3, E for overall health.',
                price: 420.00,
                mrp: 500.00,
                wholesale_price: 420.00,
                image_url: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&q=80',
                category: 'Supplements',
                stock: 800
            },
            {
                name: 'Organic Poultry Feed - Layer',
                slug: 'organic-poultry-feed-layer',
                description: 'Certified organic layer feed for free-range and backyard chickens. Made from non-GMO grains, fortified with omega-3s for nutrient-rich eggs.',
                price: 1050.00,
                mrp: 1200.00,
                wholesale_price: 1050.00,
                image_url: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=600&q=80',
                category: 'Poultry Feed',
                stock: 200
            },
            {
                name: 'Calf Starter Feed - 20% Protein',
                slug: 'calf-starter-feed-20-protein',
                description: 'Specially formulated calf starter for dairy and beef calves from 3 days to 3 months. High protein (20%) with probiotics for healthy rumen development.',
                price: 1350.00,
                image_url: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&q=80',
                category: 'Cattle Feed',
                stock: 180
            },
            {
                name: 'Duck & Goose Feed - Waterfowl',
                slug: 'duck-goose-feed-waterfowl',
                description: 'Complete feed for ducks and geese at all life stages. Floating pellet formula with niacin for leg health and balanced protein for meat and egg production.',
                price: 650.00,
                image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
                category: 'Poultry Feed',
                stock: 320
            },
        ];

        for (const p of products) {
            await db.query(
                `INSERT INTO products (name, slug, description, price, mrp, wholesale_price, is_featured, image_url, category, stock)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (slug) DO NOTHING`,
                [
                    p.name,
                    p.slug,
                    p.description,
                    p.price,
                    p.mrp !== undefined ? p.mrp : null,
                    p.wholesale_price !== undefined ? p.wholesale_price : null,
                    !!p.is_featured,
                    p.image_url,
                    p.category,
                    p.stock,
                ]
            );
        }

        // Seed sample reviews for the first 3 products (approved, by Admin demo user)
        // Note: the user submitting a review here is the seeded admin (id 1) — these exist
        // purely as demo content so the front-end has something to show out of the box.
        // In production, the verified-buyer check requires a delivered order.
        const sampleReviews = [
            {
                product_slug: 'premium-poultry-feed-starter',
                rating: 5,
                title: 'Excellent starter feed for chicks',
                body: 'My chicks have been thriving on this feed. Healthy growth, bright feathers, and zero health issues in the first 6 weeks. The pellets are uniform and easy to digest. Highly recommended for anyone raising broilers or layers from day one.',
                delivery_rating: 5,
                quality_rating: 5,
            },
            {
                product_slug: 'premium-poultry-feed-grower',
                rating: 5,
                title: 'Best grower feed I have tried',
                body: 'Switched from a competitor brand and the difference is visible. Egg production is up and birds look healthier. Packaging is sturdy and delivery was fast.',
                delivery_rating: 4,
                quality_rating: 5,
            },
            {
                product_slug: 'dairy-cattle-feed-high-yield',
                rating: 4,
                title: 'Good yield improvement',
                body: 'Noticed a clear bump in milk yield after two weeks on this feed. Cows love the taste. Took off one star because the bag could be a bit more durable, but the contents are top quality.',
                delivery_rating: 5,
                quality_rating: 4,
            },
            {
                product_slug: 'fish-feed-floating-pellets',
                rating: 5,
                title: 'Clean water, healthy fish',
                body: 'Floating pellets mean I can monitor feeding easily, and the water stays much cleaner compared to sinking feed. Fish growth is excellent.',
                delivery_rating: 5,
                quality_rating: 5,
            },
            {
                product_slug: 'horse-feed-performance-blend',
                rating: 5,
                title: 'Great energy for sport horses',
                body: 'My eventing horse has noticeable stamina improvement on this blend. No digestive issues, coat looks fantastic. Worth every rupee.',
                delivery_rating: 5,
                quality_rating: 5,
            },
        ];

        // Get admin user id
        const adminRes = await db.query("SELECT id FROM users WHERE email = 'admin@axomdana.in' LIMIT 1");
        const adminId = adminRes.rows[0]?.id;
        if (adminId) {
            for (const r of sampleReviews) {
                const prodRes = await db.query('SELECT id FROM products WHERE slug = $1', [r.product_slug]);
                if (prodRes.rows.length === 0) continue;
                const productId = prodRes.rows[0].id;

                const insertRes = await db.query(
                    `INSERT INTO product_reviews
                        (product_id, user_id, rating, title, body, delivery_rating, quality_rating, is_approved)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
                     ON CONFLICT (product_id, user_id) DO NOTHING
                     RETURNING id`,
                    [productId, adminId, r.rating, r.title, r.body, r.delivery_rating, r.quality_rating]
                );
                if (insertRes.rows.length === 0) continue;
                const reviewId = insertRes.rows[0].id;

                // Attach a sample review image (using Unsplash photo as placeholder)
                const reviewImages = {
                    'premium-poultry-feed-starter': 'https://images.unsplash.com/photo-1569096651661-05d1294c6a99?w=600&q=80',
                    'premium-poultry-feed-grower': 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=600&q=80',
                    'dairy-cattle-feed-high-yield': 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=600&q=80',
                    'fish-feed-floating-pellets': 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=600&q=80',
                    'horse-feed-performance-blend': 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&q=80',
                };
                const imgUrl = reviewImages[r.product_slug];
                if (imgUrl) {
                    await db.query(
                        'INSERT INTO review_images (review_id, image_url, sort_order) VALUES ($1, $2, 0)',
                        [reviewId, imgUrl]
                    );
                }
            }
        }

        // Seed sample delivery images (any user can upload; these are pre-approved & featured for demo)
        const sampleDeliveryImages = [
            {
                product_slug: 'premium-poultry-feed-starter',
                image_url: 'https://images.unsplash.com/photo-1569096651661-05d1294c6a99?w=800&q=80',
                caption: 'Healthy chicks on Axom Dana starter feed - 5 weeks old',
                customer_name: 'Rajesh Kumar',
                location: 'Guwahati, Assam',
                is_featured: true,
            },
            {
                product_slug: 'dairy-cattle-feed-high-yield',
                image_url: 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=800&q=80',
                caption: 'Bulk delivery to our dairy farm - 200 bags received',
                customer_name: 'Priya Sharma',
                location: 'Jorhat, Assam',
                is_featured: true,
            },
            {
                product_slug: 'fish-feed-floating-pellets',
                image_url: 'https://images.unsplash.com/photo-1545474840-d4e94d9d8b3c?w=800&q=80',
                caption: 'Fish farm pond - excellent growth on Axom Dana floating pellets',
                customer_name: 'Anil Das',
                location: 'Dibrugarh, Assam',
                is_featured: true,
            },
            {
                product_slug: 'horse-feed-performance-blend',
                image_url: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&q=80',
                caption: 'My polo ponies love this feed! Coat is glossy and energy is great.',
                customer_name: 'Mohit Singh',
                location: 'Shillong, Meghalaya',
                is_featured: false,
            },
            {
                product_slug: 'organic-poultry-feed-layer',
                image_url: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&q=80',
                caption: 'Free-range chickens enjoying their organic layer feed',
                customer_name: 'Sunita Devi',
                location: 'Itanagar, Arunachal Pradesh',
                is_featured: false,
            },
            {
                product_slug: 'goat-sheep-feed-growth-plus',
                image_url: 'https://images.unsplash.com/photo-1480044965905-02098d419e96?w=800&q=80',
                caption: 'Goats thriving on the Growth Plus formula - excellent weight gain',
                customer_name: 'Bharat Patel',
                location: 'Silchar, Assam',
                is_featured: false,
            },
        ];

        for (const img of sampleDeliveryImages) {
            const prodRes = await db.query('SELECT id FROM products WHERE slug = $1', [img.product_slug]);
            const productId = prodRes.rows[0]?.id;
            await db.query(
                `INSERT INTO delivery_images
                    (user_id, product_id, image_url, caption, customer_name, location, is_featured, is_approved)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
                 ON CONFLICT DO NOTHING`,
                [
                    adminId,
                    productId,
                    img.image_url,
                    img.caption,
                    img.customer_name,
                    img.location,
                    img.is_featured,
                ]
            );
        }

        console.log('Seeding completed successfully.');
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }

    process.exit(0);
};

seed();
