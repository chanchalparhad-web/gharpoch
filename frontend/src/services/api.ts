import type {
  User,
  ServiceArea,
  Restaurant,
  Order,
  DashboardStats,
  DeliveryPartner,
  ReconciliationRecord,
  MenuCategory,
  MenuItem,
  CreateRestaurantResponse
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1');

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('gharpoch_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('gharpoch_token', token);
    } else {
      localStorage.removeItem('gharpoch_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`;
      try {
        const errJson = await response.json();
        errorMessage = errJson.message || errJson.error || errorMessage;
      } catch {
        // Fallback to text
      }
      throw new Error(errorMessage);
    }

    // If 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth Endpoints
  public async login(phone: string, password: string):Promise<{ token: string; userId: string; phone: string; name: string; role: string; restaurantId?: string; restaurantName?: string }> {
    const res = await this.request<{ token: string; userId: string; phone: string; name: string; role: string; restaurantId?: string; restaurantName?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
    this.setToken(res.token);
    return res;
  }

  public async register(phone: string, name: string, password: string) {
    const res = await this.request<{ token: string; userId: string; phone: string; name: string; role: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phone, name, password }),
    });
    this.setToken(res.token);
    return res;
  }

  public async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Customer Discovery & Orders
  public async getServiceAreas(): Promise<ServiceArea[]> {
    return this.request<ServiceArea[]>('/service-areas');
  }

  public async getRestaurants(village?: string): Promise<Restaurant[]> {
    const query = village ? `?village=${encodeURIComponent(village)}` : '';
    return this.request<Restaurant[]>(`/restaurants${query}`);
  }

  public async getRestaurantDetails(id: string): Promise<Restaurant> {
    return this.request<Restaurant>(`/restaurants/${id}`);
  }

  public async createOrder(orderData: {
    restaurantId: string;
    items: { menuItemId: string; quantity: number; portionSize?: string }[];
    customerName: string;
    customerPhone: string;
    village: string;
    addressLine: string;
    landmark?: string;
    specialInstructions?: string;
    idempotencyKey?: string;
  }): Promise<Order> {
    const headers: Record<string, string> = {};
    if (orderData.idempotencyKey) {
      headers['Idempotency-Key'] = orderData.idempotencyKey;
    }

    return this.request<Order>('/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });
  }

  public async getMyOrders(): Promise<Order[]> {
    return this.request<Order[]>('/orders/my');
  }

  public async getOrderById(id: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}`);
  }

  public async cancelOrder(id: string, reason?: string): Promise<Order> {
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return this.request<Order>(`/orders/${id}/cancel${query}`, { method: 'POST' });
  }

  // Restaurant Dashboard
  public async getRestaurantOrders(): Promise<Order[]> {
    return this.request<Order[]>('/restaurant/orders');
  }

  public async acceptRestaurantOrder(id: string, estimatedPrepMinutes: number = 30): Promise<Order> {
    return this.request<Order>(`/restaurant/orders/${id}/accept`, {
      method: 'PATCH',
      body: JSON.stringify({ estimatedPrepMinutes }),
    });
  }

  public async updateKitchenStatus(id: string, status: 'PREPARING' | 'READY_FOR_PICKUP'): Promise<Order> {
    return this.request<Order>(`/restaurant/orders/${id}/status?status=${status}`, {
      method: 'PATCH',
    });
  }

  public async rejectRestaurantOrder(id: string, reason: string): Promise<Order> {
    return this.request<Order>(`/restaurant/orders/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  public async getRestaurantMenu(): Promise<MenuCategory[]> {
    return this.request<MenuCategory[]>('/restaurant/menu');
  }

  public async toggleItemAvailability(itemId: string, available: boolean): Promise<MenuItem> {
    return this.request<MenuItem>(`/restaurant/menu-items/${itemId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ available }),
    });
  }

  // Delivery Dashboard
  public async getDeliveryAssignments(): Promise<Order[]> {
    return this.request<Order[]>('/delivery/assignments');
  }

  public async updateDeliveryStatus(availabilityStatus: 'ONLINE' | 'OFFLINE'): Promise<{ availabilityStatus: string }> {
    return this.request<{ availabilityStatus: string }>('/delivery/status', {
      method: 'PATCH',
      body: JSON.stringify({ availabilityStatus }),
    });
  }

  public async acceptDeliveryAssignment(id: string): Promise<Order> {
    return this.request<Order>(`/delivery/assignments/${id}/accept`, { method: 'POST' });
  }

  public async pickupDeliveryOrder(id: string): Promise<Order> {
    return this.request<Order>(`/delivery/assignments/${id}/pickup`, { method: 'POST' });
  }

  public async completeDelivery(id: string, deliveryOtp: string): Promise<Order> {
    return this.request<Order>(`/delivery/assignments/${id}/deliver`, {
      method: 'POST',
      body: JSON.stringify({ deliveryOtp }),
    });
  }

  public async reportDeliveryFailure(id: string, reason: string): Promise<Order> {
    return this.request<Order>(`/delivery/assignments/${id}/fail`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Admin Dashboard
  public async getAdminDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/admin/dashboard/stats');
  }

  public async getAdminOrders(status?: string, village?: string): Promise<Order[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (village) params.append('village', village);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request<Order[]>(`/admin/orders${q}`);
  }

  public async assignDeliveryPartner(orderId: string, partnerId: string): Promise<Order> {
    return this.request<Order>(`/admin/orders/${orderId}/assign-delivery`, {
      method: 'POST',
      body: JSON.stringify({ partnerId }),
    });
  }

  public async overrideOrderStatus(orderId: string, newStatus: string, reason: string): Promise<Order> {
    return this.request<Order>(`/admin/orders/${orderId}/override`, {
      method: 'PATCH',
      body: JSON.stringify({ newStatus, reason }),
    });
  }

  public async getDeliveryPartnersList(): Promise<DeliveryPartner[]> {
    return this.request<DeliveryPartner[]>('/admin/delivery-partners');
  }

  public async getAdminReconciliation(): Promise<ReconciliationRecord[]> {
    return this.request<ReconciliationRecord[]>('/admin/reports/reconciliation');
  }

  public async updateServiceAreaFee(areaId: string, deliveryFeePaise: number, minOrderPaise: number): Promise<ServiceArea> {
    return this.request<ServiceArea>(`/admin/service-areas/${areaId}?deliveryFeePaise=${deliveryFeePaise}&minOrderPaise=${minOrderPaise}`, {
      method: 'PUT',
    });
  }

  public async getOrderHistory(orderId: string): Promise<any[]> {
    return this.request<any[]>(`/admin/orders/${orderId}/history`);
  }

  public async getAllRestaurantsAdmin(): Promise<Restaurant[]> {
    return this.request<Restaurant[]>('/admin/restaurants');
  }

  public async createRestaurant(data: any): Promise<CreateRestaurantResponse> {
    return this.request<CreateRestaurantResponse>('/admin/restaurants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateRestaurant(id: string, data: any): Promise<Restaurant> {
    return this.request<Restaurant>(`/admin/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async createMenuCategory(restaurantId: string, data: any): Promise<MenuCategory> {
    return this.request<MenuCategory>(`/admin/restaurants/${restaurantId}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async createMenuItem(restaurantId: string, data: any): Promise<MenuItem> {
    return this.request<MenuItem>(`/admin/restaurants/${restaurantId}/menu-items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateMenuItem(itemId: string, data: any): Promise<MenuItem> {
    return this.request<MenuItem>(`/admin/menu-items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async deleteMenuItem(itemId: string): Promise<void> {
    return this.request<void>(`/admin/menu-items/${itemId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
