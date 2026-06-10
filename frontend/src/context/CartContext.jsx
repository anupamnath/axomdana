import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const { user } = useAuth();
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchCart = useCallback(async () => {
        if (!user) {
            setCart([]);
            return;
        }
        setLoading(true);
        try {
            const res = await cartAPI.get();
            setCart(res.data.cart);
        } catch {
            setCart([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const addToCart = async (productId, quantity = 1) => {
        const res = await cartAPI.add({ product_id: productId, quantity });
        setCart(res.data.cart);
    };

    const updateQuantity = async (itemId, quantity) => {
        const res = await cartAPI.update(itemId, { quantity });
        setCart(res.data.cart);
    };

    const removeFromCart = async (itemId) => {
        const res = await cartAPI.remove(itemId);
        setCart(res.data.cart);
    };

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

    return (
        <CartContext.Provider
            value={{ cart, loading, cartCount, cartTotal, addToCart, updateQuantity, removeFromCart, fetchCart }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
