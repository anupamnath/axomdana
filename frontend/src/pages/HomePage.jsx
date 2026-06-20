import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI, publicAPI, deliveryImagesAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';

// Helper: get effective selling price (wholesale_price if set, else price)
const getItemPrice = (product) => {
    const wp = product.wholesale_price !== null && product.wholesale_price !== undefined ? product.wholesale_price : product.price;
    return parseFloat(wp);
};

// Helper: get MRP (with fallback to selling price if not set)
const getMrp = (product) => {
    if (product.mrp !== null && product.mrp !== undefined) return parseFloat(product.mrp);
    return getItemPrice(product);
};

const categories = [
    { name: 'All', icon: '🌾', slug: '' },
    { name: 'Poultry Feed', icon: '🐔', slug: 'Poultry Feed' },
    { name: 'Cattle Feed', icon: '🐄', slug: 'Cattle Feed' },
    { name: 'Goat & Sheep Feed', icon: '🐐', slug: 'Goat & Sheep Feed' },
    { name: 'Fish Feed', icon: '🐟', slug: 'Fish Feed' },
    { name: 'Horse Feed', icon: '🐎', slug: 'Horse Feed' },
    { name: 'Pig Feed', icon: '🐖', slug: 'Pig Feed' },
    { name: 'Supplements', icon: '💊', slug: 'Supplements' },
];

const defaultHeroSlides = [
    {
        title: 'Premium Animal Nutrition',
        subtitle: 'Scientifically formulated feeds for healthier livestock and higher yields',
        image_url: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&q=80',
    },
    {
        title: 'Trusted by Assam\'s Farmers',
        subtitle: 'Delivering quality feed across Beharbari, Guwahati and all of Northeast India',
        image_url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=1200&q=80',
    },
    {
        title: 'From Farm to Table',
        subtitle: 'Supporting local agriculture with premium feed solutions since 2024',
        image_url: 'https://images.unsplash.com/photo-1559678197-90e9e0e0c7b0?w=1200&q=80',
    },
];

export default function HomePage() {
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [heroSlides, setHeroSlides] = useState(defaultHeroSlides);
    const [heroIndex, setHeroIndex] = useState(0);
    const [heroTagline, setHeroTagline] = useState('Axom Dana LLC — Beharbari, Guwahati');
    const [featuredDeliveries, setFeaturedDeliveries] = useState([]);
    const [deliveriesLoading, setDeliveriesLoading] = useState(true);
    const { addToCart } = useCart();
    const { user } = useAuth();
    const productsRef = useRef(null);
    const searchInputRef = useRef(null);

    // Fetch hero slides and tagline from API
    useEffect(() => {
        const fetchHeroData = async () => {
            try {
                const [slidesRes, settingsRes] = await Promise.all([
                    publicAPI.getHeroSlides(),
                    publicAPI.getSettings(),
                ]);
                if (slidesRes.data.slides && slidesRes.data.slides.length > 0) {
                    setHeroSlides(slidesRes.data.slides);
                }
                if (settingsRes.data.settings?.hero_tagline) {
                    setHeroTagline(settingsRes.data.settings.hero_tagline);
                }
            } catch (err) {
                console.error('Failed to fetch hero data, using defaults:', err);
            }
        };
        fetchHeroData();
    }, []);

    // Hero auto-rotation
    useEffect(() => {
        const interval = setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % heroSlides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [heroSlides.length]);

    // Fetch featured delivery images for social-proof gallery
    useEffect(() => {
        const fetchFeaturedDeliveries = async () => {
            setDeliveriesLoading(true);
            try {
                const res = await deliveryImagesAPI.list({
                    featured: 'true',
                    limit: 8,
                });
                setFeaturedDeliveries(res.data.images || []);
            } catch (err) {
                console.error('Failed to fetch delivery images:', err);
            } finally {
                setDeliveriesLoading(false);
            }
        };
        fetchFeaturedDeliveries();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 8 };
            if (selectedCategory) params.category = selectedCategory;
            if (search) params.search = search;
            const res = await productsAPI.getAll(params);
            setProducts(res.data.products);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Failed to fetch products:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory, page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchProducts();
        if (productsRef.current) {
            productsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const scrollToProducts = () => {
        if (productsRef.current) {
            productsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div>
            {/* ════════════════════════════════════════ */}
            {/* HERO SECTION - Full Screen Apple Style   */}
            {/* ════════════════════════════════════════ */}
            <section
                style={{
                    position: 'relative',
                    height: '100vh',
                    minHeight: '600px',
                    maxHeight: '900px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    backgroundColor: '#1a1a1a',
                }}
            >
                {/* Background Image with Crossfade */}
                {heroSlides.map((slide, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: `url(${slide.image_url || slide.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: i === heroIndex ? 1 : 0,
                            transition: 'opacity 1.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
                            transform: 'scale(1.05)',
                        }}
                    />
                ))}

                {/* Overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.8) 100%)',
                    }}
                />

                {/* Hero Content */}
                <div
                    style={{
                        position: 'relative',
                        zIndex: 2,
                        textAlign: 'center',
                        color: 'white',
                        padding: '0 1.5rem',
                        maxWidth: '800px',
                    }}
                >
                    <div style={{ marginBottom: '1.5rem', animation: 'fadeInUp 0.8s ease-out' }}>
                        <span
                            style={{
                                display: 'inline-block',
                                padding: '0.375rem 1rem',
                                backgroundColor: 'rgba(26, 138, 63, 0.9)',
                                borderRadius: '9999px',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                letterSpacing: '0.02em',
                                textTransform: 'uppercase',
                            }}
                        >
                            {heroTagline}
                        </span>
                    </div>

                    <h1
                        key={heroIndex}
                        style={{
                            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                            fontWeight: 800,
                            letterSpacing: '-0.04em',
                            lineHeight: 1.05,
                            marginBottom: '1rem',
                            animation: 'fadeInUp 0.6s ease-out',
                        }}
                    >
                        {heroSlides[heroIndex].title}
                    </h1>

                    <p
                        key={`p-${heroIndex}`}
                        style={{
                            fontSize: 'clamp(1rem, 2vw, 1.375rem)',
                            fontWeight: 400,
                            color: 'rgba(255,255,255,0.8)',
                            maxWidth: '600px',
                            margin: '0 auto 2rem',
                            lineHeight: 1.6,
                            animation: 'fadeInUp 0.6s ease-out 0.1s both',
                        }}
                    >
                        {heroSlides[heroIndex].subtitle}
                    </p>

                    <div
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            animation: 'fadeInUp 0.6s ease-out 0.2s both',
                        }}
                    >
                        <button
                            onClick={scrollToProducts}
                            className="btn btn-primary btn-xl"
                            style={{
                                backgroundColor: 'white',
                                color: 'var(--text)',
                                fontSize: '1rem',
                                padding: '1rem 2.5rem',
                            }}
                        >
                            Browse Products
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                        <Link
                            to="/register"
                            className="btn btn-outline btn-xl"
                            style={{
                                borderColor: 'rgba(255,255,255,0.4)',
                                color: 'white',
                                fontSize: '1rem',
                                padding: '1rem 2.5rem',
                            }}
                        >
                            Create Account
                        </Link>
                    </div>
                </div>

                {/* Hero Dots */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '2.5rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '0.5rem',
                        zIndex: 2,
                    }}
                >
                    {heroSlides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setHeroIndex(i)}
                            style={{
                                width: i === heroIndex ? '2rem' : '0.5rem',
                                height: '0.5rem',
                                borderRadius: '9999px',
                                border: 'none',
                                backgroundColor: i === heroIndex ? 'white' : 'rgba(255,255,255,0.4)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                padding: 0,
                            }}
                        />
                    ))}
                </div>

                {/* Scroll Indicator */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '1rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 2,
                        animation: 'bounce 2s infinite',
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5">
                        <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                    </svg>
                </div>
            </section>

            {/* ════════════════════════════════════════ */}
            {/* SOCIAL PROOF / TRUST BAR                 */}
            {/* ════════════════════════════════════════ */}
            <section
                style={{
                    padding: '2.25rem 0',
                    backgroundColor: 'white',
                    borderBottom: '1px solid var(--border-light)',
                }}
            >
                <div className="container">
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '1rem',
                        }}
                    >
                        {[
                            {
                                icon: (
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                ),
                                value: 'Lab Tested',
                                label: 'Every batch verified for quality',
                            },
                            {
                                icon: (
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="1" y="3" width="15" height="13" rx="2" />
                                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                        <circle cx="5.5" cy="18.5" r="2.5" />
                                        <circle cx="18.5" cy="18.5" r="2.5" />
                                    </svg>
                                ),
                                value: 'Free Delivery',
                                label: 'On orders above ₹2,000',
                            },
                            {
                                icon: (
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                ),
                                value: '4.8 / 5',
                                label: 'Customer rating on verified deliveries',
                            },
                            {
                                icon: (
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                ),
                                value: 'Across Assam',
                                label: 'Delivering to 25+ districts',
                            },
                        ].map((item, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.875rem',
                                    padding: '0.875rem 1rem',
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--border-light)',
                                }}
                            >
                                <div
                                    style={{
                                        flexShrink: 0,
                                        width: '2.5rem',
                                        height: '2.5rem',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(26, 138, 63, 0.12)',
                                        color: 'var(--primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {item.icon}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: '0.9375rem',
                                            fontWeight: 700,
                                            color: 'var(--text)',
                                            letterSpacing: '-0.01em',
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {item.value}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--text-tertiary)',
                                            lineHeight: 1.4,
                                            marginTop: '0.125rem',
                                        }}
                                    >
                                        {item.label}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════ */}
            {/* CATEGORY STRIP - Apple Style Pills       */}
            {/* ════════════════════════════════════════ */}
            <section
                style={{
                    padding: '1.5rem 0',
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'saturate(180%) blur(18px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(18px)',
                    borderBottom: '1px solid var(--border-light)',
                    position: 'sticky',
                    top: '3.75rem',
                    zIndex: 50,
                }}
            >
                <div className="container">
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.5rem',
                            overflowX: 'auto',
                            paddingBottom: '0.25rem',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                        }}
                    >
                        {categories.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => {
                                    setSelectedCategory(cat.slug);
                                    setPage(1);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '9999px',
                                    border: '1.5px solid',
                                    borderColor: selectedCategory === cat.slug ? 'var(--primary)' : 'var(--border-light)',
                                    backgroundColor: selectedCategory === cat.slug ? 'var(--primary-bg)' : 'transparent',
                                    color: selectedCategory === cat.slug ? 'var(--primary)' : 'var(--text-secondary)',
                                    fontWeight: 600,
                                    fontSize: '0.8125rem',
                                    cursor: 'pointer',
                                    transition: 'var(--transition-fast)',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedCategory !== cat.slug) {
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedCategory !== cat.slug) {
                                        e.currentTarget.style.borderColor = 'var(--border-light)';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════ */}
            {/* SEARCH + PRODUCTS SECTION                */}
            {/* ════════════════════════════════════════ */}
            <section ref={productsRef} style={{ padding: '3rem 0 5rem' }}>
                <div className="container">
                    {/* Section Header */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                            marginBottom: '2rem',
                            flexWrap: 'wrap',
                            gap: '1rem',
                        }}
                    >
                        <div>
                            <h2 className="section-title" style={{ fontSize: '2rem' }}>
                                {selectedCategory || 'All Products'}
                            </h2>
                            <p className="section-subtitle" style={{ fontSize: '1rem', maxWidth: '400px' }}>
                                Premium quality animal feed delivered across Assam
                            </p>
                        </div>

                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', minWidth: '280px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <svg
                                    style={{
                                        position: 'absolute',
                                        left: '0.875rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--text-tertiary)',
                                        pointerEvents: 'none',
                                    }}
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search feeds..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="form-input"
                                    style={{ paddingLeft: '2.5rem', borderRadius: '9999px' }}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ borderRadius: '9999px' }}>
                                Search
                            </button>
                        </form>
                    </div>

                    {/* Products Grid */}
                    {loading ? (
                        <div className="loading-container" style={{ minHeight: '400px' }}>
                            <div className="spinner" />
                        </div>
                    ) : products.length === 0 ? (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '4rem 1rem',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-xl)',
                            }}
                        >
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                            <h3 style={{ marginBottom: '0.5rem' }}>No products found</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Try adjusting your search or filter to find what you're looking for.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                                    gap: '1.5rem',
                                }}
                            >
                                {products.map((product, index) => (
                                    <div
                                        key={product.id}
                                        style={{
                                            backgroundColor: 'var(--bg-card)',
                                            borderRadius: 'var(--radius-lg)',
                                            overflow: 'hidden',
                                            boxShadow: 'var(--shadow-sm)',
                                            border: '1px solid var(--border-light)',
                                            transition: 'var(--transition)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.borderColor = 'var(--border-light)';
                                        }}
                                    >
                                        {/* Product Image */}
                                        <Link to={`/products/${product.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    height: '220px',
                                                    backgroundColor: '#f5f5f7',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        transition: 'transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
                                                    }}
                                                    loading="lazy"
                                                    onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; }}
                                                    onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
                                                />
                                                {/* Category Badge */}
                                                <span
                                                    style={{
                                                        position: 'absolute',
                                                        top: '0.75rem',
                                                        left: '0.75rem',
                                                        padding: '0.25rem 0.625rem',
                                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                                        backdropFilter: 'blur(10px)',
                                                        borderRadius: '9999px',
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 600,
                                                        color: 'var(--text-secondary)',
                                                    }}
                                                >
                                                    {product.category}
                                                </span>
                                                {/* Featured Badge */}
                                                {product.is_featured && (
                                                    <span
                                                        style={{
                                                            position: 'absolute',
                                                            top: '0.75rem',
                                                            right: '0.75rem',
                                                            padding: '0.25rem 0.625rem',
                                                            backgroundColor: 'rgba(255, 69, 58, 0.95)',
                                                            borderRadius: '9999px',
                                                            fontSize: '0.6875rem',
                                                            fontWeight: 700,
                                                            color: 'white',
                                                            letterSpacing: '0.02em',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem',
                                                        }}
                                                    >
                                                        ★ Featured
                                                    </span>
                                                )}
                                                {/* Stock Badge */}
                                                {!product.is_featured && product.stock <= 10 && product.stock > 0 && (
                                                    <span
                                                        style={{
                                                            position: 'absolute',
                                                            top: '0.75rem',
                                                            right: '0.75rem',
                                                            padding: '0.25rem 0.625rem',
                                                            backgroundColor: 'rgba(255, 149, 0, 0.9)',
                                                            borderRadius: '9999px',
                                                            fontSize: '0.6875rem',
                                                            fontWeight: 600,
                                                            color: 'white',
                                                        }}
                                                    >
                                                        Only {product.stock} left
                                                    </span>
                                                )}
                                            </div>
                                        </Link>

                                        {/* Product Info */}
                                        <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Link
                                                to={`/products/${product.slug}`}
                                                style={{
                                                    fontSize: '1rem',
                                                    fontWeight: 600,
                                                    color: 'var(--text)',
                                                    textDecoration: 'none',
                                                    letterSpacing: '-0.02em',
                                                    lineHeight: 1.3,
                                                    marginBottom: '0.375rem',
                                                    transition: 'var(--transition-fast)',
                                                }}
                                            >
                                                {product.name}
                                            </Link>

                                            <p
                                                style={{
                                                    fontSize: '0.8125rem',
                                                    color: 'var(--text-tertiary)',
                                                    lineHeight: 1.5,
                                                    marginBottom: '1rem',
                                                    flex: 1,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {product.description}
                                            </p>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                                                    {(() => {
                                                        const mrp = getMrp(product);
                                                        const sellPrice = getItemPrice(product);
                                                        const hasDiscount = mrp > sellPrice;
                                                        return (
                                                            <>
                                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', flexWrap: 'wrap' }}>
                                                                    <span
                                                                        style={{
                                                                            fontSize: '1.25rem',
                                                                            fontWeight: 700,
                                                                            color: 'var(--primary)',
                                                                            letterSpacing: '-0.02em',
                                                                        }}
                                                                    >
                                                                        ₹{sellPrice.toLocaleString('en-IN')}
                                                                    </span>
                                                                    {hasDiscount && (
                                                                        <span
                                                                            style={{
                                                                                fontSize: '0.8125rem',
                                                                                color: 'var(--text-tertiary)',
                                                                                textDecoration: 'line-through',
                                                                                fontWeight: 500,
                                                                            }}
                                                                        >
                                                                            ₹{mrp.toLocaleString('en-IN')}
                                                                        </span>
                                                                    )}
                                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>/bag</span>
                                                                </div>
                                                                {hasDiscount && (
                                                                    <span
                                                                        style={{
                                                                            fontSize: '0.6875rem',
                                                                            color: '#1a8a3f',
                                                                            fontWeight: 600,
                                                                        }}
                                                                    >
                                                                        Save ₹{(mrp - sellPrice).toLocaleString('en-IN')}/bag
                                                                    </span>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => addToCart(product.id)}
                                                    disabled={product.stock === 0}
                                                    style={{
                                                        borderRadius: '9999px',
                                                        padding: '0.5rem 1rem',
                                                        fontSize: '0.8125rem',
                                                    }}
                                                >
                                                    {product.stock === 0 ? 'Out of Stock' : 'Add'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.totalPages > 1 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        marginTop: '3rem',
                                    }}
                                >
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => p - 1)}
                                        style={{ borderRadius: '9999px' }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 12H5M12 19l-7-7 7-7" />
                                        </svg>
                                        Previous
                                    </button>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p)}
                                                style={{
                                                    width: '2.25rem',
                                                    height: '2.25rem',
                                                    borderRadius: '50%',
                                                    border: 'none',
                                                    backgroundColor: p === page ? 'var(--primary)' : 'transparent',
                                                    color: p === page ? 'white' : 'var(--text-secondary)',
                                                    fontWeight: 600,
                                                    fontSize: '0.875rem',
                                                    cursor: 'pointer',
                                                    transition: 'var(--transition-fast)',
                                                }}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        disabled={page >= pagination.totalPages}
                                        onClick={() => setPage((p) => p + 1)}
                                        style={{ borderRadius: '9999px' }}
                                    >
                                        Next
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* ════════════════════════════════════════ */}
            {/* DELIVERY GALLERY - Customer shared      */}
            {/* ════════════════════════════════════════ */}
            {!deliveriesLoading && featuredDeliveries.length > 0 && (
                <section
                    style={{
                        padding: '4rem 0',
                        backgroundColor: 'white',
                    }}
                >
                    <div className="container">
                        <div
                            style={{
                                textAlign: 'center',
                                marginBottom: '2.5rem',
                            }}
                        >
                            <span
                                style={{
                                    display: 'inline-block',
                                    padding: '0.375rem 0.875rem',
                                    backgroundColor: 'rgba(26, 138, 63, 0.1)',
                                    color: 'var(--primary)',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                Real Customers · Real Deliveries
                            </span>
                            <h2
                                className="section-title"
                                style={{ fontSize: '2rem' }}
                            >
                                From Our Customers' Farms
                            </h2>
                            <p
                                className="section-subtitle"
                                style={{
                                    fontSize: '1rem',
                                    margin: '0.5rem auto 0',
                                    maxWidth: '520px',
                                }}
                            >
                                Verified photos shared by happy farmers across
                                Assam and Northeast India.
                            </p>
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fill, minmax(220px, 1fr))',
                                gap: '1rem',
                            }}
                        >
                            {featuredDeliveries.map((img, i) => (
                                <div
                                    key={img.id}
                                    style={{
                                        position: 'relative',
                                        aspectRatio: '1 / 1',
                                        borderRadius: 'var(--radius-lg)',
                                        overflow: 'hidden',
                                        backgroundColor: '#f5f5f7',
                                        boxShadow: 'var(--shadow-sm)',
                                        cursor: 'pointer',
                                        animation: `fadeInUp 0.5s ease-out ${i * 0.07
                                            }s both`,
                                        transition:
                                            'transform 0.3s ease, box-shadow 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform =
                                            'translateY(-4px) scale(1.01)';
                                        e.currentTarget.style.boxShadow =
                                            'var(--shadow-lg)';
                                        const overlay =
                                            e.currentTarget.querySelector(
                                                '.delivery-overlay'
                                            );
                                        if (overlay)
                                            overlay.style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform =
                                            'translateY(0) scale(1)';
                                        e.currentTarget.style.boxShadow =
                                            'var(--shadow-sm)';
                                        const overlay =
                                            e.currentTarget.querySelector(
                                                '.delivery-overlay'
                                            );
                                        if (overlay)
                                            overlay.style.opacity = '0';
                                    }}
                                >
                                    <img
                                        src={img.image_url}
                                        alt={
                                            img.caption ||
                                            `Delivery by ${img.customer_name}`
                                        }
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                        loading="lazy"
                                    />
                                    <div
                                        className="delivery-overlay"
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background:
                                                'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'flex-end',
                                            padding: '1rem',
                                            color: 'white',
                                            opacity: 0,
                                            transition: 'opacity 0.25s ease',
                                        }}
                                    >
                                        {img.customer_name && (
                                            <div
                                                style={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: 700,
                                                    marginBottom: '0.125rem',
                                                }}
                                            >
                                                {img.customer_name}
                                            </div>
                                        )}
                                        {img.location && (
                                            <div
                                                style={{
                                                    fontSize: '0.75rem',
                                                    opacity: 0.9,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                }}
                                            >
                                                <svg
                                                    width="11"
                                                    height="11"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                                                    <circle cx="12" cy="10" r="3" />
                                                </svg>
                                                {img.location}
                                            </div>
                                        )}
                                        {img.caption && (
                                            <div
                                                style={{
                                                    fontSize: '0.75rem',
                                                    opacity: 0.85,
                                                    marginTop: '0.375rem',
                                                    fontStyle: 'italic',
                                                }}
                                            >
                                                "{img.caption}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {user && (
                            <div
                                style={{
                                    textAlign: 'center',
                                    marginTop: '2rem',
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    Got a delivery you'd like to share?{' '}
                                    <Link
                                        to="/orders"
                                        style={{
                                            color: 'var(--primary)',
                                            fontWeight: 600,
                                            textDecoration: 'none',
                                        }}
                                    >
                                        Upload from your orders →
                                    </Link>
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ════════════════════════════════════════ */}
            {/* FEATURES SECTION - Apple Style Grid      */}
            {/* ════════════════════════════════════════ */}
            <section
                style={{
                    padding: '5rem 0',
                    backgroundColor: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border-light)',
                    borderBottom: '1px solid var(--border-light)',
                }}
            >
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 className="section-title">Why Choose Axom Dana?</h2>
                        <p className="section-subtitle" style={{ margin: '0.5rem auto 0' }}>
                            Quality you can trust, service you can rely on
                        </p>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '1.5rem',
                        }}
                    >
                        {[
                            {
                                icon: '🌾',
                                title: 'Premium Quality',
                                desc: 'Scientifically formulated feeds with optimal nutrition for every stage of growth',
                            },
                            {
                                icon: '🚚',
                                title: 'Free Delivery',
                                desc: 'Free shipping on orders above ₹2,000 across Guwahati and nearby areas',
                            },
                            {
                                icon: '🧪',
                                title: 'Lab Tested',
                                desc: 'Every batch tested for quality, purity, and nutritional consistency',
                            },
                            {
                                icon: '🤝',
                                title: 'Expert Support',
                                desc: 'Get advice from our animal nutrition experts for your specific needs',
                            },
                        ].map((feature, i) => (
                            <div
                                key={i}
                                style={{
                                    padding: '2rem',
                                    backgroundColor: 'white',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--border-light)',
                                    textAlign: 'center',
                                    transition: 'var(--transition)',
                                    animation: `fadeInUp 0.5s ease-out ${i * 0.1}s both`,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{feature.icon}</div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>{feature.title}</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════ */}
            {/* CTA SECTION                             */}
            {/* ════════════════════════════════════════ */}
            <section
                style={{
                    padding: '5rem 0',
                    background: 'linear-gradient(135deg, #1a8a3f 0%, #166534 100%)',
                    color: 'white',
                    textAlign: 'center',
                }}
            >
                <div className="container" style={{ maxWidth: '700px' }}>
                    <h2
                        style={{
                            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                            fontWeight: 700,
                            letterSpacing: '-0.03em',
                            marginBottom: '1rem',
                        }}
                    >
                        Ready to Transform Your Livestock?
                    </h2>
                    <p
                        style={{
                            fontSize: '1.125rem',
                            opacity: 0.9,
                            marginBottom: '2rem',
                            lineHeight: 1.6,
                        }}
                    >
                        Join hundreds of satisfied farmers across Assam. Create your account today and get
                        exclusive access to bulk pricing and expert nutrition advice.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link
                            to="/register"
                            className="btn btn-primary btn-xl"
                            style={{
                                backgroundColor: 'white',
                                color: 'var(--primary)',
                                fontSize: '1rem',
                            }}
                        >
                            Get Started Free
                        </Link>
                        <Link
                            to="/login"
                            className="btn btn-outline btn-xl"
                            style={{
                                borderColor: 'rgba(255,255,255,0.4)',
                                color: 'white',
                                fontSize: '1rem',
                            }}
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════ */}
            {/* FOOTER                                   */}
            {/* ════════════════════════════════════════ */}
            <footer
                style={{
                    backgroundColor: '#1d1d1f',
                    color: '#86868b',
                    padding: '3rem 0 2rem',
                }}
            >
                <div className="container">
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr 1fr 1fr',
                            gap: '2rem',
                            marginBottom: '2rem',
                        }}
                    >
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                                    <rect width="32" height="32" rx="8" fill="#1a8a3f" />
                                    <path d="M16 6C12 6 8 9 8 14c0 4 3 8 8 14 5-6 8-10 8-14 0-5-4-8-8-8z" fill="white" opacity="0.9" />
                                </svg>
                                <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Axom Dana LLC</span>
                            </div>
                            <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, maxWidth: '300px' }}>
                                Premium animal feed and livestock nutrition solutions. Serving farmers across Assam
                                and Northeast India from our base in Beharbari, Guwahati.
                            </p>
                        </div>
                        <div>
                            <h4 style={{ color: 'white', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Products</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                {['Poultry Feed', 'Cattle Feed', 'Fish Feed', 'Supplements'].map((item) => (
                                    <Link key={item} to={`/?category=${encodeURIComponent(item)}`} style={{ color: '#86868b', fontSize: '0.8125rem' }}>
                                        {item}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 style={{ color: 'white', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                {['About Us', 'Contact', 'Privacy Policy', 'Terms'].map((item) => (
                                    <span key={item} style={{ color: '#86868b', fontSize: '0.8125rem', cursor: 'pointer' }}>{item}</span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 style={{ color: 'white', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</h4>
                            <div style={{ fontSize: '0.8125rem', lineHeight: 1.8 }}>
                                <p>Beharbari, Guwahati</p>
                                <p>Assam, India</p>
                                <p style={{ marginTop: '0.5rem' }}>info@axomdana.in</p>
                            </div>
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }} />

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.75rem',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                        }}
                    >
                        <p>&copy; {new Date().getFullYear()} Axom Dana LLC. All rights reserved.</p>
                        <p>Made with ❤️ in Assam, India</p>
                    </div>
                </div>
            </footer>

            {/* Keyframe for bounce animation */}
            <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
          40% { transform: translateX(-50%) translateY(-8px); }
          60% { transform: translateX(-50%) translateY(-4px); }
        }
      `}</style>
        </div>
    );
}
