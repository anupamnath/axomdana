import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        ordersAPI
            .getAll()
            .then((res) => setOrders(res.data.orders))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '60vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: 1 }}>📦</div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
                    No orders yet
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.0625rem' }}>
                    You haven't placed any orders yet.
                </p>
                <Link to="/" className="btn btn-primary btn-lg" style={{ padding: '0.875rem 2.5rem' }}>
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', letterSpacing: '-0.03em' }}>
                My Orders
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders.map((order, index) => {
                    const statusStyle = statusColors[order.status] || statusColors.pending;
                    const statusIcon = statusIcons[order.status] || '📋';
                    const itemCount = order.items?.length || 0;

                    return (
                        <Link
                            key={order.id}
                            to={`/orders/${order.id}`}
                            className="animate-fade-in-up"
                            style={{
                                animationDelay: `${index * 0.05}s`,
                                textDecoration: 'none',
                                color: 'inherit',
                                backgroundColor: 'var(--bg-card)',
                                borderRadius: 'var(--radius-lg)',
                                boxShadow: 'var(--shadow)',
                                padding: '1.5rem',
                                transition: 'var(--transition)',
                                display: 'block',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'var(--shadow)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Order #</span>
                                    <span style={{ fontWeight: 700, marginLeft: '0.375rem', fontSize: '1.0625rem' }}>{order.id}</span>
                                </div>
                                <span
                                    style={{
                                        padding: '0.375rem 1rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        textTransform: 'capitalize',
                                        backgroundColor: statusStyle.bg,
                                        color: statusStyle.color,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.375rem',
                                    }}
                                >
                                    {statusIcon} {order.status}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {order.items?.slice(0, 4).map((item) => (
                                        <img
                                            key={item.id}
                                            src={item.image_url}
                                            alt={item.name}
                                            style={{
                                                width: '44px',
                                                height: '44px',
                                                objectFit: 'cover',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-light)',
                                            }}
                                        />
                                    ))}
                                    {itemCount > 4 && (
                                        <span style={{
                                            fontSize: '0.8125rem',
                                            color: 'var(--text-secondary)',
                                            fontWeight: 600,
                                            width: '44px',
                                            height: '44px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: 'var(--bg-secondary)',
                                            borderRadius: '8px',
                                        }}>
                                            +{itemCount - 4}
                                        </span>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.125rem' }}>
                                        {formatINR(order.total)}
                                    </span>
                                    <br />
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
