import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { Header } from './components/common/Header';
import { PwaInstallBanner } from './components/common/PwaInstallBanner';
import { CustomerView } from './components/customer/CustomerView';
import { RestaurantDashboard } from './components/restaurant/RestaurantDashboard';
import { DeliveryDashboard } from './components/delivery/DeliveryDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LoginPage } from './components/auth/LoginPage';
import { Loader2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [selectedVillage, setSelectedVillage] = useState<string>('Karodi');
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState<boolean>(false);

  // Initial loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-200 flex items-center justify-center mb-4 shadow-sm">
          <img src="/logo.svg" alt="GharPoch" className="w-10 h-10 animate-pulse" />
        </div>
        <Loader2 className="w-6 h-6 text-orange-600 animate-spin mb-2" />
        <p className="text-xs font-bold text-orange-800">GharPoch सुरू होत आहे...</p>
      </div>
    );
  }

  // Show Login Page if not logged in
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-slate-800 flex flex-col selection:bg-orange-200 selection:text-orange-950">
      {/* Universal Responsive Header */}
      <Header
        selectedVillage={selectedVillage}
        onSelectVillage={setSelectedVillage}
        onOpenOrdersModal={() => setIsOrdersModalOpen(true)}
      />

      {/* Main View Router based on Logged-in User Role */}
      <main className="flex-1">
        {user.role === 'ROLE_CUSTOMER' && (
          <CustomerView
            selectedVillage={selectedVillage}
            isOrdersModalOpen={isOrdersModalOpen}
            onCloseOrdersModal={() => setIsOrdersModalOpen(false)}
          />
        )}

        {user.role === 'ROLE_RESTAURANT_STAFF' && <RestaurantDashboard />}

        {user.role === 'ROLE_DELIVERY_PARTNER' && <DeliveryDashboard />}

        {user.role === 'ROLE_ADMIN' && <AdminDashboard />}
      </main>

      {/* PWA Installation Prompt */}
      <PwaInstallBanner />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <MainAppContent />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
