import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import type { Restaurant, MenuItem, Order, ServiceArea } from '../../types';
import {
  Search,
  Clock,
  MapPin,
  Phone,
  ArrowLeft,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bike,
  UtensilsCrossed,
  ChefHat,
  PackageCheck,
  ChevronRight,
  Sparkles,
  PhoneCall,
  User as UserIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomerViewProps {
  selectedVillage: string;
  isOrdersModalOpen: boolean;
  onCloseOrdersModal: () => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  selectedVillage,
  isOrdersModalOpen,
  onCloseOrdersModal,
}) => {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const {
    items: cartItems,
    restaurantId: cartRestId,
    restaurantName: cartRestName,
    subtotalPaise,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    conflictState,
    resolveConflict,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
  } = useCart();

  // State
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vegOnlyFilter, setVegOnlyFilter] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>(user?.name || 'Rahul Deshmukh');
  const [customerPhone, setCustomerPhone] = useState<string>(user?.phone || '9890055555');
  const [addressLine, setAddressLine] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('gharpoch_saved_address');
      if (stored) return JSON.parse(stored).addressLine || 'House No. 45, Near Gram Panchayat';
    } catch {}
    return 'House No. 45, Near Gram Panchayat';
  });
  const [landmark, setLandmark] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('gharpoch_saved_address');
      if (stored) return JSON.parse(stored).landmark || 'Opposite Hanuman Mandir';
    } catch {}
    return 'Opposite Hanuman Mandir';
  });
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);

  // Sync address if updated in Account modal
  useEffect(() => {
    const handleAddressSync = () => {
      try {
        const stored = localStorage.getItem('gharpoch_saved_address');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.addressLine) setAddressLine(parsed.addressLine);
          if (parsed.landmark) setLandmark(parsed.landmark);
        }
      } catch {}
    };
    window.addEventListener('gharpoch_address_updated', handleAddressSync);
    return () => window.removeEventListener('gharpoch_address_updated', handleAddressSync);
  }, []);

  // Tracking state
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  // Load Restaurants & Service Areas
  useEffect(() => {
    const loadDiscoveryData = async () => {
      setIsLoading(true);
      try {
        const [rests, areas] = await Promise.all([
          api.getRestaurants(selectedVillage),
          api.getServiceAreas(),
        ]);
        setRestaurants(rests);
        setServiceAreas(areas);
      } catch (err) {
        console.error('Failed to load restaurants:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDiscoveryData();
  }, [selectedVillage]);

  // Load Customer Orders when Orders Modal opens or when tracking
  const refreshCustomerOrders = async () => {
    try {
      const orders = await api.getMyOrders();
      setMyOrders(orders);
      if (activeTrackingOrder) {
        const refreshed = orders.find((o) => o.id === activeTrackingOrder.id);
        if (refreshed) setActiveTrackingOrder(refreshed);
      }
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    }
  };

  useEffect(() => {
    if (isOrdersModalOpen || activeTrackingOrder) {
      refreshCustomerOrders();
      const interval = setInterval(refreshCustomerOrders, 8000);
      return () => clearInterval(interval);
    }
  }, [isOrdersModalOpen, activeTrackingOrder?.id]);

  // Handle open restaurant details
  const handleOpenRestaurant = async (r: Restaurant) => {
    try {
      const fullDetails = await api.getRestaurantDetails(r.id);
      setSelectedRestaurant(fullDetails);
      setSelectedCategory('all');
    } catch {
      setSelectedRestaurant(r);
    }
  };

  // Current village delivery fee calculation
  const currentArea = serviceAreas.find(
    (a) => a.villageName.toLowerCase() === selectedVillage.toLowerCase()
  );
  const deliveryFeePaise = currentArea ? currentArea.deliveryFeePaise : 3000;
  const platformFeePaise = 500;
  const totalPayablePaise = subtotalPaise + deliveryFeePaise + platformFeePaise;

  // Submit Order
  const handlePlaceOrder = async () => {
    if (!cartRestId || cartItems.length === 0) return;
    if (!customerName.trim() || !customerPhone.trim() || !addressLine.trim()) {
      alert('कृपया सर्व आवश्यक माहिती भरा (Name, Phone, Address are required).');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const idempotencyKey = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const orderData = {
        restaurantId: cartRestId,
        items: cartItems.map((i) => ({
          menuItemId: i.menuItem.id,
          quantity: i.quantity,
          portionSize: i.portionSize,
        })),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        village: selectedVillage,
        addressLine: addressLine.trim(),
        landmark: landmark.trim(),
        specialInstructions: specialInstructions.trim(),
        idempotencyKey,
      };

      const placedOrder = await api.createOrder(orderData);
      try {
        localStorage.setItem(
          'gharpoch_saved_address',
          JSON.stringify({ village: selectedVillage, addressLine: addressLine.trim(), landmark: landmark.trim() })
        );
      } catch {}
      clearCart();
      setIsCheckoutOpen(false);
      setIsCartDrawerOpen(false);
      setActiveTrackingOrder(placedOrder);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      alert(err.message || 'ऑर्डर नोंदवताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Cancel active order
  const handleCancelActiveOrder = async (orderId: string) => {
    if (!confirm('तुम्हाला ही ऑर्डर नक्की रद्द करायची आहे का? (Are you sure you want to cancel?)')) {
      return;
    }
    try {
      const cancelled = await api.cancelOrder(orderId, 'Cancelled by customer via app');
      setActiveTrackingOrder(cancelled);
      refreshCustomerOrders();
    } catch (e: any) {
      alert(e.message || 'Failed to cancel order');
    }
  };

  // Filtered menu items when restaurant detail is active
  const menuCategories = selectedRestaurant?.categories || [];
  const allMenuItems: MenuItem[] = menuCategories.flatMap((c) => c.items || []);

  const filteredMenuItems = allMenuItems.filter((item) => {
    if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
      return false;
    }
    if (vegOnlyFilter && !item.veg) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchEn = item.nameEn?.toLowerCase().includes(q);
      const matchMr = item.nameMr?.toLowerCase().includes(q);
      return matchEn || matchMr;
    }
    return true;
  });

  return (
    <div className="min-h-screen pb-24">
      {/* -------------------- 1. HERO BANNER -------------------- */}
      {!selectedRestaurant && (
        <div className="bg-gradient-to-b from-orange-500/10 via-orange-500/5 to-transparent px-4 pt-4 pb-6">
          <div className="max-w-4xl mx-auto">
            {/* Village & Greeting Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-900 text-xs font-semibold mb-2">
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              <span>
                {t('hero.deliveringTo', 'डिलिव्हरी ठिकाण')}: <strong>{selectedVillage}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-orange-600 tracking-tight leading-snug">
              {t('hero.title', 'भूक लागलीये?')} <span className="text-orange-700">{t('hero.subtitle', 'तुमच्या आवडीचे जेवण आता घरपोच!')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              {t('hero.features', 'स्थानिक हॉटेल्स • सोपी ऑर्डर • घरपोच डिलिव्हरी')}
            </p>

            {/* Search Bar */}
            <div className="mt-4 relative">
              <Search className="w-4 h-4 text-orange-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={lang === 'mr' ? 'हॉटेल किंवा पदार्थाचे नाव शोधा (उदा. हांडी, भाकरी, थाळी)...' : 'Search hotels or dishes (e.g. Handi, Bhakri, Thali)...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white pl-10 pr-4 py-2.5 rounded-2xl border border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm shadow-xs outline-hidden transition"
              />
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 2. RESTAURANT DETAIL SCREEN -------------------- */}
      {selectedRestaurant ? (
        <div className="max-w-4xl mx-auto px-4 py-4 animate-fade-in">
          {/* Back Button */}
          <button
            onClick={() => setSelectedRestaurant(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-orange-600 mb-3 hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'mr' ? 'सर्व हॉटेल्स पहा' : 'Back to Restaurants'}</span>
          </button>

          {/* Hotel Cover & Meta Card */}
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md">
            <div className="relative h-44 sm:h-56 bg-slate-200">
              <img
                src={selectedRestaurant.coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'}
                alt={selectedRestaurant.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black">{selectedRestaurant.nameMr}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-bold">
                    {selectedRestaurant.name}
                  </span>
                </div>
                <p className="text-xs text-white/90 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-300" />
                  <span>{selectedRestaurant.address}</span>
                </p>
              </div>
            </div>

            {/* Timing, Prep Time & Minimum Order */}
            <div className="p-3.5 bg-amber-50/50 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-amber-100/60">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-slate-700 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{selectedRestaurant.prepTimeMinutes} {t('restaurants.prepTime', 'मिनिटे')}</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-700 font-medium">
                  {t('restaurants.minOrder', 'किमान ऑर्डर')}: ₹{(selectedRestaurant.minOrderPaise / 100).toFixed(0)}
                </span>
              </div>
              <a
                href={`tel:${selectedRestaurant.contactPhone}`}
                className="flex items-center gap-1 text-orange-600 font-bold hover:underline"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{selectedRestaurant.contactPhone}</span>
              </a>
            </div>
          </div>

          {/* Sticky Category Tabs & Veg Filter */}
          <div className="sticky top-14 z-30 bg-[#FBF9F4]/95 backdrop-blur-md py-2.5 my-3 flex items-center justify-between gap-2 border-b border-slate-200">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-amber-300'
                }`}
              >
                {t('filter.all', 'सर्व खाद्यपदार्थ')}
              </button>
              {menuCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-amber-300'
                  }`}
                >
                  {lang === 'mr' ? cat.nameMr : cat.nameEn}
                </button>
              ))}
            </div>

            {/* Veg Only Toggle */}
            <button
              onClick={() => setVegOnlyFilter(!vegOnlyFilter)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 border transition cursor-pointer ${
                vegOnlyFilter
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
              <span>Veg</span>
            </button>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
            {filteredMenuItems.map((item) => {
              const inCart = cartItems.find((i) => i.menuItem.id === item.id);
              const qty = inCart ? inCart.quantity : 0;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-3.5 border transition flex items-center justify-between gap-3 shadow-xs ${
                    !item.available ? 'opacity-60 bg-slate-50 border-slate-200' : 'border-slate-100 hover:border-amber-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-3 h-3 rounded-xs flex items-center justify-center border ${item.veg ? 'border-emerald-600' : 'border-rose-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.veg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{item.nameMr}</h4>
                    </div>

                    <p className="text-xs text-slate-500 font-medium">{item.nameEn}</p>
                    {item.portionSize && (
                      <span className="inline-block text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-sm mt-1">
                        {item.portionSize}
                      </span>
                    )}

                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-black text-base text-orange-600">
                        ₹{(item.pricePaise / 100).toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Image & Action Button */}
                  <div className="flex flex-col items-center gap-2">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.nameEn}
                        className="w-20 h-20 rounded-xl object-cover bg-slate-100 shadow-xs"
                      />
                    )}

                    {!item.available ? (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                        {t('menu.outOfStock', 'संपले आहे')}
                      </span>
                    ) : qty > 0 ? (
                      <div className="flex items-center bg-orange-600 text-white rounded-xl px-1.5 py-0.5 shadow-xs">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:text-amber-300 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 font-bold text-xs">{qty}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:text-amber-300 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addItem(item, selectedRestaurant.id, selectedRestaurant.name)}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-3.5 py-1 rounded-xl font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('menu.addToCart', '+ जोडा')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* -------------------- 3. RESTAURANTS DISCOVERY LIST -------------------- */
        <div className="max-w-4xl mx-auto px-4 mt-2">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
              <UtensilsCrossed className="w-4 h-4 text-amber-600" />
              <span>{t('restaurants.nearYou', 'तुमच्या जवळची हॉटेल्स')}</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              {restaurants.length} {lang === 'mr' ? 'हॉटेल्स उपलब्ध' : 'Hotels available'}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white rounded-3xl h-44 animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="font-bold text-slate-800">
                {lang === 'mr' ? 'या गावात सध्या हॉटेल्स उपलब्ध नाहीत' : 'No restaurants currently found in this village'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'mr' ? 'कृपया वरील गावांच्या यादीतून दुसरे गाव निवडा.' : 'Please select another village above.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {restaurants.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleOpenRestaurant(r)}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer group"
                >
                  <div className="relative h-40 bg-slate-100">
                    <img
                      src={r.coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'}
                      alt={r.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-orange-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                      {r.open ? t('restaurants.open', 'ऑर्डर चालू') : t('restaurants.closed', 'बंद')}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-xs flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>{r.prepTimeMinutes} {t('restaurants.prepTime', 'मिनिटे')}</span>
                    </div>
                  </div>

                  <div className="p-3.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-base text-slate-900 group-hover:text-amber-600 transition">
                        {r.nameMr}
                      </h4>
                      <span className="text-xs font-semibold text-slate-400">{r.name}</span>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{r.cuisineTypes}</p>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span>{t('restaurants.minOrder', 'किमान ऑर्डर')}: ₹{(r.minOrderPaise / 100).toFixed(0)}</span>
                      <span className="text-orange-600 font-bold flex items-center gap-0.5">
                        {lang === 'mr' ? 'मेनू पहा' : 'View Menu'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------- 4. FLOATING CART BOTTOM BAR -------------------- */}
      {cartItems.length > 0 && !isCartDrawerOpen && !isCheckoutOpen && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40 animate-slide-up">
          <div
            onClick={() => setIsCartDrawerOpen(true)}
            className="bg-orange-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer border border-amber-400/30"
          >
            <div>
              <p className="text-xs text-amber-300 font-semibold">{cartRestName}</p>
              <p className="text-sm font-black">
                {cartItems.length} {lang === 'mr' ? 'पदार्थ' : 'items'} • ₹{(subtotalPaise / 100).toFixed(0)}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-amber-400 text-slate-900 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs">
              <span>{lang === 'mr' ? 'कार्ट पहा' : 'View Cart'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 5. MULTI-ITEM CART DRAWER -------------------- */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="w-full sm:max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-left">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">{t('cart.title', 'तुमची कार्ट')}</h3>
                <p className="text-xs text-amber-800 font-medium">{cartRestName}</p>
              </div>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartItems.map((item) => (
                <div key={item.menuItem.id} className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-900">{item.menuItem.nameMr}</p>
                    <p className="text-xs text-slate-500">{item.menuItem.nameEn}</p>
                    <p className="font-black text-xs text-orange-600 mt-0.5">
                      ₹{((item.menuItem.pricePaise * item.quantity) / 100).toFixed(0)}
                    </p>
                  </div>

                  <div className="flex items-center bg-slate-100 rounded-xl px-2 py-1">
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, -1)}
                      className="p-1 hover:text-amber-600 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2.5 font-bold text-xs">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, 1)}
                      className="p-1 hover:text-amber-600 transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bill Summary & Checkout Button */}
            <div className="p-4 border-t border-slate-100 bg-[#FBF9F4] space-y-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>{t('cart.subtotal', 'पदार्थांची रक्कम')}</span>
                <span>₹{(subtotalPaise / 100).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>{t('cart.deliveryFee', 'गाव डिलिव्हरी शुल्क')} ({selectedVillage})</span>
                <span>₹{(deliveryFeePaise / 100).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>{t('cart.platformFee', 'प्लॅटफॉर्म शुल्क')}</span>
                <span>₹{(platformFeePaise / 100).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>{t('cart.total', 'एकूण देय रक्कम')}</span>
                <span className="text-orange-600">₹{(totalPayablePaise / 100).toFixed(0)}</span>
              </div>

              <button
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full mt-3 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-2xl font-extrabold text-sm shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{t('cart.checkoutBtn', 'ऑर्डर निश्चित करा (COD)')}</span>
                <ChevronRight className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 6. HOTEL CONFLICT WARNING MODAL -------------------- */}
      {conflictState.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-amber-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="font-extrabold text-center text-slate-900 text-base">
              {t('cart.itemConflictTitle', 'दुसऱ्या हॉटेलमधून ऑर्डर?')}
            </h4>
            <p className="text-xs text-slate-600 text-center mt-1">
              {t('cart.itemConflictDesc', 'एका वेळी एकाच हॉटेलमधून ऑर्डर करता येते. नवीन हॉटेल निवडल्यास सध्याची कार्ट रीसेट होईल.')}
            </p>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => resolveConflict(true)}
                className="w-full bg-orange-600 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs"
              >
                {t('cart.clearAndAdd', 'हो, नवीन हॉटेल निवडा')}
              </button>
              <button
                onClick={() => resolveConflict(false)}
                className="w-full bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold text-xs"
              >
                {t('cart.keepOld', 'रद्द करा')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 7. CHECKOUT MODAL -------------------- */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
            <div className="p-4 bg-orange-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">{t('checkout.title', 'डिलिव्हरी माहिती आणि चेकआउट')}</h3>
                <p className="text-xs text-amber-300 font-medium">{cartRestName}</p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('checkout.customerName', 'तुमचे नाव')} *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-200 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('checkout.customerPhone', 'मोबाईल नंबर')} *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-200 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('checkout.village', 'गाव')}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedVillage}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('checkout.landmark', 'जवळची खूण (Landmark)')}
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="उदा. हनुमान मंदिर"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-200 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('checkout.addressLine', 'घर क्र. / गल्ली / रस्ता')} *
                </label>
                <textarea
                  rows={2}
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-200 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('menu.specialInstructions', 'विशेष सूचना (Optional)')}
                </label>
                <input
                  type="text"
                  placeholder="उदा. भाजी मध्यम तिखट ठेवा"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-200 outline-hidden"
                />
              </div>

              {/* COD Payment Badge */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="font-extrabold text-xs text-slate-800">
                    पेमेंट पद्धत: रोख रक्कम (Cash on Delivery)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  {t('checkout.codNotice', 'जेवण मिळाल्यावर डिलिव्हरी बॉयला रोख रक्कम द्या.')}
                </p>
              </div>

              {/* Total Summary */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium">एकूण देय रक्कम:</span>
                  <p className="text-xl font-black text-orange-600">₹{(totalPayablePaise / 100).toFixed(0)}</p>
                </div>
                <button
                  disabled={isSubmittingOrder}
                  onClick={handlePlaceOrder}
                  className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-900 px-6 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingOrder ? (
                    <span>नोंदवत आहे...</span>
                  ) : (
                    <>
                      <span>{t('checkout.placeOrderBtn', 'ऑर्डर निश्चित करा')}</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 8. LIVE ORDER TRACKING MODAL -------------------- */}
      {activeTrackingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
            <div className="p-4 bg-orange-600 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-300 font-semibold">{t('tracking.title', 'थेट ऑर्डर ट्रॅकिंग')}</span>
                <h3 className="font-black text-lg">{activeTrackingOrder.publicOrderNumber}</h3>
              </div>
              <button
                onClick={() => setActiveTrackingOrder(null)}
                className="text-white/80 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Delivery OTP Callout */}
              {activeTrackingOrder.deliveryOtp && activeTrackingOrder.status !== 'DELIVERED' && (
                <div className="bg-amber-50 border-2 border-dashed border-amber-300 p-3 rounded-2xl text-center">
                  <span className="text-xs font-bold text-amber-900">
                    {t('tracking.otpLabel', 'डिलिव्हरी ओटीपी (OTP):')}
                  </span>
                  <p className="text-2xl font-black text-orange-600 tracking-widest my-0.5">
                    {activeTrackingOrder.deliveryOtp}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {t('tracking.otpDesc', 'जेवण पोहोचल्यावर हा कोड डिलिव्हरी पार्टनरला सांगा.')}
                  </p>
                </div>
              )}

              {/* Status Stepper */}
              <div className="space-y-3 py-1">
                {[
                  { key: 'PLACED', label: t('tracking.step1', 'ऑर्डर नोंदवली'), icon: CheckCircle },
                  { key: 'RESTAURANT_ACCEPTED', label: t('tracking.step2', 'हॉटेलने स्वीकारली'), icon: ChefHat },
                  { key: 'PREPARING', label: t('tracking.step3', 'जेवण तयार होत आहे'), icon: UtensilsCrossed },
                  { key: 'ASSIGNED', label: t('tracking.step4', 'डिलिव्हरी पार्टनर नियुक्त'), icon: Bike },
                  { key: 'OUT_FOR_DELIVERY', label: t('tracking.step5', 'डिलिव्हरीसाठी निघाले'), icon: PackageCheck },
                  { key: 'DELIVERED', label: t('tracking.step6', 'घरपोच पोहोचवले'), icon: Sparkles },
                ].map((step, idx) => {
                  const statusOrder = ['PLACED', 'RESTAURANT_ACCEPTED', 'PREPARING', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                  const currentIdx = statusOrder.indexOf(activeTrackingOrder.status);
                  const isDone = currentIdx >= idx;
                  const isCurrent = currentIdx === idx;
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          isDone
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400'
                        } ${isCurrent ? 'ring-4 ring-amber-300 animate-pulse' : ''}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs ${isDone ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Hotel & Rider Contacts */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={`tel:${activeTrackingOrder.restaurantPhone}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t('tracking.callHotel', 'हॉटेलला कॉल')}</span>
                </a>
                {activeTrackingOrder.assignedPartnerPhone && (
                  <a
                    href={`tel:${activeTrackingOrder.assignedPartnerPhone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-400 text-slate-900 text-xs font-bold hover:bg-amber-300"
                  >
                    <Bike className="w-3.5 h-3.5" />
                    <span>{t('tracking.callRider', 'पार्टनरला कॉल')}</span>
                  </a>
                )}
              </div>

              {/* Cancellation button if still in PLACED state */}
              {activeTrackingOrder.status === 'PLACED' && (
                <button
                  onClick={() => handleCancelActiveOrder(activeTrackingOrder.id)}
                  className="w-full text-center text-xs font-bold text-rose-600 hover:underline pt-2"
                >
                  {t('tracking.cancelBtn', 'ऑर्डर रद्द करा')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 9. CUSTOMER ORDERS HISTORY MODAL -------------------- */}
      {isOrdersModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
            <div className="p-4 bg-orange-600 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-base">
                {lang === 'mr' ? 'माझ्या ऑर्डर्स' : 'My Order History'}
              </h3>
              <button onClick={onCloseOrdersModal} className="text-white/80 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              {myOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  {lang === 'mr' ? 'तुम्ही अजून कोणतीही ऑर्डर दिलेली नाही.' : 'No orders placed yet.'}
                </div>
              ) : (
                myOrders.map((o) => (
                  <div
                    key={o.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-[#FBF9F4] hover:border-amber-200 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-900">{o.publicOrderNumber}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        o.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : o.status.startsWith('CANCEL')
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {lang === 'mr' ? o.statusDisplayMr : o.statusDisplay}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-amber-800 mt-1">{o.restaurantName}</p>
                    <p className="text-[11px] text-slate-500">
                      {o.items?.map((it) => `${it.itemNameMr} x${it.quantity}`).join(', ')}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="font-black text-xs text-orange-600">
                        ₹{(o.totalPaise / 100).toFixed(0)} ({o.paymentMethod})
                      </span>
                      <button
                        onClick={() => {
                          onCloseOrdersModal();
                          setActiveTrackingOrder(o);
                        }}
                        className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-0.5"
                      >
                        <span>{lang === 'mr' ? 'ट्रॅकिंग पहा' : 'Track Order'}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
