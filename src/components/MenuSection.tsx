import { Flame, Minus, Plus, Search, UtensilsCrossed } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatPrice, MENU_CATEGORIES } from '../lib/format';
import type { CartItem, MenuItem } from '../types';

interface MenuSectionProps {
  menu: MenuItem[];
  loading: boolean;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  cart: CartItem[];
  onQuickAdd: (item: MenuItem) => void;
  onUpdateCartQty: (cartKey: string, delta: number) => void;
  onOpenDetail: (item: MenuItem) => void;
}

type SortOption = 'popular' | 'price_asc' | 'price_desc';

function DishImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-800 text-zinc-400 p-4">
        <UtensilsCrossed className="w-8 h-8 text-[#F95700] mb-2" />
        <span className="text-xs text-center text-zinc-300 line-clamp-1">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
    />
  );
}

export function MenuSection({
  menu,
  loading,
  selectedCategory,
  onSelectCategory,
  cart,
  onQuickAdd,
  onUpdateCartQty,
  onOpenDetail,
}: MenuSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const categories = useMemo(() => ['Barchasi', ...MENU_CATEGORIES], []);

  const filteredMenu = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = menu.filter((item) => {
      const catMatch =
        selectedCategory === 'Barchasi' || item.category === selectedCategory;
      const searchMatch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });

    if (sortBy === 'price_asc') {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price_desc') {
      return [...list].sort((a, b) => b.price - a.price);
    }
    return [...list].sort((a, b) => Number(Boolean(b.popular)) - Number(Boolean(a.popular)));
  }, [menu, selectedCategory, searchQuery, sortBy]);

  // Helper: find base cart entry (without addons) for quick inline stepper
  const getBaseCartEntry = (menuItemId: string) =>
    cart.find((c) => c.menuItemId === menuItemId && c.addons.length === 0);

  const getTotalItemCountInCart = (menuItemId: string) =>
    cart
      .filter((c) => c.menuItemId === menuItemId)
      .reduce((acc, c) => acc + c.quantity, 0);

  return (
    <section id="menyu" className="bg-white py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-sm font-medium text-[#F95700] mb-2">
              Interaktiv menyu
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0D0D0F]">
              Oshxona taomlari
            </h2>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search
                className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Taom qidirish..."
                aria-label="Taom qidirish"
                className="w-full pl-10 pr-4 py-2.5 min-h-11 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-[#0D0D0F] placeholder:text-zinc-400 focus:outline-none focus:border-[#F95700] focus:bg-white transition-colors"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Saralash"
              className="px-3.5 py-2.5 min-h-11 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-medium text-[#0D0D0F] focus:outline-none focus:border-[#F95700] cursor-pointer"
            >
              <option value="popular">Ommaboplar birinchi</option>
              <option value="price_asc">Avval arzonlari</option>
              <option value="price_desc">Avval qimmatlari</option>
            </select>
          </div>
        </div>

        {/* Category Filter Tabs (Interactive Buttons) */}
        <div
          role="tablist"
          aria-label="Taom kategoriyalari"
          className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-zinc-200"
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectCategory(cat)}
                className={`px-4 py-2.5 min-h-10 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0D0D0F] text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-[#0D0D0F]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-zinc-200 bg-white overflow-hidden animate-pulse"
              >
                <div className="aspect-4/3 bg-zinc-200" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-28 bg-zinc-200 rounded" />
                  <div className="h-5 w-48 bg-zinc-200 rounded" />
                  <div className="h-4 w-full bg-zinc-100 rounded" />
                  <div className="pt-2 flex justify-between items-center">
                    <div className="h-5 w-24 bg-zinc-200 rounded" />
                    <div className="h-10 w-28 bg-zinc-200 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredMenu.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-zinc-200 bg-zinc-50 px-6">
            <p className="font-display text-xl font-bold text-[#0D0D0F] mb-2">
              Mos taom topilmadi
            </p>
            <p className="text-sm text-zinc-600 mb-6">
              Qidiruv so‘zini o‘zgartiring yoki barcha kategoriyalarni ko‘ring.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                onSelectCategory('Barchasi');
              }}
              className="px-5 py-2.5 rounded-lg bg-[#0D0D0F] text-white text-sm font-semibold hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Barcha taomlarni ko‘rsatish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredMenu.map((item) => {
              const baseEntry = getBaseCartEntry(item.id);
              const totalQty = getTotalItemCountInCart(item.id);

              return (
                <article
                  key={item.id}
                  className={`group flex flex-col rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 ${
                    !item.available ? 'opacity-65' : ''
                  }`}
                >
                  {/* 4:3 Image Stage */}
                  <button
                    type="button"
                    onClick={() => item.available && onOpenDetail(item)}
                    disabled={!item.available}
                    className="relative aspect-4/3 w-full bg-[#18181B] overflow-hidden text-left cursor-pointer disabled:cursor-not-allowed"
                  >
                    <DishImage src={item.image} alt={item.name} />
                    {!item.available && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="px-3.5 py-1.5 rounded-lg bg-black text-white text-xs font-semibold tracking-wide">
                          Vaqtincha tugagan
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Uniform Card Body */}
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Clean unboxed metadata with typographic separators */}
                    <div className="flex items-center flex-wrap gap-1.5 text-xs text-zinc-500 mb-1.5">
                      <span>{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{item.weight}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{item.prepMinutes} daq</span>
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

                    <button
                      type="button"
                      onClick={() => item.available && onOpenDetail(item)}
                      disabled={!item.available}
                      className="text-left font-display text-lg font-bold text-[#0D0D0F] group-hover:text-[#F95700] transition-colors mb-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {item.name}
                    </button>

                    <p className="text-sm text-zinc-600 leading-relaxed line-clamp-2 mb-5">
                      {item.description}
                    </p>

                    {/* Aligned Price & Action Baseline */}
                    <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-mono tabular-nums text-base font-semibold text-[#0D0D0F]">
                          {formatPrice(item.price)}
                        </p>
                        {totalQty > 0 && !baseEntry && (
                          <p className="text-xs text-[#F95700] font-medium">
                            Savatda {totalQty} ta (qo‘shimchali)
                          </p>
                        )}
                      </div>

                      {!item.available ? (
                        <span className="text-xs font-medium text-zinc-400">
                          Mavjud emas
                        </span>
                      ) : baseEntry ? (
                        <div className="inline-flex items-center gap-1 rounded-lg bg-[#0D0D0F] p-1 text-white">
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(baseEntry.cartKey, -1)}
                            aria-label={`${item.name} sonini kamaytirish`}
                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/15 transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono tabular-nums text-sm font-semibold w-7 text-center">
                            {baseEntry.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(baseEntry.cartKey, 1)}
                            aria-label={`${item.name} sonini oshirish`}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-[#F95700] hover:bg-[#DC4A00] transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onQuickAdd(item)}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-10 rounded-lg bg-[#0D0D0F] hover:bg-[#F95700] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>Savatga</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
