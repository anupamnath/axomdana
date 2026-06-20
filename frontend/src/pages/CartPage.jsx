import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

// Helper: get effective selling price for a cart item (wholesale_price if set, else price)
const getItemPrice = (item) => {
    const wp = item.wholesale_price !== null && item.wholesale_price !== undefined ? item.wholesale_price : item.price;
    return parseFloat(wp);
};

export default function CartPage() {
    const { cart, loading, cartTotal, cartCount, updateQuantity, removeFromCart } = useCart();

    const MIN_QUANTITY = 5;
    const meetsMinimum = cartCount >= MIN_QUANTITY;

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '60vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: 1 }}>🛒</div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
                    Your cart is empty
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.0625rem' }}>
                    Looks like you haven't added anything yet.
                </p>
                <Link to="/" className="btn btn-primary btn-lg" style={{ padding: '0.875rem 2.5rem' }}>
                    Browse Products
                </Link>
            </div>
        );
    }

    const formatINR = (amount) => {
        return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', letterSpacing: '-0.03em' }}>
                Shopping Cart
            </h1>

            {/* Minimum quantity notification */}
            <div
                style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius)',
                    marginBottom: '1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    backgroundColor: meetsMinimum ? '#f0fdf4' : '#fffbeb',
                    color: meetsMinimum ? '#166534' : '#92400e',
                    border: `1px solid ${meetsMinimum ? '#bbf7d0' : '#fde68a'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                }}
            >
                <span>{meetsMinimum ? '✅' : '⚠️'}</span>
                <span>
                    {meetsMinimum
                        ? `Your cart has ${cartCount} bag(s). Minimum order of ${MIN_QUANTITY} bags met — you're good to go!`
                        : `Your cart has ${cartCount} bag(s). Minimum order is ${MIN_QUANTITY} bags. Add ${MIN_QUANTITY - cartCount} more bag(s) to proceed.`}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
                {/* Cart Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {cart.map((item, index) => (
                        <div
                            key={item.id}
                            className="animate-fade-in-up"
                            style={{
                                animationDelay: `${index * 0.05}s`,
                                display: 'flex',
                                gap: '1.25rem',
                                padding: '1.25rem',
                                backgroundColor: 'var(--bg-card)',
                                borderRadius: 'var(--radius-lg)',
                                boxShadow: 'var(--shadow)',
                                transition: 'var(--transition)',
                            }}
                        >
                            <Link to={`/products/${item.slug}`} style={{ flexShrink: 0 }}>
                                <img
                                    src={item.image_url}
                                    alt={item.name}
                                    style={{
                                        width: '120px',
                                        height: '120px',
                                        objectFit: 'cover',
                                        borderRadius: 'var(--radius)',
                                    }}
                                />
                            </Link>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <Link
                                        to={`/products/${item.slug}`}
                                        style={{
                                            fontWeight: 600,
                                            color: 'var(--text)',
                                            textDecoration: 'none',
                                            fontSize: '1.0625rem',
                                            transition: 'var(--transition-fast)',
                                        }}
                                        onMouseEnter={(e) => (e.target.style.color = 'var(--primary)')}
                                        onMouseLeave={(e) => (e.target.style.color = 'var(--text)')}
                                    >
                                        {item.name}
                                    </Link>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                        {formatINR(getItemPrice(item))} each
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                            style={{
                                                padding: '0.25rem 0.75rem',
                                                minWidth: '2.25rem',
                                                borderRadius: '980px',
                                                fontWeight: 700,
                                                fontSize: '1rem',
                                            }}
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            min={1}
                                            max={item.stock}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 1;
                                                const clamped = Math.max(1, Math.min(item.stock, val));
                                                if (clamped !== item.quantity) {
                                                    updateQuantity(item.id, clamped);
                                                }
                                            }}
                                            style={{
                                                fontWeight: 600,
                                                minWidth: '3rem',
                                                width: '3.5rem',
                                                textAlign: 'center',
                                                fontSize: '0.9375rem',
                                                border: '1.5px solid var(--border-light)',
                                                borderRadius: 'var(--radius-sm)',
                                                padding: '0.25rem 0.25rem',
                                                outline: 'none',
                                                background: 'transparent',
                                                color: 'var(--text)',
                                                MozAppearance: 'textfield',
                                            }}
                                            onFocus={(e) => e.target.select()}
                                        />
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => item.quantity < item.stock && updateQuantity(item.id, item.quantity + 1)}
                                            disabled={item.quantity >= item.stock}
                                            style={{
                                                padding: '0.25rem 0.75rem',
                                                minWidth: '2.25rem',
                                                borderRadius: '980px',
                                                fontWeight: 700,
                                                fontSize: '1rem',
                                            }}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.125rem' }}>
                                            {formatINR(getItemPrice(item) * item.quantity)}
                                        </span>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => removeFromCart(item.id)}
                                            style={{ padding: '0.375rem 0.875rem', borderRadius: '980px' }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div
                    style={{
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-lg)',
                        padding: '1.75rem',
                        position: 'sticky',
                        top: '5.5rem',
                    }}
                >
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
                        Order Summary
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                        {cart.map((item) => (
                            <div key={item.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <img
                                    src={item.image_url}
                                    alt={item.name}
                                    style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px' }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.name}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        Qty: {item.quantity}
                                    </p>
                                </div>
                                <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--primary)' }}>
                                    {formatINR(getItemPrice(item) * item.quantity)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Total Items</span>
                        <span style={{ fontWeight: 600 }}>{cartCount} bag(s)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                        <span style={{ fontWeight: 600 }}>{formatINR(cartTotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
                        <span style={{ fontWeight: 600, color: 'var(--success)' }}>Free</span>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.75rem 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.125rem' }}>
                        <span style={{ fontWeight: 700 }}>Total</span>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.25rem' }}>{formatINR(cartTotal)}</span>
                    </div>

                    {!meetsMinimum && (
                        <div
                            style={{
                                padding: '0.625rem 0.875rem',
                                backgroundColor: '#fffbeb',
                                borderRadius: 'var(--radius)',
                                marginBottom: '1rem',
                                fontSize: '0.8125rem',
                                color: '#92400e',
                                border: '1px solid #fde68a',
                                textAlign: 'center',
                            }}
                        >
                            Add {MIN_QUANTITY - cartCount} more bag(s) to reach the minimum order of {MIN_QUANTITY} bags
                        </div>
                    )}

                    <Link
                        to={meetsMinimum ? '/checkout' : '#'}
                        className="btn btn-primary btn-lg"
                        onClick={(e) => {
                            if (!meetsMinimum) {
                                e.preventDefault();
                            }
                        }}
                        style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '0.875rem 1.5rem',
                            opacity: meetsMinimum ? 1 : 0.5,
                            cursor: meetsMinimum ? 'pointer' : 'not-allowed',
                            pointerEvents: meetsMinimum ? 'auto' : 'none',
                        }}
                    >
                        {meetsMinimum ? 'Proceed to Checkout' : `Need ${MIN_QUANTITY - cartCount} More Bag(s)`}
                    </Link>

                    <Link
                        to="/"
                        style={{
                            display: 'block',
                            textAlign: 'center',
                            marginTop: '1rem',
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 500,
                            transition: 'var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => (e.target.style.color = 'var(--primary)')}
                        onMouseLeave={(e) => (e.target.style.color = 'var(--text-secondary)')}
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}
