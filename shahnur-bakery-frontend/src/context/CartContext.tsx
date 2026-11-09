import React, { createContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  cartKey?: string;
  customization?: { weight: number; flavor: string; cream: string; decoration: string; inscription: string };
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isInCart: (productId: string) => boolean;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('shahnur_cart');
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter(i => typeof i.productId === 'string' && Number.isSafeInteger(i.quantity) && i.quantity > 0 && Number.isFinite(i.price) && i.price >= 0) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('shahnur_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    const key = item.customization ? item.productId + '#' + JSON.stringify(item.customization) : item.productId;
    setCart((prev) => {
      const ex = prev.find((i) => (i.cartKey || i.productId) === key);
      if (ex) {
        return prev.map((i) =>
          (i.cartKey || i.productId) === key ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, { ...item, cartKey: key }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => (i.cartKey || i.productId) !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId);
    setCart((prev) =>
      prev.map((i) => ((i.cartKey || i.productId) === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setCart([]);
  const isInCart = (productId: string) => cart.some((i) => i.productId === productId);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isInCart }}
    >
      {children}
    </CartContext.Provider>
  );
};
