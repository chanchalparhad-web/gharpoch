import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, MenuItem } from '../types';

interface CartConflict {
  isOpen: boolean;
  pendingItem?: MenuItem;
  pendingRestaurantId?: string;
  pendingRestaurantName?: string;
}

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  itemCount: number;
  subtotalPaise: number;
  addItem: (item: MenuItem, restId: string, restName: string) => void;
  updateQuantity: (menuItemId: string, delta: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  conflictState: CartConflict;
  resolveConflict: (confirmSwitch: boolean) => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  restaurantId: null,
  restaurantName: null,
  itemCount: 0,
  subtotalPaise: 0,
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  conflictState: { isOpen: false },
  resolveConflict: () => {},
  isCartDrawerOpen: false,
  setIsCartDrawerOpen: () => {},
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('gharpoch_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [restaurantId, setRestaurantId] = useState<string | null>(() => {
    return localStorage.getItem('gharpoch_cart_rest_id');
  });

  const [restaurantName, setRestaurantName] = useState<string | null>(() => {
    return localStorage.getItem('gharpoch_cart_rest_name');
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [conflictState, setConflictState] = useState<CartConflict>({ isOpen: false });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('gharpoch_cart', JSON.stringify(items));
    if (restaurantId) {
      localStorage.setItem('gharpoch_cart_rest_id', restaurantId);
    } else {
      localStorage.removeItem('gharpoch_cart_rest_id');
    }
    if (restaurantName) {
      localStorage.setItem('gharpoch_cart_rest_name', restaurantName);
    } else {
      localStorage.removeItem('gharpoch_cart_rest_name');
    }
  }, [items, restaurantId, restaurantName]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalPaise = items.reduce((sum, item) => sum + (item.menuItem.pricePaise * item.quantity), 0);

  const addItem = (item: MenuItem, targetRestId: string, targetRestName: string) => {
    // If cart is non-empty and from a different restaurant
    if (items.length > 0 && restaurantId && restaurantId !== targetRestId) {
      setConflictState({
        isOpen: true,
        pendingItem: item,
        pendingRestaurantId: targetRestId,
        pendingRestaurantName: targetRestName,
      });
      return;
    }

    // Set restaurant if fresh cart
    if (items.length === 0) {
      setRestaurantId(targetRestId);
      setRestaurantName(targetRestName);
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItem: item, quantity: 1, restaurantId: targetRestId, restaurantName: targetRestName, portionSize: item.portionSize }];
    });
  };

  const resolveConflict = (confirmSwitch: boolean) => {
    if (confirmSwitch && conflictState.pendingItem && conflictState.pendingRestaurantId) {
      const item = conflictState.pendingItem;
      const rId = conflictState.pendingRestaurantId;
      const rName = conflictState.pendingRestaurantName || '';
      setItems([{ menuItem: item, quantity: 1, restaurantId: rId, restaurantName: rName, portionSize: item.portionSize }]);
      setRestaurantId(rId);
      setRestaurantName(rName);
    }
    setConflictState({ isOpen: false });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.menuItem.id === menuItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });

    if (items.length === 1 && items[0].menuItem.id === menuItemId && items[0].quantity + delta <= 0) {
      setRestaurantId(null);
      setRestaurantName(null);
    }
  };

  const removeItem = (menuItemId: string) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.menuItem.id !== menuItemId);
      if (filtered.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
      }
      return filtered;
    });
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        restaurantName,
        itemCount,
        subtotalPaise,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        conflictState,
        resolveConflict,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
