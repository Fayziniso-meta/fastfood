export type MenuCategory =
  | 'Burgerlar'
  | 'Lavash va Donar'
  | 'Pitsa'
  | 'Tovuq va Fri'
  | 'Kombo'
  | 'Ichimliklar';

export interface AddonOption {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  description: string;
  price: number;
  weight: string;
  image: string;
  available: boolean;
  popular?: boolean;
  spicy?: boolean;
  prepMinutes: number;
}

export interface CartItem {
  cartKey: string;
  menuItemId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  addons: AddonOption[];
}

export type OrderStatus =
  | 'new'
  | 'preparing'
  | 'delivering'
  | 'completed'
  | 'cancelled';

export type DeliveryType = 'delivery' | 'pickup';
export type PaymentMethod = 'cash' | 'card' | 'click_payme';

export interface OrderItemPayload {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  addons: AddonOption[];
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  deliveryType: DeliveryType;
  address: string;
  paymentMethod: PaymentMethod;
  comment: string;
  items: OrderItemPayload[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  telegramSent: boolean;
  telegramMessageId?: number;
  telegramError?: string;
}

export interface KitchenSettings {
  kitchenOpen: boolean;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  workHours: string;
  phone: string;
  address: string;
}

export interface TelegramLogEntry {
  id: string;
  timestamp: string;
  type: 'order' | 'status' | 'test';
  orderNumber?: string;
  success: boolean;
  messageId?: number;
  detail: string;
}

export interface TelegramStatusInfo {
  configured: boolean;
  channelIdMasked: string;
  channelId: string;
  totalSent: number;
  totalFailed: number;
  recentLogs: TelegramLogEntry[];
}
