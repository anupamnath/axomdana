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
                price: 850.00,
                image_url: 'https://images.unsplash.com/photo-1559678197-90e9e0e0c7b0?w=600&q=80',
                category: 'Poultry Feed',
                stock: 500
            },
            {
                name: 'Premium Poultry Feed - Grower',
                slug: 'premium-poultry-feed-grower',
                description: 'Balanced grower feed for broilers and layers (6-20 weeks). Supports healthy weight gain and egg production with optimized calcium and protein levels.',
                price: 780.00,
                image_url: 'https://images.unsplash.com/photo-1597764690521-15b1e6c0c5e0?w=600&q=80',
                category: 'Poultry Feed',
                stock: 450
            },
            {
                name: 'Dairy Cattle Feed - High Yield',
                slug: 'dairy-cattle-feed-high-yield',
                description: 'Nutrient-rich feed for high-yielding dairy cows. Enriched with bypass protein, minerals, and energy sources to maximize milk production and fat content.',
                price: 1200.00,
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
                price: 720.00,
                image_url: 'https://images.unsplash.com/photo-1480044965905-02098d419e96?w=600&q=80',
                category: 'Goat & Sheep Feed',
                stock: 350
            },
            {
                name: 'Fish Feed - Floating Pellets',
                slug: 'fish-feed-floating-pellets',
                description: 'Premium floating fish feed pellets for carp, tilapia, and catfish. Slow-sinking formula with 32% protein for efficient growth and water quality management.',
                price: 680.00,
                image_url: 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=600&q=80',
                category: 'Fish Feed',
                stock: 600
            },
            {
                name: 'Horse Feed - Performance Blend',
                slug: 'horse-feed-performance-blend',
                description: 'High-energy performance feed for working and sport horses. Fortified with electrolytes, joint supplements, and controlled starch for sustained energy.',
                price: 1450.00,
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
                price: 450.00,
                image_url: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&q=80',
                category: 'Supplements',
                stock: 800
            },
            {
                name: 'Organic Poultry Feed - Layer',
                slug: 'organic-poultry-feed-layer',
                description: 'Certified organic layer feed for free-range and backyard chickens. Made from non-GMO grains, fortified with omega-3s for nutrient-rich eggs.',
                price: 1100.00,
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
                `INSERT INTO products (name, slug, description, price, image_url, category, stock)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO NOTHING`,
                [p.name, p.slug, p.description, p.price, p.image_url, p.category, p.stock]
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
