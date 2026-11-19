import { Clock, MapPin, Phone, Search } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { formatPrice, formatShortTime, ORDER_STATUS_META } from '../lib/format';
import type { KitchenSettings, Order } from '../types';

interface AboutFooterProps {
  settings: KitchenSettings;
  lastOrderNumber?: string;
  onOpenAdmin: () => void;
}

type TrackedOrder = Pick<
  Order,
  'orderNumber' | 'status' | 'createdAt' | 'deliveryType' | 'items' | 'total'
>;

export function AboutFooter({
  settings,
  lastOrderNumber,
  onOpenAdmin,
}: AboutFooterProps) {
  const [orderQuery, setOrderQuery] = useState(lastOrderNumber || '');
  const [tracking, setTracking] = useState(false);
  const [tracked, setTracked] = useState<TrackedOrder | null>(null);
  const [trackError, setTrackError] = useState('');

  const handleTrack = async (e: FormEvent) => {
    e.preventDefault();
    const cleaned = orderQuery.trim();
    if (!cleaned) return;

    setTracking(true);
    setTrackError('');
    setTracked(null);

    try {
      const res = await fetch(
        `/api/orders/track/${encodeURIComponent(cleaned.replace(/^#/, ''))}`
      );
      const data = (await res.json()) as { order?: TrackedOrder; error?: string };
      if (!res.ok || !data.order) {
        setTrackError(data.error || 'Buyurtma topilmadi');
      } else {
        setTracked(data.order);
      }
    } catch {
      setTrackError('Holatni tekshirishda xatolik yuz berdi');
    } finally {
      setTracking(false);
    }
  };

  return (
    <>
      {/* Kitchen Story + Live Order Status Lookup */}
      <section
        id="biz-haqimizda"
        className="bg-zinc-50 border-t border-zinc-200 py-16 sm:py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <p className="text-sm font-medium text-[#F95700] mb-2">
                Oshxona falsafasi
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0D0D0F]">
                Muzlatilmagan go‘sht, ochiq olov va aniq vaqt
              </h2>
            </div>

            <p className="text-base text-zinc-600 leading-relaxed max-w-2xl">
              Olov Grill oshxonasida barcha kotletlar va tovuq filelari har kuni
              ertalab yangi tayyorlanadi. Buyurtmangiz sayt orqali tushgan soniyada
              oshpazlarimizning Telegram tizimiga uzatiladi va qizigan grilda
              pishirish boshlanadi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-zinc-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <Clock className="w-4 h-4 text-[#F95700]" aria-hidden="true" />
                  <span>Ish vaqti</span>
                </div>
                <p className="font-mono tabular-nums text-sm font-semibold text-[#0D0D0F]">
                  {settings.workHours}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <Phone className="w-4 h-4 text-[#F95700]" aria-hidden="true" />
                  <span>Aloqa markazi</span>
                </div>
                <p className="font-mono tabular-nums text-sm font-semibold text-[#0D0D0F]">
                  {settings.phone}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <MapPin className="w-4 h-4 text-[#F95700]" aria-hidden="true" />
                  <span>Manzil</span>
                </div>
                <p className="text-sm font-medium text-[#0D0D0F]">
                  {settings.address}
                </p>
              </div>
            </div>
          </div>

          {/* Live Order Tracker */}
          <div className="lg:col-span-5 rounded-2xl bg-white border border-zinc-200 p-6">
            <h3 className="font-display text-lg font-bold text-[#0D0D0F] mb-1">
              Buyurtma holatini tekshirish
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Chekdagi buyurtma raqamini kiriting (masalan: OG-1001)
            </p>

            <form onSubmit={handleTrack} className="flex gap-2">
              <input
                type="text"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="#OG-1001"
                aria-label="Buyurtma raqami"
                className="flex-1 px-3.5 py-2.5 min-h-11 rounded-xl border border-zinc-200 font-mono text-sm text-[#0D0D0F] focus:outline-none focus:border-[#F95700]"
              />
              <button
                type="submit"
                disabled={tracking}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-11 rounded-xl bg-[#0D0D0F] hover:bg-[#F95700] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
                <span>Tekshirish</span>
              </button>
            </form>

            {trackError && (
              <p className="mt-3 text-xs text-red-600">{trackError}</p>
            )}

            {tracked && (
              <div className="mt-4 pt-4 border-t border-zinc-200 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-[#0D0D0F]">
                    {tracked.orderNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md border text-xs font-semibold ${
                      ORDER_STATUS_META[tracked.status].bgClass
                    } ${ORDER_STATUS_META[tracked.status].textClass}`}
                  >
                    {ORDER_STATUS_META[tracked.status].label}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 tabular-nums">
                  {formatShortTime(tracked.createdAt)} ·{' '}
                  {tracked.items.reduce((a, i) => a + i.quantity, 0)} ta taom ·{' '}
                  <span className="font-mono font-semibold text-[#0D0D0F]">
                    {formatPrice(tracked.total)}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Minimal Black Footer */}
      <footer className="bg-[#0D0D0F] text-zinc-400 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-3">
            <span className="font-display font-extrabold text-white tracking-tight">
              OLOV <span className="text-[#F95700]">GRILL</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>© {new Date().getFullYear()} Barcha huquqlar himoyalangan</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="#menyu"
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              Menyu
            </a>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="hover:text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              Admin boshqaruv
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
