import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const statusColors = {
    pending: '#ff9f0a',
    confirmed: '#0071e3',
    processing: '#bf5af2',
    shipped: '#1a8a3f',
    delivered: '#30d158',
    cancelled: '#ff453a',
};

const statusIcons = {
    pending: '⏳',
    confirmed: '✅',
    processing: '⚙️',
    shipped: '🚚',
    delivered: '📦',
    cancelled: '❌',
};

const allStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(null);
    const [sendingEmail, setSendingEmail] = useState(null);
    const [emailMsg, setEmailMsg] = useState({ type: '', text: '' });
    const [remarksText, setRemarksText] = useState({});
    const [savingRemarks, setSavingRemarks] = useState({});

    const fetchOrders = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (statusFilter) params.status = statusFilter;
            const res = await adminAPI.getOrders(params);
            setOrders(res.data.orders);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const handleStatusChange = async (orderId, newStatus) => {
        setUpdatingStatus(orderId);
        try {
            await adminAPI.updateOrderStatus(orderId, newStatus);
            fetchOrders(pagination.page);
        } catch (err) {
            alert('Failed to update order status.');
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this order?')) return;
        try {
            await adminAPI.deleteOrder(id);
            fetchOrders(pagination.page);
        } catch (err) {
            alert('Failed to delete order.');
        }
    };

    const handleSendEmail = async (orderId, type) => {
        setSendingEmail(orderId);
        setEmailMsg({ type: '', text: '' });
        try {
            if (type === 'confirmation') {
                await adminAPI.sendOrderConfirmation(orderId);
            } else {
                await adminAPI.sendOrderStatusUpdate(orderId);
            }
            setEmailMsg({ type: 'success', text: 'Email sent successfully!' });
            setTimeout(() => setEmailMsg({ type: '', text: '' }), 3000);
        } catch (err) {
            setEmailMsg({ type: 'error', text: err.response?.data?.error || 'Failed to send email.' });
        } finally {
            setSendingEmail(null);
        }
    };

    const handleSaveRemarks = async (orderId) => {
        setSavingRemarks((prev) => ({ ...prev, [orderId]: true }));
        try {
            await adminAPI.updateOrderRemarks(orderId, remarksText[orderId] || '');
            setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? { ...o, remarks: remarksText[orderId] || '' } : o))
            );
        } catch (err) {
            alert('Failed to save remarks.');
        } finally {
            setSavingRemarks((prev) => ({ ...prev, [orderId]: false }));
        }
    };

    const openRemarksEditor = (order) => {
        setRemarksText((prev) => ({ ...prev, [order.id]: order.remarks || '' }));
    };

    return (
        <div style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Orders</h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
                    {pagination.total} order{pagination.total !== 1 ? 's' : ''} total
                </p>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setStatusFilter('')}
                    style={{
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.8125rem',
                        border: `1px solid ${!statusFilter ? '#1a8a3f' : 'var(--border)'}`,
                        borderRadius: '980px',
                        backgroundColor: !statusFilter ? '#1a8a3f' : 'white',
                        color: !statusFilter ? 'white' : 'var(--text)',
                        cursor: 'pointer',
                        fontWeight: 500,
                    }}
                >
                    All
                </button>
                {allStatuses.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        style={{
                            padding: '0.375rem 0.75rem',
                            fontSize: '0.8125rem',
                            border: `1px solid ${statusFilter === s ? statusColors[s] : 'var(--border)'}`,
                            borderRadius: '980px',
                            backgroundColor: statusFilter === s ? statusColors[s] : 'white',
                            color: statusFilter === s ? 'white' : 'var(--text)',
                            cursor: 'pointer',
                            fontWeight: 500,
                        }}
                    >
                        {statusIcons[s]} {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-container"><div className="spinner" /></div>
            ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                    No orders found.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {orders.map((order) => (
                        <div key={order.id} style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                            <div
                                style={{
                                    padding: '1rem 1.25rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    flexWrap: 'wrap',
                                    gap: '0.75rem',
                                }}
                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Order #{order.id}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                            {order.user_name} &middot; {order.user_email}
                                        </div>
                                    </div>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '0.125rem 0.5rem',
                                        borderRadius: '980px',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        backgroundColor: `${statusColors[order.status] || '#8e8e93'}20`,
                                        color: statusColors[order.status] || '#8e8e93',
                                    }}>
                                        {statusIcons[order.status]} {order.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                                            ₹{parseFloat(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{
                                        transform: expandedOrder === order.id ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.2s',
                                        color: 'var(--text-tertiary)',
                                    }}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </div>
                            </div>

                            {expandedOrder === order.id && (
                                <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.25rem' }}>
                                    {/* Shipping Address */}
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                                            Shipping Address
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{order.shipping_address}</div>
                                    </div>

                                    {/* Remarks / Shipping Notes */}
                                    <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            📝 Remarks / Shipping Notes
                                            <span style={{ fontSize: '0.6875rem', fontWeight: 400, color: 'var(--text-tertiary)', textTransform: 'none' }}>
                                                (visible to customer)
                                            </span>
                                        </div>
                                        <textarea
                                            placeholder="Add shipping notes, delivery instructions, or any remarks for this order..."
                                            value={remarksText[order.id] !== undefined ? remarksText[order.id] : (order.remarks || '')}
                                            onChange={(e) => {
                                                if (!(order.id in remarksText)) {
                                                    openRemarksEditor(order);
                                                }
                                                setRemarksText((prev) => ({ ...prev, [order.id]: e.target.value }));
                                            }}
                                            rows={3}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem 0.75rem',
                                                border: '1px solid var(--border)',
                                                borderRadius: '6px',
                                                fontSize: '0.8125rem',
                                                resize: 'vertical',
                                                fontFamily: 'inherit',
                                                boxSizing: 'border-box',
                                            }}
                                        />
                                        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleSaveRemarks(order.id)}
                                                disabled={savingRemarks[order.id]}
                                                style={{
                                                    padding: '0.375rem 1rem',
                                                    fontSize: '0.75rem',
                                                    border: '1px solid #1a8a3f',
                                                    borderRadius: '6px',
                                                    backgroundColor: '#1a8a3f',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: 500,
                                                    opacity: savingRemarks[order.id] ? 0.6 : 1,
                                                }}
                                            >
                                                {savingRemarks[order.id] ? 'Saving...' : 'Save Remarks'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                                            Items
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {(order.items || []).map((item) => (
                                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                                                    {item.image_url && (
                                                        <img src={item.image_url} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                                                    )}
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                            Qty: {item.quantity} × ₹{parseFloat(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                    <div style={{ fontWeight: 600 }}>
                                                        ₹{(item.quantity * parseFloat(item.price)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Status Update */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Update Status:</span>
                                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                            {allStatuses.map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => handleStatusChange(order.id, s)}
                                                    disabled={updatingStatus === order.id || s === order.status}
                                                    style={{
                                                        padding: '0.25rem 0.625rem',
                                                        fontSize: '0.75rem',
                                                        border: `1px solid ${s === order.status ? statusColors[s] : 'var(--border)'}`,
                                                        borderRadius: '980px',
                                                        backgroundColor: s === order.status ? `${statusColors[s]}20` : 'white',
                                                        color: s === order.status ? statusColors[s] : 'var(--text-secondary)',
                                                        cursor: s === order.status ? 'default' : 'pointer',
                                                        fontWeight: 500,
                                                        opacity: updatingStatus === order.id ? 0.6 : 1,
                                                    }}
                                                >
                                                    {statusIcons[s]} {s.charAt(0).toUpperCase() + s.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(order.id)}
                                            style={{
                                                marginLeft: 'auto',
                                                padding: '0.25rem 0.625rem',
                                                fontSize: '0.75rem',
                                                border: '1px solid #ff453a',
                                                borderRadius: '6px',
                                                backgroundColor: 'white',
                                                cursor: 'pointer',
                                                color: '#ff453a',
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>

                                    {/* Email Notifications */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.75rem', marginTop: '0.75rem', borderTop: '1px dashed var(--border)' }}>
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>📧 Notify Customer:</span>
                                        <button
                                            onClick={() => handleSendEmail(order.id, 'confirmation')}
                                            disabled={sendingEmail === order.id}
                                            style={{
                                                padding: '0.25rem 0.625rem',
                                                fontSize: '0.75rem',
                                                border: '1px solid #1a8a3f',
                                                borderRadius: '6px',
                                                backgroundColor: 'white',
                                                cursor: 'pointer',
                                                color: '#1a8a3f',
                                                fontWeight: 500,
                                                opacity: sendingEmail === order.id ? 0.6 : 1,
                                            }}
                                        >
                                            {sendingEmail === order.id ? 'Sending...' : 'Send Confirmation'}
                                        </button>
                                        <button
                                            onClick={() => handleSendEmail(order.id, 'status')}
                                            disabled={sendingEmail === order.id}
                                            style={{
                                                padding: '0.25rem 0.625rem',
                                                fontSize: '0.75rem',
                                                border: '1px solid #0071e3',
                                                borderRadius: '6px',
                                                backgroundColor: 'white',
                                                cursor: 'pointer',
                                                color: '#0071e3',
                                                fontWeight: 500,
                                                opacity: sendingEmail === order.id ? 0.6 : 1,
                                            }}
                                        >
                                            {sendingEmail === order.id ? 'Sending...' : 'Send Status Update'}
                                        </button>
                                        {emailMsg.text && (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: emailMsg.type === 'success' ? '#166534' : '#ff453a',
                                            }}>
                                                {emailMsg.text}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => fetchOrders(page)}
                            style={{
                                padding: '0.375rem 0.75rem',
                                border: `1px solid ${page === pagination.page ? '#1a8a3f' : 'var(--border)'}`,
                                borderRadius: '6px',
                                backgroundColor: page === pagination.page ? '#1a8a3f' : 'white',
                                color: page === pagination.page ? 'white' : 'var(--text)',
                                cursor: 'pointer',
                                fontSize: '0.8125rem',
                            }}
                        >
                            {page}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
