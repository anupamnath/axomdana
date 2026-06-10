import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
    const { addToCart } = useCart();
    const { user } = useAuth();

    useEffect(() => {
        setLoading(true);
        productsAPI
            .getBySlug(slug)
            .then((res) => {
                setProduct(res.data.product);
                setQuantity(1);
            })
            .catch(() => setProduct(null))
            .finally(() => setLoading(false));
    }, [slug]);

    const handleAddToCart = async () => {
        if (!user) return;
        try {
            await addToCart(product.id, quantity);
            setAdded(true);
            setTimeout(() => setAdded(false), 2500);
        } catch (err) {
            console.error('Failed to add to cart:', err);
        }
    };

    const handleBuyNow = () => {
        if (!user) return;
        navigate('/checkout', {
            state: {
                buyNow: true,
                productId: product.id,
                quantity,
                price: product.price,
                name: product.name,
                image_url: product.image_url,
            },
        });
    };

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '80vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                <h2 style={{ marginBottom: '0.5rem' }}>Product not found</h2>
                <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    Browse Products
                </Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
            {/* Breadcrumb */}
            <Link
                to="/"
                style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-tertiary)',
                    marginBottom: '1.5rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    transition: 'var(--transition-fast)',
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to Products
            </Link>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4rem',
                    alignItems: 'start',
                }}
            >
                {/* Image */}
                <div
                    style={{
                        borderRadius: 'var(--radius-xl)',
                        overflow: 'hidden',
                        backgroundColor: '#f5f5f7',
                        aspectRatio: '1',
                        position: 'relative',
                    }}
                >
                    <img
                        src={product.image_url}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            left: '1rem',
                            padding: '0.375rem 0.75rem',
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                        }}
                    >
                        {product.category}
                    </span>
                </div>

                {/* Details */}
                <div style={{ paddingTop: '1rem' }}>
                    <h1
                        style={{
                            fontSize: '2.25rem',
                            fontWeight: 700,
                            letterSpacing: '-0.03em',
                            lineHeight: 1.15,
                            marginBottom: '0.75rem',
                        }}
                    >
                        {product.name}
                    </h1>

                    <p
                        style={{
                            fontSize: '2.5rem',
                            fontWeight: 800,
                            color: 'var(--primary)',
                            letterSpacing: '-0.03em',
                            marginBottom: '1.5rem',
                        }}
                    >
                        ₹{parseFloat(product.price).toLocaleString('en-IN')}
                        <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: '0.5rem' }}>/bag</span>
                    </p>

                    <p
                        style={{
                            color: 'var(--text-secondary)',
                            lineHeight: 1.7,
                            marginBottom: '2rem',
                            fontSize: '1rem',
                        }}
                    >
                        {product.description}
                    </p>

                    {/* Stock Status */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            backgroundColor: product.stock > 0 ? 'var(--primary-bg)' : '#fff5f5',
                            borderRadius: 'var(--radius)',
                            marginBottom: '2rem',
                        }}
                    >
                        <span style={{ fontSize: '1.25rem' }}>{product.stock > 0 ? '✅' : '❌'}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: product.stock > 0 ? 'var(--primary)' : 'var(--danger)' }}>
                            {product.stock > 0 ? `In Stock — ${product.stock} bags available` : 'Currently Out of Stock'}
                        </span>
                    </div>

                    {user ? (
                        <>
                            {/* Quantity Selector */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                                    Quantity
                                </label>
                                {/* Quick-select tiers */}
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                                    {[1, 3, 5, 10, 15, 25, 50].map((tier) => (
                                        <button
                                            key={tier}
                                            onClick={() => setQuantity(tier)}
                                            style={{
                                                padding: '0.5rem 1.25rem',
                                                border: `2px solid ${quantity === tier ? 'var(--primary)' : 'var(--border-light)'}`,
                                                borderRadius: '9999px',
                                                background: quantity === tier ? 'var(--primary-bg)' : 'transparent',
                                                color: quantity === tier ? 'var(--primary)' : 'var(--text-secondary)',
                                                fontWeight: quantity === tier ? 700 : 500,
                                                fontSize: '0.875rem',
                                                cursor: 'pointer',
                                                transition: 'var(--transition-fast)',
                                            }}
                                        >
                                            {tier} bags
                                        </button>
                                    ))}
                                </div>
                                {/* Custom quantity input */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            border: '1.5px solid var(--border-light)',
                                            borderRadius: 'var(--radius)',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <button
                                            style={{
                                                padding: '0.625rem 1rem',
                                                border: 'none',
                                                background: 'none',
                                                fontSize: '1.125rem',
                                                cursor: 'pointer',
                                                color: quantity <= 1 ? 'var(--text-tertiary)' : 'var(--text)',
                                                transition: 'var(--transition-fast)',
                                            }}
                                            disabled={quantity <= 1}
                                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            min={1}
                                            max={product.stock}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 1;
                                                setQuantity(Math.max(1, Math.min(product.stock, val)));
                                            }}
                                            style={{
                                                padding: '0.625rem 0.5rem',
                                                minWidth: '4rem',
                                                width: '4.5rem',
                                                textAlign: 'center',
                                                fontWeight: 600,
                                                fontSize: '1rem',
                                                border: 'none',
                                                borderLeft: '1.5px solid var(--border-light)',
                                                borderRight: '1.5px solid var(--border-light)',
                                                outline: 'none',
                                                background: 'transparent',
                                                color: 'var(--text)',
                                                MozAppearance: 'textfield',
                                            }}
                                            onFocus={(e) => e.target.select()}
                                        />
                                        <button
                                            style={{
                                                padding: '0.625rem 1rem',
                                                border: 'none',
                                                background: 'none',
                                                fontSize: '1.125rem',
                                                cursor: 'pointer',
                                                color: quantity >= product.stock ? 'var(--text-tertiary)' : 'var(--text)',
                                                transition: 'var(--transition-fast)',
                                            }}
                                            disabled={quantity >= product.stock}
                                            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                                        {quantity} bag{quantity > 1 ? 's' : ''} × ₹{parseFloat(product.price).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                    style={{
                                        flex: 1,
                                        minWidth: '200px',
                                        padding: '1rem 2rem',
                                        fontSize: '1.125rem',
                                        borderRadius: '9999px',
                                    }}
                                >
                                    {added ? (
                                        <>✓ Added to Cart — ₹{(parseFloat(product.price) * quantity).toLocaleString('en-IN')}</>
                                    ) : (
                                        <>Add to Cart — ₹{(parseFloat(product.price) * quantity).toLocaleString('en-IN')}</>
                                    )}
                                </button>
                                <button
                                    className="btn btn-success btn-lg"
                                    onClick={handleBuyNow}
                                    disabled={product.stock === 0}
                                    style={{
                                        flex: 1,
                                        minWidth: '160px',
                                        padding: '1rem 2rem',
                                        fontSize: '1.125rem',
                                        borderRadius: '9999px',
                                        backgroundColor: '#ff9f0a',
                                        borderColor: '#ff9f0a',
                                        color: 'white',
                                    }}
                                >
                                    ⚡ Buy Now
                                </button>
                            </div>
                        </>
                    ) : (
                        <div
                            style={{
                                padding: '1.25rem',
                                backgroundColor: '#eff6ff',
                                borderRadius: 'var(--radius)',
                                border: '1px solid #bfdbfe',
                            }}
                        >
                            <p style={{ fontSize: '0.9375rem', color: '#2563eb' }}>
                                <Link to="/login" style={{ fontWeight: 600, color: '#2563eb' }}>Sign in</Link> to add items to your cart and place orders.
                            </p>
                        </div>
                    )}

                    {/* Product Features */}
                    <div
                        style={{
                            marginTop: '2.5rem',
                            paddingTop: '2rem',
                            borderTop: '1px solid var(--border-light)',
                        }}
                    >
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Product Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {[
                                { label: 'Category', value: product.category },
                                { label: 'Stock', value: `${product.stock} bags` },
                                { label: 'Price', value: `₹${parseFloat(product.price).toLocaleString('en-IN')}/bag` },
                                { label: 'SKU', value: `AD-${product.id}` },
                            ].map((detail) => (
                                <div
                                    key={detail.label}
                                    style={{
                                        padding: '0.75rem',
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-sm)',
                                    }}
                                >
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block' }}>
                                        {detail.label}
                                    </span>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{detail.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
