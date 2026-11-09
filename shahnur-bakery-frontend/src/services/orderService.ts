import api from './api';

export interface OrderItem {
  product: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: any;
  items: OrderItem[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  deliveryAddress: any;
  deliveryDate: string;
  deliveryTime: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

export interface CreateOrderData {
  idempotencyKey?: string;
  items: { product: string; quantity: number; customization?: { weight: number; flavor: string; cream: string; decoration: string; inscription: string } }[];
  gift?: { enabled: boolean; recipient: string; phone: string; message: string; packaging: string };
  promoCode?: string;
  bonusUsed?: number;
  deliveryAddress: {
    street: string;
    city: string;
    district?: string;
    zipCode?: string;
    country?: string;
  };
  deliveryDate: string;
  deliveryTime: string;
  paymentMethod: string;
  specialRequests?: string;
  discount?: number;
}

export const orderService = {
  // Buyurtma yaratish
  async createOrder(data: CreateOrderData): Promise<Order> {
    const res = await api.post('/orders', data);
    return res.data.data;
  },

  // Mening buyurtmalarim
  async getMyOrders(page = 1): Promise<{ data: Order[]; pagination: { pages: number } }> {
    const res = await api.get('/orders', { params: { page, limit: 10 } });
    return res.data;
  },

  // Bitta buyurtma
  async getOrder(id: string): Promise<Order> {
    const res = await api.get(`/orders/${id}`);
    return res.data.data;
  },

  // Buyurtmani bekor qilish
  async cancelOrder(id: string): Promise<Order> {
    const res = await api.put(`/orders/${id}/cancel`);
    return res.data.data;
  },

  // ==================== ADMIN FUNKSIYALARI ====================

  // BARCHA buyurtmalarni olish (ADMIN)
  async getAllOrders(params?: any): Promise<{ data: Order[]; stats: any; pagination: any }> {
    const res = await api.get('/orders/admin/all', { params });
    return res.data;
  },

  // Buyurtma statusini yangilash (ADMIN)
  async updateOrderStatus(id: string, status: string, note?: string): Promise<Order> {
    const res = await api.put(`/orders/${id}/status`, { status, note });
    return res.data.data;
  },

  // Buyurtmani to'liq yangilash (ADMIN)
  async updateOrder(id: string, data: Partial<Order>): Promise<Order> {
    const res = await api.put(`/admin/orders/${id}`, data);
    return res.data.data;
  },
};
