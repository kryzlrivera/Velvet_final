import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      if (product.is_custom) {
        return [...prev, { 
          cart_id: Date.now() + Math.random().toString(36).substr(2, 9),
          product_id: product.id, 
          quantity, 
          price: product.price, 
          product,
          custom_details: product.custom_details 
        }];
      }

      const existing = prev.find(item => item.product_id === product.id && !item.product?.is_custom);
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id && !item.product?.is_custom
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { 
        cart_id: Date.now() + Math.random().toString(36).substr(2, 9),
        product_id: product.id, 
        quantity, 
        price: product.price, 
        product 
      }];
    });
  };

  const removeFromCart = (identifier) => {
    setCart(prev => prev.filter(item => item.cart_id !== identifier && item.product_id !== identifier));
  };

  const clearCart = () => setCart([]);

  const updateQuantity = (identifier, quantity) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => 
      (item.cart_id === identifier || item.product_id === identifier) ? { ...item, quantity } : item
    ));
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, updateQuantity, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};
