import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { soundManager } from '../../utils/sound';
import type { Order, MenuCategory } from '../../types';
import {
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  UtensilsCrossed,
  ChefHat,
  Package,
  Bike,
  Volume2,
  RefreshCw,
  Store,
  Layers,
  Phone,
  User as UserIcon,
  X,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export const RestaurantDashboard: React.FC = () => {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'kds' | 'menu'>('kds');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // New incoming order popup alert state
  const [incomingOrderPopup, setIncomingOrderPopup] = useState<Order | null>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());

  // Accept modal state
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [estimatedPrep, setEstimatedPrep] = useState<number>(30);

  // Reject modal state
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('सामग्री संपली आहे (Out of stock)');

  const fetchOrdersAndMenu = async () => {
    try {
      const [ordList, menuList] = await Promise.all([
        api.getRestaurantOrders(),
        api.getRestaurantMenu(),
      ]);

      // Check if new incoming PLACED order arrived
      if (knownOrderIdsRef.current.size > 0) {
        const newlyPlaced = ordList.find(
          (o) => o.status === 'PLACED' && !knownOrderIdsRef.current.has(o.id)
        );
        if (newlyPlaced) {
          soundManager.playOrderChime();
          setIncomingOrderPopup(newlyPlaced);
        }
      } else {
        // Initial load check
        const initialPlaced = ordList.find((o) => o.status === 'PLACED');
        if (initialPlaced) {
          soundManager.playOrderChime();
        }
      }

      // Add all fetched orders to known IDs
      ordList.forEach((o) => knownOrderIdsRef.current.add(o.id));

      setOrders(ordList);
      setMenuCategories(menuList);
    } catch (e) {
      console.error('Failed to fetch restaurant orders:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndMenu();
    // 4-second polling for fast kitchen response
    const interval = setInterval(fetchOrdersAndMenu, 4000);
    return () => clearInterval(interval);
  }, []);

  // Accept order
  const handleConfirmAccept = async () => {
    if (!acceptingOrderId) return;
    try {
      await api.acceptRestaurantOrder(acceptingOrderId, estimatedPrep);
      setAcceptingOrderId(null);
      fetchOrdersAndMenu();
    } catch (e: any) {
      alert(e.message || 'Error accepting order');
    }
  };

  // Reject order
  const handleConfirmReject = async () => {
    if (!rejectingOrderId) return;
    try {
      await api.rejectRestaurantOrder(rejectingOrderId, rejectReason);
      setRejectingOrderId(null);
      fetchOrdersAndMenu();
    } catch (e: any) {
      alert(e.message || 'Error rejecting order');
    }
  };

  // Update kitchen prep status
  const handleKitchenStatus = async (orderId: string, status: 'PREPARING' | 'READY_FOR_PICKUP') => {
    try {
      await api.updateKitchenStatus(orderId, status);
      fetchOrdersAndMenu();
    } catch (e: any) {
      alert(e.message || 'Error updating status');
    }
  };

  // Toggle item 86
  const handleToggleItemAvailability = async (itemId: string, currentAvailable: boolean) => {
    try {
      await api.toggleItemAvailability(itemId, !currentAvailable);
      fetchOrdersAndMenu();
    } catch (e: any) {
      alert(e.message || 'Error toggling item');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'incoming') return o.status === 'PLACED';
    if (filterStatus === 'active') {
      return o.status === 'RESTAURANT_ACCEPTED' || o.status === 'PREPARING' || o.status === 'READY_FOR_PICKUP' || o.status === 'ASSIGNED' || o.status === 'OUT_FOR_DELIVERY';
    }
    if (filterStatus === 'completed') return o.status === 'DELIVERED';
    if (filterStatus === 'cancelled') return o.status.startsWith('CANCEL') || o.status === 'DELIVERY_FAILED';
    return true;
  });

  const incomingCount = orders.filter((o) => o.status === 'PLACED').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 animate-fade-in pb-20">
      {/* Hotel Dashboard Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-amber-700">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">
                {user?.restaurantName || 'Hotel Sai Krupa (हॉटेल साई कृपा)'}
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {lang === 'mr' ? 'किचन चालू' : 'KDS Active'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {lang === 'mr' ? 'ऑर्डर व्यवस्थापन आणि मेनू उपलब्धता पॅनेल' : 'Live Kitchen Display & Menu 86 Management'}
            </p>
          </div>
        </div>

        {/* Tab Switcher, Account Pill, Sound Test & Logout */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Account Details Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-2xl text-xs font-semibold text-orange-950">
            <UserIcon className="w-3.5 h-3.5 text-orange-600" />
            <div className="leading-tight">
              <span className="font-bold block truncate max-w-[120px]">{user?.name}</span>
              <span className="text-[10px] text-slate-500">{user?.phone}</span>
            </div>
          </div>

          <button
            onClick={() => soundManager.playOrderChime()}
            className="p-2 rounded-xl bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Test Kitchen Sound"
          >
            <Volume2 className="w-4 h-4 text-orange-600" />
            <span className="hidden sm:inline">{lang === 'mr' ? 'आवाज तपासा' : 'Test Bell'}</span>
          </button>

          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchOrdersAndMenu();
            }}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('kds')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'kds'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>{lang === 'mr' ? 'ऑर्डर्स' : 'Orders'}</span>
              {incomingCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                  {incomingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'menu'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{lang === 'mr' ? 'पदार्थ उपलब्धता (86)' : 'Menu Availability'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* -------------------- 1. KITCHEN DISPLAY SYSTEM TAB -------------------- */}
      {activeTab === 'kds' ? (
        <div>
          {/* Incoming Order Audio Alert Callout */}
          {incomingCount > 0 && (
            <div className="bg-amber-400 border-2 border-amber-600 text-slate-950 p-4 rounded-3xl shadow-lg mb-4 flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-slate-950 animate-bounce" />
                <div>
                  <h4 className="font-black text-sm">
                    {lang === 'mr' ? `नवीन ${incomingCount} ऑर्डर आली आहे!` : `${incomingCount} New Incoming Order(s)!`}
                  </h4>
                  <p className="text-xs font-medium">
                    {lang === 'mr' ? 'कृपया ग्राहकासाठी ऑर्डर स्वीकारा किंवा नाकारा.' : 'Please accept or decline incoming orders promptly.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status Filters */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 text-xs font-bold">
            {[
              { key: 'all', label: lang === 'mr' ? 'सर्व ऑर्डर्स' : 'All Orders' },
              { key: 'incoming', label: `${lang === 'mr' ? 'नवीन' : 'Incoming'} (${incomingCount})` },
              { key: 'active', label: lang === 'mr' ? 'किचनमध्ये चालू' : 'In Kitchen' },
              { key: 'completed', label: lang === 'mr' ? 'पूर्ण झालेल्या' : 'Completed' },
              { key: 'cancelled', label: lang === 'mr' ? 'रद्द / अयशस्वी' : 'Cancelled' },
            ].map((st) => (
              <button
                key={st.key}
                onClick={() => setFilterStatus(st.key)}
                className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
                  filterStatus === st.key
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-amber-300'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Orders Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white rounded-3xl h-48 animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-slate-200">
              <ChefHat className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">
                {lang === 'mr' ? 'या वर्गात सध्या कोणतीही ऑर्डर नाही.' : 'No orders in this queue right now.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map((order) => {
                const isPlaced = order.status === 'PLACED';
                const isAccepted = order.status === 'RESTAURANT_ACCEPTED';
                const isPreparing = order.status === 'PREPARING';
                const isReady = order.status === 'READY_FOR_PICKUP';

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-3xl p-4 sm:p-5 border shadow-sm transition flex flex-col justify-between ${
                      isPlaced
                        ? 'border-amber-400 ring-2 ring-amber-200 bg-amber-50/20'
                        : 'border-slate-100'
                    }`}
                  >
                    <div>
                      {/* Order Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900">{order.publicOrderNumber}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              order.status === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'PLACED'
                                ? 'bg-amber-400 text-slate-900 animate-pulse'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {lang === 'mr' ? order.statusDisplayMr : order.statusDisplay}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {order.customerName} • {order.village}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-base text-orange-600">
                            ₹{(order.totalPaise / 100).toFixed(0)}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-bold uppercase">
                            {order.paymentMethod}
                          </span>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="py-3 space-y-1.5">
                        {order.items?.map((it) => (
                          <div key={it.id} className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">
                              {it.quantity}x {it.itemNameMr} <span className="text-slate-400 font-normal">({it.itemNameEn})</span>
                            </span>
                            <span className="font-semibold text-slate-600">
                              ₹{(it.lineTotalPaise / 100).toFixed(0)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Customer Instructions */}
                      {order.specialInstructions && (
                        <div className="p-2.5 bg-amber-50 rounded-xl text-xs text-amber-900 mb-3 border border-amber-200/60">
                          <span className="font-bold">विशेष सूचना: </span>
                          <span>{order.specialInstructions}</span>
                        </div>
                      )}

                      {/* Assigned Delivery Partner Details */}
                      {order.assignedPartnerName && (
                        <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 mb-3 flex items-center justify-between border border-slate-200">
                          <div className="flex items-center gap-1.5">
                            <Bike className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                              {lang === 'mr' ? 'डिलिव्हरी पार्टनर:' : 'Rider:'} <strong>{order.assignedPartnerName}</strong>
                            </span>
                          </div>
                          {order.assignedPartnerPhone && (
                            <a
                              href={`tel:${order.assignedPartnerPhone}`}
                              className="text-amber-800 font-bold flex items-center gap-1 hover:underline"
                            >
                              <Phone className="w-3 h-3" />
                              <span>कॉल</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons based on status */}
                    <div className="pt-3 border-t border-slate-100 mt-2">
                      {isPlaced && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setAcceptingOrderId(order.id);
                              setEstimatedPrep(30);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{lang === 'mr' ? 'स्वीकारा (Accept)' : 'Accept'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setRejectingOrderId(order.id);
                              setRejectReason('सामग्री संपली आहे');
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 py-2 rounded-xl font-bold text-xs border border-rose-200 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{lang === 'mr' ? 'नाकारा (Reject)' : 'Reject'}</span>
                          </button>
                        </div>
                      )}

                      {isAccepted && (
                        <button
                          onClick={() => handleKitchenStatus(order.id, 'PREPARING')}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <UtensilsCrossed className="w-3.5 h-3.5 text-amber-300" />
                          <span>{lang === 'mr' ? 'जेवण तयार करण्यास घ्या (Start Cooking)' : 'Start Preparing'}</span>
                        </button>
                      )}

                      {isPreparing && (
                        <button
                          onClick={() => handleKitchenStatus(order.id, 'READY_FOR_PICKUP')}
                          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 rounded-xl font-black text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>{lang === 'mr' ? 'पिकअपसाठी तयार आहे (Mark Ready)' : 'Ready for Pickup'}</span>
                        </button>
                      )}

                      {isReady && (
                        <div className="bg-emerald-50 text-emerald-800 p-2 rounded-xl text-center text-xs font-bold border border-emerald-200">
                          {lang === 'mr' ? 'पॅकिंग पूर्ण • डिलिव्हरी पार्टनरची वाट पाहत आहे' : 'Packed & Ready • Awaiting Rider Pickup'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* -------------------- 2. MENU 86 MANAGER TAB -------------------- */
        <div className="space-y-4">
          <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900">
            <span className="font-black">सूचना: </span>
            <span>
              {lang === 'mr'
                ? 'किचनमध्ये एखादा पदार्थ संपल्यास समोरचे बटण बंद करा. तो पदार्थ ग्राहकांच्या ॲपमध्ये तात्काळ "संपले आहे" (86) दिसेल.'
                : 'Toggle switches off if a dish runs out of stock in kitchen. It will instantly show as Out of Stock for customers.'}
            </span>
          </div>

          <div className="space-y-4">
            {menuCategories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm">
                <h4 className="font-black text-base text-orange-600 mb-3 pb-2 border-b border-slate-100">
                  {cat.nameMr} <span className="text-xs text-slate-400 font-semibold">({cat.nameEn})</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cat.items?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl border border-slate-100 bg-[#FBF9F4] flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-bold text-xs text-slate-900">{item.nameMr}</p>
                        <p className="text-[11px] text-slate-500">{item.nameEn}</p>
                        <span className="font-black text-xs text-orange-600">
                          ₹{(item.pricePaise / 100).toFixed(0)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold ${item.available ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {item.available ? (lang === 'mr' ? 'उपलब्ध' : 'Available') : (lang === 'mr' ? 'संपले (86)' : 'Out of Stock')}
                        </span>
                        <button
                          onClick={() => handleToggleItemAvailability(item.id, item.available)}
                          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            item.available ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                              item.available ? 'right-1' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- ACCEPT ORDER MODAL -------------------- */}
      {acceptingOrderId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100">
            <h4 className="font-black text-base text-slate-900 mb-1">
              {lang === 'mr' ? 'ऑर्डर स्वीकारा' : 'Accept Order'}
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              {lang === 'mr' ? 'जेवण तयार करण्यासाठी अंदाजे किती वेळ लागेल?' : 'Estimated preparation time:'}
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[20, 30, 45].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setEstimatedPrep(mins)}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    estimatedPrep === mins
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {mins} {lang === 'mr' ? 'मिनिटे' : 'mins'}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={handleConfirmAccept}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs"
              >
                {lang === 'mr' ? 'ऑर्डर निश्चित करा' : 'Confirm Accept'}
              </button>
              <button
                onClick={() => setAcceptingOrderId(null)}
                className="w-full bg-slate-100 text-slate-700 py-2 rounded-xl font-bold text-xs"
              >
                {lang === 'mr' ? 'मागे जा' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- REJECT ORDER MODAL -------------------- */}
      {rejectingOrderId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-rose-200">
            <h4 className="font-black text-base text-rose-700 mb-1">
              {lang === 'mr' ? 'ऑर्डर का नाकारायची आहे?' : 'Reject Order Reason'}
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              {lang === 'mr' ? 'हे कारण ग्राहक आणि प्रशासकाला दिसेल.' : 'This reason will be shared with the customer and admin.'}
            </p>

            <div className="space-y-1.5 mb-4 text-xs font-medium">
              {[
                'सामग्री संपली आहे (Out of stock)',
                'किचनमध्ये प्रचंड गर्दी आहे (High rush)',
                'गॅस किंवा वीज समस्या (Kitchen downtime)',
                'हॉटेल बंद करण्याची वेळ झाली आहे (Closing time)',
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setRejectReason(reason)}
                  className={`w-full text-left px-3 py-2 rounded-xl border transition cursor-pointer ${
                    rejectReason === reason
                      ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={handleConfirmReject}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs"
              >
                {lang === 'mr' ? 'ऑर्डर नाकारा' : 'Confirm Reject'}
              </button>
              <button
                onClick={() => setRejectingOrderId(null)}
                className="w-full bg-slate-100 text-slate-700 py-2 rounded-xl font-bold text-xs"
              >
                {lang === 'mr' ? 'रद्द करा' : 'Back'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- INSTANT NEW ORDER POPUP MODAL -------------------- */}
      {incomingOrderPopup && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-amber-500 overflow-hidden text-left animate-scale-up">
            {/* Pulsing Header */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center animate-bounce">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-base leading-tight">
                    {lang === 'mr' ? '🔔 नवीन ऑर्डर प्राप्त झाली!' : '🔔 New Order Received!'}
                  </h4>
                  <p className="text-xs text-amber-100 font-semibold">
                    ऑर्डर #{incomingOrderPopup.publicOrderNumber || incomingOrderPopup.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIncomingOrderPopup(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Details */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Customer Info */}
              <div className="p-3 bg-orange-50/70 rounded-2xl border border-orange-200/80 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{incomingOrderPopup.customerName}</span>
                  <a
                    href={`tel:${incomingOrderPopup.customerPhone}`}
                    className="inline-flex items-center gap-1 font-bold text-orange-700 bg-white px-2.5 py-1 rounded-full border border-orange-200 hover:bg-orange-100 transition shadow-2xs"
                  >
                    <Phone className="w-3 h-3" />
                    <span>+91 {incomingOrderPopup.customerPhone}</span>
                  </a>
                </div>
                <div className="flex items-start gap-1.5 text-slate-600 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                  <span>
                    {incomingOrderPopup.addressLine},{' '}
                    <strong>{incomingOrderPopup.village}</strong>
                    {incomingOrderPopup.landmark && ` (खूण: ${incomingOrderPopup.landmark})`}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-700">
                  {lang === 'mr' ? 'मागवलेले पदार्थ (Items):' : 'Ordered Dishes:'}
                </div>
                <div className="divide-y divide-slate-100 p-2 space-y-1">
                  {incomingOrderPopup.items && incomingOrderPopup.items.length > 0 ? (
                    incomingOrderPopup.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1.5 px-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-orange-100 text-orange-800 font-extrabold flex items-center justify-center text-[11px]">
                            {item.quantity}x
                          </span>
                          <span className="font-bold text-slate-800">
                            {lang === 'mr' ? item.itemNameMr || item.itemNameEn : item.itemNameEn || item.itemNameMr}
                          </span>
                          {item.portionSize && (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-sm">
                              {item.portionSize}
                            </span>
                          )}
                        </div>
                        <span className="font-extrabold text-slate-900">
                          ₹{((item.lineTotalPaise || item.unitPricePaise * item.quantity) / 100).toFixed(0)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 py-1 px-1">
                      {lang === 'mr' ? 'पदार्थ तपशील लोड होत आहेत...' : 'Items details loading...'}
                    </div>
                  )}
                </div>
                <div className="bg-orange-50/80 px-3 py-2 border-t border-orange-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{lang === 'mr' ? 'एकूण रक्कम:' : 'Total Amount:'}</span>
                  <span className="font-black text-base text-orange-700">
                    ₹{(incomingOrderPopup.totalPaise / 100).toFixed(0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => {
                  setAcceptingOrderId(incomingOrderPopup.id);
                  setIncomingOrderPopup(null);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-2xl text-xs sm:text-sm transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === 'mr' ? 'ऑर्डर स्वीकारा (Accept)' : 'Accept Order'}</span>
              </button>

              <button
                onClick={() => {
                  setRejectingOrderId(incomingOrderPopup.id);
                  setIncomingOrderPopup(null);
                }}
                className="px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-3 rounded-2xl text-xs transition cursor-pointer"
              >
                {lang === 'mr' ? 'नाकारा' : 'Reject'}
              </button>

              <button
                onClick={() => setIncomingOrderPopup(null)}
                className="px-3 bg-white text-slate-600 hover:text-slate-900 border border-slate-200 font-bold py-3 rounded-2xl text-xs transition cursor-pointer"
              >
                {lang === 'mr' ? 'बंद करा' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
