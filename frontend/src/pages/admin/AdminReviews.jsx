import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import StarRating from '../../components/StarRating';

const REVIEW_TABS = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All' },
];

export default function AdminReviews() {
    const [tab, setTab] = useState('reviews'); // 'reviews' | 'deliveries'
    const [status, setStatus] = useState('pending');
    const [reviews, setReviews] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Delivery images state
    const [deliveries, setDeliveries] = useState([]);
    const [dPage, setDPage] = useState(1);
    const [dPagination, setDPagination] = useState(null);
    const [dLoading, setDLoading] = useState(false);

    // Reject modal
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        setPage(1);
    }, [status]);

    useEffect(() => {
        if (tab === 'reviews') fetchReviews();
        if (tab === 'deliveries') fetchDeliveries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, status, page]);

    const fetchReviews = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminAPI.getReviews({
                status,
                page,
                limit: 10,
            });
            setReviews(res.data.reviews || []);
            setPagination(res.data.pagination || null);
        } catch (err) {
            console.error('Failed to load reviews:', err);
            setError('Failed to load reviews.');
        } finally {
            setLoading(false);
        }
    };

    const fetchDeliveries = async () => {
        setDLoading(true);
        try {
            const res = await adminAPI.getDeliveryImages({
                page: dPage,
                limit: 12,
            });
            setDeliveries(res.data.images || []);
            setDPagination(res.data.pagination || null);
        } catch (err) {
            console.error('Failed to load delivery images:', err);
        } finally {
            setDLoading(false);
        }
    };

    const approveReview = async (id) => {
        try {
            await adminAPI.approveReview(id);
            fetchReviews();
        } catch (err) {
            console.error('Approve failed:', err);
            alert('Failed to approve review.');
        }
    };

    const confirmReject = async () => {
        if (!rejectingId) return;
        try {
            await adminAPI.rejectReview(
                rejectingId,
                rejectReason.trim() || null
            );
            setRejectingId(null);
            setRejectReason('');
            fetchReviews();
        } catch (err) {
            console.error('Reject failed:', err);
            alert('Failed to reject review.');
        }
    };

    const deleteReview = async (id) => {
        if (!window.confirm('Delete this review permanently?')) return;
        try {
            await adminAPI.deleteReview(id);
            fetchReviews();
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete review.');
        }
    };

    const toggleFeaturedDelivery = async (id) => {
        try {
            await adminAPI.toggleFeaturedDeliveryImage(id);
            fetchDeliveries();
        } catch (err) {
            console.error('Toggle failed:', err);
            alert('Failed to toggle featured.');
        }
    };

    const deleteDelivery = async (id) => {
        if (!window.confirm('Delete this delivery image permanently?'))
            return;
        try {
            await adminAPI.deleteDeliveryImage(id);
            fetchDeliveries();
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete delivery image.');
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    gap: '1rem',
                }}
            >
                <div>
                    <h1
                        style={{
                            fontSize: '1.75rem',
                            fontWeight: 700,
                            letterSpacing: '-0.03em',
                            marginBottom: '0.25rem',
                        }}
                    >
                        Reviews & Social Proof
                    </h1>
                    <p
                        style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        Moderate customer reviews and feature customer delivery
                        photos on the storefront.
                    </p>
                </div>
            </div>

            {/* Top tabs: Reviews vs Deliveries */}
            <div
                style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                    borderBottom: '1px solid var(--border-light)',
                }}
            >
                {[
                    { key: 'reviews', label: 'Product Reviews' },
                    { key: 'deliveries', label: 'Delivery Photos' },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        style={{
                            padding: '0.75rem 1.25rem',
                            border: 'none',
                            background: 'transparent',
                            borderBottom:
                                tab === t.key
                                    ? '2px solid var(--primary)'
                                    : '2px solid transparent',
                            color:
                                tab === t.key
                                    ? 'var(--primary)'
                                    : 'var(--text-secondary)',
                            fontWeight: tab === t.key ? 600 : 500,
                            fontSize: '0.9375rem',
                            cursor: 'pointer',
                            marginBottom: '-1px',
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ════════════════════════════════════════ */}
            {/* REVIEWS TAB                              */}
            {/* ════════════════════════════════════════ */}
            {tab === 'reviews' && (
                <>
                    {/* Status sub-tabs */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.375rem',
                            marginBottom: '1.5rem',
                            flexWrap: 'wrap',
                        }}
                    >
                        {REVIEW_TABS.map((s) => (
                            <button
                                key={s.key}
                                onClick={() => setStatus(s.key)}
                                style={{
                                    padding: '0.5rem 0.875rem',
                                    borderRadius: '9999px',
                                    border: '1.5px solid',
                                    borderColor:
                                        status === s.key
                                            ? 'var(--primary)'
                                            : 'var(--border-light)',
                                    backgroundColor:
                                        status === s.key
                                            ? 'var(--primary-bg)'
                                            : 'transparent',
                                    color:
                                        status === s.key
                                            ? 'var(--primary)'
                                            : 'var(--text-secondary)',
                                    fontWeight: status === s.key ? 700 : 500,
                                    fontSize: '0.8125rem',
                                    cursor: 'pointer',
                                }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div
                            className="loading-container"
                            style={{ minHeight: '240px' }}
                        >
                            <div className="spinner" />
                        </div>
                    ) : error ? (
                        <div
                            style={{
                                padding: '1.25rem',
                                backgroundColor: '#fef2f2',
                                color: '#991b1b',
                                borderRadius: 'var(--radius)',
                                fontSize: '0.875rem',
                            }}
                        >
                            {error}
                        </div>
                    ) : reviews.length === 0 ? (
                        <div
                            style={{
                                padding: '4rem 1rem',
                                textAlign: 'center',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-lg)',
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            No reviews in this status.
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                            }}
                        >
                            {reviews.map((r) => (
                                <div
                                    key={r.id}
                                    style={{
                                        padding: '1.25rem',
                                        backgroundColor: 'white',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--border-light)',
                                        boxShadow: 'var(--shadow-sm)',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '1rem',
                                            marginBottom: '0.75rem',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        {r.product_image_url && (
                                            <img
                                                src={r.product_image_url}
                                                alt=""
                                                style={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius:
                                                        'var(--radius-sm)',
                                                    objectFit: 'cover',
                                                    flexShrink: 0,
                                                }}
                                            />
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-tertiary)',
                                                }}
                                            >
                                                Product
                                            </div>
                                            <div
                                                style={{
                                                    fontWeight: 600,
                                                    fontSize: '0.9375rem',
                                                }}
                                            >
                                                {r.product_name || `#${r.product_id}`}
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                textAlign: 'right',
                                                fontSize: '0.75rem',
                                                color: 'var(--text-tertiary)',
                                            }}
                                        >
                                            {new Date(
                                                r.created_at
                                            ).toLocaleString('en-IN', {
                                                dateStyle: 'medium',
                                                timeStyle: 'short',
                                            })}
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.625rem',
                                            marginBottom: '0.5rem',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <StarRating
                                            value={r.rating}
                                            size={16}
                                        />
                                        {r.delivery_rating && (
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                }}
                                            >
                                                🚚{' '}
                                                <StarRating
                                                    value={r.delivery_rating}
                                                    size={11}
                                                />
                                            </span>
                                        )}
                                        {r.quality_rating && (
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                }}
                                            >
                                                🧪{' '}
                                                <StarRating
                                                    value={r.quality_rating}
                                                    size={11}
                                                />
                                            </span>
                                        )}
                                        <span
                                            style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--text-tertiary)',
                                            }}
                                        >
                                            by {r.user_name || 'Customer'}
                                            {r.user_email &&
                                                ` (${r.user_email})`}
                                        </span>
                                        {r.is_approved && (
                                            <span
                                                style={{
                                                    fontSize: '0.6875rem',
                                                    padding:
                                                        '0.125rem 0.5rem',
                                                    backgroundColor:
                                                        '#ecfdf5',
                                                    color: '#166534',
                                                    borderRadius: '9999px',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                APPROVED
                                            </span>
                                        )}
                                        {r.is_rejected && (
                                            <span
                                                style={{
                                                    fontSize: '0.6875rem',
                                                    padding:
                                                        '0.125rem 0.5rem',
                                                    backgroundColor:
                                                        '#fef2f2',
                                                    color: '#991b1b',
                                                    borderRadius: '9999px',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                REJECTED
                                            </span>
                                        )}
                                    </div>

                                    {r.title && (
                                        <h4
                                            style={{
                                                fontSize: '0.9375rem',
                                                fontWeight: 600,
                                                marginBottom: '0.25rem',
                                            }}
                                        >
                                            {r.title}
                                        </h4>
                                    )}
                                    <p
                                        style={{
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.875rem',
                                            lineHeight: 1.6,
                                            margin: 0,
                                            whiteSpace: 'pre-wrap',
                                        }}
                                    >
                                        {r.body}
                                    </p>

                                    {r.images && r.images.length > 0 && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '0.5rem',
                                                marginTop: '0.75rem',
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            {r.images.map((img, i) => (
                                                <a
                                                    key={i}
                                                    href={img}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        width: 80,
                                                        height: 80,
                                                        borderRadius:
                                                            'var(--radius-sm)',
                                                        overflow: 'hidden',
                                                        border: '1px solid var(--border-light)',
                                                        display: 'block',
                                                    }}
                                                >
                                                    <img
                                                        src={img}
                                                        alt=""
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                        }}
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    )}

                                    {r.rejection_reason && (
                                        <div
                                            style={{
                                                marginTop: '0.75rem',
                                                padding: '0.625rem 0.75rem',
                                                backgroundColor: '#fef2f2',
                                                color: '#991b1b',
                                                borderRadius:
                                                    'var(--radius-sm)',
                                                fontSize: '0.8125rem',
                                            }}
                                        >
                                            Rejected: {r.rejection_reason}
                                        </div>
                                    )}

                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '0.5rem',
                                            marginTop: '1rem',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        {!r.is_approved && (
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() =>
                                                    approveReview(r.id)
                                                }
                                                style={{
                                                    borderRadius: '9999px',
                                                }}
                                            >
                                                ✓ Approve
                                            </button>
                                        )}
                                        {!r.is_rejected && (
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => {
                                                    setRejectingId(r.id);
                                                    setRejectReason('');
                                                }}
                                                style={{
                                                    borderRadius: '9999px',
                                                }}
                                            >
                                                ✕ Reject
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => deleteReview(r.id)}
                                            style={{
                                                borderRadius: '9999px',
                                                color: 'var(--danger)',
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {pagination && pagination.totalPages > 1 && (
                        <Pagination
                            page={page}
                            totalPages={pagination.totalPages}
                            onChange={(p) => setPage(p)}
                        />
                    )}
                </>
            )}

            {/* ════════════════════════════════════════ */}
            {/* DELIVERY IMAGES TAB                      */}
            {/* ════════════════════════════════════════ */}
            {tab === 'deliveries' && (
                <>
                    <p
                        style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '1.25rem',
                        }}
                    >
                        Toggle "Featured" to mark which photos appear in the
                        storefront gallery on the home page.
                    </p>

                    {dLoading ? (
                        <div
                            className="loading-container"
                            style={{ minHeight: '240px' }}
                        >
                            <div className="spinner" />
                        </div>
                    ) : deliveries.length === 0 ? (
                        <div
                            style={{
                                padding: '4rem 1rem',
                                textAlign: 'center',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-lg)',
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            No delivery images yet.
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fill, minmax(220px, 1fr))',
                                gap: '1rem',
                            }}
                        >
                            {deliveries.map((img) => (
                                <div
                                    key={img.id}
                                    style={{
                                        backgroundColor: 'white',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--border-light)',
                                        overflow: 'hidden',
                                        boxShadow: 'var(--shadow-sm)',
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'relative',
                                            aspectRatio: '1 / 1',
                                            backgroundColor: '#f5f5f7',
                                        }}
                                    >
                                        <img
                                            src={img.image_url}
                                            alt={img.caption || 'Delivery'}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                        {img.is_featured && (
                                            <span
                                                style={{
                                                    position: 'absolute',
                                                    top: '0.5rem',
                                                    left: '0.5rem',
                                                    padding:
                                                        '0.25rem 0.625rem',
                                                    backgroundColor:
                                                        'rgba(26, 138, 63, 0.95)',
                                                    color: 'white',
                                                    borderRadius: '9999px',
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 700,
                                                    letterSpacing: '0.02em',
                                                }}
                                            >
                                                ★ FEATURED
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            padding: '0.75rem',
                                            fontSize: '0.8125rem',
                                        }}
                                    >
                                        {img.customer_name && (
                                            <div
                                                style={{
                                                    fontWeight: 600,
                                                    marginBottom: '0.125rem',
                                                }}
                                            >
                                                {img.customer_name}
                                            </div>
                                        )}
                                        {img.location && (
                                            <div
                                                style={{
                                                    color: 'var(--text-tertiary)',
                                                    marginBottom: '0.25rem',
                                                }}
                                            >
                                                📍 {img.location}
                                            </div>
                                        )}
                                        {img.product_name && (
                                            <div
                                                style={{
                                                    color: 'var(--text-tertiary)',
                                                    fontSize: '0.75rem',
                                                    marginBottom: '0.5rem',
                                                }}
                                            >
                                                for {img.product_name}
                                            </div>
                                        )}
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '0.375rem',
                                                marginTop: '0.5rem',
                                            }}
                                        >
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() =>
                                                    toggleFeaturedDelivery(
                                                        img.id
                                                    )
                                                }
                                                style={{
                                                    flex: 1,
                                                    fontSize: '0.75rem',
                                                    padding: '0.375rem',
                                                }}
                                            >
                                                {img.is_featured
                                                    ? '★ Unfeature'
                                                    : '☆ Feature'}
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() =>
                                                    deleteDelivery(img.id)
                                                }
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.375rem 0.625rem',
                                                    color: 'var(--danger)',
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {dPagination && dPagination.totalPages > 1 && (
                        <Pagination
                            page={dPage}
                            totalPages={dPagination.totalPages}
                            onChange={(p) => setDPage(p)}
                        />
                    )}
                </>
            )}

            {/* Reject modal */}
            {rejectingId && (
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget)
                            setRejectingId(null);
                    }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        zIndex: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                    }}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            padding: '1.5rem',
                            borderRadius: 'var(--radius-lg)',
                            maxWidth: '420px',
                            width: '100%',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                        }}
                    >
                        <h3
                            style={{
                                fontSize: '1.125rem',
                                fontWeight: 600,
                                marginBottom: '0.5rem',
                            }}
                        >
                            Reject this review?
                        </h3>
                        <p
                            style={{
                                fontSize: '0.875rem',
                                color: 'var(--text-secondary)',
                                marginBottom: '1rem',
                            }}
                        >
                            Optionally provide a reason that will be visible to
                            the customer.
                        </p>
                        <textarea
                            rows={3}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            maxLength={255}
                            placeholder="Reason (optional)"
                            className="form-input"
                            style={{
                                resize: 'vertical',
                                marginBottom: '1rem',
                            }}
                        />
                        <div
                            style={{
                                display: 'flex',
                                gap: '0.5rem',
                                justifyContent: 'flex-end',
                            }}
                        >
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setRejectingId(null)}
                                style={{ borderRadius: '9999px' }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={confirmReject}
                                style={{
                                    borderRadius: '9999px',
                                    backgroundColor: '#dc2626',
                                    borderColor: '#dc2626',
                                }}
                            >
                                Reject Review
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Pagination({ page, totalPages, onChange }) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.375rem',
                marginTop: '1.5rem',
            }}
        >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                    key={p}
                    onClick={() => onChange(p)}
                    style={{
                        minWidth: '2.25rem',
                        height: '2.25rem',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor:
                            p === page ? 'var(--primary)' : 'transparent',
                        color: p === page ? 'white' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                    }}
                >
                    {p}
                </button>
            ))}
        </div>
    );
}
