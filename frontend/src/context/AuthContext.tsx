import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  activeRole: Role;
  isLoading: boolean;
  login: (phone: string, pass: string) => Promise<void>;
  register: (phone: string, name: string, pass: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: Role) => Promise<void>;
}

const DEMO_ACCOUNTS: Record<Role, { phone: string; pass: string }> = {
  ROLE_CUSTOMER: { phone: '9890055555', pass: 'customer123' },
  ROLE_RESTAURANT_STAFF: { phone: '9822011111', pass: 'hotel123' },
  ROLE_DELIVERY_PARTNER: { phone: '9766033333', pass: 'rider123' },
  ROLE_ADMIN: { phone: '9999999999', pass: 'admin123' },
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  activeRole: 'ROLE_CUSTOMER',
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  switchDemoRole: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [activeRole, setActiveRole] = useState<Role>('ROLE_CUSTOMER');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = api.getToken();
        if (storedToken) {
          const profile = await api.getCurrentUser();
          setUser(profile);
          setActiveRole(profile.role);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.warn('Session expired or invalid, please sign in:', e);
        api.setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (phone: string, pass: string) => {
    setIsLoading(true);
    try {
      const auth = await api.login(phone, pass);
      const profile: User = {
        id: auth.userId,
        name: auth.name,
        phone: auth.phone,
        role: auth.role as Role,
        restaurantId: auth.restaurantId,
        restaurantName: auth.restaurantName,
      };
      setUser(profile);
      setToken(auth.token);
      setActiveRole(profile.role);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (phone: string, name: string, pass: string) => {
    setIsLoading(true);
    try {
      const auth = await api.register(phone, name, pass);
      const profile: User = {
        id: auth.userId,
        name: auth.name,
        phone: auth.phone,
        role: auth.role as Role,
      };
      setUser(profile);
      setToken(auth.token);
      setActiveRole(profile.role);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    setToken(null);
    setActiveRole('ROLE_CUSTOMER');
  };

  const switchDemoRole = async (targetRole: Role) => {
    const creds = DEMO_ACCOUNTS[targetRole];
    if (creds) {
      await login(creds.phone, creds.pass);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeRole,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
