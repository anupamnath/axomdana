import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊', exact: true },
    { path: '/admin/products', label: 'Products', icon: '📦' },
    { path: '/admin/orders', label: 'Orders', icon: '📋' },
    { path: '/admin/reviews', label: 'Reviews', icon: '⭐' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminLayout({ children }) {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isActive = (item) => {
        if (item.exact) {
            return location.pathname === item.path;
        }
        return location.pathname.startsWith(item.path);
    };

    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 4rem)' }}>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        zIndex: 90,
                    }}
                />
            )}

            {/* Sidebar */}
            <aside
                style={{
                    width: '240px',
                    backgroundColor: 'white',
                    borderRight: '1px solid var(--border)',
                    padding: '1.5rem 0',
                    flexShrink: 0,
                    position: 'fixed',
                    top: '4rem',
                    left: 0,
                    bottom: 0,
                    zIndex: 80,
                    overflowY: 'auto',
                    transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s ease',
                }}
                className="admin-sidebar"
            >
                <div style={{ padding: '0 1rem', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', margin: 0 }}>
                        Admin Panel
                    </h2>
                </div>

                <nav>
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.625rem 1rem',
                                margin: '0 0.5rem',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontWeight: isActive(item) ? 600 : 500,
                                color: isActive(item) ? '#1a8a3f' : 'var(--text-secondary)',
                                backgroundColor: isActive(item) ? 'rgba(26, 138, 63, 0.08)' : 'transparent',
                                textDecoration: 'none',
                                transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive(item)) {
                                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                                    e.currentTarget.style.color = 'var(--text)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive(item)) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }
                            }}
                        >
                            <span style={{ fontSize: '1.125rem' }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div style={{ padding: '1rem', marginTop: 'auto', borderTop: '1px solid var(--border-light)', margin: '1rem 0.5rem 0' }}>
                    <Link
                        to="/"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.8125rem',
                            color: 'var(--text-tertiary)',
                            textDecoration: 'none',
                            padding: '0.5rem',
                            borderRadius: '8px',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                            e.currentTarget.style.color = 'var(--text)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-tertiary)';
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Store
                    </Link>
                </div>
            </aside>

            {/* Mobile toggle button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                    position: 'fixed',
                    bottom: '1.5rem',
                    right: '1.5rem',
                    zIndex: 95,
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#1a8a3f',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(26, 138, 63, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                }}
                className="admin-mobile-toggle"
            >
                {sidebarOpen ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M3 12h18M3 6h18M3 18h18" />
                    </svg>
                )}
            </button>

            {/* Main content */}
            <main
                style={{
                    flex: 1,
                    marginLeft: '240px',
                    padding: '0',
                    minHeight: 'calc(100vh - 4rem)',
                    backgroundColor: 'var(--bg)',
                }}
                className="admin-main-content"
            >
                {children}
            </main>

            <style>{`
                @media (max-width: 768px) {
                    .admin-sidebar {
                        transform: translateX(-100%) !important;
                    }
                    .admin-sidebar.open {
                        transform: translateX(0) !important;
                    }
                    .admin-main-content {
                        margin-left: 0 !important;
                    }
                    .admin-mobile-toggle {
                        display: flex !important;
                    }
                }
                @media (min-width: 769px) {
                    .admin-sidebar {
                        transform: translateX(0) !important;
                    }
                    .admin-mobile-toggle {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
