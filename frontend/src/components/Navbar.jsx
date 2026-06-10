import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '3.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(210, 210, 215, 0.5)',
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
                    style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: 'var(--text)',
                        textDecoration: 'none',
                        letterSpacing: '-0.03em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                        <rect width="32" height="32" rx="8" fill="#1a8a3f" />
                        <path d="M16 6C12 6 8 9 8 14c0 4 3 8 8 14 5-6 8-10 8-14 0-5-4-8-8-8z" fill="white" opacity="0.9" />
                        <path d="M14 12l2 2 2-2" stroke="#1a8a3f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontWeight: 800 }}>Axom Dana</span>
                </Link>

                {/* Desktop Nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Link
                        to="/"
                        style={{
                            padding: '0.5rem 0.875rem',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            textDecoration: 'none',
                            borderRadius: '980px',
                            transition: 'var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'var(--bg-secondary)';
                            e.target.style.color = 'var(--text)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = 'var(--text-secondary)';
                        }}
                    >
                        Products
                    </Link>

                    {/* Cart Icon */}
                    <Link
                        to="/cart"
                        style={{
                            position: 'relative',
                            padding: '0.5rem',
                            color: 'var(--text-secondary)',
                            textDecoration: 'none',
                            borderRadius: '50%',
                            transition: 'var(--transition-fast)',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                            e.currentTarget.style.color = 'var(--text)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        {cartCount > 0 && (
                            <span
                                className="badge"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    minWidth: '1rem',
                                    height: '1rem',
                                    fontSize: '0.625rem',
                                }}
                            >
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                            {/* Admin Link - only for admin users */}
                            {user.is_admin && (
                                <Link
                                    to="/admin"
                                    style={{
                                        padding: '0.5rem 0.875rem',
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        color: '#1a8a3f',
                                        textDecoration: 'none',
                                        borderRadius: '980px',
                                        transition: 'var(--transition-fast)',
                                        backgroundColor: 'rgba(26, 138, 63, 0.08)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = 'rgba(26, 138, 63, 0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'rgba(26, 138, 63, 0.08)';
                                    }}
                                >
                                    Admin
                                </Link>
                            )}
                            <Link
                                to="/orders"
                                style={{
                                    padding: '0.5rem 0.875rem',
                                    fontSize: '0.8125rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    textDecoration: 'none',
                                    borderRadius: '980px',
                                    transition: 'var(--transition-fast)',
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = 'var(--bg-secondary)';
                                    e.target.style.color = 'var(--text)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                }}
                            >
                                Orders
                            </Link>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', padding: '0 0.25rem' }}>{user.name}</span>
                            <button
                                onClick={handleLogout}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.8125rem' }}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
                            <Link to="/login" className="btn btn-secondary btn-sm" style={{ fontSize: '0.8125rem' }}>
                                Sign In
                            </Link>
                            <Link to="/register" className="btn btn-primary btn-sm" style={{ fontSize: '0.8125rem' }}>
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
