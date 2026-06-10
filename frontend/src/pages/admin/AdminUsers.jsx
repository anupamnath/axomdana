import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', is_admin: false, password: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchUsers = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (search) params.search = search;
            const res = await adminAPI.getUsers(params);
            setUsers(res.data.users);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error(err);
            setError('Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers(1);
    };

    const openEdit = (user) => {
        setEditingUser(user);
        setForm({ name: user.name, email: user.email, is_admin: user.is_admin, password: '' });
        setShowModal(true);
        setError('');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const data = { name: form.name, email: form.email, is_admin: form.is_admin };
            if (form.password) data.password = form.password;
            await adminAPI.updateUser(editingUser.id, data);
            setShowModal(false);
            fetchUsers(pagination.page);
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to update user.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? This will also delete their cart and orders.')) return;
        try {
            await adminAPI.deleteUser(id);
            fetchUsers(pagination.page);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete user.');
        }
    };

    return (
        <div style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Users</h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
                    {pagination.total} user{pagination.total !== 1 ? 's' : ''} total
                </p>
            </div>

            <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: '100%',
                        maxWidth: '400px',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none',
                    }}
                />
            </form>

            {error && (
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '8px', color: '#ff453a', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            {loading ? (
                <div className="loading-container"><div className="spinner" /></div>
            ) : users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                    No users found.
                </div>
            ) : (
                <div style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Name</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Email</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>Admin</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Joined</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{user.name}</td>
                                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            {user.is_admin ? (
                                                <span style={{ color: '#30d158', fontWeight: 600 }}>Yes</span>
                                            ) : (
                                                <span style={{ color: 'var(--text-tertiary)' }}>No</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                            {new Date(user.created_at).toLocaleDateString('en-IN')}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button onClick={() => openEdit(user)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', color: '#0071e3' }}>
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDelete(user.id)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', border: '1px solid #ff453a', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', color: '#ff453a' }}>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => fetchUsers(page)}
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

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem',
                }} onClick={() => setShowModal(false)}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem',
                        maxWidth: '480px', width: '100%',
                    }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1.25rem' }}>
                            Edit User
                        </h2>

                        {error && (
                            <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '6px', color: '#ff453a', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Name</label>
                                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Email</label>
                                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>New Password (leave blank to keep current)</label>
                                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" id="is_admin" checked={form.is_admin} onChange={(e) => setForm({ ...form, is_admin: e.target.checked })} style={{ width: '1rem', height: '1rem' }} />
                                <label htmlFor="is_admin" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Admin privileges</label>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>Cancel</button>
                                <button type="submit" disabled={saving} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
                                    {saving ? 'Saving...' : 'Update User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
