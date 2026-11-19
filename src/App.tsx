import { CheckCircle2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AboutFooter } from './components/AboutFooter';
import { AdminPanel } from './components/AdminPanel';
import { CartDrawer } from './components/CartDrawer';
import { DishModal } from './components/DishModal';
import { HeroSection } from './components/HeroSection';
import { MenuSection } from './components/MenuSection';
import { Navbar } from './components/Navbar';
import type {
  AddonOption,
  CartItem,
  KitchenSettings,
  MenuItem,
  Order,
} from './types';

const DEFAULT_SETTINGS: KitchenSettings = {
  kitchenOpen: true,
  deliveryFee: 15000,
  freeDeliveryThreshold: 100000,
  workHours: '10:00 – 02:00',
  phone: '+998 71 200 45 45',
  address: 'Toshkent sh., Amir Temur shoh ko‘chasi, 48-uy',
};

function makeCartKey(menuItemId: string, addons: AddonOption[]): string {
  const addonIds = addons
    .map((a) => a.id)
    .sort()
    .join(',');
  return `${menuItemId}::${addonIds}`;
}

export default function App() {
  const [activeView, setActiveView] = useState<'store' | 'admin'>('store');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<KitchenSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string>('Barchasi');
  const [detailDish, setDetailDish] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('olov_grill_cart');
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('olov_grill_cart', JSON.stringify(cart));
    } catch {
      // Ignore storage quota issues
    }
  }, [cart]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [menuRes, settingsRes] = await Promise.all([
        fetch('/api/menu'),
        fetch('/api/settings'),
      ]);
      if (menuRes.ok) {
        const mData = (await menuRes.json()) as { menu?: MenuItem[] };
        if (Array.isArray(mData.menu)) setMenu(mData.menu);
      }
      if (settingsRes.ok) {
        const sData = (await settingsRes.json()) as {
          settings?: KitchenSettings;
        };
        if (sData.settings) setSettings(sData.settings);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage((curr) => (curr === message ? '' : curr));
    }, 2600);
  }, []);

  const handleAddToCart = useCallback(
    (item: MenuItem, quantity: number, addons: AddonOption[]) => {
      const cartKey = makeCartKey(item.id, addons);
      setCart((prev) => {
        const existing = prev.find((c) => c.cartKey === cartKey);
        if (existing) {
          return prev.map((c) =>
            c.cartKey === cartKey
              ? { ...c, quantity: Math.min(50, c.quantity + quantity) }
              : c
          );
        }
        return [
          ...prev,
          {
            cartKey,
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity,
            addons,
          },
        ];
      });
      showToast(`"${item.name}" savatga qo‘shildi`);
    },
    [showToast]
  );

  const handleQuickAdd = useCallback(
    (item: MenuItem) => {
      handleAddToCart(item, 1, []);
    },
    [handleAddToCart]
  );

  const handleUpdateCartQty = useCallback((cartKey: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.cartKey === cartKey
            ? { ...c, quantity: Math.min(50, c.quantity + delta) }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  }, []);

  const handleRemoveCartItem = useCallback((cartKey: string) => {
    setCart((prev) => prev.filter((c) => c.cartKey !== cartKey));
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  const handleOrderSuccess = useCallback((order: Order) => {
    setLastOrderNumber(order.orderNumber);
  }, []);

  const handleNavigateStore = useCallback(
    (sectionId?: string, category?: string) => {
      setActiveView('store');
      if (category) {
        setSelectedCategory(category);
      }
      if (sectionId) {
        window.setTimeout(() => {
          const el = document.getElementById(sectionId);
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 60);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    []
  );

  const handleExploreMenu = useCallback((category?: string) => {
    if (category) setSelectedCategory(category);
    const el = document.getElementById('menyu');
    el?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const addonSum = item.addons.reduce((a, b) => a + b.price, 0);
        return sum + (item.price + addonSum) * item.quantity;
      }, 0),
    [cart]
  );

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0D0D0F]">
      <Navbar
        activeView={activeView}
        cartCount={cartCount}
        cartSubtotal={cartSubtotal}
        onNavigateStore={handleNavigateStore}
        onNavigateAdmin={() => {
          setActiveView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCart={() => setCartOpen(true)}
      />

      {activeView === 'store' ? (
        <main className="flex-1">
          <HeroSection
            settings={settings}
            onExploreMenu={handleExploreMenu}
          />
          <MenuSection
            menu={menu}
            loading={loading}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            cart={cart}
            onQuickAdd={handleQuickAdd}
            onUpdateCartQty={handleUpdateCartQty}
            onOpenDetail={setDetailDish}
          />
          <AboutFooter
            settings={settings}
            lastOrderNumber={lastOrderNumber}
            onOpenAdmin={() => {
              setActiveView('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </main>
      ) : (
        <AdminPanel
          menu={menu}
          settings={settings}
          onMenuUpdated={setMenu}
          onSettingsUpdated={setSettings}
        />
      )}

      <DishModal
        item={detailDish}
        onClose={() => setDetailDish(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        open={cartOpen}
        cart={cart}
        settings={settings}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Subtle Add-to-Cart Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#0D0D0F] text-white text-sm font-medium shadow-xl border border-white/10"
        >
          <CheckCircle2 className="w-4 h-4 text-[#F95700] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
