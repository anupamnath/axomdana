import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    productsAPI,
    reviewsAPI,
    deliveryImagesAPI,
    uploadAPI,
} from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';

// Helper: get effective selling price (wholesale_price if set, else price)
const getItemPrice = (product) => {
    const wp =
        product.wholesale_price !== null && product.wholesale_price !== undefined
            ? product.wholesale_price
            : product.price;
    return parseFloat(wp);
};

// Helper: get MRP (with fallback to selling price if not set)
const getMrp = (product) => {
    if (product.mrp !== null && product.mrp !== undefined)
        return parseFloat(product.mrp);
    return getItemPrice(product);
};

export default function ProductPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewSummary, setReviewSummary] = useState(null);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [reviewsPagination, setReviewsPagination] = useState(null);

    // Review form state
    const [eligibility, setEligibility] = useState(null);
    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        delivery_rating: 5,
        quality_rating: 5,
        title: '',
        body: '',
        images: [],
    });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewSubmitMsg, setReviewSubmitMsg] = useState(null);
    const [uploadingImages, setUploadingImages] = useState(false);
    const reviewFileInputRef = useRef(null);

    // Delivery images state
    const [deliveryImages, setDeliveryImages] = useState([]);
    const [deliveryUploading, setDeliveryUploading] = useState(false);
    const [deliveryMsg, setDeliveryMsg] = useState(null);
    const deliveryFileInputRef = useRef(null);

    // Delivery submission form
    const [deliveryForm, setDeliveryForm] = useState({
        caption: '',
        customer_name: '',
        location: '',
    });

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

    // Load reviews + summary
    useEffect(() => {
        if (!product) return;
        const load = async () => {
            setReviewsLoading(true);
            try {
                const res = await reviewsAPI.getByProduct(product.id, {
                    page: reviewsPage,
                    limit: 5,
                });
                setReviews(res.data.reviews || []);
                setReviewSummary(res.data.summary || null);
                setReviewsPagination(res.data.pagination || null);
            } catch (err) {
                console.error('Failed to load reviews:', err);
            } finally {
                setReviewsLoading(false);
            }
        };
        load();
    }, [product, reviewsPage]);

    // Check eligibility for verified buyer review
    useEffect(() => {
        if (!product || !user) {
            setEligibility(null);
            return;
        }
        const checkEligibility = async () => {
            try {
                const res = await reviewsAPI.getEligibility(product.id);
                setEligibility(res.data);
            } catch (err) {
                console.error('Failed to check eligibility:', err);
                setEligibility(null);
            }
        };
        checkEligibility();
    }, [product, user]);

    // Load delivery images for this product
    useEffect(() => {
        if (!product) return;
        const load = async () => {
            try {
                const res = await deliveryImagesAPI.list({
                    product_id: product.id,
                    limit: 12,
                });
                setDeliveryImages(res.data.images || []);
            } catch (err) {
                console.error('Failed to load delivery images:', err);
            }
        };
        load();
    }, [product]);

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
                price: getItemPrice(product),
                name: product.name,
                image_url: product.image_url,
            },
        });
    };

    const handleReviewImageUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        const remaining = 6 - reviewForm.images.length;
        if (remaining <= 0) {
            setReviewSubmitMsg({
                type: 'error',
                text: 'Maximum 6 images per review.',
            });
            return;
        }
        const toUpload = files.slice(0, remaining);
        setUploadingImages(true);
        setReviewSubmitMsg(null);
        try {
            const urls = [...reviewForm.images];
            for (const file of toUpload) {
                const fd = new FormData();
                fd.append('image', file);
                const res = await uploadAPI.uploadImage(fd);
                urls.push(res.data.url);
            }
            setReviewForm((f) => ({ ...f, images: urls }));
        } catch (err) {
            console.error('Upload failed:', err);
            setReviewSubmitMsg({
                type: 'error',
                text: 'Image upload failed. Please try again.',
            });
        } finally {
            setUploadingImages(false);
            if (reviewFileInputRef.current)
                reviewFileInputRef.current.value = '';
        }
    };

    const removeReviewImage = (idx) => {
        setReviewForm((f) => ({
            ...f,
            images: f.images.filter((_, i) => i !== idx),
        }));
    };

    const submitReview = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }
        if (reviewForm.body.trim().length < 10) {
            setReviewSubmitMsg({
                type: 'error',
                text: 'Please write at least 10 characters.',
            });
            return;
        }
        setReviewSubmitting(true);
        setReviewSubmitMsg(null);
        try {
            await reviewsAPI.submit({
                product_id: product.id,
                rating: reviewForm.rating,
                delivery_rating: reviewForm.delivery_rating,
                quality_rating: reviewForm.quality_rating,
                title: reviewForm.title.trim() || null,
                body: reviewForm.body.trim(),
                images: reviewForm.images,
            });
            setReviewSubmitMsg({
                type: 'success',
                text: 'Thanks! Your review was submitted and is awaiting admin approval.',
            });
            setReviewForm({
                rating: 5,
                delivery_rating: 5,
                quality_rating: 5,
                title: '',
                body: '',
                images: [],
            });
            // Re-check eligibility (should become ineligible after review)
            try {
                const res = await reviewsAPI.getEligibility(product.id);
                setEligibility(res.data);
            } catch (e) {
                /* ignore */
            }
            // If first page, refresh reviews (won't show pending but keeps state fresh)
            if (reviewsPage === 1) {
                const r = await reviewsAPI.getByProduct(product.id, {
                    page: 1,
                    limit: 5,
                });
                setReviews(r.data.reviews || []);
                setReviewSummary(r.data.summary || null);
                setReviewsPagination(r.data.pagination || null);
            }
        } catch (err) {
            console.error('Review submit failed:', err);
            setReviewSubmitMsg({
                type: 'error',
                text:
                    err.response?.data?.error ||
                    'Failed to submit review. Please try again.',
            });
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleDeliveryImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!user) {
            navigate('/login');
            return;
        }
        setDeliveryUploading(true);
        setDeliveryMsg(null);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const upRes = await uploadAPI.uploadImage(fd);
            await deliveryImagesAPI.submit({
                image_url: upRes.data.url,
                product_id: product.id,
                caption: deliveryForm.caption.trim() || null,
                customer_name:
                    deliveryForm.customer_name.trim() ||
                    user.name ||
                    null,
                location: deliveryForm.location.trim() || null,
            });
            setDeliveryMsg({
                type: 'success',
                text: 'Thanks for sharing! Your delivery photo is now live.',
            });
            setDeliveryForm({ caption: '', customer_name: '', location: '' });
            // Refresh
            const res = await deliveryImagesAPI.list({
                product_id: product.id,
                limit: 12,
            });
            setDeliveryImages(res.data.images || []);
        } catch (err) {
            console.error('Delivery image upload failed:', err);
            setDeliveryMsg({
                type: 'error',
                text:
                    err.response?.data?.error ||
                    'Upload failed. Please try again.',
            });
        } finally {
            setDeliveryUploading(false);
            if (deliveryFileInputRef.current)
                deliveryFileInputRef.current.value = '';
        }
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
            <div
                className="container"
                style={{ textAlign: 'center', padding: '6rem 1rem' }}
            >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                <h2 style={{ marginBottom: '0.5rem' }}>Product not found</h2>
                <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    Browse Products
                </Link>
            </div>
        );
    }

    const avgRating = reviewSummary?.average_rating || 0;
    const totalReviews = reviewSummary?.total_reviews || 0;

    return (
        <div
            className="container"
            style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}
        >
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
                    textDecoration: 'none',
                }}
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
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
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
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
                    {product.is_featured && (
                        <span
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                padding: '0.375rem 0.75rem',
                                backgroundColor: 'rgba(255, 69, 58, 0.95)',
                                borderRadius: '9999px',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                color: 'white',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                            }}
                        >
                            ★ Featured
                        </span>
                    )}
                </div>

                {/* Details */}
                <div style={{ paddingTop: '1rem' }}>
                    <h1
                        style={{
                            fontSize: '2.25rem',
                            fontWeight: 700,
                            letterSpacing: '-0.03em',
                            lineHeight: 1.15,
                            marginBottom: '0.5rem',
                        }}
                    >
                        {product.name}
                    </h1>

                    {/* Aggregate rating row */}
                    {totalReviews > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.625rem',
                                marginBottom: '1.25rem',
                                color: 'var(--text-secondary)',
                                fontSize: '0.875rem',
                            }}
                        >
                            <StarRating value={avgRating} size={16} showValue />
                            <span>
                                · {totalReviews} review
                                {totalReviews !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}

                    {/* Price */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        {getMrp(product) > getItemPrice(product) && (
                            <p
                                style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 500,
                                    color: 'var(--text-tertiary)',
                                    textDecoration: 'line-through',
                                    letterSpacing: '-0.02em',
                                    marginBottom: '0.25rem',
                                }}
                            >
                                MRP ₹{getMrp(product).toLocaleString('en-IN')}
                            </p>
                        )}
                        <p
                            style={{
                                fontSize: '2.5rem',
                                fontWeight: 800,
                                color: 'var(--primary)',
                                letterSpacing: '-0.03em',
                                margin: 0,
                            }}
                        >
                            ₹{getItemPrice(product).toLocaleString('en-IN')}
                            <span
                                style={{
                                    fontSize: '1rem',
                                    fontWeight: 400,
                                    color: 'var(--text-tertiary)',
                                    marginLeft: '0.5rem',
                                }}
                            >
                                /bag
                            </span>
                        </p>
                        {getMrp(product) > getItemPrice(product) && (
                            <p
                                style={{
                                    fontSize: '0.875rem',
                                    color: '#166534',
                                    fontWeight: 600,
                                    marginTop: '0.5rem',
                                    margin: '0.5rem 0 0',
                                }}
                            >
                                You save ₹
                                {(
                                    getMrp(product) - getItemPrice(product)
                                ).toLocaleString('en-IN')}{' '}
                                per bag
                            </p>
                        )}
                    </div>

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
                            backgroundColor:
                                product.stock > 0
                                    ? 'var(--primary-bg)'
                                    : '#fff5f5',
                            borderRadius: 'var(--radius)',
                            marginBottom: '2rem',
                        }}
                    >
                        <span style={{ fontSize: '1.25rem' }}>
                            {product.stock > 0 ? '✅' : '❌'}
                        </span>
                        <span
                            style={{
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                color:
                                    product.stock > 0
                                        ? 'var(--primary)'
                                        : 'var(--danger)',
                            }}
                        >
                            {product.stock > 0
                                ? `In Stock — ${product.stock} bags available`
                                : 'Currently Out of Stock'}
                        </span>
                    </div>

                    {user ? (
                        <>
                            {/* Quantity Selector */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label
                                    style={{
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        display: 'block',
                                        marginBottom: '0.5rem',
                                    }}
                                >
                                    Quantity
                                </label>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        marginBottom: '0.75rem',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    {[1, 3, 5, 10, 15, 25, 50].map((tier) => (
                                        <button
                                            key={tier}
                                            onClick={() => setQuantity(tier)}
                                            style={{
                                                padding: '0.5rem 1.25rem',
                                                border: `2px solid ${quantity === tier
                                                        ? 'var(--primary)'
                                                        : 'var(--border-light)'
                                                    }`,
                                                borderRadius: '9999px',
                                                background:
                                                    quantity === tier
                                                        ? 'var(--primary-bg)'
                                                        : 'transparent',
                                                color:
                                                    quantity === tier
                                                        ? 'var(--primary)'
                                                        : 'var(--text-secondary)',
                                                fontWeight:
                                                    quantity === tier ? 700 : 500,
                                                fontSize: '0.875rem',
                                                cursor: 'pointer',
                                                transition:
                                                    'var(--transition-fast)',
                                            }}
                                        >
                                            {tier} bags
                                        </button>
                                    ))}
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                    }}
                                >
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
                                                color:
                                                    quantity <= 1
                                                        ? 'var(--text-tertiary)'
                                                        : 'var(--text)',
                                                transition:
                                                    'var(--transition-fast)',
                                            }}
                                            disabled={quantity <= 1}
                                            onClick={() =>
                                                setQuantity((q) =>
                                                    Math.max(1, q - 1)
                                                )
                                            }
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            min={1}
                                            max={product.stock}
                                            onChange={(e) => {
                                                const val =
                                                    parseInt(e.target.value) ||
                                                    1;
                                                setQuantity(
                                                    Math.max(
                                                        1,
                                                        Math.min(
                                                            product.stock,
                                                            val
                                                        )
                                                    )
                                                );
                                            }}
                                            style={{
                                                padding: '0.625rem 0.5rem',
                                                minWidth: '4rem',
                                                width: '4.5rem',
                                                textAlign: 'center',
                                                fontWeight: 600,
                                                fontSize: '1rem',
                                                border: 'none',
                                                borderLeft:
                                                    '1.5px solid var(--border-light)',
                                                borderRight:
                                                    '1.5px solid var(--border-light)',
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
                                                color:
                                                    quantity >= product.stock
                                                        ? 'var(--text-tertiary)'
                                                        : 'var(--text)',
                                                transition:
                                                    'var(--transition-fast)',
                                            }}
                                            disabled={
                                                quantity >= product.stock
                                            }
                                            onClick={() =>
                                                setQuantity((q) =>
                                                    Math.min(product.stock, q + 1)
                                                )
                                            }
                                        >
                                            +
                                        </button>
                                    </div>
                                    <span
                                        style={{
                                            fontSize: '0.8125rem',
                                            color: 'var(--text-tertiary)',
                                        }}
                                    >
                                        {quantity} bag
                                        {quantity > 1 ? 's' : ''} × ₹
                                        {getItemPrice(product).toLocaleString(
                                            'en-IN'
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    flexWrap: 'wrap',
                                }}
                            >
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
                                    {added
                                        ? `✓ Added to Cart — ₹${(
                                            getItemPrice(product) * quantity
                                        ).toLocaleString('en-IN')}`
                                        : `Add to Cart — ₹${(
                                            getItemPrice(product) * quantity
                                        ).toLocaleString('en-IN')}`}
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
                                <Link
                                    to="/login"
                                    style={{
                                        fontWeight: 600,
                                        color: '#2563eb',
                                    }}
                                >
                                    Sign in
                                </Link>{' '}
                                to add items to your cart and place orders.
                            </p>
                        </div>
                    )}

                    <div
                        style={{
                            marginTop: '2.5rem',
                            paddingTop: '2rem',
                            borderTop: '1px solid var(--border-light)',
                        }}
                    >
                        <h3
                            style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                marginBottom: '1rem',
                            }}
                        >
                            Product Details
                        </h3>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0.75rem',
                            }}
                        >
                            {[
                                { label: 'Category', value: product.category },
                                {
                                    label: 'Stock',
                                    value: `${product.stock} bags`,
                                },
                                {
                                    label: 'MRP',
                                    value: `₹${getMrp(product).toLocaleString(
                                        'en-IN'
                                    )}/bag`,
                                },
                                {
                                    label: 'Wholesale Price',
                                    value: `₹${getItemPrice(
                                        product
                                    ).toLocaleString('en-IN')}/bag`,
                                },
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
                                    <span
                                        style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--text-tertiary)',
                                            display: 'block',
                                        }}
                                    >
                                        {detail.label}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {detail.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════ */}
            {/* CUSTOMER REVIEWS                          */}
            {/* ════════════════════════════════════════ */}
            <section
                style={{
                    marginTop: '4rem',
                    paddingTop: '3rem',
                    borderTop: '1px solid var(--border-light)',
                }}
            >
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
                        gap: '3rem',
                        alignItems: 'start',
                    }}
                >
                    {/* Summary + form column */}
                    <div>
                        <h2
                            style={{
                                fontSize: '1.75rem',
                                fontWeight: 700,
                                letterSpacing: '-0.03em',
                                marginBottom: '1rem',
                            }}
                        >
                            Customer Reviews
                        </h2>

                        {totalReviews > 0 ? (
                            <div
                                style={{
                                    padding: '1.5rem',
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--border-light)',
                                    marginBottom: '1.5rem',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        marginBottom: '1rem',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '3rem',
                                            fontWeight: 800,
                                            color: 'var(--text)',
                                            letterSpacing: '-0.04em',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {avgRating.toFixed(1)}
                                    </div>
                                    <div>
                                        <StarRating
                                            value={avgRating}
                                            size={20}
                                        />
                                        <div
                                            style={{
                                                fontSize: '0.8125rem',
                                                color: 'var(--text-secondary)',
                                                marginTop: '0.25rem',
                                            }}
                                        >
                                            Based on {totalReviews} review
                                            {totalReviews !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                                {/* Distribution bars */}
                                <div>
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const count =
                                            reviewSummary?.rating_counts?.[
                                            star
                                            ] || 0;
                                        const pct = totalReviews
                                            ? (count / totalReviews) * 100
                                            : 0;
                                        return (
                                            <div
                                                key={star}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-secondary)',
                                                    marginBottom: '0.25rem',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        minWidth: '1.5rem',
                                                        textAlign: 'right',
                                                    }}
                                                >
                                                    {star}★
                                                </span>
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        height: '6px',
                                                        backgroundColor:
                                                            'var(--border-light)',
                                                        borderRadius: '9999px',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: `${pct}%`,
                                                            height: '100%',
                                                            backgroundColor:
                                                                'var(--primary)',
                                                            transition:
                                                                'width 0.4s ease',
                                                        }}
                                                    />
                                                </div>
                                                <span
                                                    style={{
                                                        minWidth: '1.5rem',
                                                        textAlign: 'right',
                                                    }}
                                                >
                                                    {count}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {reviewSummary?.average_delivery_rating && (
                                    <div
                                        style={{
                                            marginTop: '1rem',
                                            paddingTop: '1rem',
                                            borderTop:
                                                '1px solid var(--border-light)',
                                            fontSize: '0.8125rem',
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '0.375rem',
                                            }}
                                        >
                                            <span>🚚 Delivery</span>
                                            <StarRating
                                                value={
                                                    reviewSummary.average_delivery_rating
                                                }
                                                size={13}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <span>🧪 Product Quality</span>
                                            <StarRating
                                                value={
                                                    reviewSummary.average_quality_rating
                                                }
                                                size={13}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                style={{
                                    padding: '1.25rem',
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--border-light)',
                                    marginBottom: '1.5rem',
                                    fontSize: '0.875rem',
                                    color: 'var(--text-secondary)',
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{ fontSize: '1.75rem' }}>💬</div>
                                Be the first to review this product!
                            </div>
                        )}

                        {/* Review form */}
                        {user ? (
                            eligibility?.eligible ? (
                                <form
                                    onSubmit={submitReview}
                                    style={{
                                        padding: '1.5rem',
                                        backgroundColor: 'white',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--border-light)',
                                        boxShadow: 'var(--shadow-sm)',
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            marginBottom: '0.25rem',
                                        }}
                                    >
                                        Write a review
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--text-tertiary)',
                                            marginBottom: '1rem',
                                        }}
                                    >
                                        ✓ Verified buyer — your review will be
                                        published after admin approval.
                                    </p>

                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1rem',
                                        }}
                                    >
                                        <div>
                                            <label
                                                style={{
                                                    fontSize: '0.8125rem',
                                                    fontWeight: 600,
                                                    display: 'block',
                                                    marginBottom: '0.375rem',
                                                }}
                                            >
                                                Overall Rating
                                            </label>
                                            <StarRating
                                                value={reviewForm.rating}
                                                onChange={(v) =>
                                                    setReviewForm((f) => ({
                                                        ...f,
                                                        rating: v,
                                                    }))
                                                }
                                                size={26}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns:
                                                    '1fr 1fr',
                                                gap: '1rem',
                                            }}
                                        >
                                            <div>
                                                <label
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        display: 'block',
                                                        marginBottom: '0.375rem',
                                                        color: 'var(--text-secondary)',
                                                    }}
                                                >
                                                    Delivery
                                                </label>
                                                <StarRating
                                                    value={
                                                        reviewForm.delivery_rating
                                                    }
                                                    onChange={(v) =>
                                                        setReviewForm((f) => ({
                                                            ...f,
                                                            delivery_rating: v,
                                                        }))
                                                    }
                                                    size={20}
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        display: 'block',
                                                        marginBottom: '0.375rem',
                                                        color: 'var(--text-secondary)',
                                                    }}
                                                >
                                                    Quality
                                                </label>
                                                <StarRating
                                                    value={
                                                        reviewForm.quality_rating
                                                    }
                                                    onChange={(v) =>
                                                        setReviewForm((f) => ({
                                                            ...f,
                                                            quality_rating: v,
                                                        }))
                                                    }
                                                    size={20}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label
                                                style={{
                                                    fontSize: '0.8125rem',
                                                    fontWeight: 600,
                                                    display: 'block',
                                                    marginBottom: '0.375rem',
                                                }}
                                            >
                                                Title (optional)
                                            </label>
                                            <input
                                                type="text"
                                                maxLength={120}
                                                value={reviewForm.title}
                                                onChange={(e) =>
                                                    setReviewForm((f) => ({
                                                        ...f,
                                                        title: e.target.value,
                                                    }))
                                                }
                                                placeholder="Summarize your experience"
                                                className="form-input"
                                            />
                                        </div>
                                        <div>
                                            <label
                                                style={{
                                                    fontSize: '0.8125rem',
                                                    fontWeight: 600,
                                                    display: 'block',
                                                    marginBottom: '0.375rem',
                                                }}
                                            >
                                                Your Review{' '}
                                                <span
                                                    style={{
                                                        fontWeight: 400,
                                                        color: 'var(--text-tertiary)',
                                                    }}
                                                >
                                                    ({reviewForm.body.length}/2000)
                                                </span>
                                            </label>
                                            <textarea
                                                rows={4}
                                                maxLength={2000}
                                                value={reviewForm.body}
                                                onChange={(e) =>
                                                    setReviewForm((f) => ({
                                                        ...f,
                                                        body: e.target.value,
                                                    }))
                                                }
                                                placeholder="Tell other customers what you loved (or didn't)..."
                                                className="form-input"
                                                style={{ resize: 'vertical' }}
                                            />
                                        </div>
                                        <div>
                                            <label
                                                style={{
                                                    fontSize: '0.8125rem',
                                                    fontWeight: 600,
                                                    display: 'block',
                                                    marginBottom: '0.375rem',
                                                }}
                                            >
                                                Photos (optional, up to 6)
                                            </label>
                                            <input
                                                ref={reviewFileInputRef}
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleReviewImageUpload}
                                                disabled={
                                                    uploadingImages ||
                                                    reviewForm.images.length >= 6
                                                }
                                                style={{
                                                    fontSize: '0.8125rem',
                                                }}
                                            />
                                            {uploadingImages && (
                                                <div
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        color: 'var(--text-tertiary)',
                                                        marginTop: '0.25rem',
                                                    }}
                                                >
                                                    Uploading…
                                                </div>
                                            )}
                                            {reviewForm.images.length > 0 && (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        gap: '0.5rem',
                                                        flexWrap: 'wrap',
                                                        marginTop: '0.5rem',
                                                    }}
                                                >
                                                    {reviewForm.images.map(
                                                        (url, i) => (
                                                            <div
                                                                key={i}
                                                                style={{
                                                                    position:
                                                                        'relative',
                                                                    width: 64,
                                                                    height: 64,
                                                                    borderRadius:
                                                                        'var(--radius-sm)',
                                                                    overflow:
                                                                        'hidden',
                                                                    border: '1px solid var(--border-light)',
                                                                }}
                                                            >
                                                                <img
                                                                    src={url}
                                                                    alt=""
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit:
                                                                            'cover',
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeReviewImage(
                                                                            i
                                                                        )
                                                                    }
                                                                    style={{
                                                                        position:
                                                                            'absolute',
                                                                        top: 2,
                                                                        right: 2,
                                                                        width: 20,
                                                                        height: 20,
                                                                        borderRadius:
                                                                            '50%',
                                                                        border:
                                                                            'none',
                                                                        backgroundColor:
                                                                            'rgba(0,0,0,0.6)',
                                                                        color: 'white',
                                                                        cursor: 'pointer',
                                                                        display:
                                                                            'flex',
                                                                        alignItems:
                                                                            'center',
                                                                        justifyContent:
                                                                            'center',
                                                                        fontSize:
                                                                            '0.75rem',
                                                                    }}
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {reviewSubmitMsg && (
                                            <div
                                                style={{
                                                    padding: '0.625rem 0.875rem',
                                                    borderRadius:
                                                        'var(--radius)',
                                                    fontSize: '0.8125rem',
                                                    backgroundColor:
                                                        reviewSubmitMsg.type ===
                                                            'success'
                                                            ? '#ecfdf5'
                                                            : '#fef2f2',
                                                    color:
                                                        reviewSubmitMsg.type ===
                                                            'success'
                                                            ? '#166534'
                                                            : '#991b1b',
                                                    border: `1px solid ${reviewSubmitMsg.type ===
                                                            'success'
                                                            ? '#86efac'
                                                            : '#fca5a5'
                                                        }`,
                                                }}
                                            >
                                                {reviewSubmitMsg.text}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={reviewSubmitting}
                                            style={{
                                                borderRadius: '9999px',
                                                padding: '0.75rem 1.5rem',
                                            }}
                                        >
                                            {reviewSubmitting
                                                ? 'Submitting…'
                                                : 'Submit Review'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div
                                    style={{
                                        padding: '1rem 1.25rem',
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--border-light)',
                                        fontSize: '0.8125rem',
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    {eligibility?.already_reviewed
                                        ? '✓ You have already reviewed this product. Thank you!'
                                        : '⭐ Only verified buyers (with a delivered order) can review this product.'}
                                </div>
                            )
                        ) : (
                            <div
                                style={{
                                    padding: '1rem 1.25rem',
                                    backgroundColor: '#eff6ff',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid #bfdbfe',
                                    fontSize: '0.875rem',
                                    color: '#2563eb',
                                }}
                            >
                                <Link
                                    to="/login"
                                    style={{ fontWeight: 600 }}
                                >
                                    Sign in
                                </Link>{' '}
                                to leave a review. Reviews are only available
                                to verified buyers.
                            </div>
                        )}
                    </div>

                    {/* Reviews list column */}
                    <div>
                        {reviewsLoading ? (
                            <div
                                className="loading-container"
                                style={{ minHeight: '200px' }}
                            >
                                <div className="spinner" />
                            </div>
                        ) : reviews.length === 0 ? (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: '3rem 1rem',
                                    color: 'var(--text-tertiary)',
                                }}
                            >
                                No reviews yet.
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
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                gap: '1rem',
                                                marginBottom: '0.5rem',
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.625rem',
                                                        marginBottom: '0.25rem',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontWeight: 600,
                                                            fontSize: '0.9375rem',
                                                        }}
                                                    >
                                                        {r.user_name || 'Customer'}
                                                    </span>
                                                    {r.verified_buyer && (
                                                        <span
                                                            title="Verified buyer"
                                                            style={{
                                                                fontSize: '0.6875rem',
                                                                padding:
                                                                    '0.125rem 0.5rem',
                                                                backgroundColor:
                                                                    'rgba(26, 138, 63, 0.1)',
                                                                color: 'var(--primary)',
                                                                borderRadius:
                                                                    '9999px',
                                                                fontWeight: 700,
                                                                letterSpacing:
                                                                    '0.02em',
                                                            }}
                                                        >
                                                            ✓ Verified Buyer
                                                        </span>
                                                    )}
                                                </div>
                                                <StarRating
                                                    value={r.rating}
                                                    size={14}
                                                />
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-tertiary)',
                                                }}
                                            >
                                                {new Date(
                                                    r.created_at
                                                ).toLocaleDateString('en-IN', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                        {r.title && (
                                            <h4
                                                style={{
                                                    fontSize: '0.9375rem',
                                                    fontWeight: 600,
                                                    marginTop: '0.5rem',
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
                                        {(r.delivery_rating ||
                                            r.quality_rating) && (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        gap: '1.25rem',
                                                        marginTop: '0.625rem',
                                                        paddingTop: '0.625rem',
                                                        borderTop:
                                                            '1px solid var(--border-light)',
                                                        fontSize: '0.75rem',
                                                        color: 'var(--text-tertiary)',
                                                    }}
                                                >
                                                    {r.delivery_rating && (
                                                        <span
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.375rem',
                                                            }}
                                                        >
                                                            🚚{' '}
                                                            <StarRating
                                                                value={
                                                                    r.delivery_rating
                                                                }
                                                                size={11}
                                                            />
                                                        </span>
                                                    )}
                                                    {r.quality_rating && (
                                                        <span
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.375rem',
                                                            }}
                                                        >
                                                            🧪{' '}
                                                            <StarRating
                                                                value={
                                                                    r.quality_rating
                                                                }
                                                                size={11}
                                                            />
                                                        </span>
                                                    )}
                                                </div>
                                            )}
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
                                                            alt={`Review photo ${i + 1}`}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit:
                                                                    'cover',
                                                            }}
                                                        />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {reviewsPagination &&
                                    reviewsPagination.totalPages > 1 && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                gap: '0.25rem',
                                                marginTop: '0.5rem',
                                            }}
                                        >
                                            {Array.from(
                                                {
                                                    length: reviewsPagination.totalPages,
                                                },
                                                (_, i) => i + 1
                                            ).map((p) => (
                                                <button
                                                    key={p}
                                                    onClick={() =>
                                                        setReviewsPage(p)
                                                    }
                                                    style={{
                                                        minWidth: '2.25rem',
                                                        height: '2.25rem',
                                                        borderRadius: '50%',
                                                        border: 'none',
                                                        backgroundColor:
                                                            p === reviewsPage
                                                                ? 'var(--primary)'
                                                                : 'transparent',
                                                        color:
                                                            p === reviewsPage
                                                                ? 'white'
                                                                : 'var(--text-secondary)',
                                                        fontWeight: 600,
                                                        fontSize: '0.875rem',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════ */}
            {/* DELIVERY PHOTOS GALLERY                   */}
            {/* ════════════════════════════════════════ */}
            <section
                style={{
                    marginTop: '4rem',
                    paddingTop: '3rem',
                    borderTop: '1px solid var(--border-light)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        marginBottom: '1.5rem',
                        flexWrap: 'wrap',
                        gap: '1rem',
                    }}
                >
                    <div>
                        <h2
                            style={{
                                fontSize: '1.75rem',
                                fontWeight: 700,
                                letterSpacing: '-0.03em',
                                marginBottom: '0.375rem',
                            }}
                        >
                            Delivery Photos
                        </h2>
                        <p
                            style={{
                                color: 'var(--text-secondary)',
                                fontSize: '0.9375rem',
                            }}
                        >
                            Real customers sharing their delivery experience.
                        </p>
                    </div>
                    {user && (
                        <div
                            style={{
                                padding: '1rem',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--border-light)',
                                minWidth: '280px',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    marginBottom: '0.5rem',
                                }}
                            >
                                Got a delivery photo? Share it!
                            </p>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns:
                                        '1fr 1fr',
                                    gap: '0.5rem',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                <input
                                    type="text"
                                    placeholder="Your name"
                                    value={deliveryForm.customer_name}
                                    onChange={(e) =>
                                        setDeliveryForm((f) => ({
                                            ...f,
                                            customer_name: e.target.value,
                                        }))
                                    }
                                    className="form-input"
                                    style={{ fontSize: '0.8125rem' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Location (e.g., Jorhat)"
                                    value={deliveryForm.location}
                                    onChange={(e) =>
                                        setDeliveryForm((f) => ({
                                            ...f,
                                            location: e.target.value,
                                        }))
                                    }
                                    className="form-input"
                                    style={{ fontSize: '0.8125rem' }}
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Caption (optional)"
                                value={deliveryForm.caption}
                                onChange={(e) =>
                                    setDeliveryForm((f) => ({
                                        ...f,
                                        caption: e.target.value,
                                    }))
                                }
                                className="form-input"
                                style={{
                                    fontSize: '0.8125rem',
                                    marginBottom: '0.5rem',
                                }}
                            />
                            <input
                                ref={deliveryFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleDeliveryImageUpload}
                                disabled={deliveryUploading}
                                style={{ fontSize: '0.8125rem' }}
                            />
                            {deliveryUploading && (
                                <div
                                    style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-tertiary)',
                                        marginTop: '0.25rem',
                                    }}
                                >
                                    Uploading…
                                </div>
                            )}
                            {deliveryMsg && (
                                <div
                                    style={{
                                        marginTop: '0.5rem',
                                        padding: '0.5rem 0.625rem',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.75rem',
                                        backgroundColor:
                                            deliveryMsg.type === 'success'
                                                ? '#ecfdf5'
                                                : '#fef2f2',
                                        color:
                                            deliveryMsg.type === 'success'
                                                ? '#166534'
                                                : '#991b1b',
                                    }}
                                >
                                    {deliveryMsg.text}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {deliveryImages.length === 0 ? (
                    <div
                        style={{
                            padding: '3rem 1rem',
                            textAlign: 'center',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-lg)',
                            color: 'var(--text-tertiary)',
                        }}
                    >
                        No delivery photos yet — be the first to share!
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: '0.75rem',
                        }}
                    >
                        {deliveryImages.map((img) => (
                            <div
                                key={img.id}
                                style={{
                                    position: 'relative',
                                    aspectRatio: '1 / 1',
                                    borderRadius: 'var(--radius-md)',
                                    overflow: 'hidden',
                                    backgroundColor: '#f5f5f7',
                                    boxShadow: 'var(--shadow-sm)',
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
                                {(img.customer_name || img.location) && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background:
                                                'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'flex-end',
                                            padding: '0.625rem',
                                            color: 'white',
                                        }}
                                    >
                                        {img.customer_name && (
                                            <div
                                                style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {img.customer_name}
                                            </div>
                                        )}
                                        {img.location && (
                                            <div
                                                style={{
                                                    fontSize: '0.6875rem',
                                                    opacity: 0.9,
                                                }}
                                            >
                                                📍 {img.location}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
