import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [hovered, setHovered] = useState(null);

    // Track scroll for elevated/frosted shadow
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isHome = location.pathname === '/';

    // More transparent at top of page (especially on home with hero),
    // more opaque + shadowed after scroll for legibility.
    const baseAlpha = isHome ? 0.55 : 0.82;
    const scrolledAlpha = isHome ? 0.86 : 0.94;
    const alpha = scrolled ? scrolledAlpha : baseAlpha;
    const borderAlpha = scrolled ? 0.18 : 0.08;

    const linkStyle = (active = false) => ({
        padding: '0.5rem 0.875rem',
        fontSize: '0.8125rem',
        fontWeight: active ? 600 : 500,
        color: active ? 'var(--text)' : 'var(--text-secondary)',
        textDecoration: 'none',
        borderRadius: '980px',
        transition: 'all 0.18s ease',
        backgroundColor: active ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
    });

    return (
        <>
            <nav
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3.75rem',
                    backgroundColor: `rgba(255, 255, 255, ${alpha})`,
                    backdropFilter: 'saturate(180%) blur(24px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(24px)',
                    borderBottom: `1px solid rgba(15, 23, 42, ${borderAlpha})`,
                    boxShadow: scrolled
                        ? '0 4px 20px -8px rgba(15, 23, 42, 0.12)'
                        : 'none',
                    transition:
                        'background-color 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                    zIndex: 100,
                }}
            >
                <div
                    className="container"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        height: '100%',
                        maxWidth: '1200px',
                    }}
                >
                    {/* Logo */}
                    <Link
                        to="/"
                        onMouseEnter={() => setHovered('logo')}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                            fontSize: '1.1875rem',
                            fontWeight: 700,
                            color: 'var(--text)',
                            textDecoration: 'none',
                            letterSpacing: '-0.02em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transform:
                                hovered === 'logo' ? 'scale(1.02)' : 'scale(1)',
                            transition: 'transform 0.18s ease',
                        }}
                    >
                        <svg
                            width="30"
                            height="30"
                            viewBox="0 0 32 32"
                            fill="none"
                            aria-hidden="true"
                        >
                            <defs>
                                <linearGradient
                                    id="brand-grad"
                                    x1="0"
                                    y1="0"
                                    x2="32"
                                    y2="32"
                                    gradientUnits="userSpaceOnUse"
                                >
                                    <stop offset="0" stopColor="#22a55a" />
                                    <stop offset="1" stopColor="#0d6b30" />
                                </linearGradient>
                            </defs>
                            <rect
                                width="32"
                                height="32"
                                rx="9"
                                fill="url(#brand-grad)"
                            />
                            <path
                                d="M16 6c-3.3 0-6 2.7-6 6 0 3.5 2.4 6.9 6 12 3.6-5.1 6-8.5 6-12 0-3.3-2.7-6-6-6z"
                                fill="white"
                                opacity="0.96"
                            />
                            <path
                                d="M14.5 13l1.5 1.5 1.5-1.5"
                                stroke="#0d6b30"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                            />
                        </svg>
                        <span style={{ fontWeight: 800 }}>Axom Dana</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.15rem',
                        }}
                    >
                        <Link
                            to="/"
                            style={linkStyle(location.pathname === '/')}
                            onMouseEnter={(e) => {
                                if (location.pathname !== '/') {
                                    e.currentTarget.style.backgroundColor =
                                        'rgba(0, 0, 0, 0.04)';
                                    e.currentTarget.style.color = 'var(--text)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (location.pathname !== '/') {
                                    e.currentTarget.style.backgroundColor =
                                        'transparent';
                                    e.currentTarget.style.color =
                                        'var(--text-secondary)';
                                }
                            }}
                        >
                            Products
                        </Link>

                        {/* Cart Icon */}
                        <Link
                            to="/cart"
                            aria-label="Cart"
                            style={{
                                position: 'relative',
                                padding: '0.5rem',
                                margin: '0 0.25rem',
                                color: 'var(--text-secondary)',
                                textDecoration: 'none',
                                borderRadius: '50%',
                                transition: 'all 0.18s ease',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    'rgba(0, 0, 0, 0.04)';
                                e.currentTarget.style.color = 'var(--text)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    'transparent';
                                e.currentTarget.style.color =
                                    'var(--text-secondary)';
                            }}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                            </svg>
                            {cartCount > 0 && (
                                <span
                                    className="badge"
                                    style={{
                                        position: 'absolute',
                                        top: 2,
                                        right: 2,
                                        minWidth: '1.05rem',
                                        height: '1.05rem',
                                        fontSize: '0.625rem',
                                        fontWeight: 700,
                                    }}
                                >
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {user ? (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    marginLeft: '0.5rem',
                                }}
                            >
                                {/* Admin Link - only for admin users */}
                                {user.is_admin && (
                                    <Link
                                        to="/admin"
                                        style={{
                                            padding: '0.5rem 0.875rem',
                                            fontSize: '0.8125rem',
                                            fontWeight: 600,
                                            color: '#0d6b30',
                                            textDecoration: 'none',
                                            borderRadius: '980px',
                                            transition: 'all 0.18s ease',
                                            backgroundColor:
                                                'rgba(13, 107, 48, 0.08)',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor =
                                                'rgba(13, 107, 48, 0.16)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor =
                                                'rgba(13, 107, 48, 0.08)';
                                        }}
                                    >
                                        Admin
                                    </Link>
                                )}
                                <Link
                                    to="/orders"
                                    style={linkStyle(
                                        location.pathname.startsWith('/orders')
                                    )}
                                    onMouseEnter={(e) => {
                                        if (
                                            !location.pathname.startsWith(
                                                '/orders'
                                            )
                                        ) {
                                            e.currentTarget.style.backgroundColor =
                                                'rgba(0, 0, 0, 0.04)';
                                            e.currentTarget.style.color =
                                                'var(--text)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (
                                            !location.pathname.startsWith(
                                                '/orders'
                                            )
                                        ) {
                                            e.currentTarget.style.backgroundColor =
                                                'transparent';
                                            e.currentTarget.style.color =
                                                'var(--text-secondary)';
                                        }
                                    }}
                                >
                                    Orders
                                </Link>
                                <span
                                    style={{
                                        fontSize: '0.8125rem',
                                        color: 'var(--text-tertiary)',
                                        padding: '0 0.5rem',
                                        maxWidth: '120px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                    title={user.name}
                                >
                                    {user.name?.split(' ')[0]}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.8125rem' }}
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    marginLeft: '0.5rem',
                                }}
                            >
                                <Link
                                    to="/login"
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.8125rem' }}
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn btn-primary btn-sm"
                                    style={{ fontSize: '0.8125rem' }}
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Spacer for fixed nav height */}
            <div style={{ height: '3.75rem' }} aria-hidden="true" />
        </>
    );
}
