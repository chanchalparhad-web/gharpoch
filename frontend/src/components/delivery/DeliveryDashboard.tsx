import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { soundManager } from '../../utils/sound';
import type { Order } from '../../types';
import {
  Bike,
  MapPin,
  Phone,
  Navigation,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldCheck,
  IndianRupee,
  PackageCheck,
  User as UserIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [assignments, setAssignments] = useState<Order[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [earningsRs, setEarningsRs] = useState<number>(0);
  const [deliveriesCount, setDeliveriesCount] = useState<number>(0);

  // OTP Modal
  const [otpModalOrderId, setOtpModalOrderId] = useState<string | null>(null);
  const [inputOtp, setInputOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);

  // Failure Modal
  const [failureModalOrderId, setFailureModalOrderId] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<string>('ग्राहक फोन उचलत नाही (Customer unreachable)');

  const fetchAssignments = async () => {
    try {
      const orders = await api.getDeliveryAssignments();
      setAssignments(orders);

      const delivered = orders.filter((o) => o.status === 'DELIVERED');
      setDeliveriesCount(delivered.length);
      const earned = delivered.reduce((sum, o) => sum + (o.deliveryFeePaise / 100), 0);
      setEarningsRs(earned);
    } catch (e) {
      console.error('Failed to fetch delivery assignments:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    const interval = setInterval(fetchAssignments, 8000);
    return () => clearInterval(interval);
  }, []);

  // Toggle online/offline
  const handleToggleOnline = async () => {
    const nextStatus = isOnline ? 'OFFLINE' : 'ONLINE';
    try {
      await api.updateDeliveryStatus(nextStatus);
      setIsOnline(!isOnline);
    } catch {
      setIsOnline(!isOnline);
    }
  };

  // Accept job
  const handleAcceptJob = async (orderId: string) => {
    try {
      await api.acceptDeliveryAssignment(orderId);
      fetchAssignments();
    } catch (e: any) {
      alert(e.message || 'Error accepting delivery');
    }
  };

  // Pick up food
  const handlePickup = async (orderId: string) => {
    try {
      await api.pickupDeliveryOrder(orderId);
      fetchAssignments();
    } catch (e: any) {
      alert(e.message || 'Error marking pickup');
    }
  };

  // Deliver with OTP verification
  const handleConfirmDeliver = async () => {
    if (!otpModalOrderId || !inputOtp.trim()) return;
    try {
      await api.completeDelivery(otpModalOrderId, inputOtp.trim());
      soundManager.playSuccessChime();
      confetti({ particleCount: 70, spread: 60 });
      setOtpModalOrderId(null);
      setInputOtp('');
      setOtpError(null);
      fetchAssignments();
    } catch (e: any) {
      setOtpError(e.message || 'चुकीचा ओटीपी (Incorrect OTP). Please verify with customer.');
    }
  };

  // Report delivery failure
  const handleConfirmFailure = async () => {
    if (!failureModalOrderId) return;
    try {
      await api.reportDeliveryFailure(failureModalOrderId, failureReason);
      setFailureModalOrderId(null);
      fetchAssignments();
    } catch (e: any) {
      alert(e.message || 'Error reporting failure');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 animate-fade-in pb-20">
      {/* Rider Header & Stats Card */}
      <div className="bg-white rounded-3xl p-5 border border-orange-100 shadow-sm mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-orange-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {user?.name || 'Sachin Gaikwad (सचिन गायकवाड)'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'mr' ? 'गाव डिलिव्हरी पार्टनर • MH-20-DZ-1428' : 'Village Delivery Partner • MH-20-DZ-1428'}
              </p>
            </div>
          </div>

          {/* Account Pill, Duty Status Switch & Logout */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-2xl text-xs font-semibold text-orange-950">
              <UserIcon className="w-3.5 h-3.5 text-orange-600" />
              <div className="leading-tight">
                <span className="font-bold block">{user?.name}</span>
                <span className="text-[10px] text-slate-500">{user?.phone}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsRefreshing(true);
                fetchAssignments();
              }}
              className="p-2 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleToggleOnline}
              className={`px-4 py-2 rounded-2xl font-black text-xs shadow-xs transition active:scale-95 flex items-center gap-2 cursor-pointer ${
                isOnline
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
              <span>{isOnline ? (lang === 'mr' ? 'ड्युटी सुरू (Online)' : 'Duty Online') : (lang === 'mr' ? 'ड्युटी बंद (Offline)' : 'Duty Offline')}</span>
            </button>
          </div>
        </div>

        {/* Workload & Earnings Badges */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 bg-orange-50/70 rounded-2xl border border-orange-200/80">
            <span className="text-[11px] font-bold text-orange-900 block">
              {lang === 'mr' ? 'आजच्या पूर्ण डिलिव्हरी' : 'Completed Deliveries'}
            </span>
            <span className="text-2xl font-black text-orange-600">{deliveriesCount}</span>
          </div>

          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/60">
            <span className="text-[11px] font-bold text-emerald-900 block">
              {lang === 'mr' ? 'आजची कमाई' : "Today's Earnings"}
            </span>
            <span className="text-2xl font-black text-emerald-700">₹{earningsRs.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* -------------------- ASSIGNED DELIVERY ORDERS -------------------- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-1.5">
            <PackageCheck className="w-5 h-5 text-amber-600" />
            <span>{lang === 'mr' ? 'नियुक्त केलेल्या ऑर्डर्स' : 'Assigned Deliveries'}</span>
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {assignments.length} {lang === 'mr' ? 'ऑर्डर्स' : 'jobs'}
          </span>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-3xl h-44 animate-pulse border border-slate-100" />
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-slate-200">
            <Bike className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-800">
              {lang === 'mr' ? 'सध्या कोणतीही ऑर्डर नियुक्त केलेली नाही.' : 'No active deliveries assigned.'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'mr' ? 'ड्युटी चालू ठेवा. नवीन ऑर्डर आल्यावर ॲडमिन तुम्हाला नियुक्त करेल.' : 'Keep duty online. Admin will assign new orders.'}
            </p>
          </div>
        ) : (
          assignments.map((order) => {
            const isAssigned = order.status === 'ASSIGNED';
            const isAccepted = order.status === 'PARTNER_ACCEPTED';
            const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';
            const isDelivered = order.status === 'DELIVERED';

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md space-y-4"
              >
                {/* Header & COD Amount */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="font-black text-sm text-slate-900">{order.publicOrderNumber}</span>
                    <span className={`block text-[11px] font-bold mt-0.5 ${
                      isDelivered ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {lang === 'mr' ? order.statusDisplayMr : order.statusDisplay}
                    </span>
                  </div>

                  <div className="bg-amber-100/80 px-3 py-1 rounded-xl text-right">
                    <span className="text-[10px] text-amber-900 font-bold block">
                      {lang === 'mr' ? 'रोख गोळा करा (COD):' : 'Collect COD Cash:'}
                    </span>
                    <span className="text-lg font-black text-orange-600">
                      ₹{(order.totalPaise / 100).toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* 1. Pickup Restaurant Details */}
                <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/60 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-amber-900 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>{lang === 'mr' ? 'पिकअप हॉटेल:' : 'Pickup Restaurant:'}</span>
                    </div>
                    <p className="font-extrabold text-sm text-slate-900 mt-0.5">{order.restaurantName}</p>
                    <p className="text-xs text-slate-500">{order.village}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${order.restaurantPhone}`}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-amber-700 shadow-2xs"
                      title="Call Restaurant"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.restaurantName}, ${order.village}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-orange-600 text-white hover:bg-orange-700 shadow-2xs flex items-center gap-1 text-xs font-bold"
                    >
                      <Navigation className="w-4 h-4" />
                      <span className="hidden sm:inline">Directions</span>
                    </a>
                  </div>
                </div>

                {/* 2. Customer Delivery Destination */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      <span>{lang === 'mr' ? 'डिलिव्हरी पत्ता:' : 'Delivery Drop:'}</span>
                    </div>
                    <p className="font-extrabold text-sm text-slate-900 mt-0.5">{order.customerName}</p>
                    <p className="text-xs text-slate-600">
                      {order.addressLine}, {order.village}
                    </p>
                    {order.landmark && (
                      <p className="text-xs text-amber-800 font-semibold mt-0.5">
                        खूण: {order.landmark}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-amber-700 shadow-2xs"
                      title="Call Customer"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.addressLine}, ${order.village}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-orange-600 text-white hover:bg-orange-700 shadow-2xs flex items-center gap-1 text-xs font-bold"
                    >
                      <Navigation className="w-4 h-4" />
                      <span className="hidden sm:inline">Map</span>
                    </a>
                  </div>
                </div>

                {/* 3. Workflow Action Buttons */}
                <div className="pt-2">
                  {isAssigned && (
                    <button
                      onClick={() => handleAcceptJob(order.id)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-2xl font-black text-xs shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4 text-amber-300" />
                      <span>{lang === 'mr' ? 'डिलिव्हरी स्वीकारा (Accept Delivery)' : 'Accept Delivery Job'}</span>
                    </button>
                  )}

                  {isAccepted && (
                    <button
                      onClick={() => handlePickup(order.id)}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-3 rounded-2xl font-black text-xs shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Bike className="w-4 h-4" />
                      <span>{lang === 'mr' ? 'हॉटेलमधून जेवण घेतले (Picked Up)' : 'Confirm Food Picked Up'}</span>
                    </button>
                  )}

                  {isOutForDelivery && (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setOtpModalOrderId(order.id);
                          setInputOtp('');
                          setOtpError(null);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl font-black text-xs shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{lang === 'mr' ? 'ग्राहकाला पोहोचवले (Enter OTP to Deliver)' : 'Mark Delivered (Enter OTP)'}</span>
                      </button>

                      <button
                        onClick={() => setFailureModalOrderId(order.id)}
                        className="w-full text-center text-xs font-bold text-rose-600 hover:underline pt-1"
                      >
                        {lang === 'mr' ? 'डिलिव्हरी समस्या नोंदवा (Report Issue)' : 'Report Delivery Failure'}
                      </button>
                    </div>
                  )}

                  {isDelivered && (
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-2xl text-center text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'mr' ? 'डिलिव्हरी यशस्वीरीत्या पूर्ण झाली' : 'Delivery Successfully Completed'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* -------------------- DELIVERY OTP VERIFICATION MODAL -------------------- */}
      {otpModalOrderId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h4 className="font-black text-base text-slate-900 mb-1">
              {lang === 'mr' ? 'डिलिव्हरी ओटीपी टाका' : 'Enter Customer Delivery OTP'}
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              {lang === 'mr' ? 'जेवण दिल्यावर ग्राहकाच्या फोनवरील ४-अंकी कोड विचारा.' : 'Ask the customer for the 4-digit code shown on their tracking screen.'}
            </p>

            <input
              type="text"
              maxLength={6}
              value={inputOtp}
              onChange={(e) => setInputOtp(e.target.value)}
              placeholder="4-digit OTP"
              className="w-40 mx-auto text-center font-black text-2xl tracking-widest border-2 border-amber-300 rounded-2xl py-2 mb-2 focus:ring-4 focus:ring-amber-200 outline-hidden"
            />

            {otpError && (
              <p className="text-xs font-bold text-rose-600 mb-3">{otpError}</p>
            )}

            <div className="space-y-2 mt-2">
              <button
                onClick={handleConfirmDeliver}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-xs shadow-md transition active:scale-95"
              >
                {lang === 'mr' ? 'ओटीपी तपासा आणि पूर्ण करा' : 'Verify & Complete Delivery'}
              </button>
              <button
                onClick={() => setOtpModalOrderId(null)}
                className="w-full bg-slate-100 text-slate-700 py-2 rounded-xl font-bold text-xs"
              >
                {lang === 'mr' ? 'मागे जा' : 'Back'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- DELIVERY FAILURE REPORT MODAL -------------------- */}
      {failureModalOrderId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-rose-200">
            <h4 className="font-black text-base text-rose-700 mb-1">
              {lang === 'mr' ? 'डिलिव्हरी का होऊ शकली नाही?' : 'Report Delivery Failure'}
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              {lang === 'mr' ? 'हे कारण ॲडमिन पॅनेलमध्ये नोंदवले जाईल.' : 'This will be flagged for admin intervention.'}
            </p>

            <div className="space-y-1.5 mb-4 text-xs font-medium">
              {[
                'ग्राहक फोन उचलत नाही (Customer unreachable)',
                'चुकीचा पत्ता किंवा घर सापडले नाही (Address not found)',
                'ग्राहकाने ऑर्डर घेण्यास नकार दिला (Customer refused)',
                'रस्त्यात गाडी बंद पडली (Bike breakdown)',
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setFailureReason(reason)}
                  className={`w-full text-left px-3 py-2 rounded-xl border transition cursor-pointer ${
                    failureReason === reason
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
                onClick={handleConfirmFailure}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs"
              >
                {lang === 'mr' ? 'अयशस्वी नोंदवा' : 'Confirm Failure'}
              </button>
              <button
                onClick={() => setFailureModalOrderId(null)}
                className="w-full bg-slate-100 text-slate-700 py-2 rounded-xl font-bold text-xs"
              >
                {lang === 'mr' ? 'रद्द करा' : 'Back'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
