import { useState, useEffect } from 'react';
import { adminAPI, uploadAPI } from '../../services/api';

const TABS = [
    { id: 'upi', label: '💳 UPI Payment', icon: '💳' },
    { id: 'smtp', label: '📧 Email (SMTP)', icon: '📧' },
    { id: 'hero', label: '🖼️ Hero Slides', icon: '🖼️' },
];

export default function AdminSettings() {
    const [activeTab, setActiveTab] = useState('upi');

    return (
        <div style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem' }}>Settings</h1>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9375rem' }}>
                    Configure your store's payment, email, and landing page settings
                </p>
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '2rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '0',
                overflowX: 'auto',
            }}>
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.25rem',
                            fontSize: '0.875rem',
                            fontWeight: activeTab === tab.id ? 600 : 500,
                            color: activeTab === tab.id ? '#1a8a3f' : 'var(--text-secondary)',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '2px solid #1a8a3f' : '2px solid transparent',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease',
                            marginBottom: '-1px',
                        }}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'upi' && <UPISettings />}
            {activeTab === 'smtp' && <SMTPSettings />}
            {activeTab === 'hero' && <HeroSlidesManager />}
        </div>
    );
}

// ─── UPI SETTINGS ───────────────────────────────────────────
function UPISettings() {
    const [upiId, setUpiId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getSettings();
            if (res.data.settings?.upi_id) {
                setUpiId(res.data.settings.upi_id);
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!upiId.trim()) {
            setMessage({ type: 'error', text: 'UPI ID is required.' });
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await adminAPI.updateSetting('upi_id', upiId.trim());
            setMessage({ type: 'success', text: 'UPI ID updated successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update UPI ID.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '40vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: 'white',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '2rem',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
            }}>
                <span style={{ fontSize: '1.5rem' }}>💳</span>
                <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9375rem', margin: '0 0 0.25rem', color: '#166534' }}>
                        UPI Payment Gateway
                    </p>
                    <p style={{ fontSize: '0.8125rem', margin: 0, color: '#166534' }}>
                        This UPI ID will be used to generate QR codes for customer payments at checkout.
                        Supported apps: Google Pay, PhonePe, Paytm, BHIM, etc.
                    </p>
                </div>
            </div>

            {message.text && (
                <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fff2f0',
                    border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#ffccc7'}`,
                    color: message.type === 'success' ? '#166534' : '#ff453a',
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave}>
                <div className="form-group">
                    <label htmlFor="upiId" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
                        UPI ID (UPI Address)
                    </label>
                    <input
                        id="upiId"
                        type="text"
                        className="form-input"
                        placeholder="e.g., merchant@upi or axomdana@paytm"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '1rem', border: '1.5px solid var(--border)', borderRadius: '8px', outline: 'none' }}
                    />
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '0.375rem', margin: '0.375rem 0 0' }}>
                        Enter the UPI ID you want to receive payments to. Format: <code style={{ backgroundColor: '#f5f5f7', padding: '0.125rem 0.375rem', borderRadius: '4px', fontSize: '0.75rem' }}>yourname@upi</code>
                    </p>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                    <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '0.9375rem' }}>
                        {saving ? 'Saving...' : 'Save UPI ID'}
                    </button>
                </div>
            </form>

            {/* Preview Section */}
            {upiId && (
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>QR Code Preview</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        This is how the QR code will appear to customers at checkout:
                    </p>
                    <div style={{ display: 'inline-block', padding: '1rem', backgroundColor: 'white', borderRadius: 'var(--radius)', border: '2px solid var(--border-light)' }}>
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('upi://pay?pa=' + encodeURIComponent(upiId) + '&pn=Axom%20Dana%20LLC&am=100&tn=Test%20Payment&cu=INR')}`}
                            alt="UPI QR Preview"
                            style={{ width: '200px', height: '200px', display: 'block' }}
                        />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                        Preview QR — actual amount and order reference will be dynamically added at checkout.
                    </p>
                </div>
            )}
        </div>
    );
}

// ─── SMTP SETTINGS ──────────────────────────────────────────
function SMTPSettings() {
    const [config, setConfig] = useState({
        host: '',
        port: '587',
        user: '',
        pass: '',
        from_email: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSmtpConfig();
    }, []);

    const fetchSmtpConfig = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getSettings();
            const settings = res.data.settings || {};

            if (settings.smtp_config) {
                try {
                    const parsed = JSON.parse(settings.smtp_config);
                    setConfig((prev) => ({ ...prev, ...parsed }));
                } catch { }
            }
            if (settings.smtp_from_email) {
                setConfig((prev) => ({ ...prev, from_email: settings.smtp_from_email }));
            }
        } catch (err) {
            console.error('Failed to load SMTP config:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setConfig((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const smtpConfig = {
                host: config.host,
                port: config.port,
                user: config.user,
                pass: config.pass,
            };
            await adminAPI.updateSetting('smtp_config', JSON.stringify(smtpConfig));
            if (config.from_email) {
                await adminAPI.updateSetting('smtp_from_email', config.from_email);
            }
            setMessage({ type: 'success', text: 'SMTP configuration saved successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save SMTP configuration.' });
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!config.from_email) {
            setMessage({ type: 'error', text: 'Please enter a "From Email" address first.' });
            return;
        }
        setTesting(true);
        setMessage({ type: '', text: '' });

        try {
            const smtpConfig = {
                host: config.host,
                port: config.port,
                user: config.user,
                pass: config.pass,
            };
            await adminAPI.updateSetting('smtp_config', JSON.stringify(smtpConfig));
            if (config.from_email) {
                await adminAPI.updateSetting('smtp_from_email', config.from_email);
            }
            setMessage({ type: 'success', text: 'Configuration saved. Emails will be sent using these settings.' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Test failed: ' + (err.response?.data?.error || err.message) });
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '40vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: 'white',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '2rem',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#f0f5ff',
                borderRadius: '8px',
                border: '1px solid #bdd3ff',
            }}>
                <span style={{ fontSize: '1.5rem' }}>📧</span>
                <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9375rem', margin: '0 0 0.25rem', color: '#003d99' }}>
                        Email (SMTP) Configuration
                    </p>
                    <p style={{ fontSize: '0.8125rem', margin: 0, color: '#003d99' }}>
                        Configure SMTP to send order confirmations and status updates to your customers.
                        Use Gmail, SendGrid, Mailgun, or any SMTP provider.
                    </p>
                </div>
            </div>

            {message.text && (
                <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fff2f0',
                    border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#ffccc7'}`,
                    color: message.type === 'success' ? '#166534' : '#ff453a',
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label htmlFor="smtp_host" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
                            SMTP Host
                        </label>
                        <input
                            id="smtp_host"
                            type="text"
                            className="form-input"
                            placeholder="e.g., smtp.gmail.com"
                            value={config.host}
                            onChange={(e) => handleChange('host', e.target.value)}
                            style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.9375rem', border: '1.5px solid var(--border)', borderRadius: '8px', outline: 'none' }}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="smtp_port" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
                            SMTP Port
                        </label>
                        <input
                            id="smtp_port"
                            type="text"
                            className="form-input"
                            placeholder="e.g., 587"
                            value={config.port}
                            onChange={(e) => handleChange('port', e.target.value)}
                            style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.9375rem', border: '1.5px solid var(--border)', borderRadius: '8px', outline: 'none' }}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="smtp_user" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
                            SMTP Username
                        </label>
                        <input
                            id="smtp_user"
                            type="text"
                            className="form-input"
                            placeholder="e.g., your@email.com"
                            value={config.user}
                            onChange={(e) => handleChange('user', e.target.value)}
                            style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.9375rem', border: '1.5px solid var(--border)', borderRadius: '8px', outline: 'none' }}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="smtp_pass" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
                            SMTP Password
                        </label>
                        <input
                            id="smtp_pass"
                            type="password"
                            className="form-input"
                            placeholder="App password or SMTP password"
                            value={config.pass}
                            onChange={(e) => handleChange('pass', e.target.value)}
                            style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.9375rem', border: '1.5px solid var(--border)', borderRadius: '8px', outline: 'none' }}
                        />
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label htmlFor="smtp_from" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
                        From Email Address
                    </label>
                    <input
                        id="smtp_from"
                        type="email"
                        className="form-input"
                        placeholder="e.g., noreply@axomdana.in"
                        value={config.from_email}
                        onChange={(e) => handleChange('from_email', e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.9375rem', border: '1.5px solid var(--border)', borderRadius: '8px', outline: 'none' }}
                    />
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '0.375rem', margin: '0.375rem 0 0' }}>
                        This email will appear as the sender when customers receive order notifications.
                    </p>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '0.9375rem' }}>
                        {saving ? 'Saving...' : 'Save SMTP Settings'}
                    </button>
                    <button type="button" onClick={handleTest} disabled={testing} className="btn btn-secondary" style={{ padding: '0.75rem 2rem', fontSize: '0.9375rem' }}>
                        {testing ? 'Testing...' : 'Save & Test'}
                    </button>
                </div>
            </form>

            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f7', borderRadius: '8px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>💡 SMTP Setup Guides</strong>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.8 }}>
                    <li><strong>Gmail:</strong> Use <code>smtp.gmail.com</code>, port <code>587</code>. Enable 2FA and use an <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" style={{ color: '#0071e3' }}>App Password</a>.</li>
                    <li><strong>SendGrid:</strong> Use <code>smtp.sendgrid.net</code>, port <code>587</code>. Username is <code>apikey</code>, password is your API key.</li>
                    <li><strong>Mailgun:</strong> Use <code>smtp.mailgun.org</code>, port <code>587</code>. Use your Mailgun SMTP credentials.</li>
                </ul>
            </div>
        </div>
    );
}

// ─── HERO SLIDES MANAGER ────────────────────────────────────
function HeroSlidesManager() {
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [form, setForm] = useState({
        title: '',
        subtitle: '',
        image_url: '',
        sort_order: 0,
        is_active: true,
    });
    const [tagline, setTagline] = useState('');
    const [savingTagline, setSavingTagline] = useState(false);
    const [taglineMsg, setTaglineMsg] = useState({ type: '', text: '' });

    const fetchTagline = async () => {
        try {
            const res = await adminAPI.getSettings();
            if (res.data.settings?.hero_tagline) {
                setTagline(res.data.settings.hero_tagline);
            } else {
                setTagline('Axom Dana LLC — Beharbari, Guwahati');
            }
        } catch (err) {
            console.error('Failed to fetch tagline:', err);
        }
    };

    const handleSaveTagline = async (e) => {
        e.preventDefault();
        if (!tagline.trim()) {
            setTaglineMsg({ type: 'error', text: 'Tagline cannot be empty.' });
            return;
        }
        setSavingTagline(true);
        setTaglineMsg({ type: '', text: '' });
        try {
            await adminAPI.updateSetting('hero_tagline', tagline.trim());
            setTaglineMsg({ type: 'success', text: 'Tagline updated successfully!' });
            setTimeout(() => setTaglineMsg({ type: '', text: '' }), 3000);
        } catch (err) {
            setTaglineMsg({ type: 'error', text: 'Failed to update tagline.' });
        } finally {
            setSavingTagline(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await uploadAPI.uploadImage(formData);
            setForm((prev) => ({ ...prev, image_url: res.data.image_url }));
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to upload image.' });
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        fetchSlides();
        fetchTagline();
    }, []);

    const fetchSlides = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getHeroSlides();
            setSlides(res.data.slides || []);
        } catch (err) {
            console.error('Failed to load hero slides:', err);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ title: '', subtitle: '', image_url: '', sort_order: 0, is_active: true });
        setShowForm(true);
        setMessage({ type: '', text: '' });
    };

    const openEdit = (slide) => {
        setEditing(slide);
        setForm({
            title: slide.title,
            subtitle: slide.subtitle || '',
            image_url: slide.image_url,
            sort_order: slide.sort_order,
            is_active: slide.is_active,
        });
        setShowForm(true);
        setMessage({ type: '', text: '' });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.image_url.trim()) {
            setMessage({ type: 'error', text: 'Title and Image URL are required.' });
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            if (editing) {
                await adminAPI.updateHeroSlide(editing.id, form);
                setMessage({ type: 'success', text: 'Hero slide updated successfully!' });
            } else {
                await adminAPI.createHeroSlide(form);
                setMessage({ type: 'success', text: 'Hero slide created successfully!' });
            }
            setShowForm(false);
            setEditing(null);
            fetchSlides();
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save hero slide.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this hero slide?')) return;

        try {
            await adminAPI.deleteHeroSlide(id);
            setMessage({ type: 'success', text: 'Hero slide deleted.' });
            fetchSlides();
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to delete hero slide.' });
        }
    };

    const handleToggleActive = async (slide) => {
        try {
            await adminAPI.updateHeroSlide(slide.id, { is_active: !slide.is_active });
            fetchSlides();
        } catch (err) {
            console.error('Failed to toggle slide:', err);
        }
    };

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '40vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div>
            {message.text && (
                <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fff2f0',
                    border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#ffccc7'}`,
                    color: message.type === 'success' ? '#166534' : '#ff453a',
                }}>
                    {message.text}
                </div>
            )}

            {/* Landing Page Tagline Editor */}
            <div style={{
                backgroundColor: 'white',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>🏷️</span>
                    <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.125rem' }}>Landing Page Tagline</h4>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                            The tagline shown above the hero slides on the landing page
                        </p>
                    </div>
                </div>
                {taglineMsg.text && (
                    <div style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        marginBottom: '0.75rem',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        backgroundColor: taglineMsg.type === 'success' ? '#f0fdf4' : '#fff2f0',
                        border: `1px solid ${taglineMsg.type === 'success' ? '#bbf7d0' : '#ffccc7'}`,
                        color: taglineMsg.type === 'success' ? '#166534' : '#ff453a',
                    }}>
                        {taglineMsg.text}
                    </div>
                )}
                <form onSubmit={handleSaveTagline} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., Axom Dana LLC — Beharbari, Guwahati"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '0.75rem 1rem',
                            fontSize: '0.9375rem',
                            border: '1.5px solid var(--border)',
                            borderRadius: '8px',
                            outline: 'none',
                        }}
                    />
                    <button
                        type="submit"
                        disabled={savingTagline}
                        className="btn btn-primary"
                        style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
                    >
                        {savingTagline ? 'Saving...' : 'Save Tagline'}
                    </button>
                </form>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.25rem' }}>Hero Slides</h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Manage the hero banner slides shown on your store's landing page
                    </p>
                </div>
                {!showForm && (
                    <button onClick={openCreate} className="btn btn-primary" style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}>
                        + Add Slide
                    </button>
                )}
            </div>

            {/* Slide Form */}
            {showForm && (
                <div style={{
                    backgroundColor: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 1rem' }}>
                        {editing ? 'Edit Hero Slide' : 'New Hero Slide'}
                    </h4>
                    <form onSubmit={handleSave}>
                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Title *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Premium Animal Nutrition"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.9375rem', border: '1.5px solid var(--border)', borderRadius: '8px', outline: 'none' }}
                            />
                        </div>
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Subtitle</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Scientifically formulated feeds for healthier livestock"
                                value={form.subtitle}
                                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.9375rem', border: '1.5px solid var(--border)', borderRadius: '8px', outline: 'none' }}
                            />
                        </div>
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Image *</label>
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
                                        fontSize: '0.875rem',
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
                            <div style={{ marginTop: '0.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 400, marginBottom: '0.25rem', color: 'var(--text-tertiary)' }}>Or enter image URL directly:</label>
                                <input
                                    type="url"
                                    className="form-input"
                                    placeholder="https://images.unsplash.com/..."
                                    value={form.image_url}
                                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.9375rem', border: '1.5px solid var(--border)', borderRadius: '8px', outline: 'none' }}
                                />
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.375rem', margin: '0.375rem 0 0' }}>
                                Upload an image file (JPEG, PNG, GIF, or WebP, max 5MB) or enter a URL for external images.
                            </p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Sort Order</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={form.sort_order}
                                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                                    style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.9375rem', border: '1.5px solid var(--border)', borderRadius: '8px', outline: 'none' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Status</label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                        style={{ width: '1.125rem', height: '1.125rem', accentColor: '#1a8a3f' }}
                                    />
                                    <span style={{ fontSize: '0.9375rem' }}>Active (visible on landing page)</span>
                                </label>
                            </div>
                        </div>

                        {/* Image Preview */}
                        {form.image_url && (
                            <div style={{ marginTop: '1rem' }}>
                                <p style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Preview:</p>
                                <div style={{ borderRadius: '8px', overflow: 'hidden', maxHeight: '200px' }}>
                                    <img
                                        src={form.image_url}
                                        alt="Preview"
                                        style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                            <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '0.9375rem' }}>
                                {saving ? 'Saving...' : editing ? 'Update Slide' : 'Create Slide'}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn btn-secondary" style={{ padding: '0.75rem 2rem', fontSize: '0.9375rem' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Slides List */}
            {slides.length === 0 ? (
                <div style={{
                    backgroundColor: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    color: 'var(--text-tertiary)',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🖼️</div>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>No hero slides yet</p>
                    <p style={{ fontSize: '0.875rem', margin: '0 0 1rem' }}>Add your first hero slide to customize the landing page banner.</p>
                    <button onClick={openCreate} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem' }}>
                        + Add Your First Slide
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {slides.map((slide) => (
                        <div
                            key={slide.id}
                            style={{
                                backgroundColor: 'white',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                display: 'flex',
                                opacity: slide.is_active ? 1 : 0.5,
                            }}
                        >
                            <div style={{ width: '200px', minHeight: '120px', flexShrink: 0 }}>
                                <img
                                    src={slide.image_url}
                                    alt={slide.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                            <div style={{ flex: 1, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{slide.title}</h4>
                                    {!slide.is_active && (
                                        <span style={{
                                            fontSize: '0.6875rem',
                                            padding: '0.125rem 0.375rem',
                                            borderRadius: '4px',
                                            backgroundColor: '#f5f5f7',
                                            color: 'var(--text-tertiary)',
                                            fontWeight: 500,
                                        }}>
                                            Inactive
                                        </span>
                                    )}
                                </div>
                                {slide.subtitle && (
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 0.25rem' }}>
                                        {slide.subtitle}
                                    </p>
                                )}
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>
                                    Order: {slide.sort_order} · {slide.is_active ? 'Active' : 'Inactive'}
                                </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1rem', gap: '0.5rem', borderLeft: '1px solid var(--border)' }}>
                                <button
                                    onClick={() => openEdit(slide)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', whiteSpace: 'nowrap' }}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleToggleActive(slide)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', whiteSpace: 'nowrap' }}
                                >
                                    {slide.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                    onClick={() => handleDelete(slide.id)}
                                    className="btn btn-danger btn-sm"
                                    style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', whiteSpace: 'nowrap' }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
