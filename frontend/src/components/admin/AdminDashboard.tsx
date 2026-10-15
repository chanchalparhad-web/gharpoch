import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { soundManager } from '../../utils/sound';
import type {
  Order,
  DashboardStats,
  DeliveryPartner,
  ServiceArea,
  ReconciliationRecord,
  OrderStatus,
  Restaurant,
  MenuCategory,
  MenuItem,
  CreateRestaurantResponse
} from '../../types';
import {
  ShieldCheck,
  Package,
  Clock,
  Store,
  Bike,
  IndianRupee,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  Edit,
  Download,
  AlertTriangle,
  MapPin,
  CheckCircle,
  FileSpreadsheet,
  Plus,
  Trash2,
  Eye,
  X,
  Phone,
  User as UserIcon,
  CheckCircle2,
  ChevronRight,
  History,
  Tag,
  UtensilsCrossed,
  ToggleLeft,
  ToggleRight,
  Copy,
  Key,
  Bell
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'orders' | 'hotels' | 'riders' | 'areas' | 'reconciliation'>('orders');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<DeliveryPartner[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [reconciliation, setReconciliation] = useState<ReconciliationRecord[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  // Filtering states
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [villageFilter, setVillageFilter] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // New incoming order popup alert state for Admin
  const [adminNewOrderAlert, setAdminNewOrderAlert] = useState<Order | null>(null);
  const knownAdminOrderIdsRef = useRef<Set<string>>(new Set());

  // Hotel Account Credentials Modal State
  const [createdHotelCredentials, setCreatedHotelCredentials] = useState<CreateRestaurantResponse | null>(null);
  const [copiedCreds, setCopiedCreds] = useState<boolean>(false);

  // Order Details Modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Assign Partner Modal
  const [assignModalOrder, setAssignModalOrder] = useState<Order | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');

  // Override Order Modal
  const [overrideModalOrder, setOverrideModalOrder] = useState<Order | null>(null);
  const [overrideNewStatus, setOverrideNewStatus] = useState<OrderStatus>('DELIVERED');
  const [overrideReason, setOverrideReason] = useState<string>('प्रशासकीय पडताळणी पूर्ण (Admin verified)');

  // Service Area Edit Modal
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null);
  const [editDeliveryFeeRs, setEditDeliveryFeeRs] = useState<number>(30);
  const [editMinOrderRs, setEditMinOrderRs] = useState<number>(100);

  // Hotel & Menu Management States
  const [selectedHotel, setSelectedHotel] = useState<Restaurant | null>(null);
  const [isAddHotelOpen, setIsAddHotelOpen] = useState<boolean>(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState<boolean>(false);
  const [isAddDishOpen, setIsAddDishOpen] = useState<boolean>(false);

  // Edit Hotel State
  const [isEditHotelOpen, setIsEditHotelOpen] = useState<boolean>(false);
  const [editingHotelData, setEditingHotelData] = useState({
    id: '',
    name: '',
    nameMr: '',
    village: 'Karodi',
    address: '',
    contactPhone: '',
    openingTime: '08:00',
    closingTime: '22:00',
    prepTimeMinutes: 25,
    commissionRatePercent: 10,
    cuisineTypes: 'महाराष्ट्रीयन, थाळी, नाश्ता',
    coverImageUrl: '',
    open: true,
    active: true,
  });

  // Edit Dish State
  const [isEditDishOpen, setIsEditDishOpen] = useState<boolean>(false);
  const [editingDishData, setEditingDishData] = useState({
    id: '',
    categoryId: '',
    nameEn: '',
    nameMr: '',
    descriptionMr: '',
    priceRs: 120,
    veg: true,
    portionSize: '१ प्लेट',
    imageUrl: '',
    available: true,
  });

  // New Hotel Form State (with ownerPassword)
  const [newHotel, setNewHotel] = useState({
    name: '',
    nameMr: '',
    village: 'Karodi',
    address: '',
    contactPhone: '',
    ownerPassword: 'hotel123',
    commissionRatePercent: 10,
    prepTimeMinutes: 25,
    coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    cuisineTypes: 'महाराष्ट्रीयन, थाळी, नाश्ता',
  });

  // New Category Form State
  const [newCategory, setNewCategory] = useState({
    nameEn: '',
    nameMr: '',
    sortOrder: 1,
  });

  // New Dish Form State
  const [newDish, setNewDish] = useState({
    categoryId: '',
    nameEn: '',
    nameMr: '',
    priceRs: 120,
    veg: true,
    portionSize: '१ प्लेट',
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
  });

  const fetchAdminData = async () => {
    try {
      const [st, ords, rds, areas, recon, rests] = await Promise.all([
        api.getAdminDashboardStats(),
        api.getAdminOrders(statusFilter, villageFilter),
        api.getDeliveryPartnersList(),
        api.getServiceAreas(),
        api.getAdminReconciliation(),
        api.getAllRestaurantsAdmin().catch(() => api.getRestaurants()),
      ]);

      // Check if new incoming PLACED order arrived for Admin popup alert
      if (knownAdminOrderIdsRef.current.size > 0) {
        const newlyPlaced = ords.find(
          (o) => o.status === 'PLACED' && !knownAdminOrderIdsRef.current.has(o.id)
        );
        if (newlyPlaced) {
          soundManager.playOrderChime();
          setAdminNewOrderAlert(newlyPlaced);
        }
      } else {
        const anyPlaced = ords.find((o) => o.status === 'PLACED');
        if (anyPlaced) {
          soundManager.playOrderChime();
        }
      }
      ords.forEach((o) => knownAdminOrderIdsRef.current.add(o.id));

      setStats(st);
      setOrders(ords);
      setRiders(rds);
      setServiceAreas(areas);
      setReconciliation(recon);
      setRestaurants(rests);

      // If a hotel is currently selected, refresh its details
      if (selectedHotel) {
        const updated = rests.find((r) => r.id === selectedHotel.id);
        if (updated) {
          const detailed = await api.getRestaurantDetails(updated.id);
          setSelectedHotel(detailed);
        }
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    // 4-second polling for real-time order alerts
    const interval = setInterval(fetchAdminData, 4000);
    return () => clearInterval(interval);
  }, [statusFilter, villageFilter]);

  // Load Order Details & Audit Trail
  const handleOpenOrderDetails = async (order: Order) => {
    setSelectedOrderDetails(order);
    setLoadingHistory(true);
    try {
      const history = await api.getOrderHistory(order.id);
      setOrderHistory(history);
    } catch (e) {
      console.error('Error fetching order history:', e);
      setOrderHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle Assign Delivery Partner
  const handleConfirmAssign = async () => {
    if (!assignModalOrder || !selectedPartnerId) return;
    try {
      await api.assignDeliveryPartner(assignModalOrder.id, selectedPartnerId);
      setAssignModalOrder(null);
      setSelectedPartnerId('');
      if (selectedOrderDetails && selectedOrderDetails.id === assignModalOrder.id) {
        const refreshed = await api.getOrderById(assignModalOrder.id);
        setSelectedOrderDetails(refreshed);
      }
      fetchAdminData();
    } catch (e: any) {
      alert(e.message || 'Error assigning partner');
    }
  };

  // Handle Admin Override
  const handleConfirmOverride = async () => {
    if (!overrideModalOrder || !overrideReason.trim()) return;
    try {
      await api.overrideOrderStatus(overrideModalOrder.id, overrideNewStatus, overrideReason.trim());
      setOverrideModalOrder(null);
      if (selectedOrderDetails && selectedOrderDetails.id === overrideModalOrder.id) {
        const refreshed = await api.getOrderById(overrideModalOrder.id);
        setSelectedOrderDetails(refreshed);
        const history = await api.getOrderHistory(overrideModalOrder.id);
        setOrderHistory(history);
      }
      fetchAdminData();
    } catch (e: any) {
      alert(e.message || 'Error overriding order');
    }
  };

  // Handle Update Service Area
  const handleConfirmAreaUpdate = async () => {
    if (!editingArea) return;
    try {
      await api.updateServiceAreaFee(editingArea.id, editDeliveryFeeRs * 100, editMinOrderRs * 100);
      setEditingArea(null);
      fetchAdminData();
    } catch (e: any) {
      alert(e.message || 'Error updating area');
    }
  };

  // Handle Create Restaurant
  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotel.name || !newHotel.nameMr || !newHotel.contactPhone) {
      alert('हॉटेलचे नाव आणि फोन नंबर आवश्यक आहे!');
      return;
    }
    try {
      const created = await api.createRestaurant({
        ...newHotel,
        ownerPassword: newHotel.ownerPassword || 'hotel123',
      });
      setIsAddHotelOpen(false);
      setCreatedHotelCredentials(created);
      setNewHotel({
        name: '',
        nameMr: '',
        village: 'Karodi',
        address: '',
        contactPhone: '',
        ownerPassword: 'hotel123',
        commissionRatePercent: 10,
        prepTimeMinutes: 25,
        coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
        cuisineTypes: 'महाराष्ट्रीयन, थाळी, नाश्ता',
      });
      await fetchAdminData();
      try {
        const detailed = await api.getRestaurantDetails(created.id);
        setSelectedHotel(detailed);
      } catch {}
    } catch (err: any) {
      alert(err.message || 'Failed to create hotel');
    }
  };

  // Handle Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel || !newCategory.nameMr) return;
    try {
      await api.createMenuCategory(selectedHotel.id, newCategory);
      setIsAddCategoryOpen(false);
      setNewCategory({ nameEn: '', nameMr: '', sortOrder: 1 });
      const detailed = await api.getRestaurantDetails(selectedHotel.id);
      setSelectedHotel(detailed);
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    }
  };

  // Handle Create Dish
  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel || !newDish.categoryId || !newDish.nameMr) {
      alert('कृपया वर्गवारी आणि पदार्थाचे नाव भरा!');
      return;
    }
    try {
      await api.createMenuItem(selectedHotel.id, {
        categoryId: newDish.categoryId,
        nameEn: newDish.nameEn || newDish.nameMr,
        nameMr: newDish.nameMr,
        pricePaise: Math.round(newDish.priceRs * 100),
        veg: newDish.veg,
        portionSize: newDish.portionSize,
        imageUrl: newDish.imageUrl,
        available: true,
      });
      setIsAddDishOpen(false);
      setNewDish({
        categoryId: '',
        nameEn: '',
        nameMr: '',
        priceRs: 120,
        veg: true,
        portionSize: '१ प्लेट',
        imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
      });
      const detailed = await api.getRestaurantDetails(selectedHotel.id);
      setSelectedHotel(detailed);
      alert('नवीन पदार्थ यशस्वीरित्या जोडला गेला!');
    } catch (err: any) {
      alert(err.message || 'Failed to add dish');
    }
  };

  // Toggle Dish Availability
  const handleToggleDishAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      await api.toggleItemAvailability(itemId, !currentStatus);
      if (selectedHotel) {
        const detailed = await api.getRestaurantDetails(selectedHotel.id);
        setSelectedHotel(detailed);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle availability');
    }
  };

  // Delete Dish
  const handleDeleteDish = async (itemId: string, itemName: string) => {
    if (!confirm(`तुम्हाला खात्री आहे का "${itemName}" हा पदार्थ हटवायचा आहे?`)) return;
    try {
      await api.deleteMenuItem(itemId);
      if (selectedHotel) {
        const detailed = await api.getRestaurantDetails(selectedHotel.id);
        setSelectedHotel(detailed);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete dish');
    }
  };

  // Handle Open and Save Edit Hotel
  const handleOpenEditHotel = (hotel: Restaurant) => {
    setEditingHotelData({
      id: hotel.id,
      name: hotel.name,
      nameMr: hotel.nameMr,
      village: hotel.village,
      address: hotel.address || '',
      contactPhone: hotel.contactPhone || '',
      openingTime: hotel.openingTime || '08:00',
      closingTime: hotel.closingTime || '22:00',
      prepTimeMinutes: hotel.prepTimeMinutes || 25,
      commissionRatePercent: hotel.commissionRatePercent || 10,
      cuisineTypes: hotel.cuisineTypes || 'महाराष्ट्रीयन, थाळी, नाश्ता',
      coverImageUrl: hotel.coverImageUrl || '',
      open: hotel.open ?? true,
      active: hotel.active ?? true,
    });
    setIsEditHotelOpen(true);
  };

  const handleSaveEditHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotelData.id || !editingHotelData.nameMr || !editingHotelData.name) {
      alert('हॉटेलचे नाव (मराठी व इंग्रजी) आवश्यक आहे!');
      return;
    }
    try {
      const updated = await api.updateRestaurant(editingHotelData.id, {
        name: editingHotelData.name,
        nameMr: editingHotelData.nameMr,
        village: editingHotelData.village,
        address: editingHotelData.address,
        contactPhone: editingHotelData.contactPhone,
        openingTime: editingHotelData.openingTime,
        closingTime: editingHotelData.closingTime,
        prepTimeMinutes: editingHotelData.prepTimeMinutes,
        commissionPct: editingHotelData.commissionRatePercent,
        cuisineTypes: editingHotelData.cuisineTypes,
        coverImageUrl: editingHotelData.coverImageUrl,
        open: editingHotelData.open,
        active: editingHotelData.active,
      });
      setIsEditHotelOpen(false);
      await fetchAdminData();
      try {
        const detailed = await api.getRestaurantDetails(updated.id);
        setSelectedHotel(detailed);
      } catch {}
      alert('हॉटेलची माहिती व फोटो यशस्वीरित्या अपडेट करण्यात आला!');
    } catch (err: any) {
      alert(err.message || 'हॉटेल माहिती अपडेट करताना त्रुटी आली');
    }
  };

  // Handle Open and Save Edit Dish
  const handleOpenEditDish = (item: MenuItem, currentCategoryId?: string) => {
    setEditingDishData({
      id: item.id,
      categoryId: currentCategoryId || (selectedHotel?.categories?.[0]?.id || ''),
      nameEn: item.nameEn || '',
      nameMr: item.nameMr || '',
      descriptionMr: item.descriptionMr || '',
      priceRs: Math.round(item.pricePaise / 100),
      veg: item.veg ?? true,
      portionSize: item.portionSize || '',
      imageUrl: item.imageUrl || '',
      available: item.available ?? true,
    });
    setIsEditDishOpen(true);
  };

  const handleSaveEditDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDishData.id || !editingDishData.nameMr) {
      alert('पदार्थाचे नाव (मराठी) आवश्यक आहे!');
      return;
    }
    try {
      await api.updateMenuItem(editingDishData.id, {
        categoryId: editingDishData.categoryId,
        nameMr: editingDishData.nameMr,
        nameEn: editingDishData.nameEn || editingDishData.nameMr,
        descriptionMr: editingDishData.descriptionMr,
        pricePaise: Math.round(editingDishData.priceRs * 100),
        imageUrl: editingDishData.imageUrl,
        veg: editingDishData.veg,
        portionSize: editingDishData.portionSize,
        available: editingDishData.available,
      });
      setIsEditDishOpen(false);
      if (selectedHotel) {
        const detailed = await api.getRestaurantDetails(selectedHotel.id);
        setSelectedHotel(detailed);
      }
      alert('पदार्थाची माहिती व फोटो यशस्वीरित्या अपडेट करण्यात आला!');
    } catch (err: any) {
      alert(err.message || 'पदार्थ अपडेट करताना त्रुटी आली');
    }
  };

  // Export Reconciliation to CSV
  const handleExportCSV = () => {
    if (reconciliation.length === 0) {
      alert('No records to export');
      return;
    }
    const headers = ['Order Number', 'Restaurant', 'Village', 'Subtotal (Rs)', 'Delivery Fee (Rs)', 'Total Collected (Rs)', 'GharPoch Platform Earnings (Rs)', 'Hotel Payable (Rs)', 'Rider Earnings (Rs)', 'Date'];
    const rows = reconciliation.map((r) => [
      r.orderNumber,
      `"${r.restaurant}"`,
      r.village,
      r.subtotalRs,
      r.deliveryFeeRs,
      r.totalCollectedRs,
      r.gharpochEarningsRs,
      r.hotelPayableRs,
      r.partnerEarningsRs,
      `"${r.date}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GharPoch_Reconciliation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered orders list by search
  const displayedOrders = orders.filter((o) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase().trim();
    return (
      o.publicOrderNumber.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.restaurantName?.toLowerCase().includes(q) ||
      o.village?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 animate-fade-in pb-24 text-slate-800">
      {/* -------------------- ADMIN HEADER & KPI STATS -------------------- */}
      <div className="bg-white rounded-3xl p-5 border border-orange-100 shadow-sm mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-orange-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">GharPoch Central Admin</h2>
                <span className="bg-orange-100 text-orange-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200">
                  प्रशासक पॅनेल
                </span>
              </div>
              <p className="text-xs text-orange-800/80 font-medium">
                {lang === 'mr' ? 'गाव-पातळीवरील थेट ऑर्डर डिस्पॅच, हॉटेल व्यवस्थापन आणि हिशोब' : 'Hyperlocal Dispatch, Hotel & Menu Operations, Fleet & Settlements'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Account Info Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-50/80 border border-orange-200 rounded-2xl text-xs font-semibold text-orange-950">
              <UserIcon className="w-3.5 h-3.5 text-orange-600" />
              <span>{user?.name || 'Admin'}</span>
              <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.2 rounded-md">HQ Ops</span>
            </div>

            <button
              onClick={() => {
                setIsRefreshing(true);
                fetchAdminData();
              }}
              className="p-2 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 text-xs font-bold transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 6 KPI Cards in Orange & White theme */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
            <div className="p-3 bg-white rounded-2xl border border-orange-100 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 block">
                {lang === 'mr' ? 'एकूण ऑर्डर्स' : 'Total Orders'}
              </span>
              <span className="text-xl font-black text-slate-900">{stats.totalOrders}</span>
            </div>

            <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80">
              <span className="text-[11px] font-bold text-amber-900 block">
                {lang === 'mr' ? 'प्रलंबित ऑर्डर्स' : 'Pending Action'}
              </span>
              <span className="text-xl font-black text-amber-700">{stats.pendingOrders}</span>
            </div>

            <div className="p-3 bg-orange-50/70 rounded-2xl border border-orange-200/80">
              <span className="text-[11px] font-bold text-orange-900 block">
                {lang === 'mr' ? 'नोंदणीकृत हॉटेल्स' : 'Hotels'}
              </span>
              <span className="text-xl font-black text-orange-700">{restaurants.length || stats.activeRestaurants}</span>
            </div>

            <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200/80">
              <span className="text-[11px] font-bold text-blue-900 block">
                {lang === 'mr' ? 'उपलब्ध रायडर्स' : 'Available Riders'}
              </span>
              <span className="text-xl font-black text-blue-700">{stats.availableDeliveryPartners}</span>
            </div>

            <div className="p-3 bg-orange-100/60 rounded-2xl border border-orange-200/80">
              <span className="text-[11px] font-bold text-orange-950 block">
                {lang === 'mr' ? 'एकूण विक्री (GMV)' : 'Gross Sales'}
              </span>
              <span className="text-xl font-black text-orange-800">
                ₹{(stats.grossMerchandiseValuePaise / 100).toFixed(0)}
              </span>
            </div>

            <div className="p-3 bg-orange-600 rounded-2xl text-white shadow-xs">
              <span className="text-[11px] font-bold text-orange-100 block">
                {lang === 'mr' ? 'GharPoch नफा' : 'Platform Rev'}
              </span>
              <span className="text-xl font-black text-white">
                ₹{(stats.platformCommissionsPaise / 100).toFixed(0)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* -------------------- ADMIN NAVIGATION TABS -------------------- */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-4 bg-white p-1.5 rounded-2xl border border-orange-100 shadow-xs">
        {[
          { key: 'orders', icon: Package, label: lang === 'mr' ? 'ऑर्डर व्यवस्थापन' : 'Live Order Book' },
          { key: 'hotels', icon: Store, label: lang === 'mr' ? 'हॉटेल्स आणि मेनू' : 'Hotels & Menus' },
          { key: 'riders', icon: Bike, label: lang === 'mr' ? 'डिलिव्हरी फ्लीट' : 'Delivery Fleet' },
          { key: 'areas', icon: MapPin, label: lang === 'mr' ? 'गाव आणि दर' : 'Service Areas & Fees' },
          { key: 'reconciliation', icon: FileSpreadsheet, label: lang === 'mr' ? 'आर्थिक ताळेबंद' : 'Financial Settlement' },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* -------------------- 1. LIVE ORDER BOOK TAB -------------------- */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl p-5 border border-orange-100 shadow-sm space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-orange-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={lang === 'mr' ? 'ऑर्डर क्र., ग्राहक, हॉटेल शोधा...' : 'Search order #, customer, hotel...'}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-orange-50/40 pl-9 pr-3 py-2 rounded-xl border border-orange-200 text-xs font-medium focus:ring-2 focus:ring-orange-300 outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-orange-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
              >
                <option value="">{lang === 'mr' ? 'सर्व स्टेटस' : 'All Statuses'}</option>
                <option value="PLACED">PLACED (नवीन)</option>
                <option value="RESTAURANT_ACCEPTED">ACCEPTED</option>
                <option value="PREPARING">PREPARING</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED_BY_RESTAURANT">REJECTED</option>
              </select>

              <select
                value={villageFilter}
                onChange={(e) => setVillageFilter(e.target.value)}
                className="bg-white border border-orange-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
              >
                <option value="">{lang === 'mr' ? 'सर्व गावे' : 'All Villages'}</option>
                <option value="Karodi">Karodi (करोडी)</option>
                <option value="Asegaon">Asegaon (आसेगाव)</option>
                <option value="Sajapur">Sajapur (साजापूर)</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-orange-50/60 text-slate-700 font-bold border-b border-orange-100">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer & Village</th>
                  <th className="p-3">Restaurant</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Rider</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50">
                {displayedOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => handleOpenOrderDetails(ord)}
                    className="hover:bg-orange-50/40 transition cursor-pointer"
                  >
                    <td className="p-3 font-black text-orange-600 whitespace-nowrap">
                      {ord.publicOrderNumber}
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{ord.customerName}</p>
                      <p className="text-[11px] text-slate-500">{ord.village} • {ord.customerPhone}</p>
                    </td>
                    <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">
                      {ord.restaurantName}
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">
                      {ord.items?.map((it) => `${it.itemNameMr} x${it.quantity}`).join(', ')}
                    </td>
                    <td className="p-3 font-black text-slate-900 whitespace-nowrap">
                      ₹{(ord.totalPaise / 100).toFixed(0)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'PLACED'
                          ? 'bg-orange-500 text-white font-black'
                          : ord.status.startsWith('CANCEL')
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {lang === 'mr' ? ord.statusDisplayMr : ord.statusDisplay}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-slate-700">
                      {ord.assignedPartnerName ? (
                        <span className="font-semibold text-orange-800 flex items-center gap-1">
                          <Bike className="w-3 h-3 text-orange-600" />
                          {ord.assignedPartnerName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td
                      className="p-3 text-right whitespace-nowrap space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* View Details Button */}
                      <button
                        onClick={() => handleOpenOrderDetails(ord)}
                        className="px-2 py-1 bg-white hover:bg-orange-50 border border-orange-200 text-orange-700 rounded-lg font-bold text-[11px] transition shadow-2xs cursor-pointer inline-flex items-center gap-1"
                        title="View Full Order Details"
                      >
                        <Eye className="w-3 h-3 text-orange-600" />
                        <span>सविस्तर</span>
                      </button>

                      {/* Assign Rider Button */}
                      <button
                        onClick={() => {
                          setAssignModalOrder(ord);
                          setSelectedPartnerId(riders[0]?.id || '');
                        }}
                        className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-[11px] transition shadow-2xs cursor-pointer"
                        title="Assign Delivery Partner"
                      >
                        {ord.assignedPartnerName ? 'Reassign' : 'Assign Rider'}
                      </button>

                      {/* Status Override Button */}
                      <button
                        onClick={() => {
                          setOverrideModalOrder(ord);
                          setOverrideNewStatus(ord.status);
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition cursor-pointer"
                        title="Admin Status Override"
                      >
                        Override
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------- 2. HOTELS & MENUS MANAGEMENT TAB -------------------- */}
      {activeTab === 'hotels' && (
        <div className="space-y-4">
          {/* Hotels Bar */}
          <div className="bg-white rounded-3xl p-5 border border-orange-100 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-orange-600" />
                  <span>{lang === 'mr' ? 'हॉटेल्स आणि मेनू व्यवस्थापन' : 'Hotels & Menu Catalog Operations'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'mr' ? 'नवीन हॉटेल जोडा, मेनू वर्गवारी आणि खाद्यपदार्थ नियंत्रित करा' : 'Register local hotels, configure menu categories, add dishes, and manage stock'}
                </p>
              </div>

              <button
                onClick={() => setIsAddHotelOpen(true)}
                className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'mr' ? 'नवीन हॉटेल जोडा' : 'Add New Hotel'}</span>
              </button>
            </div>

            {/* List of Registered Hotels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {restaurants.map((hotel) => (
                <div
                  key={hotel.id}
                  onClick={async () => {
                    const detailed = await api.getRestaurantDetails(hotel.id);
                    setSelectedHotel(detailed);
                  }}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer text-left ${
                    selectedHotel?.id === hotel.id
                      ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-200 shadow-xs'
                      : 'border-orange-100 hover:border-orange-200 bg-white hover:bg-orange-50/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={hotel.coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80'}
                      alt={hotel.nameMr}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-orange-100"
                    />
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                          {hotel.village}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditHotel(hotel);
                            }}
                            className="p-1 rounded-md text-orange-600 hover:bg-orange-100 transition cursor-pointer"
                            title="हॉटेल व फोटो बदला (Edit Hotel Details & Photo)"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <span className={`w-2 h-2 rounded-full ${hotel.open ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 truncate mt-1">
                        {hotel.nameMr}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">{hotel.name}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-orange-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                    <span>{hotel.contactPhone}</span>
                    <span className="text-orange-700 font-bold flex items-center gap-0.5">
                      <span>मेनू व्यवस्थापित करा</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Hotel's Menu & Category Operations */}
          {selectedHotel && (
            <div className="bg-white rounded-3xl p-5 border border-orange-100 shadow-sm space-y-5 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-orange-100">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedHotel.coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80'}
                    alt={selectedHotel.nameMr}
                    className="w-12 h-12 rounded-2xl object-cover border border-orange-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-lg text-slate-900">{selectedHotel.nameMr}</h3>
                      <span className="text-xs text-slate-500 font-semibold">({selectedHotel.name})</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      गाव: <strong>{selectedHotel.village}</strong> • पत्ता: {selectedHotel.address} • फोन: {selectedHotel.contactPhone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditHotel(selectedHotel)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 border border-orange-300 text-orange-950 text-xs font-bold transition cursor-pointer shadow-2xs"
                    title="हॉटेलची सर्व माहिती व फोटो बदला"
                  >
                    <Edit className="w-3.5 h-3.5 text-orange-700" />
                    <span>हॉटेल व फोटो बदला (Edit Hotel)</span>
                  </button>

                  <button
                    onClick={() => setIsAddCategoryOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ नवीन वर्गवारी (Category)</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!selectedHotel.categories || selectedHotel.categories.length === 0) {
                        alert('कृपया आधी एक वर्गवारी (Category) तयार करा!');
                        return;
                      }
                      setNewDish((prev) => ({
                        ...prev,
                        categoryId: selectedHotel.categories![0].id,
                      }));
                      setIsAddDishOpen(true);
                    }}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ नवीन खाद्यपदार्थ (Add Dish)</span>
                  </button>
                </div>
              </div>

              {/* Categories & Items Accordion/List */}
              {(!selectedHotel.categories || selectedHotel.categories.length === 0) ? (
                <div className="text-center py-10 bg-orange-50/40 rounded-2xl border border-dashed border-orange-200">
                  <UtensilsCrossed className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                  <h4 className="font-bold text-sm text-slate-800">या हॉटेलमध्ये अद्याप मेनू वर्गवारी नाही</h4>
                  <p className="text-xs text-slate-500 mb-3">पहिली वर्गवारी (उदा. थाळी, जेवण, नाश्ता) तयार करा आणि पदार्थ जोडा.</p>
                  <button
                    onClick={() => setIsAddCategoryOpen(true)}
                    className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs"
                  >
                    + वर्गवारी जोडा
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedHotel.categories.map((cat) => (
                    <div key={cat.id} className="bg-orange-50/30 rounded-2xl p-4 border border-orange-100">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-orange-100">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-orange-600" />
                          <h4 className="font-extrabold text-sm text-slate-900">{cat.nameMr}</h4>
                          <span className="text-xs text-slate-400">({cat.nameEn})</span>
                          <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.2 rounded-full">
                            {cat.items?.length || 0} पदार्थ
                          </span>
                        </div>
                      </div>

                      {/* Dishes in this Category */}
                      {(!cat.items || cat.items.length === 0) ? (
                        <p className="text-xs text-slate-400 italic py-2">या वर्गवारीत अद्याप पदार्थ जोडलेले नाहीत.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {cat.items.map((item) => (
                            <div
                              key={item.id}
                              className="bg-white rounded-xl p-3 border border-orange-100 shadow-2xs flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <img
                                  src={item.imageUrl || 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=200&q=80'}
                                  alt={item.nameMr}
                                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-orange-100"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80';
                                  }}
                                />
                                <div className="overflow-hidden">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                      item.veg ? 'border-emerald-600' : 'border-rose-600'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        item.veg ? 'bg-emerald-600' : 'bg-rose-600'
                                      }`} />
                                    </span>
                                    <h5 className="font-bold text-xs text-slate-900 truncate">{item.nameMr}</h5>
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate">{item.nameEn}</p>
                                  <p className="font-black text-xs text-orange-700 mt-0.5">
                                    ₹{(item.pricePaise / 100).toFixed(0)}
                                    {item.portionSize && <span className="font-normal text-[10px] text-slate-400 ml-1">({item.portionSize})</span>}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {/* Edit Dish Button */}
                                <button
                                  onClick={() => handleOpenEditDish(item, cat.id)}
                                  className="p-1.5 rounded-lg text-orange-700 hover:bg-orange-100 transition cursor-pointer"
                                  title="पदार्थ व फोटो बदला (Edit Dish & Photo)"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                {/* Stock Availability Toggle */}
                                <button
                                  onClick={() => handleToggleDishAvailability(item.id, item.available)}
                                  className={`p-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    item.available
                                      ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                      : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                                  }`}
                                  title={item.available ? 'उपलब्ध (In Stock) - क्लिक करून बंद करा' : 'बंद (Out of Stock) - क्लिक करून चालू करा'}
                                >
                                  {item.available ? (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                                      सक्रिय
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                                      बंद
                                    </span>
                                  )}
                                </button>

                                {/* Delete Dish Button */}
                                <button
                                  onClick={() => handleDeleteDish(item.id, item.nameMr)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                                  title="पदार्थ हटवा (Delete Dish)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* -------------------- 3. DELIVERY FLEET TAB -------------------- */}
      {activeTab === 'riders' && (
        <div className="bg-white rounded-3xl p-5 border border-orange-100 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">
            {lang === 'mr' ? 'गाव डिलिव्हरी पार्टनर ताफा' : 'Registered Village Delivery Fleet'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {riders.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl border border-orange-100 bg-[#FFFDF9] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bike className="w-4 h-4 text-orange-600" />
                    <span className="font-black text-sm text-slate-900">{r.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    r.availabilityStatus === 'ONLINE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {r.availabilityStatus}
                  </span>
                </div>

                <p className="text-xs text-slate-600">मोबाईल: <strong>{r.phone}</strong></p>
                <p className="text-xs text-slate-600">गाडी क्र.: {r.vehicleNumber}</p>

                <div className="pt-2 border-t border-orange-100 flex justify-between text-xs font-bold text-slate-700">
                  <span>पूर्ण डिलिव्हरी: {r.totalDeliveries}</span>
                  <span className="text-emerald-700">कमाई: ₹{r.totalEarningsRs.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- 4. SERVICE AREAS & FEES TAB -------------------- */}
      {activeTab === 'areas' && (
        <div className="bg-white rounded-3xl p-5 border border-orange-100 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">
            {lang === 'mr' ? 'कार्यक्षेत्र गावे आणि डिलिव्हरी दर' : 'Serviceable Villages & Delivery Fee Matrix'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {serviceAreas.map((area) => (
              <div key={area.id} className="p-4 rounded-2xl border border-orange-100 bg-[#FFFDF9] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <span className="font-black text-base text-slate-900">{area.villageNameMr}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">{area.villageName}</span>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>डिलिव्हरी शुल्क:</span>
                    <strong className="text-slate-900">₹{(area.deliveryFeePaise / 100).toFixed(0)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>किमान ऑर्डर मूल्य:</span>
                    <strong className="text-slate-900">₹{(area.minOrderPaise / 100).toFixed(0)}</strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingArea(area);
                    setEditDeliveryFeeRs(area.deliveryFeePaise / 100);
                    setEditMinOrderRs(area.minOrderPaise / 100);
                  }}
                  className="w-full bg-orange-600 text-white py-1.5 rounded-xl font-bold text-xs shadow-2xs hover:bg-orange-700 cursor-pointer"
                >
                  दर बदला (Edit Fee)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- 5. FINANCIAL SETTLEMENT RECONCILIATION TAB -------------------- */}
      {activeTab === 'reconciliation' && (
        <div className="bg-white rounded-3xl p-5 border border-orange-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-base text-slate-900">
                {lang === 'mr' ? 'आर्थिक ताळेबंद आणि हिशोब' : 'Financial Reconciliation & Settlements'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'mr' ? 'हॉटेल विक्री, डिलिव्हरी फी आणि GharPoch कमिशनचे स्पष्ट विभाजन' : 'Breakdown separating hotel sales, rider payout, and platform fee'}
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className="bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-orange-200" />
              <span>CSV डाऊनलोड करा</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-orange-50/60 text-slate-700 font-bold border-b border-orange-100">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Restaurant</th>
                  <th className="p-3">Village</th>
                  <th className="p-3">Food Total</th>
                  <th className="p-3">Delivery Fee</th>
                  <th className="p-3">Total Paid</th>
                  <th className="p-3 text-emerald-700">Hotel Payable</th>
                  <th className="p-3 text-blue-700">Rider Earning</th>
                  <th className="p-3 text-orange-700 font-black">GharPoch Rev (10%+₹5)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50">
                {reconciliation.map((rec) => (
                  <tr key={rec.orderNumber} className="hover:bg-orange-50/40">
                    <td className="p-3 font-bold text-orange-600">{rec.orderNumber}</td>
                    <td className="p-3 font-semibold">{rec.restaurant}</td>
                    <td className="p-3">{rec.village}</td>
                    <td className="p-3">₹{rec.subtotalRs.toFixed(0)}</td>
                    <td className="p-3">₹{rec.deliveryFeeRs.toFixed(0)}</td>
                    <td className="p-3 font-bold">₹{rec.totalCollectedRs.toFixed(0)}</td>
                    <td className="p-3 font-bold text-emerald-700">₹{rec.hotelPayableRs.toFixed(0)}</td>
                    <td className="p-3 font-bold text-blue-700">₹{rec.partnerEarningsRs.toFixed(0)}</td>
                    <td className="p-3 font-black text-orange-700">₹{rec.gharpochEarningsRs.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== COMPREHENSIVE ORDER DETAILS MODAL ==================== */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-orange-100 p-5 space-y-4 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900">
                      ऑर्डर क्र.: {selectedOrderDetails.publicOrderNumber}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedOrderDetails.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedOrderDetails.status === 'PLACED'
                        ? 'bg-orange-500 text-white'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {lang === 'mr' ? selectedOrderDetails.statusDisplayMr : selectedOrderDetails.statusDisplay}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    वेळ: {new Date(selectedOrderDetails.createdAt).toLocaleString('mr-IN')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer & Delivery Address Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-orange-50/40 p-3.5 rounded-2xl border border-orange-100">
              <div>
                <span className="text-[11px] text-orange-800 font-bold block mb-1">ग्राहक तपशील (Customer):</span>
                <p className="font-bold text-slate-900">{selectedOrderDetails.customerName}</p>
                <p className="text-slate-600 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-orange-600" />
                  <strong>+91 {selectedOrderDetails.customerPhone}</strong>
                </p>
              </div>

              <div>
                <span className="text-[11px] text-orange-800 font-bold block mb-1">डिलिव्हरी पत्ता (Address):</span>
                <p className="font-semibold text-slate-900">
                  {selectedOrderDetails.addressLine}, {selectedOrderDetails.village}
                </p>
                {selectedOrderDetails.landmark && (
                  <p className="text-slate-500 text-[11px]">लँडमार्क: {selectedOrderDetails.landmark}</p>
                )}
                {selectedOrderDetails.specialInstructions && (
                  <p className="text-amber-800 font-medium text-[11px] mt-0.5">सूचना: "{selectedOrderDetails.specialInstructions}"</p>
                )}
              </div>
            </div>

            {/* Hotel & Delivery Partner Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl border border-orange-100 bg-white">
                <span className="text-[11px] text-slate-500 font-bold block mb-1">हॉटेल (Restaurant):</span>
                <p className="font-bold text-slate-900">{selectedOrderDetails.restaurantNameMr || selectedOrderDetails.restaurantName}</p>
                <p className="text-slate-500">संपर्क: {selectedOrderDetails.restaurantPhone || 'N/A'}</p>
              </div>

              <div className="p-3 rounded-2xl border border-orange-100 bg-white">
                <span className="text-[11px] text-slate-500 font-bold block mb-1">डिलिव्हरी पार्टनर व OTP:</span>
                <p className="font-bold text-slate-900 flex items-center gap-1">
                  <Bike className="w-3.5 h-3.5 text-orange-600" />
                  {selectedOrderDetails.assignedPartnerName || <span className="text-slate-400 italic">अद्याप नियुक्त नाही</span>}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-slate-500">डिलिव्हरी OTP:</span>
                  <span className="font-black text-sm text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md tracking-wider">
                    {selectedOrderDetails.deliveryOtp || '----'}
                  </span>
                </div>
              </div>
            </div>

            {/* Ordered Items Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2">ऑर्डर केलेले खाद्यपदार्थ (Items):</h4>
              <div className="border border-orange-100 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-orange-50/70 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5">पदार्थ</th>
                      <th className="p-2.5 text-center">प्रमाण</th>
                      <th className="p-2.5 text-right">दर (₹)</th>
                      <th className="p-2.5 text-right">एकूण (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50">
                    {selectedOrderDetails.items?.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2.5">
                          <p className="font-bold text-slate-900">{it.itemNameMr}</p>
                          <p className="text-[10px] text-slate-500">{it.itemNameEn}</p>
                        </td>
                        <td className="p-2.5 text-center font-bold">x{it.quantity}</td>
                        <td className="p-2.5 text-right">₹{(it.unitPricePaise / 100).toFixed(0)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          ₹{(it.lineTotalPaise / 100).toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill Summary Breakdown */}
            <div className="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-100 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>अन्नाचे उपएकूण (Subtotal):</span>
                <span>₹{(selectedOrderDetails.subtotalPaise / 100).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>गाव डिलिव्हरी शुल्क:</span>
                <span>₹{(selectedOrderDetails.deliveryFeePaise / 100).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>प्लॅटफॉर्म व पॅकेजिंग फी:</span>
                <span>₹{(selectedOrderDetails.platformFeePaise / 100).toFixed(0)}</span>
              </div>
              <div className="pt-2 border-t border-orange-200/60 flex justify-between font-black text-sm text-slate-900">
                <span>एकूण देय रक्कम (Total Payable):</span>
                <span className="text-orange-700 text-base">₹{(selectedOrderDetails.totalPaise / 100).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>पेमेंट पद्धत: <strong>{selectedOrderDetails.paymentMethod}</strong></span>
                <span>स्थिती: <strong className="text-emerald-700">{selectedOrderDetails.paymentStatus}</strong></span>
              </div>
            </div>

            {/* Audit History Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-orange-600" />
                <span>ऑर्डर जीवनचक्र व ऑडिट लॉग (Status Audit Trail):</span>
              </h4>

              {loadingHistory ? (
                <p className="text-xs text-slate-400 italic">ऑडिट नोंदी लोड होत आहेत...</p>
              ) : orderHistory.length === 0 ? (
                <p className="text-xs text-slate-400 italic">या ऑर्डरच्या कोणत्याही बदल नोंदी नाहीत.</p>
              ) : (
                <div className="space-y-2 border-l-2 border-orange-200 ml-2 pl-3">
                  {orderHistory.map((h, i) => (
                    <div key={i} className="text-xs relative">
                      <div className="w-2 h-2 rounded-full bg-orange-600 absolute -left-[17px] top-1.5" />
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{h.newStatus || h.toStatus || 'UPDATED'}</span>
                        <span className="text-[10px] text-slate-400">
                          {h.createdAt
                            ? new Date(h.createdAt).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })
                            : h.timestamp
                            ? new Date(h.timestamp).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        बदलकर्ता: <strong>{h.changedByName || h.actorName || 'प्रणाली (System)'}</strong> ({h.roleAtChange || h.actorRole || 'ROLE_SYSTEM'})
                      </p>
                      {(h.reason || h.notes) && (
                        <p className="text-[11px] text-slate-500 italic bg-white p-1 rounded-md border border-orange-100 mt-0.5">
                          "{h.reason || h.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions Footer inside Modal */}
            <div className="pt-3 border-t border-orange-100 flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => {
                  setAssignModalOrder(selectedOrderDetails);
                  setSelectedPartnerId(riders[0]?.id || '');
                }}
                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Bike className="w-3.5 h-3.5" />
                <span>{selectedOrderDetails.assignedPartnerName ? 'रायडर बदला (Reassign)' : 'रायडर नियुक्त करा'}</span>
              </button>

              <button
                onClick={() => {
                  setOverrideModalOrder(selectedOrderDetails);
                  setOverrideNewStatus(selectedOrderDetails.status);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                स्टेटस ओव्हरराइड (Override)
              </button>

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs cursor-pointer"
              >
                बंद करा (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD HOTEL MODAL ==================== */}
      {isAddHotelOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-orange-100">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100 mb-3">
              <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-orange-600" />
                <span>नवीन हॉटेल जोडा (Add Restaurant)</span>
              </h4>
              <button onClick={() => setIsAddHotelOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHotel} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">हॉटेलचे नाव (मराठी) *:</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. हॉटेल अन्नपूर्णा"
                  value={newHotel.nameMr}
                  onChange={(e) => setNewHotel({ ...newHotel, nameMr: e.target.value })}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hotel Name (English) *:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hotel Annapurna"
                  value={newHotel.name}
                  onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">गाव (Village):</label>
                  <select
                    value={newHotel.village}
                    onChange={(e) => setNewHotel({ ...newHotel, village: e.target.value })}
                    className="w-full bg-white border border-orange-200 rounded-xl p-2 font-semibold"
                  >
                    <option value="Karodi">Karodi (करोडी)</option>
                    <option value="Asegaon">Asegaon (आसेगाव)</option>
                    <option value="Sajapur">Sajapur (साजापूर)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">संपर्क फोन *:</label>
                  <input
                    type="tel"
                    required
                    placeholder="9822000000"
                    value={newHotel.contactPhone}
                    onChange={(e) => setNewHotel({ ...newHotel, contactPhone: e.target.value })}
                    className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">पत्ता (Address):</label>
                <input
                  type="text"
                  placeholder="उदा. बस स्टँडजवळ, करोडी"
                  value={newHotel.address}
                  onChange={(e) => setNewHotel({ ...newHotel, address: e.target.value })}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">हॉटेल मॅनेजर पासवर्ड *:</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. hotel123"
                    value={newHotel.ownerPassword}
                    onChange={(e) => setNewHotel({ ...newHotel, ownerPassword: e.target.value })}
                    className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-mono font-bold text-orange-950 text-xs"
                  />
                  <span className="text-[10px] text-slate-500">हॉटेल लॉगिनसाठी पासवर्ड</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">कमिशन (%):</label>
                  <input
                    type="number"
                    value={newHotel.commissionRatePercent}
                    onChange={(e) => setNewHotel({ ...newHotel, commissionRatePercent: Number(e.target.value) })}
                    className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">अंदाजे वेळ (मिनिटे):</label>
                <input
                  type="number"
                  value={newHotel.prepTimeMinutes}
                  onChange={(e) => setNewHotel({ ...newHotel, prepTimeMinutes: Number(e.target.value) })}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">फोटो लिंक (Image URL):</label>
                <input
                  type="url"
                  value={newHotel.coverImageUrl}
                  onChange={(e) => setNewHotel({ ...newHotel, coverImageUrl: e.target.value })}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-mono text-[11px]"
                />
                {newHotel.coverImageUrl && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-orange-200 h-28 bg-slate-100">
                    <img
                      src={newHotel.coverImageUrl}
                      alt="Hotel Cover Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <span className="absolute bottom-1 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md font-semibold">
                      फोटो प्रिव्ह्यू
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                >
                  हॉटेल नोंदणी करा (Save Hotel)
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddHotelOpen(false)}
                  className="px-4 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
                >
                  रद्द करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD CATEGORY MODAL ==================== */}
      {isAddCategoryOpen && selectedHotel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-orange-100">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100 mb-3">
              <h4 className="font-black text-base text-slate-900">
                नवीन वर्गवारी जोडा: {selectedHotel.nameMr}
              </h4>
              <button onClick={() => setIsAddCategoryOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">वर्गवारीचे नाव (मराठी) *:</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. खास महाराष्ट्रीयन जेवण / थाळी"
                  value={newCategory.nameMr}
                  onChange={(e) => setNewCategory({ ...newCategory, nameMr: e.target.value })}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name (English):</label>
                <input
                  type="text"
                  placeholder="e.g. Maharashtrian Thali / Meals"
                  value={newCategory.nameEn}
                  onChange={(e) => setNewCategory({ ...newCategory, nameEn: e.target.value })}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">क्रम (Sort Order):</label>
                <input
                  type="number"
                  value={newCategory.sortOrder}
                  onChange={(e) => setNewCategory({ ...newCategory, sortOrder: Number(e.target.value) })}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                >
                  वर्गवारी जतन करा
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-4 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
                >
                  रद्द करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD DISH MODAL ==================== */}
      {isAddDishOpen && selectedHotel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-orange-100">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100 mb-3">
              <h4 className="font-black text-base text-slate-900">
                नवीन खाद्यपदार्थ जोडा: {selectedHotel.nameMr}
              </h4>
              <button onClick={() => setIsAddDishOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDish} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">वर्गवारी निवडा (Category) *:</label>
                <select
                  required
                  value={newDish.categoryId}
                  onChange={(e) => setNewDish({ ...newDish, categoryId: e.target.value })}
                  className="w-full bg-white border border-orange-200 rounded-xl p-2 font-semibold"
                >
                  {selectedHotel.categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameMr} ({c.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">पदार्थाचे नाव (मराठी) *:</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. पिठलं भाकरी थाळी / शेव भाजी"
                  value={newDish.nameMr}
                  onChange={(e) => setNewDish({ ...newDish, nameMr: e.target.value })}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dish Name (English):</label>
                <input
                  type="text"
                  placeholder="e.g. Pithla Bhakri Thali"
                  value={newDish.nameEn}
                  onChange={(e) => setNewDish({ ...newDish, nameEn: e.target.value })}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">किंमत (₹) *:</label>
                  <input
                    type="number"
                    required
                    value={newDish.priceRs}
                    onChange={(e) => setNewDish({ ...newDish, priceRs: Number(e.target.value) })}
                    className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-bold text-orange-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">प्रकार (Veg/Non-Veg):</label>
                  <select
                    value={newDish.veg ? 'veg' : 'nonveg'}
                    onChange={(e) => setNewDish({ ...newDish, veg: e.target.value === 'veg' })}
                    className="w-full bg-white border border-orange-200 rounded-xl p-2 font-semibold"
                  >
                    <option value="veg">🟢 शाकाहारी (Veg)</option>
                    <option value="nonveg">🔴 मांसाहारी (Non-Veg)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">प्रमाण / वर्णन (Portion Size):</label>
                <input
                  type="text"
                  placeholder="उदा. १ प्लेट (२ बाजरी भाकरी, पिठलं, ठेचा, कांदा)"
                  value={newDish.portionSize}
                  onChange={(e) => setNewDish({ ...newDish, portionSize: e.target.value })}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">फोटो लिंक (Image URL):</label>
                <input
                  type="url"
                  value={newDish.imageUrl}
                  onChange={(e) => setNewDish({ ...newDish, imageUrl: e.target.value })}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-mono text-[11px]"
                />
                {newDish.imageUrl && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-orange-50/60 rounded-xl border border-orange-200">
                    <img
                      src={newDish.imageUrl}
                      alt="Dish Preview"
                      className="w-14 h-14 rounded-lg object-cover border border-orange-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div>
                      <p className="font-bold text-xs text-slate-800">{newDish.nameMr || 'नवीन पदार्थ'}</p>
                      <p className="text-[10px] text-slate-500">फोटो प्रिव्ह्यू</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                >
                  पदार्थ जतन करा (Save Dish)
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddDishOpen(false)}
                  className="px-4 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
                >
                  रद्द करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- ASSIGN PARTNER MODAL -------------------- */}
      {assignModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-orange-100">
            <h4 className="font-black text-base text-slate-900 mb-1">
              {lang === 'mr' ? 'डिलिव्हरी पार्टनर नियुक्त करा' : 'Assign Delivery Partner'}
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              ऑर्डर: <strong>{assignModalOrder.publicOrderNumber}</strong> ({assignModalOrder.village})
            </p>

            <div className="space-y-2 mb-4">
              <label className="block text-xs font-bold text-slate-700">
                उपलब्ध रायडर निवडा:
              </label>
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-hidden"
              >
                {riders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.vehicleNumber}) - {r.availabilityStatus}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleConfirmAssign}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer"
              >
                {lang === 'mr' ? 'नियुक्ती निश्चित करा' : 'Confirm Assignment'}
              </button>
              <button
                onClick={() => setAssignModalOrder(null)}
                className="w-full bg-slate-100 text-slate-700 py-2 rounded-xl font-bold text-xs cursor-pointer"
              >
                {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- STATUS OVERRIDE MODAL -------------------- */}
      {overrideModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-amber-300">
            <div className="flex items-center gap-2 mb-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-black text-base">
                {lang === 'mr' ? 'प्रशासकीय स्टेटस ओव्हरराइड' : 'Admin Status Override'}
              </h4>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              ऑर्डर: <strong>{overrideModalOrder.publicOrderNumber}</strong>
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">नवीन स्टेटस निवडा:</label>
                <select
                  value={overrideNewStatus}
                  onChange={(e) => setOverrideNewStatus(e.target.value as any)}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 text-xs font-semibold text-slate-800"
                >
                  <option value="PLACED">PLACED</option>
                  <option value="RESTAURANT_ACCEPTED">RESTAURANT_ACCEPTED</option>
                  <option value="PREPARING">PREPARING</option>
                  <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED_BY_ADMIN">CANCELLED_BY_ADMIN</option>
                  <option value="DELIVERY_FAILED">DELIVERY_FAILED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ओव्हरराइडचे बंधनकारक कारण (Audit Log Reason) *:
                </label>
                <textarea
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 text-xs font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleConfirmOverride}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl font-black text-xs shadow-xs cursor-pointer"
              >
                {lang === 'mr' ? 'ओव्हरराइड लागू करा' : 'Apply Override'}
              </button>
              <button
                onClick={() => setOverrideModalOrder(null)}
                className="w-full bg-slate-100 text-slate-700 py-2 rounded-xl font-bold text-xs cursor-pointer"
              >
                {lang === 'mr' ? 'मागे जा' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- EDIT SERVICE AREA MODAL -------------------- */}
      {editingArea && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-orange-100">
            <h4 className="font-black text-base text-slate-900 mb-1">
              दर बदला: {editingArea.villageNameMr} ({editingArea.villageName})
            </h4>

            <div className="space-y-3 my-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">डिलिव्हरी शुल्क (₹):</label>
                <input
                  type="number"
                  value={editDeliveryFeeRs}
                  onChange={(e) => setEditDeliveryFeeRs(Number(e.target.value))}
                  className="w-full border border-orange-200 rounded-xl p-2 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">किमान ऑर्डर मूल्य (₹):</label>
                <input
                  type="number"
                  value={editMinOrderRs}
                  onChange={(e) => setEditMinOrderRs(Number(e.target.value))}
                  className="w-full border border-orange-200 rounded-xl p-2 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleConfirmAreaUpdate}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer"
              >
                जतन करा (Save)
              </button>
              <button
                onClick={() => setEditingArea(null)}
                className="w-full bg-slate-100 text-slate-700 py-2 rounded-xl font-bold text-xs cursor-pointer"
              >
                रद्द करा (Cancel)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- ADMIN INSTANT NEW ORDER ALERT MODAL -------------------- */}
      {adminNewOrderAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-orange-500 overflow-hidden text-left animate-scale-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center animate-bounce">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-base leading-tight">
                    {lang === 'mr' ? '🔔 नवीन ऑर्डर सूचना (Admin Alert)!' : '🔔 New Order Alert!'}
                  </h4>
                  <p className="text-xs text-orange-100 font-semibold">
                    ऑर्डर #{adminNewOrderAlert.publicOrderNumber || adminNewOrderAlert.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAdminNewOrderAlert(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Details */}
            <div className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-orange-50/70 rounded-2xl border border-orange-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">{lang === 'mr' ? 'हॉटेल (Hotel):' : 'Hotel:'}</span>
                  <strong className="text-slate-900 font-extrabold text-sm">
                    {adminNewOrderAlert.restaurantNameMr || adminNewOrderAlert.restaurantName}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">{lang === 'mr' ? 'ग्राहक (Customer):' : 'Customer:'}</span>
                  <span className="text-slate-800 font-bold">
                    {adminNewOrderAlert.customerName} (+91 {adminNewOrderAlert.customerPhone})
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2 pt-1 border-t border-orange-200/60">
                  <span className="text-slate-500 font-semibold shrink-0">{lang === 'mr' ? 'पत्ता (Address):' : 'Address:'}</span>
                  <span className="text-right text-slate-800 font-medium">
                    {adminNewOrderAlert.addressLine},{' '}
                    <strong>{adminNewOrderAlert.village}</strong>
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-orange-200/60">
                  <span className="text-slate-500 font-semibold">{lang === 'mr' ? 'रक्कम (Total):' : 'Total:'}</span>
                  <strong className="text-base font-black text-orange-700">
                    ₹{(adminNewOrderAlert.totalPaise / 100).toFixed(0)}
                  </strong>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                💡 ही ऑर्डर नुकतीच नोंदवली गेली आहे. तुम्ही त्वरित रायडर नियुक्त करू शकता किंवा संपूर्ण तपशील तपासू शकता.
              </p>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => {
                  const ord = adminNewOrderAlert;
                  setAdminNewOrderAlert(null);
                  handleOpenOrderDetails(ord);
                }}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{lang === 'mr' ? 'सविस्तर पहा' : 'View Order'}</span>
              </button>

              <button
                onClick={() => {
                  const ord = adminNewOrderAlert;
                  setAdminNewOrderAlert(null);
                  setAssignModalOrder(ord);
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <Bike className="w-3.5 h-3.5" />
                <span>{lang === 'mr' ? 'रायडर नियुक्त करा' : 'Assign Rider'}</span>
              </button>

              <button
                onClick={() => setAdminNewOrderAlert(null)}
                className="px-3 bg-white text-slate-600 hover:text-slate-900 border border-slate-200 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                {lang === 'mr' ? 'बंद करा' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT HOTEL MODAL ==================== */}
      {isEditHotelOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 max-w-lg w-full shadow-2xl border border-orange-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100 mb-3">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-orange-600" />
                <h4 className="font-black text-base text-slate-900">
                  हॉटेल तपशील व फोटो संपादन (Edit Hotel)
                </h4>
              </div>
              <button
                onClick={() => setIsEditHotelOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditHotel} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">हॉटेलचे नाव (मराठी) *:</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. हॉटेल साई कृपा"
                    value={editingHotelData.nameMr}
                    onChange={(e) => setEditingHotelData({ ...editingHotelData, nameMr: e.target.value })}
                    className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hotel Name (English) *:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hotel Sai Krupa"
                    value={editingHotelData.name}
                    onChange={(e) => setEditingHotelData({ ...editingHotelData, name: e.target.value })}
                    className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">गाव कार्यक्षेत्र (Village):</label>
                  <select
                    value={editingHotelData.village}
                    onChange={(e) => setEditingHotelData({ ...editingHotelData, village: e.target.value })}
                    className="w-full bg-white border border-orange-200 rounded-xl p-2 font-semibold"
                  >
                    <option value="Karodi">Karodi (करोडी)</option>
                    <option value="Asegaon">Asegaon (आसेगाव)</option>
                    <option value="Sajapur">Sajapur (साजापूर)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">संपर्क फोन (Phone):</label>
                  <input
                    type="tel"
                    required
                    value={editingHotelData.contactPhone}
                    onChange={(e) => setEditingHotelData({ ...editingHotelData, contactPhone: e.target.value })}
                    className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">पत्ता (Address):</label>
                <input
                  type="text"
                  placeholder="उदा. बस स्टँडजवळ, करोडी"
                  value={editingHotelData.address}
                  onChange={(e) => setEditingHotelData({ ...editingHotelData, address: e.target.value })}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">खाद्यपदार्थ प्रकार (Cuisines):</label>
                <input
                  type="text"
                  placeholder="उदा. महाराष्ट्रीयन, थाळी, नाश्ता"
                  value={editingHotelData.cuisineTypes}
                  onChange={(e) => setEditingHotelData({ ...editingHotelData, cuisineTypes: e.target.value })}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">सुरू वेळ:</label>
                  <input
                    type="time"
                    value={editingHotelData.openingTime}
                    onChange={(e) => setEditingHotelData({ ...editingHotelData, openingTime: e.target.value })}
                    className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">बंद वेळ:</label>
                  <input
                    type="time"
                    value={editingHotelData.closingTime}
                    onChange={(e) => setEditingHotelData({ ...editingHotelData, closingTime: e.target.value })}
                    className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">अंदाजे वेळ (मि.):</label>
                  <input
                    type="number"
                    value={editingHotelData.prepTimeMinutes}
                    onChange={(e) => setEditingHotelData({ ...editingHotelData, prepTimeMinutes: Number(e.target.value) })}
                    className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">कमिशन (%):</label>
                  <input
                    type="number"
                    value={editingHotelData.commissionRatePercent}
                    onChange={(e) => setEditingHotelData({ ...editingHotelData, commissionRatePercent: Number(e.target.value) })}
                    className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                  />
                </div>
              </div>

              {/* Status Toggles */}
              <div className="grid grid-cols-2 gap-3 p-2.5 bg-orange-50/50 rounded-xl border border-orange-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={editingHotelData.open}
                    onChange={(e) => setEditingHotelData({ ...editingHotelData, open: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded-md"
                  />
                  <span>हॉटेल सध्या चालू (Open)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={editingHotelData.active}
                    onChange={(e) => setEditingHotelData({ ...editingHotelData, active: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded-md"
                  />
                  <span>नोंदणी सक्रिय (Active)</span>
                </label>
              </div>

              {/* Cover Photo URL & Live Image Preview */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  हॉटेल कव्हर फोटो लिंक (Hotel Cover Photo URL):
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editingHotelData.coverImageUrl}
                  onChange={(e) => setEditingHotelData({ ...editingHotelData, coverImageUrl: e.target.value })}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-mono text-[11px]"
                />
                {editingHotelData.coverImageUrl && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-orange-200 h-32 bg-slate-100">
                    <img
                      src={editingHotelData.coverImageUrl}
                      alt="Hotel Cover Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                      <span className="text-white text-[11px] font-bold drop-shadow-md">
                        थेट प्रिव्ह्यू: {editingHotelData.nameMr || editingHotelData.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                >
                  हॉटेल माहिती जतन करा (Save Changes)
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditHotelOpen(false)}
                  className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  रद्द करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT DISH MODAL ==================== */}
      {isEditDishOpen && selectedHotel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-orange-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100 mb-3">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-orange-600" />
                <h4 className="font-black text-base text-slate-900">
                  खाद्यपदार्थ व फोटो संपादन (Edit Dish)
                </h4>
              </div>
              <button
                onClick={() => setIsEditDishOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDish} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">वर्गवारी (Category) *:</label>
                <select
                  required
                  value={editingDishData.categoryId}
                  onChange={(e) => setEditingDishData({ ...editingDishData, categoryId: e.target.value })}
                  className="w-full bg-white border border-orange-200 rounded-xl p-2 font-semibold"
                >
                  {selectedHotel.categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameMr} ({c.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">पदार्थाचे नाव (मराठी) *:</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. शेव भाजी थाळी"
                    value={editingDishData.nameMr}
                    onChange={(e) => setEditingDishData({ ...editingDishData, nameMr: e.target.value })}
                    className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dish Name (English):</label>
                  <input
                    type="text"
                    placeholder="e.g. Shev Bhaji Thali"
                    value={editingDishData.nameEn}
                    onChange={(e) => setEditingDishData({ ...editingDishData, nameEn: e.target.value })}
                    className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">किंमत (₹) *:</label>
                  <input
                    type="number"
                    required
                    value={editingDishData.priceRs}
                    onChange={(e) => setEditingDishData({ ...editingDishData, priceRs: Number(e.target.value) })}
                    className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-bold text-orange-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">प्रकार (Veg/Non-Veg):</label>
                  <select
                    value={editingDishData.veg ? 'veg' : 'nonveg'}
                    onChange={(e) => setEditingDishData({ ...editingDishData, veg: e.target.value === 'veg' })}
                    className="w-full bg-white border border-orange-200 rounded-xl p-2 font-semibold"
                  >
                    <option value="veg">🟢 शाकाहारी (Veg)</option>
                    <option value="nonveg">🔴 मांसाहारी (Non-Veg)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">प्रमाण / साईझ (Portion Size):</label>
                <input
                  type="text"
                  placeholder="उदा. १ प्लेट, २ भाकरी"
                  value={editingDishData.portionSize}
                  onChange={(e) => setEditingDishData({ ...editingDishData, portionSize: e.target.value })}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">वर्णन (Description):</label>
                <textarea
                  rows={2}
                  placeholder="पदार्थाविषयी थोडी माहिती..."
                  value={editingDishData.descriptionMr}
                  onChange={(e) => setEditingDishData({ ...editingDishData, descriptionMr: e.target.value })}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 text-xs font-medium"
                />
              </div>

              {/* Availability Toggle */}
              <div className="p-2.5 bg-orange-50/50 rounded-xl border border-orange-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={editingDishData.available}
                    onChange={(e) => setEditingDishData({ ...editingDishData, available: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded-md"
                  />
                  <span>सध्या उपलब्ध आहे (In Stock / Available)</span>
                </label>
              </div>

              {/* Dish Photo URL & Live Image Preview */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  पदार्थाचा फोटो लिंक (Dish Photo URL):
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editingDishData.imageUrl}
                  onChange={(e) => setEditingDishData({ ...editingDishData, imageUrl: e.target.value })}
                  className="w-full bg-orange-50/40 border border-orange-200 rounded-xl p-2 font-mono text-[11px]"
                />
                {editingDishData.imageUrl && (
                  <div className="mt-2 flex items-center gap-3 p-2.5 bg-orange-50/60 rounded-xl border border-orange-200">
                    <img
                      src={editingDishData.imageUrl}
                      alt="Dish Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-orange-200 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="overflow-hidden">
                      <p className="font-bold text-xs text-slate-900 truncate">{editingDishData.nameMr || 'पदार्थ'}</p>
                      <p className="text-[10px] text-slate-500">थेट फोटो प्रिव्ह्यू (Live Dish Preview)</p>
                      <p className="font-extrabold text-xs text-orange-700 mt-0.5">₹{editingDishData.priceRs}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                >
                  पदार्थ माहिती जतन करा (Save Dish)
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditDishOpen(false)}
                  className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  रद्द करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- HOTEL ACCOUNT CREATED & PASSWORD MODAL -------------------- */}
      {createdHotelCredentials && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-emerald-500 overflow-hidden text-left animate-scale-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-lg leading-tight">
                    {lang === 'mr' ? 'हॉटेल खाते तयार झाले!' : 'Hotel Account Created!'}
                  </h4>
                  <p className="text-xs text-emerald-100 font-medium">
                    {lang === 'mr' ? 'लॉगिन मोबाईल व पासवर्ड तपशील' : 'Login mobile & password credentials'}
                  </p>
                </div>
              </div>
            </div>

            {/* Credentials Card */}
            <div className="p-5 space-y-4">
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                  <span className="text-slate-600 font-semibold">{lang === 'mr' ? 'हॉटेल नाव:' : 'Hotel Name:'}</span>
                  <strong className="text-slate-900 font-extrabold text-sm">
                    {createdHotelCredentials.nameMr} ({createdHotelCredentials.name})
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">{lang === 'mr' ? 'गाव कार्यक्षेत्र:' : 'Village:'}</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                    {createdHotelCredentials.village}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-200">
                  <span className="text-slate-700 font-bold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>लॉगिन मोबाईल (Login Phone):</span>
                  </span>
                  <strong className="font-mono text-sm text-slate-950 font-black">
                    +91 {createdHotelCredentials.managerPhone || createdHotelCredentials.contactPhone}
                  </strong>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-200">
                  <span className="text-slate-700 font-bold flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-emerald-600" />
                    <span>पासवर्ड (Password):</span>
                  </span>
                  <strong className="font-mono text-sm text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded-md">
                    {createdHotelCredentials.managerPassword || 'hotel123'}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-slate-500 pt-1">
                  <span>खाते भूमिका:</span>
                  <span className="font-bold text-emerald-800">हॉटेल व्यवस्थापक (Restaurant Staff)</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                👉 <strong>सूचना:</strong> हे लॉगिन तपशील हॉटेल मालक किंवा व्यवस्थापकास द्या. ते या मोबाईल आणि पासवर्डने थेट GharPoch हॉटेल पोर्टलवर लॉगिन करून ऑर्डर्स स्वीकारू शकतात.
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    const text = `GharPoch हॉटेल लॉगिन तपशील:\nहॉटेल: ${createdHotelCredentials.nameMr}\nलॉगिन मोबाईल: +91 ${createdHotelCredentials.managerPhone || createdHotelCredentials.contactPhone}\nपासवर्ड: ${createdHotelCredentials.managerPassword || 'hotel123'}\nभूमिका: हॉटेल व्यवस्थापक\nलॉगिन लिंक: http://localhost:5173/`;
                    navigator.clipboard.writeText(text);
                    setCopiedCreds(true);
                    setTimeout(() => setCopiedCreds(false), 3000);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-2xl text-xs sm:text-sm transition cursor-pointer shadow-md"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedCreds ? 'तपशील कॉपी झाले! ✓' : 'लॉगिन तपशील कॉपी करा (Copy Details)'}</span>
                </button>

                <button
                  onClick={() => {
                    setCreatedHotelCredentials(null);
                    setCopiedCreds(false);
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-2xl text-xs transition cursor-pointer"
                >
                  {lang === 'mr' ? 'समजले / बंद करा (Done)' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
