export type Role = 'ROLE_CUSTOMER' | 'ROLE_RESTAURANT_STAFF' | 'ROLE_DELIVERY_PARTNER' | 'ROLE_ADMIN';

export type OrderStatus =
  | 'PLACED'
  | 'RESTAURANT_ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'ASSIGNED'
  | 'PARTNER_ACCEPTED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED_BY_RESTAURANT'
  | 'CANCELLED_BY_ADMIN'
  | 'CANCELLED_BY_CUSTOMER'
  | 'DELIVERY_FAILED';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  status?: string;
  restaurantId?: string;
  restaurantName?: string;
  restaurantNameMr?: string;
  village?: string;
  address?: string;
  vehicleNumber?: string;
  availabilityStatus?: string;
  orderCount?: number;
  latestAddressJson?: string;
}

export interface CreateRestaurantResponse {
  id: string;
  name: string;
  nameMr: string;
  village: string;
  address: string;
  contactPhone: string;
  managerPhone: string;
  managerPassword: string;
  managerRole: string;
}

export interface ServiceArea {
  id: string;
  villageName: string;
  villageNameMr: string;
  active: boolean;
  deliveryFeePaise: number;
  minOrderPaise: number;
}

export interface Restaurant {
  id: string;
  name: string;
  nameMr: string;
  village: string;
  address: string;
  contactPhone: string;
  coverImageUrl?: string;
  logoUrl?: string;
  openingTime: string;
  closingTime: string;
  open: boolean;
  active?: boolean;
  prepTimeMinutes: number;
  minOrderPaise: number;
  commissionRatePercent?: number;
  cuisineTypes: string;
  categories?: MenuCategory[];
}

export interface MenuCategory {
  id: string;
  nameMr: string;
  nameEn: string;
  sortOrder: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  nameMr: string;
  nameEn: string;
  descriptionMr?: string;
  descriptionEn?: string;
  pricePaise: number;
  imageUrl?: string;
  veg: boolean;
  available: boolean;
  portionSize?: string;
  sortOrder: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
  portionSize?: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  itemNameMr: string;
  itemNameEn: string;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
  portionSize?: string;
}

export interface Order {
  id: string;
  publicOrderNumber: string;
  restaurantId: string;
  restaurantName: string;
  restaurantNameMr: string;
  restaurantPhone: string;
  status: OrderStatus;
  statusDisplay: string;
  statusDisplayMr: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotalPaise: number;
  deliveryFeePaise: number;
  platformFeePaise: number;
  discountPaise: number;
  totalPaise: number;
  customerName: string;
  customerPhone: string;
  village: string;
  addressLine: string;
  landmark?: string;
  specialInstructions?: string;
  cancellationReason?: string;
  deliveryOtp?: string;
  assignedPartnerName?: string;
  assignedPartnerPhone?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  activeRestaurants: number;
  availableDeliveryPartners: number;
  grossMerchandiseValuePaise: number;
  totalDeliveryFeesPaise: number;
  platformCommissionsPaise: number;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  availabilityStatus: 'ONLINE' | 'OFFLINE' | 'BUSY';
  active: boolean;
  totalDeliveries: number;
  totalEarningsRs: number;
}

export interface ReconciliationRecord {
  orderNumber: string;
  restaurant: string;
  village: string;
  subtotalRs: number;
  deliveryFeeRs: number;
  platformFeeRs: number;
  totalCollectedRs: number;
  gharpochEarningsRs: number;
  hotelPayableRs: number;
  partnerEarningsRs: number;
  date: string;
}
