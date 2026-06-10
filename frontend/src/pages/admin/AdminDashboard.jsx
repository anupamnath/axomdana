import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await adminAPI.getDashboard();
                setStats(res.data.stats);
                setRecentOrders(res.data.recentOrders || []);
            } catch (err) {
                setError('Failed to load dashboard data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner" />
            </div>
        );
    }

    const statCards = [
        { label: 'Total Products', value: stats?.totalProducts || 0, link: '/admin/products', color: '#1a8a3f' },
        { label: 'Total Users', value: stats?.totalUsers || 0, link: '/admin/users', color: '#0071e3' },
        { label: 'Total Orders', value: stats?.totalOrders || 0, link: '/admin/orders', color: '#ff9f0a' },
        { label: 'Total Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, link: '/admin/orders', color: '#bf5af2' },
    ];

    const statusColors = {
        pending: '#ff9f0a',
        confirmed: '#0071e3',
        processing: '#bf5af2',
        shipped: '#1a8a3f',
        delivered: '#30d158',
        cancelled: '#ff453a',
    };

    return (
        <div style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Admin Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Overview of your e-commerce store</p>
            </div>

            {error && (
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '8px', color: '#ff453a', marginBottom: '1.5rem' }}>
                    {error}
                </div>
            )}

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {statCards.map((card) => (
                    <Link
                        key={card.label}
                        to={card.link}
                        style={{
                            textDecoration: 'none',
                            backgroundColor: 'white',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            transition: 'box-shadow 0.2s, transform 0.2s',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'none';
                        }}
                    >
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                            {card.label}
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: card.color }}>
                            {card.value}
                        </div>
                    </Link>
                ))}
            </div>

            {/* Recent Orders */}
            <div style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Recent Orders</h2>
                    <Link to="/admin/orders" style={{ fontSize: '0.8125rem', color: '#0071e3', textDecoration: 'none' }}>
                        View All
                    </Link>
                </div>
                {recentOrders.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        No orders yet.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Order #</th>
                                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Customer</th>
                                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Total</th>
                                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map((order) => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.75rem 1.25rem' }}>
                                            <Link to={`/admin/orders`} style={{ color: '#0071e3', textDecoration: 'none', fontWeight: 500 }}>
                                                #{order.id}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text)' }}>{order.user_name}</td>
                                        <td style={{ padding: '0.75rem 1.25rem' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '0.125rem 0.5rem',
                                                borderRadius: '980px',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                backgroundColor: `${statusColors[order.status] || '#8e8e93'}20`,
                                                color: statusColors[order.status] || '#8e8e93',
                                            }}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontWeight: 600 }}>
                                            ₹{parseFloat(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                            {new Date(order.created_at).toLocaleDateString('en-IN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
