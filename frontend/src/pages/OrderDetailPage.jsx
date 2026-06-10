import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersAPI } from '../services/api';

const statusColors = {
    pending: { bg: '#fef3c7', color: '#92400e' },
    confirmed: { bg: '#dbeafe', color: '#1e40af' },
    shipped: { bg: '#e0e7ff', color: '#3730a3' },
    delivered: { bg: '#d1fae5', color: '#065f46' },
    cancelled: { bg: '#fee2e2', color: '#991b1b' },
};

const statusIcons = {
    pending: '⏳',
    confirmed: '✅',
    shipped: '🚚',
    delivered: '📦',
    cancelled: '❌',
};

const formatINR = (amount) => {
    return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function OrderDetailPage() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        ordersAPI
            .getById(id)
            .then((res) => setOrder(res.data.order))
            .catch(() => setOrder(null))
            .finally(() => setLoading(false));
    }, [id]);

    const handleDownloadInvoice = async () => {
        setDownloading(true);
        try {
            const res = await ordersAPI.getInvoice(order.id);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${order.invoice_number || order.id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download invoice:', err);
            alert('Failed to download invoice. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '60vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: 1 }}>🔍</div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
                    Order not found
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.0625rem' }}>
                    This order doesn't exist or you don't have access to it.
                </p>
                <Link to="/orders" className="btn btn-primary btn-lg" style={{ padding: '0.875rem 2.5rem' }}>
                    Back to Orders
                </Link>
            </div>
        );
    }

    const statusStyle = statusColors[order.status] || statusColors.pending;
    const statusIcon = statusIcons[order.status] || '📋';

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
            <Link
                to="/orders"
                style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1.5rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    fontWeight: 500,
                    transition: 'var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.target.style.color = 'var(--primary)')}
                onMouseLeave={(e) => (e.target.style.color = 'var(--text-secondary)')}
            >
                ← Back to Orders
            </Link>

            <div
                style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow)',
                    padding: '2.5rem',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.375rem' }}>
                            Order #{order.id}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                            Placed on{' '}
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                        {order.invoice_number && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                                Invoice: {order.invoice_number}
                            </p>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span
                            style={{
                                padding: '0.5rem 1.25rem',
                                borderRadius: '9999px',
                                fontSize: '0.9375rem',
                                fontWeight: 600,
                                textTransform: 'capitalize',
                                backgroundColor: statusStyle.bg,
                                color: statusStyle.color,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}
                        >
                            {statusIcon} {order.status}
                        </span>
                        <button
                            onClick={handleDownloadInvoice}
                            disabled={downloading}
                            style={{
                                padding: '0.5rem 1.25rem',
                                borderRadius: '9999px',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                border: '1.5px solid var(--primary)',
                                backgroundColor: 'white',
                                color: 'var(--primary)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'var(--transition-fast)',
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'var(--primary)';
                                e.target.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.color = 'var(--primary)';
                            }}
                        >
                            {downloading ? '⏳' : '📄'} {downloading ? 'Downloading...' : 'Download Invoice'}
                        </button>
                    </div>
                </div>

                {/* Items */}
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                    Items
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
                    {order.items?.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                display: 'flex',
                                gap: '1rem',
                                padding: '1rem',
                                backgroundColor: 'var(--bg)',
                                borderRadius: 'var(--radius)',
                                alignItems: 'center',
                            }}
                        >
                            <img
                                src={item.image_url}
                                alt={item.name}
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    objectFit: 'cover',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-light)',
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{item.name}</p>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                    Qty: {item.quantity} × {formatINR(item.price)}
                                </p>
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>
                                {formatINR(parseFloat(item.price) * item.quantity)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Shipping & Payment Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                            Shipping Address
                        </h3>
                        <div
                            style={{
                                backgroundColor: 'var(--bg)',
                                borderRadius: 'var(--radius)',
                                padding: '1.25rem',
                                color: 'var(--text-secondary)',
                                fontSize: '0.9375rem',
                                lineHeight: 1.6,
                                whiteSpace: 'pre-line',
                            }}
                        >
                            {order.shipping_address}
                        </div>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                            Contact Info
                        </h3>
                        <div
                            style={{
                                backgroundColor: 'var(--bg)',
                                borderRadius: 'var(--radius)',
                                padding: '1.25rem',
                                fontSize: '0.9375rem',
                                lineHeight: 1.8,
                            }}
                        >
                            <div>
                                <span style={{ color: 'var(--text-tertiary)' }}>Phone: </span>
                                <span style={{ fontWeight: 500 }}>{order.phone || 'N/A'}</span>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-tertiary)' }}>Email: </span>
                                <span style={{ fontWeight: 500 }}>{order.email || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Remarks / Shipping Notes */}
                {order.remarks && (
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                            📝 Shipping Notes
                        </h3>
                        <div
                            style={{
                                backgroundColor: '#fffbeb',
                                borderRadius: 'var(--radius)',
                                padding: '1.25rem',
                                color: '#92400e',
                                fontSize: '0.9375rem',
                                lineHeight: 1.6,
                                whiteSpace: 'pre-line',
                                border: '1px solid #fde68a',
                            }}
                        >
                            {order.remarks}
                        </div>
                    </div>
                )}

                {/* Payment Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                            Payment Info
                        </h3>
                        <div
                            style={{
                                backgroundColor: 'var(--bg)',
                                borderRadius: 'var(--radius)',
                                padding: '1.25rem',
                                fontSize: '0.9375rem',
                                lineHeight: 1.8,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Method</span>
                                <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{order.payment_method || 'UPI'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Payment Status</span>
                                <span
                                    style={{
                                        fontWeight: 600,
                                        color: order.payment_status === 'paid' ? '#30d158' : order.payment_status === 'failed' ? '#ff453a' : '#ff9f0a',
                                    }}
                                >
                                    {(order.payment_status || 'pending').charAt(0).toUpperCase() + (order.payment_status || 'pending').slice(1)}
                                </span>
                            </div>
                            {order.upi_transaction_id && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>UPI TXN ID</span>
                                    <span style={{ fontWeight: 500, fontSize: '0.8125rem', maxWidth: '180px', textAlign: 'right', wordBreak: 'break-all' }}>
                                        {order.upi_transaction_id}
                                    </span>
                                </div>
                            )}
                            {order.invoice_number && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Invoice</span>
                                    <span style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{order.invoice_number}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                            Payment Summary
                        </h3>
                        <div
                            style={{
                                backgroundColor: 'var(--bg)',
                                borderRadius: 'var(--radius)',
                                padding: '1.25rem',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', marginBottom: '0.75rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                                <span style={{ fontWeight: 600 }}>{formatINR(order.total)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', marginBottom: '0.75rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
                                <span style={{ fontWeight: 600, color: 'var(--success)' }}>Free</span>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.75rem 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem' }}>
                                <span style={{ fontWeight: 700 }}>Total</span>
                                <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.25rem' }}>
                                    {formatINR(order.total)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
