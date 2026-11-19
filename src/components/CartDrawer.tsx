import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Send,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { formatPrice, formatUzPhone, PAYMENT_METHOD_LABELS } from '../lib/format';
import type {
  CartItem,
  DeliveryType,
  KitchenSettings,
  Order,
  PaymentMethod,
} from '../types';

interface CartDrawerProps {
  open: boolean;
  cart: CartItem[];
  settings: KitchenSettings;
  onClose: () => void;
  onUpdateQty: (cartKey: string, delta: number) => void;
  onRemoveItem: (cartKey: string) => void;
  onClearCart: () => void;
  onOrderSuccess: (order: Order) => void;
}

export function CartDrawer({
  open,
  cart,
  settings,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
}: CartDrawerProps) {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+998 ');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [comment, setComment] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const subtotal = cart.reduce((sum, item) => {
    const addonSum = item.addons.reduce((a, b) => a + b.price, 0);
    return sum + (item.price + addonSum) * item.quantity;
  }, 0);

  const freeDeliveryRemaining = Math.max(
    0,
    settings.freeDeliveryThreshold - subtotal
  );
  const deliveryFee =
    deliveryType === 'pickup' ||
    subtotal === 0 ||
    subtotal >= settings.freeDeliveryThreshold
      ? 0
      : settings.deliveryFee;
  const grandTotal = subtotal + deliveryFee;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (customerName.trim().length < 2) {
      setError('Iltimos, ismingizni kiriting');
      return;
    }
    if (customerPhone.replace(/\D/g, '').length < 12) {
      setError('Telefon raqamingizni to‘liq kiriting (+998 XX XXX XX XX)');
      return;
    }
    if (deliveryType === 'delivery' && address.trim().length < 5) {
      setError('Yetkazib berish manzilini aniq kiriting');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          deliveryType,
          address: address.trim(),
          paymentMethod,
          comment: comment.trim(),
          items: cart.map((c) => ({
            menuItemId: c.menuItemId,
            quantity: c.quantity,
            addons: c.addons,
          })),
        }),
      });

      const data = (await res.json()) as { order?: Order; error?: string };
      if (!res.ok || !data.order) {
        setError(data.error || 'Buyurtmani yuborishda xatolik yuz berdi');
        return;
      }

      setConfirmedOrder(data.order);
      onClearCart();
      onOrderSuccess(data.order);
    } catch {
      setError('Server bilan aloqa uzildi. Qaytadan urinib ko‘ring.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setConfirmedOrder(null);
    setError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Savat va buyurtma rasmiylashtirish"
      onClick={resetAndClose}
    >
      <div
        className="w-full max-w-lg bg-white h-full flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0D0D0F]">
              {confirmedOrder ? 'Buyurtma tasdiqlandi' : 'Sizning savatingiz'}
            </h2>
            {!confirmedOrder && cart.length > 0 && (
              <p className="text-xs text-zinc-500 mt-0.5 tabular-nums">
                {cart.reduce((a, b) => a + b.quantity, 0)} ta mahsulot tanlangan
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="Savatni yopish"
            className="w-10 h-10 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmed Order Receipt */}
        {confirmedOrder ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="rounded-2xl bg-[#0D0D0F] text-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-7 h-7 text-[#F95700] shrink-0" />
                <div>
                  <p className="text-xs text-zinc-400">Buyurtma raqami</p>
                  <p className="font-mono text-2xl font-bold tracking-tight">
                    {confirmedOrder.orderNumber}
                  </p>
                </div>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Rahmat, <strong className="text-white">{confirmedOrder.customerName}</strong>!
                Buyurtmangiz oshxonaga qabul qilindi va tez orada tayyorlanadi.
              </p>

              <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2.5 text-xs">
                <Send className="w-4 h-4 text-[#F95700] shrink-0" />
                <span className="text-zinc-200">
                  {confirmedOrder.telegramSent
                    ? 'Buyurtma real vaqt rejimida Telegram kanalga yuborildi'
                    : 'Buyurtma saqlandi (Telegram xabarnoma qayta yuborish kutilmoqda)'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <h3 className="font-semibold text-[#0D0D0F]">Buyurtma tafsiloti</h3>
              <div className="divide-y divide-zinc-100 border-y border-zinc-200">
                {confirmedOrder.items.map((item, idx) => (
                  <div
                    key={`${item.menuItemId}-${idx}`}
                    className="py-3 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium text-[#0D0D0F]">
                        {item.name} × {item.quantity}
                      </p>
                      {item.addons.length > 0 && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                          + {item.addons.map((a) => a.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="font-mono tabular-nums font-medium text-[#0D0D0F] shrink-0">
                      {formatPrice(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-zinc-600">
                  <span>Yetkazib berish</span>
                  <span className="font-mono tabular-nums">
                    {confirmedOrder.deliveryFee === 0
                      ? 'Bepul'
                      : formatPrice(confirmedOrder.deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#0D0D0F] pt-1">
                  <span>Jami to‘lov</span>
                  <span className="font-mono tabular-nums text-[#F95700]">
                    {formatPrice(confirmedOrder.total)}
                  </span>
                </div>
              </div>

              <div className="pt-3 text-xs text-zinc-500 space-y-1">
                <p>
                  <strong className="text-zinc-700">Telefon:</strong>{' '}
                  {confirmedOrder.customerPhone}
                </p>
                <p>
                  <strong className="text-zinc-700">Manzil:</strong>{' '}
                  {confirmedOrder.address}
                </p>
                <p>
                  <strong className="text-zinc-700">To‘lov turi:</strong>{' '}
                  {PAYMENT_METHOD_LABELS[confirmedOrder.paymentMethod]}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={resetAndClose}
              className="w-full py-3.5 rounded-xl bg-[#0D0D0F] hover:bg-zinc-800 text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              Menyuga qaytish
            </button>
          </div>
        ) : cart.length === 0 ? (
          /* Empty Cart State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
              <ShoppingBag className="w-7 h-7 text-zinc-400" />
            </div>
            <h3 className="font-display text-xl font-bold text-[#0D0D0F] mb-2">
              Savat hozircha bo‘sh
            </h3>
            <p className="text-sm text-zinc-500 max-w-xs mb-6">
              Menyudan sevimli burger, lavash yoki pitsalaringizni tanlang va
              onlayn buyurtma bering.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-[#F95700] hover:bg-[#DC4A00] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Menyuni ko‘rish
            </button>
          </div>
        ) : (
          /* Populated Cart + Checkout Form */
          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Free delivery progress bar */}
              {deliveryType === 'delivery' && (
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                  <div className="flex items-center justify-between text-xs font-medium mb-2">
                    <span className="text-zinc-700">
                      {freeDeliveryRemaining > 0
                        ? `Bepul yetkazish uchun yana ${formatPrice(
                            freeDeliveryRemaining
                          )}`
                        : 'Tabriklaymiz! Yetkazib berish bepul'}
                    </span>
                    <span className="font-mono tabular-nums text-[#F95700]">
                      {Math.min(
                        100,
                        Math.round(
                          (subtotal / Math.max(1, settings.freeDeliveryThreshold)) *
                            100
                        )
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                    <div
                      className="h-full bg-[#F95700] transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (subtotal / Math.max(1, settings.freeDeliveryThreshold)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Cart Items */}
              <div className="divide-y divide-zinc-200">
                {cart.map((item) => {
                  const addonSum = item.addons.reduce((a, b) => a + b.price, 0);
                  const lineTotal = (item.price + addonSum) * item.quantity;

                  return (
                    <div key={item.cartKey} className="py-4 first:pt-0 flex gap-3.5">
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover bg-zinc-900 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-[#0D0D0F] leading-snug">
                            {item.name}
                          </h3>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.cartKey)}
                            aria-label={`${item.name} o‘chirish`}
                            className="p-1 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {item.addons.length > 0 && (
                          <p className="text-xs text-zinc-500 mt-0.5">
                            + {item.addons.map((a) => a.name).join(', ')}
                          </p>
                        )}

                        <div className="mt-2.5 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 p-0.5">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(item.cartKey, -1)}
                              aria-label="Kamaytirish"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-100 text-[#0D0D0F] cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono tabular-nums text-xs font-semibold w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQty(item.cartKey, 1)}
                              aria-label="Oshirish"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-100 text-[#0D0D0F] cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="font-mono tabular-nums text-sm font-semibold text-[#0D0D0F]">
                            {formatPrice(lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Checkout Form */}
              <div className="pt-4 border-t border-zinc-200 space-y-4">
                <h3 className="font-display text-lg font-bold text-[#0D0D0F]">
                  Buyurtma ma’lumotlari
                </h3>

                {/* Delivery vs Pickup Segmented Toggle */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                      deliveryType === 'delivery'
                        ? 'bg-[#0D0D0F] text-white'
                        : 'text-zinc-600 hover:text-[#0D0D0F]'
                    }`}
                  >
                    Yetkazib berish
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                      deliveryType === 'pickup'
                        ? 'bg-[#0D0D0F] text-white'
                        : 'text-zinc-600 hover:text-[#0D0D0F]'
                    }`}
                  >
                    O‘zim olib ketaman
                  </button>
                </div>

                {deliveryType === 'pickup' && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
                    <MapPin className="w-4 h-4 text-[#F95700] shrink-0 mt-0.5" />
                    <span>
                      Olib ketish manzili: <strong className="text-[#0D0D0F]">{settings.address}</strong>
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="checkout-name"
                      className="block text-xs font-semibold text-zinc-700 mb-1.5"
                    >
                      Ismingiz *
                    </label>
                    <input
                      id="checkout-name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Masalan: Jasur"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-[#0D0D0F] focus:outline-none focus:border-[#F95700]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-phone"
                      className="block text-xs font-semibold text-zinc-700 mb-1.5"
                    >
                      Telefon raqam *
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) =>
                        setCustomerPhone(formatUzPhone(e.target.value))
                      }
                      placeholder="+998 90 123 45 67"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 font-mono text-sm text-[#0D0D0F] focus:outline-none focus:border-[#F95700]"
                    />
                  </div>
                </div>

                {deliveryType === 'delivery' && (
                  <div>
                    <label
                      htmlFor="checkout-address"
                      className="block text-xs font-semibold text-zinc-700 mb-1.5"
                    >
                      Yetkazib berish manzili *
                    </label>
                    <input
                      id="checkout-address"
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Tuman, ko‘cha, uy raqami, mo‘ljal"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-[#0D0D0F] focus:outline-none focus:border-[#F95700]"
                    />
                  </div>
                )}

                {/* Payment Method */}
                <div>
                  <span className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    To‘lov usuli
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cash', 'click_payme', 'card'] as PaymentMethod[]).map(
                      (method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`py-2.5 px-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                            paymentMethod === method
                              ? 'border-[#F95700] bg-[#FFF3EC] text-[#F95700]'
                              : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                          }`}
                        >
                          {PAYMENT_METHOD_LABELS[method]}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="checkout-comment"
                    className="block text-xs font-semibold text-zinc-700 mb-1.5"
                  >
                    Qo‘shimcha izoh (ixtiyoriy)
                  </label>
                  <textarea
                    id="checkout-comment"
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Masalan: piyozsiz, eshik kodi 45..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-[#0D0D0F] focus:outline-none focus:border-[#F95700] resize-none"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Checkout Footer */}
            <div className="p-6 border-t border-zinc-200 bg-zinc-50 space-y-3 shrink-0">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-zinc-600">
                  <span>Mahsulotlar</span>
                  <span className="font-mono tabular-nums">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Yetkazib berish</span>
                  <span className="font-mono tabular-nums">
                    {deliveryFee === 0 ? 'Bepul' : formatPrice(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#0D0D0F] pt-1.5 border-t border-zinc-200">
                  <span>Jami</span>
                  <span className="font-mono tabular-nums text-[#F95700]">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !settings.kitchenOpen}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 min-h-12 rounded-xl bg-[#F95700] hover:bg-[#DC4A00] disabled:bg-zinc-400 text-white font-semibold text-sm sm:text-base transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Buyurtma yuborilmoqda...</span>
                  </>
                ) : !settings.kitchenOpen ? (
                  <span>Oshxona hozircha yopiq</span>
                ) : (
                  <>
                    <span>Buyurtma berish · {formatPrice(grandTotal)}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
