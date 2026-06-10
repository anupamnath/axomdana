import { useState, useEffect } from 'react';
import { adminAPI, uploadAPI } from '../../services/api';

const emptyProduct = {
    name: '',
    slug: '',
    description: '',
    price: '',
    image_url: '',
    category: '',
    stock: '',
};

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [form, setForm] = useState(emptyProduct);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);

    const fetchProducts = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 15 };
            if (search) params.search = search;
            const res = await adminAPI.getProducts(params);
            setProducts(res.data.products);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error(err);
            setError('Failed to load products.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProducts(1);
    };

    const openCreate = () => {
        setEditingProduct(null);
        setForm(emptyProduct);
        setShowModal(true);
        setError('');
    };

    const openEdit = (product) => {
        setEditingProduct(product);
        setForm({
            name: product.name,
            slug: product.slug,
            description: product.description || '',
            price: product.price.toString(),
            image_url: product.image_url || '',
            category: product.category || '',
            stock: product.stock.toString(),
        });
        setShowModal(true);
        setError('');
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await uploadAPI.uploadImage(formData);
            setForm({ ...form, image_url: res.data.image_url });
        } catch (err) {
            setError('Failed to upload image.');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const data = {
                ...form,
                price: parseFloat(form.price),
                stock: parseInt(form.stock),
            };
            if (editingProduct) {
                await adminAPI.updateProduct(editingProduct.id, data);
            } else {
                await adminAPI.createProduct(data);
            }
            setShowModal(false);
            fetchProducts(pagination.page);
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to save product.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await adminAPI.deleteProduct(id);
            fetchProducts(pagination.page);
        } catch (err) {
            alert('Failed to delete product.');
        }
    };

    return (
        <div style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Products</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
                        {pagination.total} product{pagination.total !== 1 ? 's' : ''} total
                    </p>
                </div>
                <button onClick={openCreate} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
                    + Add Product
                </button>
            </div>

            <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Search products..."
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
            ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                    No products found.
                </div>
            ) : (
                <div style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Product</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Category</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Price</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Stock</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                {product.image_url && (
                                                    <img src={product.image_url} alt={product.name} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: 500, color: 'var(--text)' }}>{product.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{product.slug}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{product.category || '-'}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                                            ₹{parseFloat(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                            <span style={{
                                                color: product.stock > 10 ? '#30d158' : product.stock > 0 ? '#ff9f0a' : '#ff453a',
                                                fontWeight: 500,
                                            }}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button onClick={() => openEdit(product)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', color: '#0071e3' }}>
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDelete(product.id)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', border: '1px solid #ff453a', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', color: '#ff453a' }}>
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
                            onClick={() => fetchProducts(page)}
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
                        maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
                    }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1.25rem' }}>
                            {editingProduct ? 'Edit Product' : 'Add Product'}
                        </h2>

                        {error && (
                            <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '6px', color: '#ff453a', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Name *</label>
                                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Slug *</label>
                                <input type="text" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Description</label>
                                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Price (₹) *</label>
                                    <input type="number" step="0.01" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Stock *</label>
                                    <input type="number" min="0" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Category</label>
                                <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Image</label>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px',
                                            fontSize: '0.8125rem',
                                        }}
                                    />
                                    {uploading && <span className="spinner" style={{ width: '1.25rem', height: '1.25rem' }} />}
                                </div>
                                {form.image_url && (
                                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <img
                                            src={form.image_url}
                                            alt="Preview"
                                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }}
                                        />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', wordBreak: 'break-all', flex: 1 }}>
                                            {form.image_url}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, image_url: '' })}
                                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', border: '1px solid #ff453a', borderRadius: '4px', backgroundColor: 'white', color: '#ff453a', cursor: 'pointer' }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.375rem', margin: '0.375rem 0 0' }}>
                                    Upload an image file (JPEG, PNG, GIF, or WebP, max 5MB). The image will be stored on the server.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>Cancel</button>
                                <button type="submit" disabled={saving} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
                                    {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
