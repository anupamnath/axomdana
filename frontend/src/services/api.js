import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
};

// Products
export const productsAPI = {
    getAll: (params) => api.get('/products', { params }),
    getBySlug: (slug) => api.get(`/products/${slug}`),
    getCategories: () => api.get('/products/categories'),
};

// Cart
export const cartAPI = {
    get: () => api.get('/cart'),
    add: (data) => api.post('/cart', data),
    update: (id, data) => api.put(`/cart/${id}`, data),
    remove: (id) => api.delete(`/cart/${id}`),
};

// Orders
export const ordersAPI = {
    getAll: () => api.get('/orders'),
    getById: (id) => api.get(`/orders/${id}`),
    create: (data) => api.post('/orders', data),
    buyNow: (data) => api.post('/orders/buy-now', data),
    updatePayment: (id, data) => api.put(`/orders/${id}/payment`, data),
    getInvoice: (id) => api.get(`/orders/${id}/invoice`, { responseType: 'blob' }),
};

// Reviews (verified-buyer product reviews with star ratings)
export const reviewsAPI = {
    getByProduct: (productId, params) =>
        api.get(`/reviews/product/${productId}`, { params }),
    getEligibility: (productId) => api.get(`/reviews/eligibility/${productId}`),
    submit: (data) => api.post('/reviews', data),
    delete: (id) => api.delete(`/reviews/${id}`),
};

// Delivery Images (customer-shared delivery proof photos)
export const deliveryImagesAPI = {
    list: (params) => api.get('/delivery-images', { params }),
    submit: (data) => api.post('/delivery-images', data),
    delete: (id) => api.delete(`/delivery-images/${id}`),
};

// Upload
export const uploadAPI = {
    uploadImage: (formData) =>
        api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
};

// Admin
export const adminAPI = {
    // Dashboard
    getDashboard: () => api.get('/admin/dashboard'),

    // Products
    getProducts: (params) => api.get('/admin/products', { params }),
    createProduct: (data) => api.post('/admin/products', data),
    updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
    deleteProduct: (id) => api.delete(`/admin/products/${id}`),

    // Users
    getUsers: (params) => api.get('/admin/users', { params }),
    getUser: (id) => api.get(`/admin/users/${id}`),
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),

    // Orders
    getOrders: (params) => api.get('/admin/orders', { params }),
    getOrder: (id) => api.get(`/admin/orders/${id}`),
    updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
    updateOrderRemarks: (id, remarks) => api.put(`/admin/orders/${id}/remarks`, { remarks }),
    deleteOrder: (id) => api.delete(`/admin/orders/${id}`),
    sendOrderConfirmation: (id) => api.post(`/admin/orders/${id}/send-confirmation`),
    sendOrderStatusUpdate: (id) => api.post(`/admin/orders/${id}/send-status-update`),

    // Reviews moderation
    getReviews: (params) => api.get('/admin/reviews', { params }),
    approveReview: (id) => api.put(`/admin/reviews/${id}/approve`),
    rejectReview: (id, reason) =>
        api.put(`/admin/reviews/${id}/reject`, { reason }),
    deleteReview: (id) => api.delete(`/admin/reviews/${id}`),

    // Delivery images moderation
    getDeliveryImages: (params) => api.get('/admin/delivery-images', { params }),
    toggleFeaturedDeliveryImage: (id) =>
        api.put(`/admin/delivery-images/${id}/feature`),
    deleteDeliveryImage: (id) => api.delete(`/admin/delivery-images/${id}`),

    // Hero Slides
    getHeroSlides: () => api.get('/admin/hero-slides'),
    createHeroSlide: (data) => api.post('/admin/hero-slides', data),
    updateHeroSlide: (id, data) => api.put(`/admin/hero-slides/${id}`, data),
    deleteHeroSlide: (id) => api.delete(`/admin/hero-slides/${id}`),

    // Settings
    getSettings: () => api.get('/admin/settings'),
    updateSetting: (key, value) => api.put(`/admin/settings/${key}`, { value }),
};

// Public - Hero slides and settings for landing page
export const publicAPI = {
    getHeroSlides: () => api.get('/hero-slides'),
    getSettings: () => api.get('/settings/public'),
    getPaymentSettings: () => api.get('/settings/public'),
};

export default api;
