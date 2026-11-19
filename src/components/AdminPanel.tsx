import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Loader2,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  formatPrice,
  formatShortTime,
  MENU_CATEGORIES,
  ORDER_STATUS_META,
  PAYMENT_METHOD_LABELS,
  STUDIO_IMAGES,
} from '../lib/format';
import type {
  KitchenSettings,
  MenuCategory,
  MenuItem,
  Order,
  OrderStatus,
  TelegramStatusInfo,
} from '../types';

interface AdminPanelProps {
  menu: MenuItem[];
  settings: KitchenSettings;
  onMenuUpdated: (menu: MenuItem[]) => void;
  onSettingsUpdated: (settings: KitchenSettings) => void;
}

type AdminTab = 'orders' | 'menu' | 'telegram';

const STATUS_FILTER_OPTIONS: Array<{ value: OrderStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Barchasi' },
  { value: 'new', label: 'Yangi' },
  { value: 'preparing', label: 'Tayyorlanmoqda' },
  { value: 'delivering', label: "Yo'lda" },
  { value: 'completed', label: 'Yetkazildi' },
  { value: 'cancelled', label: 'Bekor qilindi' },
];

export function AdminPanel({
  menu,
  settings,
  onMenuUpdated,
  onSettingsUpdated,
}: AdminPanelProps) {
  const [token, setToken] = useState<string>(
    () => sessionStorage.getItem('olov_admin_token') || ''
  );
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  // Menu editor modal state
  const [menuSearch, setMenuSearch] = useState('');
  const [dishFormOpen, setDishFormOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState<MenuCategory>('Burgerlar');
  const [dishPrice, setDishPrice] = useState('45000');
  const [dishWeight, setDishWeight] = useState('300 g');
  const [dishPrep, setDishPrep] = useState('12');
  const [dishDesc, setDishDesc] = useState('');
  const [dishImage, setDishImage] = useState(STUDIO_IMAGES[0].url);
  const [dishPopular, setDishPopular] = useState(false);
  const [dishSpicy, setDishSpicy] = useState(false);
  const [dishAvailable, setDishAvailable] = useState(true);
  const [dishSaving, setDishSaving] = useState(false);
  const [dishError, setDishError] = useState('');

  // Telegram & Settings state
  const [tgInfo, setTgInfo] = useState<TelegramStatusInfo | null>(null);
  const [tgTesting, setTgTesting] = useState(false);
  const [tgFeedback, setTgFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [settingsDraft, setSettingsDraft] = useState<KitchenSettings>(settings);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

  useEffect(() => {
    setSettingsDraft(settings);
  }, [settings]);

  const handleUnauthorized = useCallback(() => {
    sessionStorage.removeItem('olov_admin_token');
    setToken('');
  }, []);

  const fetchOrders = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (!silent) setOrdersLoading(true);
      try {
        const res = await fetch('/api/admin/orders', {
          headers: { 'x-admin-token': token },
        });
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        const data = (await res.json()) as { orders?: Order[] };
        if (Array.isArray(data.orders)) {
          setOrders(data.orders);
          setSelectedOrder((prev) =>
            prev ? data.orders!.find((o) => o.id === prev.id) || null : null
          );
        }
      } finally {
        if (!silent) setOrdersLoading(false);
      }
    },
    [token, handleUnauthorized]
  );

  const fetchTelegramStatus = useCallback(async () => {
    if (!token) return;
    const res = await fetch('/api/admin/telegram/status', {
      headers: { 'x-admin-token': token },
    });
    if (res.status === 401) {
      handleUnauthorized();
      return;
    }
    if (res.ok) {
      const data = (await res.json()) as TelegramStatusInfo;
      setTgInfo(data);
    }
  }, [token, handleUnauthorized]);

  useEffect(() => {
    if (!token) return;
    fetchOrders();
    fetchTelegramStatus();
    const timer = window.setInterval(() => {
      fetchOrders(true);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [token, fetchOrders, fetchTelegramStatus]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput.trim() }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Kirishda xatolik');
        return;
      }
      sessionStorage.setItem('olov_admin_token', data.token);
      setToken(data.token);
      setPinInput('');
    } catch {
      setAuthError('Server bilan bog‘lanib bo‘lmadi');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'x-admin-token': token },
      }).catch(() => undefined);
    }
    handleUnauthorized();
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setBusyOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ status, notifyTelegram: true }),
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = (await res.json()) as { order?: Order };
      if (data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? data.order! : o))
        );
        setSelectedOrder((prev) =>
          prev && prev.id === orderId ? data.order! : prev
        );
        fetchTelegramStatus();
      }
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleResendTelegram = async (orderId: string) => {
    setBusyOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/resend-telegram`, {
        method: 'POST',
        headers: { 'x-admin-token': token },
      });
      const data = (await res.json()) as {
        order?: Order;
        telegramOk?: boolean;
        error?: string;
      };
      if (data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? data.order! : o))
        );
        setSelectedOrder((prev) =>
          prev && prev.id === orderId ? data.order! : prev
        );
        fetchTelegramStatus();
      }
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setBusyOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        if (selectedOrder?.id === orderId) setSelectedOrder(null);
      }
    } finally {
      setBusyOrderId(null);
    }
  };

  const openAddDishModal = () => {
    setEditingDish(null);
    setDishName('');
    setDishCategory('Burgerlar');
    setDishPrice('45000');
    setDishWeight('300 g');
    setDishPrep('12');
    setDishDesc('');
    setDishImage(STUDIO_IMAGES[0].url);
    setDishPopular(false);
    setDishSpicy(false);
    setDishAvailable(true);
    setDishError('');
    setDishFormOpen(true);
  };

  const openEditDishModal = (item: MenuItem) => {
    setEditingDish(item);
    setDishName(item.name);
    setDishCategory(item.category);
    setDishPrice(String(item.price));
    setDishWeight(item.weight);
    setDishPrep(String(item.prepMinutes));
    setDishDesc(item.description);
    setDishImage(item.image);
    setDishPopular(Boolean(item.popular));
    setDishSpicy(Boolean(item.spicy));
    setDishAvailable(item.available);
    setDishError('');
    setDishFormOpen(true);
  };

  const handleSaveDish = async (e: FormEvent) => {
    e.preventDefault();
    setDishError('');
    setDishSaving(true);
    try {
      const payload = {
        name: dishName.trim(),
        category: dishCategory,
        price: Number(dishPrice),
        weight: dishWeight.trim(),
        prepMinutes: Number(dishPrep),
        description: dishDesc.trim(),
        image: dishImage.trim(),
        popular: dishPopular,
        spicy: dishSpicy,
        available: dishAvailable,
      };

      const url = editingDish
        ? `/api/admin/menu/${editingDish.id}`
        : '/api/admin/menu';
      const method = editingDish ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { menu?: MenuItem[]; error?: string };
      if (!res.ok || !data.menu) {
        setDishError(data.error || 'Saqlashda xatolik');
        return;
      }
      onMenuUpdated(data.menu);
      setDishFormOpen(false);
    } finally {
      setDishSaving(false);
    }
  };

  const handleToggleDishAvailability = async (item: MenuItem) => {
    const res = await fetch(`/api/admin/menu/${item.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify({ available: !item.available }),
    });
    const data = (await res.json()) as { menu?: MenuItem[] };
    if (res.ok && data.menu) {
      onMenuUpdated(data.menu);
    }
  };

  const handleDeleteDish = async (id: string) => {
    const res = await fetch(`/api/admin/menu/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': token },
    });
    const data = (await res.json()) as { menu?: MenuItem[] };
    if (res.ok && data.menu) {
      onMenuUpdated(data.menu);
    }
  };

  const handleTestTelegram = async () => {
    setTgTesting(true);
    setTgFeedback(null);
    try {
      const res = await fetch('/api/admin/telegram/test', {
        method: 'POST',
        headers: { 'x-admin-token': token },
      });
      const data = (await res.json()) as {
        ok?: boolean;
        messageId?: number;
        error?: string;
      };
      if (res.ok && data.ok) {
        setTgFeedback({
          type: 'success',
          text: `Test xabari Telegram kanalga muvaffaqiyatli yuborildi (ID: ${data.messageId}).`,
        });
      } else {
        setTgFeedback({
          type: 'error',
          text: data.error || 'Telegram kanalga yuborishda xatolik yuz berdi.',
        });
      }
      fetchTelegramStatus();
    } catch {
      setTgFeedback({
        type: 'error',
        text: 'Server bilan aloqa uzildi.',
      });
    } finally {
      setTgTesting(false);
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSavedMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify(settingsDraft),
      });
      const data = (await res.json()) as { settings?: KitchenSettings };
      if (res.ok && data.settings) {
        onSettingsUpdated(data.settings);
        setSettingsSavedMsg('Sozlamalar saqlandi');
        window.setTimeout(() => setSettingsSavedMsg(''), 3000);
      }
    } finally {
      setSettingsSaving(false);
    }
  };

  // Filtered Orders & Metrics
  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      const statusOk = statusFilter === 'all' || o.status === statusFilter;
      const queryOk =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q);
      return statusOk && queryOk;
    });
  }, [orders, statusFilter, orderSearch]);

  const filteredMenu = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();
    if (!q) return menu;
    return menu.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    );
  }, [menu, menuSearch]);

  const kpis = useMemo(() => {
    const activeCount = orders.filter(
      (o) => o.status === 'new' || o.status === 'preparing' || o.status === 'delivering'
    ).length;
    const revenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);
    const tgSentCount = orders.filter((o) => o.telegramSent).length;
    return {
      totalOrders: orders.length,
      activeCount,
      revenue,
      tgSentCount,
    };
  }, [orders]);

  // PIN Lock Screen
  if (!token) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-zinc-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white border border-zinc-200 p-8">
          <div className="w-12 h-12 rounded-xl bg-[#0D0D0F] text-[#F95700] flex items-center justify-center mb-5">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#0D0D0F] mb-1.5">
            Admin panelga kirish
          </h1>
          <p className="text-sm text-zinc-600 mb-6">
            Buyurtmalar, menyu va Telegram kanal sozlamalarini boshqarish uchun
            PIN kodni kiriting. Standart PIN:{' '}
            <span className="font-mono font-semibold text-[#0D0D0F]">2026</span>
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-pin"
                className="block text-xs font-semibold text-zinc-700 mb-1.5"
              >
                Admin PIN kodi
              </label>
              <input
                id="admin-pin"
                type="password"
                inputMode="numeric"
                autoFocus
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 font-mono text-lg tracking-widest text-[#0D0D0F] focus:outline-none focus:border-[#F95700]"
              />
            </div>

            {authError && (
              <div
                role="alert"
                className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 px-5 min-h-12 rounded-xl bg-[#F95700] hover:bg-[#DC4A00] text-white font-semibold text-sm transition-colors cursor-pointer disabled:bg-zinc-400"
            >
              {authLoading ? 'Tekshirilmoqda...' : 'Kirish'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 flex flex-col lg:flex-row">
      {/* Sidebar Navigation (256px) */}
      <aside className="w-full lg:w-64 bg-[#0D0D0F] text-white shrink-0 border-b lg:border-b-0 lg:border-r border-white/10">
        <div className="p-5 flex lg:flex-col justify-between lg:h-full gap-4">
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto">
            <p className="hidden lg:block text-xs font-medium text-zinc-500 px-3 mb-2">
              Oshxona boshqaruvi
            </p>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#F95700] text-white'
                  : 'text-zinc-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>Buyurtmalar</span>
              {kpis.activeCount > 0 && (
                <span className="ml-auto font-mono tabular-nums text-xs px-1.5 py-0.5 rounded bg-black/25">
                  {kpis.activeCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-[#F95700] text-white'
                  : 'text-zinc-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 shrink-0" />
              <span>Menyu boshqaruvi</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('telegram');
                fetchTelegramStatus();
              }}
              className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'telegram'
                  ? 'bg-[#F95700] text-white'
                  : 'text-zinc-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Telegram va sozlamalar</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 p-5 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-zinc-500">Admin / Buyurtmalar</p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0D0D0F]">
                  Real vaqtdagi buyurtmalar
                </h1>
              </div>

              <button
                type="button"
                onClick={() => fetchOrders(false)}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-10 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 text-sm font-semibold text-[#0D0D0F] transition-colors cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`}
                />
                <span>Yangilash</span>
              </button>
            </div>

            {/* 4-Column Flat KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl bg-white border border-zinc-200 p-4">
                <p className="text-xs text-zinc-500">Jami buyurtmalar</p>
                <p className="font-mono tabular-nums text-2xl font-bold text-[#0D0D0F] mt-1">
                  {kpis.totalOrders}
                </p>
              </div>
              <div className="rounded-xl bg-white border border-zinc-200 p-4">
                <p className="text-xs text-zinc-500">Faol (jarayonda)</p>
                <p className="font-mono tabular-nums text-2xl font-bold text-[#F95700] mt-1">
                  {kpis.activeCount}
                </p>
              </div>
              <div className="rounded-xl bg-white border border-zinc-200 p-4">
                <p className="text-xs text-zinc-500">Jami tushum</p>
                <p className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-[#0D0D0F] mt-1">
                  {formatPrice(kpis.revenue)}
                </p>
              </div>
              <div className="rounded-xl bg-white border border-zinc-200 p-4">
                <p className="text-xs text-zinc-500">Telegramga yuborildi</p>
                <p className="font-mono tabular-nums text-2xl font-bold text-emerald-700 mt-1">
                  {kpis.tgSentCount} / {kpis.totalOrders}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatusFilter(opt.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      statusFilter === opt.value
                        ? 'bg-[#0D0D0F] text-white'
                        : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="relative md:w-64">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Raqam, ism yoki telefon..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm focus:outline-none focus:border-[#F95700]"
                />
              </div>
            </div>

            {/* Orders Table */}
            <div className="rounded-2xl bg-white border border-zinc-200 overflow-hidden">
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="font-display text-lg font-bold text-[#0D0D0F] mb-1">
                    Hozircha buyurtmalar yo‘q
                  </p>
                  <p className="text-sm text-zinc-500">
                    Saytdan yangi buyurtma berilganda u shu yerda avtomatik paydo
                    bo‘ladi va Telegram kanalga yuboriladi.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500">
                        <th className="py-3 px-4">Buyurtma</th>
                        <th className="py-3 px-4">Mijoz</th>
                        <th className="py-3 px-4">Tarkibi</th>
                        <th className="py-3 px-4 text-right">Summa</th>
                        <th className="py-3 px-4">Holat</th>
                        <th className="py-3 px-4">Telegram</th>
                        <th className="py-3 px-4 text-right">Amal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {filteredOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-zinc-50/80 transition-colors"
                        >
                          <td className="py-3.5 px-4 align-top">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="font-mono font-bold text-[#0D0D0F] hover:text-[#F95700] cursor-pointer"
                            >
                              {order.orderNumber}
                            </button>
                            <p className="text-xs text-zinc-500 tabular-nums mt-0.5">
                              {formatShortTime(order.createdAt)}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 align-top">
                            <p className="font-medium text-[#0D0D0F]">
                              {order.customerName}
                            </p>
                            <p className="font-mono text-xs text-zinc-500 mt-0.5">
                              {order.customerPhone}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 align-top max-w-xs">
                            <p className="text-zinc-700 truncate">
                              {order.items
                                .map((i) => `${i.name} ×${i.quantity}`)
                                .join(', ')}
                            </p>
                            <p className="text-xs text-zinc-500 truncate mt-0.5">
                              {order.deliveryType === 'delivery'
                                ? order.address
                                : 'Olib ketish'}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 align-top text-right font-mono tabular-nums font-semibold text-[#0D0D0F] whitespace-nowrap">
                            {formatPrice(order.total)}
                          </td>

                          <td className="py-3.5 px-4 align-top">
                            <select
                              value={order.status}
                              disabled={busyOrderId === order.id}
                              onChange={(e) =>
                                handleStatusChange(
                                  order.id,
                                  e.target.value as OrderStatus
                                )
                              }
                              aria-label={`${order.orderNumber} holati`}
                              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer focus:outline-none ${
                                ORDER_STATUS_META[order.status].bgClass
                              } ${ORDER_STATUS_META[order.status].textClass}`}
                            >
                              <option value="new">Yangi</option>
                              <option value="preparing">Tayyorlanmoqda</option>
                              <option value="delivering">Yo‘lda</option>
                              <option value="completed">Yetkazildi</option>
                              <option value="cancelled">Bekor qilindi</option>
                            </select>
                          </td>

                          <td className="py-3.5 px-4 align-top">
                            {order.telegramSent ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Yuborildi
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={busyOrderId === order.id}
                                onClick={() => handleResendTelegram(order.id)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#F95700] hover:underline cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Qayta yuborish
                              </button>
                            )}
                          </td>

                          <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="text-xs font-semibold text-zinc-700 hover:text-[#F95700] mr-3 cursor-pointer"
                            >
                              Ko‘rish
                            </button>
                            <button
                              type="button"
                              disabled={busyOrderId === order.id}
                              onClick={() => handleDeleteOrder(order.id)}
                              aria-label={`${order.orderNumber} o‘chirish`}
                              className="text-zinc-400 hover:text-red-600 transition-colors cursor-pointer align-middle"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* MENU MANAGEMENT TAB */}
        {activeTab === 'menu' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-zinc-500">Admin / Menyu</p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0D0D0F]">
                  Menyu boshqaruvi ({menu.length})
                </h1>
              </div>

              <button
                type="button"
                onClick={openAddDishModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-10 rounded-xl bg-[#F95700] hover:bg-[#DC4A00] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi taom qo‘shish</span>
              </button>
            </div>

            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                placeholder="Menyudan qidirish..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-zinc-200 text-sm focus:outline-none focus:border-[#F95700]"
              />
            </div>

            <div className="rounded-2xl bg-white border border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500">
                      <th className="py-3 px-4">Taom</th>
                      <th className="py-3 px-4">Kategoriya</th>
                      <th className="py-3 px-4 text-right">Narx</th>
                      <th className="py-3 px-4">Holati</th>
                      <th className="py-3 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {filteredMenu.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50/70">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-lg object-cover bg-zinc-900 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-[#0D0D0F] truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {item.weight} · {item.prepMinutes} daq
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-zinc-600">
                          {item.category}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#0D0D0F] whitespace-nowrap">
                          {formatPrice(item.price)}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleDishAvailability(item)}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                              item.available
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:bg-zinc-200'
                            }`}
                          >
                            {item.available ? 'Mavjud' : 'Tugagan'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditDishModal(item)}
                            aria-label={`${item.name} tahrirlash`}
                            className="p-2 text-zinc-600 hover:text-[#F95700] transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4 inline" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDish(item.id)}
                            aria-label={`${item.name} o‘chirish`}
                            className="p-2 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TELEGRAM & SETTINGS TAB */}
        {activeTab === 'telegram' && (
          <>
            <div>
              <p className="text-xs text-zinc-500">Admin / Integratsiya</p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0D0D0F]">
                Telegram bot va oshxona sozlamalari
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Telegram Real-Time Channel Panel */}
              <div className="lg:col-span-7 space-y-6">
                <div className="rounded-2xl bg-white border border-zinc-200 p-6 space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-lg font-bold text-[#0D0D0F]">
                        Telegram kanal ulanishi
                      </h2>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Har bir yangi buyurtma va holat o‘zgarishi server orqali
                        darhol kanalga uzatiladi.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={tgTesting}
                      onClick={handleTestTelegram}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D0D0F] hover:bg-[#F95700] text-white text-xs font-semibold transition-colors cursor-pointer disabled:bg-zinc-400"
                    >
                      {tgTesting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Test xabari yuborish</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                      <p className="text-xs text-zinc-500">Kanal ID</p>
                      <p className="font-mono text-sm font-semibold text-[#0D0D0F] mt-1">
                        {tgInfo?.channelId || '-1003963771527'}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                      <p className="text-xs text-zinc-500">Yuborilgan xabarlar</p>
                      <p className="font-mono tabular-nums text-lg font-bold text-emerald-700 mt-0.5">
                        {tgInfo?.totalSent ?? 0}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                      <p className="text-xs text-zinc-500">Xatoliklar</p>
                      <p className="font-mono tabular-nums text-lg font-bold text-zinc-700 mt-0.5">
                        {tgInfo?.totalFailed ?? 0}
                      </p>
                    </div>
                  </div>

                  {tgFeedback && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                        tgFeedback.type === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}
                    >
                      {tgFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      )}
                      <span>{tgFeedback.text}</span>
                    </div>
                  )}

                  {/* Recent Telegram Delivery History */}
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-500 mb-2.5">
                      So‘nggi Telegram yuborishlar tarixi
                    </h3>
                    {!tgInfo || tgInfo.recentLogs.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-4 border-t border-zinc-100">
                        Hozircha yuborishlar qayd etilmagan. Yuqoridagi “Test
                        xabari yuborish” tugmasini bosib tekshirishingiz mumkin.
                      </p>
                    ) : (
                      <div className="divide-y divide-zinc-100 border-t border-zinc-200 max-h-64 overflow-y-auto">
                        {tgInfo.recentLogs.map((log) => (
                          <div
                            key={log.id}
                            className="py-2.5 flex items-start justify-between gap-3 text-xs"
                          >
                            <div>
                              <span
                                className={`font-semibold ${
                                  log.success ? 'text-emerald-700' : 'text-red-600'
                                }`}
                              >
                                {log.success ? 'Muvaffaqiyatli' : 'Xatolik'}
                              </span>
                              <span className="text-zinc-400 mx-1.5">·</span>
                              <span className="text-zinc-700">{log.detail}</span>
                            </div>
                            <span className="font-mono tabular-nums text-zinc-400 shrink-0">
                              {formatShortTime(log.timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Kitchen Settings Form */}
              <div className="lg:col-span-5">
                <form
                  onSubmit={handleSaveSettings}
                  className="rounded-2xl bg-white border border-zinc-200 p-6 space-y-4"
                >
                  <h2 className="font-display text-lg font-bold text-[#0D0D0F]">
                    Oshxona sozlamalari
                  </h2>

                  <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 cursor-pointer">
                    <div>
                      <span className="block text-sm font-semibold text-[#0D0D0F]">
                        Buyurtma qabul qilish
                      </span>
                      <span className="block text-xs text-zinc-500">
                        O‘chirilsa saytda yangi buyurtma yopiladi
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsDraft.kitchenOpen}
                      onChange={(e) =>
                        setSettingsDraft((s) => ({
                          ...s,
                          kitchenOpen: e.target.checked,
                        }))
                      }
                      className="w-5 h-5 accent-[#F95700] cursor-pointer"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Yetkazish narxi (so‘m)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={settingsDraft.deliveryFee}
                        onChange={(e) =>
                          setSettingsDraft((s) => ({
                            ...s,
                            deliveryFee: Number(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 font-mono text-sm focus:outline-none focus:border-[#F95700]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Bepul yetkazishdan (so‘m)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={5000}
                        value={settingsDraft.freeDeliveryThreshold}
                        onChange={(e) =>
                          setSettingsDraft((s) => ({
                            ...s,
                            freeDeliveryThreshold: Number(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 font-mono text-sm focus:outline-none focus:border-[#F95700]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Ish vaqti
                    </label>
                    <input
                      type="text"
                      value={settingsDraft.workHours}
                      onChange={(e) =>
                        setSettingsDraft((s) => ({
                          ...s,
                          workHours: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#F95700]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Telefon raqami
                    </label>
                    <input
                      type="text"
                      value={settingsDraft.phone}
                      onChange={(e) =>
                        setSettingsDraft((s) => ({ ...s, phone: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 font-mono text-sm focus:outline-none focus:border-[#F95700]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Oshxona manzili
                    </label>
                    <input
                      type="text"
                      value={settingsDraft.address}
                      onChange={(e) =>
                        setSettingsDraft((s) => ({
                          ...s,
                          address: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#F95700]"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <span className="text-xs font-medium text-emerald-700">
                      {settingsSavedMsg}
                    </span>
                    <button
                      type="submit"
                      disabled={settingsSaving}
                      className="px-5 py-2.5 rounded-xl bg-[#F95700] hover:bg-[#DC4A00] text-white text-sm font-semibold transition-colors cursor-pointer"
                    >
                      {settingsSaving ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white border border-zinc-200 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="font-mono text-lg font-bold text-[#0D0D0F]">
                  {selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-zinc-500">
                  {formatShortTime(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-9 h-9 rounded-lg hover:bg-zinc-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 block">Mijoz</span>
                  <span className="font-semibold text-[#0D0D0F]">
                    {selectedOrder.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Telefon</span>
                  <span className="font-mono font-semibold text-[#0D0D0F]">
                    {selectedOrder.customerPhone}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-500 block">Manzil / Usul</span>
                  <span className="font-medium text-[#0D0D0F]">
                    {selectedOrder.deliveryType === 'delivery'
                      ? `Yetkazish: ${selectedOrder.address}`
                      : 'Oshxonadan olib ketish'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">To‘lov turi</span>
                  <span className="font-medium text-[#0D0D0F]">
                    {PAYMENT_METHOD_LABELS[selectedOrder.paymentMethod]}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Telegram holati</span>
                  <span
                    className={`font-semibold ${
                      selectedOrder.telegramSent
                        ? 'text-emerald-700'
                        : 'text-red-600'
                    }`}
                  >
                    {selectedOrder.telegramSent
                      ? 'Kanalga yuborilgan'
                      : selectedOrder.telegramError || 'Yuborilmagan'}
                  </span>
                </div>
              </div>

              {selectedOrder.comment && (
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700">
                  <strong>Izoh:</strong> {selectedOrder.comment}
                </div>
              )}

              <div className="divide-y divide-zinc-200 border-y border-zinc-200">
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={`${item.menuItemId}-${idx}`}
                    className="py-2.5 flex justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium text-[#0D0D0F]">
                        {item.name} × {item.quantity}
                      </p>
                      {item.addons.length > 0 && (
                        <p className="text-xs text-zinc-500">
                          + {item.addons.map((a) => a.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="font-mono tabular-nums font-semibold">
                      {formatPrice(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold text-base">
                <span>Jami summa</span>
                <span className="font-mono tabular-nums text-[#F95700]">
                  {formatPrice(selectedOrder.total)}
                </span>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                {(
                  [
                    'new',
                    'preparing',
                    'delivering',
                    'completed',
                    'cancelled',
                  ] as OrderStatus[]
                ).map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={busyOrderId === selectedOrder.id}
                    onClick={() => handleStatusChange(selectedOrder.id, st)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      selectedOrder.status === st
                        ? 'bg-[#0D0D0F] text-white border-[#0D0D0F]'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    {ORDER_STATUS_META[st].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Menu Dish Modal */}
      {dishFormOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4"
          onClick={() => setDishFormOpen(false)}
        >
          <form
            onSubmit={handleSaveDish}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl bg-white border border-zinc-200 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          >
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#0D0D0F]">
                {editingDish ? 'Taomni tahrirlash' : 'Yangi taom qo‘shish'}
              </h3>
              <button
                type="button"
                onClick={() => setDishFormOpen(false)}
                className="w-9 h-9 rounded-lg hover:bg-zinc-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Taom nomi *
                  </label>
                  <input
                    type="text"
                    required
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    placeholder="Masalan: Olov Chizburger"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#F95700]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Kategoriya *
                  </label>
                  <select
                    value={dishCategory}
                    onChange={(e) =>
                      setDishCategory(e.target.value as MenuCategory)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#F95700]"
                  >
                    {MENU_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Narx (so‘m) *
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    required
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 font-mono text-sm focus:outline-none focus:border-[#F95700]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Og‘irlik
                  </label>
                  <input
                    type="text"
                    value={dishWeight}
                    onChange={(e) => setDishWeight(e.target.value)}
                    placeholder="320 g"
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#F95700]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Vaqt (daq)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={dishPrep}
                    onChange={(e) => setDishPrep(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 font-mono text-sm focus:outline-none focus:border-[#F95700]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tarkibi va tavsif
                </label>
                <textarea
                  rows={2}
                  value={dishDesc}
                  onChange={(e) => setDishDesc(e.target.value)}
                  placeholder="Masalliqlar va ta’m haqida qisqacha..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#F95700] resize-none"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Rasm tanlash
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                  {STUDIO_IMAGES.map((img) => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => setDishImage(img.url)}
                      title={img.label}
                      className={`aspect-4/3 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        dishImage === img.url
                          ? 'border-[#F95700]'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.label}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={dishImage}
                  onChange={(e) => setDishImage(e.target.value)}
                  placeholder="Yoki rasm manzilini kiriting..."
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-mono focus:outline-none focus:border-[#F95700]"
                />
              </div>

              <div className="flex flex-wrap gap-5 pt-1 text-xs font-medium text-zinc-700">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dishAvailable}
                    onChange={(e) => setDishAvailable(e.target.checked)}
                    className="w-4 h-4 accent-[#F95700]"
                  />
                  <span>Sotuvda mavjud</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dishPopular}
                    onChange={(e) => setDishPopular(e.target.checked)}
                    className="w-4 h-4 accent-[#F95700]"
                  />
                  <span>Ommabop taom</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dishSpicy}
                    onChange={(e) => setDishSpicy(e.target.checked)}
                    className="w-4 h-4 accent-[#F95700]"
                  />
                  <span>Achchiq</span>
                </label>
              </div>

              {dishError && (
                <p className="text-xs text-red-600 font-medium">{dishError}</p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDishFormOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={dishSaving}
                className="px-5 py-2.5 rounded-xl bg-[#F95700] hover:bg-[#DC4A00] text-white text-sm font-semibold cursor-pointer"
              >
                {dishSaving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
