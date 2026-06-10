import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ordersAPI, publicAPI } from '../services/api';

export default function CheckoutPage() {
    const { cart, cartTotal, cartCount, loading: cartLoading } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const buyNowState = location.state?.buyNow ? location.state : null;

    const [shippingAddress, setShippingAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Payment state
    const [order, setOrder] = useState(null);
    const [upiQr, setUpiQr] = useState(null);
    const [upiId, setUpiId] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [paymentStep, setPaymentStep] = useState('form'); // 'form' | 'qr' | 'confirming' | 'done'
    const [paymentError, setPaymentError] = useState('');

    const formatINR = (amount) => {
        return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Fetch UPI ID from public settings
    useEffect(() => {
        const fetchUpiId = async () => {
            try {
                const res = await publicAPI.getPaymentSettings();
                if (res.data.settings?.upi_id) {
                    setUpiId(res.data.settings.upi_id);
                }
            } catch (err) {
                console.error('Failed to fetch UPI settings:', err);
            }
        };
        fetchUpiId();
    }, []);

    // Generate UPI QR code when order is created
    useEffect(() => {
        if (order && upiId) {
            generateUpiQr();
        }
    }, [order, upiId]);

    const generateUpiQr = async () => {
        try {
            const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=Axom%20Dana%20LLC&am=${order.total}&tn=Order%20%23${order.id}&cu=INR`;
            // Use a QR code API to generate the QR image
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`;
            setUpiQr(qrApiUrl);
        } catch (err) {
            console.error('Failed to generate UPI QR:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!shippingAddress.trim()) {
            setError('Shipping address is required.');
            return;
        }
        if (!phone.trim()) {
            setError('Phone number is required.');
            return;
        }
        if (!email.trim()) {
            setError('Email is required.');
            return;
        }

        // Validate cart-level minimum quantity (only for cart checkout)
        if (!buyNowState) {
            const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
            if (totalQty < 5) {
                setError(`Minimum order quantity is 5 bags total. Your cart has only ${totalQty} bag(s). Please add more items.`);
                return;
            }
        }

        setSubmitting(true);
        setError('');

        try {
            let res;
            if (buyNowState) {
                // Buy Now flow - create order for single product
                res = await ordersAPI.buyNow({
                    product_id: buyNowState.productId,
                    quantity: buyNowState.quantity,
                    shipping_address: shippingAddress,
                    phone,
                    email,
                });
            } else {
                // Cart checkout flow
                res = await ordersAPI.create({
                    shipping_address: shippingAddress,
                    phone,
                    email,
                });
            }
            setOrder(res.data.order);
            setPaymentStep('qr');
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to place order. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePaymentConfirm = async () => {
        if (!transactionId.trim()) {
            setPaymentError('Please enter the UPI transaction ID.');
            return;
        }

        setPaymentStep('confirming');
        setPaymentError('');

        try {
            await ordersAPI.updatePayment(order.id, {
                payment_status: 'paid',
                upi_transaction_id: transactionId.trim(),
            });
            setPaymentStep('done');
        } catch (err) {
            setPaymentError(err.response?.data?.error || 'Failed to confirm payment. Please try again.');
            setPaymentStep('qr');
        }
    };

    const handlePaymentLater = () => {
        navigate(`/orders/${order.id}`);
    };

    // Determine items to display
    const displayItems = buyNowState
        ? [
            {
                id: 'buy-now',
                product_id: buyNowState.productId,
                name: buyNowState.name,
                price: buyNowState.price,
                quantity: buyNowState.quantity,
                image_url: buyNowState.image_url,
            },
        ]
        : cart;

    const displayTotal = buyNowState
        ? parseFloat(buyNowState.price) * buyNowState.quantity
        : cartTotal;

    // ── Payment Done View ──
    if (paymentStep === 'done' && order) {
        return (
            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
                        Payment Successful!
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.0625rem' }}>
                        Your order #{order.id} has been placed and payment confirmed.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="btn btn-primary btn-lg"
                            style={{ padding: '0.875rem 2rem' }}
                        >
                            View Order Details
                        </button>
                        <Link to="/" className="btn btn-secondary btn-lg" style={{ padding: '0.875rem 2rem' }}>
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── QR Code / Payment View ──
    if (paymentStep === 'qr' && order) {
        return (
            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '600px', margin: '0 auto' }}>
                <div
                    style={{
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow)',
                        padding: '2.5rem',
                        textAlign: 'center',
                    }}
                >
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
                        Pay with UPI
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
                        Order #{order.id} — {formatINR(order.total)}
                    </p>

                    {upiQr ? (
                        <div
                            style={{
                                display: 'inline-block',
                                padding: '1rem',
                                backgroundColor: 'white',
                                borderRadius: 'var(--radius)',
                                border: '2px solid var(--border-light)',
                                marginBottom: '1.5rem',
                            }}
                        >
                            <img
                                src={upiQr}
                                alt="UPI QR Code"
                                style={{ width: '280px', height: '280px', display: 'block' }}
                            />
                        </div>
                    ) : (
                        <div
                            style={{
                                width: '280px',
                                height: '280px',
                                margin: '0 auto 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f5f5f7',
                                borderRadius: 'var(--radius)',
                            }}
                        >
                            <div className="spinner" />
                        </div>
                    )}

                    <div
                        style={{
                            padding: '1rem',
                            backgroundColor: '#f0fdf4',
                            borderRadius: 'var(--radius)',
                            marginBottom: '1.5rem',
                            fontSize: '0.875rem',
                            color: '#166534',
                        }}
                    >
                        <strong>UPI ID:</strong> {upiId || 'Not configured'}<br />
                        <strong>Amount:</strong> {formatINR(order.total)}<br />
                        <strong>Reference:</strong> Order #{order.id}
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Scan the QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.) and make the payment. Then enter the transaction ID below.
                    </p>

                    {paymentError && (
                        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{paymentError}</div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', textAlign: 'left' }}>
                            UPI Transaction ID
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter UPI transaction reference ID"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                        <button
                            onClick={handlePaymentConfirm}
                            disabled={paymentStep === 'confirming'}
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%', padding: '0.875rem 1.5rem' }}
                        >
                            {paymentStep === 'confirming' ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <span className="spinner" style={{ width: '1.25rem', height: '1.25rem', borderWidth: '2px', borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                                    Confirming Payment...
                                </span>
                            ) : (
                                '✓ Confirm Payment'
                            )}
                        </button>
                        <button
                            onClick={handlePaymentLater}
                            className="btn btn-secondary"
                            style={{ width: '100%', padding: '0.75rem 1.5rem' }}
                        >
                            Pay Later — View Order
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Loading ──
    if (cartLoading && !buyNowState) {
        return (
            <div className="loading-container" style={{ minHeight: '60vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    // ── Empty Cart (only for cart checkout) ──
    if (!buyNowState && cart.length === 0) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: 1 }}>🛒</div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
                    Your cart is empty
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.0625rem' }}>
                    Add some products before checking out.
                </p>
                <Link to="/" className="btn btn-primary btn-lg" style={{ padding: '0.875rem 2.5rem' }}>
                    Browse Products
                </Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', letterSpacing: '-0.03em' }}>
                {buyNowState ? 'Buy Now' : 'Checkout'}
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '2rem', alignItems: 'start' }}>
                {/* Shipping Form */}
                <div
                    style={{
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow)',
                        padding: '2rem',
                    }}
                >
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
                        Shipping Details
                    </h3>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="address">Shipping Address *</label>
                            <textarea
                                id="address"
                                className="form-input"
                                rows={3}
                                placeholder="Enter your full shipping address"
                                value={shippingAddress}
                                onChange={(e) => setShippingAddress(e.target.value)}
                                required
                                style={{ resize: 'vertical', minHeight: '80px' }}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Phone Number *</label>
                            <input
                                id="phone"
                                type="tel"
                                className="form-input"
                                placeholder="Enter your phone number (e.g., +91 9876543210)"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email ID *</label>
                            <input
                                id="email"
                                type="email"
                                className="form-input"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div
                            style={{
                                padding: '0.75rem 1rem',
                                backgroundColor: '#f0fdf4',
                                borderRadius: 'var(--radius)',
                                marginBottom: '1.25rem',
                                fontSize: '0.875rem',
                                color: '#166534',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}
                        >
                            <span>💳</span>
                            <span>Payment via <strong>UPI</strong> (Google Pay, PhonePe, Paytm)</span>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={submitting}
                            style={{ width: '100%', padding: '0.875rem 1.5rem' }}
                        >
                            {submitting ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <span className="spinner" style={{ width: '1.25rem', height: '1.25rem', borderWidth: '2px', borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                                    Placing Order...
                                </span>
                            ) : (
                                `Place Order — ${formatINR(displayTotal)}`
                            )}
                        </button>
                    </form>
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
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
                        Order Summary
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        {displayItems.map((item) => (
                            <div key={item.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <img
                                    src={item.image_url}
                                    alt={item.name}
                                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.name}
                                    </p>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                        Qty: {item.quantity} × {formatINR(item.price)}
                                    </p>
                                </div>
                                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary)' }}>
                                    {formatINR(parseFloat(item.price) * item.quantity)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.75rem 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9375rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                        <span style={{ fontWeight: 600 }}>{formatINR(displayTotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9375rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
                        <span style={{ fontWeight: 600, color: 'var(--success)' }}>Free</span>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.75rem 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem' }}>
                        <span style={{ fontWeight: 700 }}>Total</span>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.25rem' }}>{formatINR(displayTotal)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
