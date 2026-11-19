import { Check, Flame, Minus, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DISH_ADDONS, formatPrice } from '../lib/format';
import type { AddonOption, MenuItem } from '../types';

interface DishModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, addons: AddonOption[]) => void;
}

export function DishModal({ item, onClose, onAddToCart }: DishModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<AddonOption[]>([]);

  useEffect(() => {
    setQuantity(1);
    setSelectedAddons([]);
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [item, onClose]);

  if (!item) return null;

  const showAddons = item.category !== 'Ichimliklar';

  const toggleAddon = (addon: AddonOption) => {
    setSelectedAddons((prev) =>
      prev.some((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const addonsTotal = selectedAddons.reduce((acc, a) => acc + a.price, 0);
  const unitPrice = item.price + addonsTotal;
  const totalPrice = unitPrice * quantity;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dish-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top photo */}
        <div className="relative aspect-16/9 w-full bg-[#18181B] shrink-0">
          <img
            src={item.image}
            alt={item.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable details */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1.5">
              <span>{item.category}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{item.weight}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Tayyorlash: {item.prepMinutes} daq</span>
              {item.spicy && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-0.5 text-[#F95700] font-medium">
                    <Flame className="w-3 h-3" aria-hidden="true" />
                    Achchiq
                  </span>
                </>
              )}
            </div>
            <h3
              id="dish-modal-title"
              className="font-display text-2xl font-bold text-[#0D0D0F] mb-2"
            >
              {item.name}
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {item.description}
            </p>
          </div>

          {showAddons && (
            <div>
              <h4 className="text-sm font-semibold text-[#0D0D0F] mb-3">
                Qo‘shimcha masalliqlar (ixtiyoriy)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DISH_ADDONS.map((addon) => {
                  const checked = selectedAddons.some((a) => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddon(addon)}
                      className={`flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        checked
                          ? 'border-[#F95700] bg-[#FFF3EC]'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                            checked
                              ? 'bg-[#F95700] border-[#F95700] text-white'
                              : 'border-zinc-300 bg-white'
                          }`}
                        >
                          {checked && <Check className="w-3.5 h-3.5" />}
                        </span>
                        <span className="text-sm font-medium text-[#0D0D0F] truncate">
                          {addon.name}
                        </span>
                      </div>
                      <span className="font-mono tabular-nums text-xs font-semibold text-zinc-600 shrink-0">
                        +{formatPrice(addon.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Purchase Bar */}
        <div className="p-5 border-t border-zinc-200 bg-zinc-50 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Sonini kamaytirish"
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-[#0D0D0F] transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-mono tabular-nums text-base font-semibold w-9 text-center text-[#0D0D0F]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              aria-label="Sonini oshirish"
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-[#0D0D0F] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onAddToCart(item, quantity, selectedAddons);
              onClose();
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-3 px-6 py-3.5 min-h-12 rounded-xl bg-[#F95700] hover:bg-[#DC4A00] text-white font-semibold text-sm sm:text-base transition-colors cursor-pointer"
          >
            <span>Savatga qo‘shish</span>
            <span className="font-mono tabular-nums">
              {formatPrice(totalPrice)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
