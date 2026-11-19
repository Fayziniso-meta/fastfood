import type { AddonOption, MenuCategory, OrderStatus, PaymentMethod } from '../types';

export function formatPrice(amount: number): string {
  return `${Math.round(amount)
    .toLocaleString('ru-RU')
    .replace(/,/g, ' ')} so'm`;
}

export function formatShortTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('uz-UZ', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatUzPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  let local = digits;
  if (local.startsWith('998')) {
    local = local.slice(3);
  }
  local = local.slice(0, 9);
  const parts: string[] = [];
  if (local.length > 0) parts.push(local.slice(0, 2));
  if (local.length > 2) parts.push(local.slice(2, 5));
  if (local.length > 5) parts.push(local.slice(5, 7));
  if (local.length > 7) parts.push(local.slice(7, 9));
  return parts.length > 0 ? `+998 ${parts.join(' ')}` : '+998 ';
}

export const MENU_CATEGORIES: MenuCategory[] = [
  'Burgerlar',
  'Lavash va Donar',
  'Pitsa',
  'Tovuq va Fri',
  'Kombo',
  'Ichimliklar',
];

export const DISH_ADDONS: AddonOption[] = [
  { id: 'addon-cheese', name: "Qo'shimcha chedder pishloq", price: 6000 },
  { id: 'addon-jalapeno', name: 'Achchiq jalapeno', price: 4000 },
  { id: 'addon-sauce', name: 'Maxsus olov sousi', price: 4000 },
  { id: 'addon-beef', name: "Qo'shimcha mol go'shti", price: 14000 },
];

export const STUDIO_IMAGES: Array<{ label: string; url: string }> = [
  {
    label: 'Olov Double Burger',
    url: '/src/assets/images/hero_fire_burger_1795065218865.jpg',
  },
  {
    label: 'Klassik Chizburger',
    url: '/src/assets/images/menu_classic_burger_1795065218986.jpg',
  },
  {
    label: 'Gril Lavash',
    url: '/src/assets/images/menu_chicken_lavash_1795065219051.jpg',
  },
  {
    label: 'Pepperoni Pitsa',
    url: '/src/assets/images/menu_pepperoni_pizza_1795065217846.jpg',
  },
  {
    label: 'Qarsildoq Tovuq va Fri',
    url: '/src/assets/images/menu_crispy_chicken_1795065217779.jpg',
  },
  {
    label: 'Muzdek Ichimliklar',
    url: '/src/assets/images/menu_combo_drinks_1795065218752.jpg',
  },
];

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; textClass: string; bgClass: string }
> = {
  new: {
    label: 'Yangi',
    textClass: 'text-[#F95700]',
    bgClass: 'bg-[#FFF3EC] border-[#F95700]/25',
  },
  preparing: {
    label: 'Tayyorlanmoqda',
    textClass: 'text-amber-700',
    bgClass: 'bg-amber-50 border-amber-200',
  },
  delivering: {
    label: "Yo'lda",
    textClass: 'text-sky-700',
    bgClass: 'bg-sky-50 border-sky-200',
  },
  completed: {
    label: 'Yetkazildi',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50 border-emerald-200',
  },
  cancelled: {
    label: 'Bekor qilindi',
    textClass: 'text-red-700',
    bgClass: 'bg-red-50 border-red-200',
  },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Naqd pul',
  click_payme: 'Click / Payme',
  card: 'Bank kartasi',
};
