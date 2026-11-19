import { Menu, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { formatPrice } from '../lib/format';

interface NavbarProps {
  activeView: 'store' | 'admin';
  cartCount: number;
  cartSubtotal: number;
  onNavigateStore: (sectionId?: string, selectCategory?: string) => void;
  onNavigateAdmin: () => void;
  onOpenCart: () => void;
}

export function Navbar({
  activeView,
  cartCount,
  cartSubtotal,
  onNavigateStore,
  onNavigateAdmin,
  onOpenCart,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0D0D0F]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            onNavigateStore();
          }}
          className="font-display text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F95700]"
        >
          OLOV <span className="text-[#F95700]">GRILL</span>
        </button>

        {/* Zone 2: 4 clean single-line navigation links */}
        <nav
          aria-label="Asosiy navigatsiya"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-300"
        >
          <button
            type="button"
            onClick={() => onNavigateStore('menyu', 'Barchasi')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-white ${
              activeView === 'store' ? 'text-white' : 'text-zinc-300'
            }`}
          >
            Menyu
          </button>
          <button
            type="button"
            onClick={() => onNavigateStore('menyu', 'Kombo')}
            className="whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-white"
          >
            Kombo
          </button>
          <button
            type="button"
            onClick={() => onNavigateStore('biz-haqimizda')}
            className="whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-white"
          >
            Biz haqimizda
          </button>
          <button
            type="button"
            onClick={onNavigateAdmin}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-white ${
              activeView === 'admin'
                ? 'text-[#F95700] underline underline-offset-8 decoration-2'
                : 'text-zinc-300'
            }`}
          >
            Admin panel
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {activeView === 'store' ? (
            <button
              type="button"
              onClick={onOpenCart}
              className="inline-flex items-center gap-2.5 px-4 py-2.5 min-h-10 rounded-lg bg-[#F95700] hover:bg-[#DC4A00] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Savat</span>
              {cartCount > 0 && (
                <span className="font-mono tabular-nums text-xs bg-black/25 px-1.5 py-0.5 rounded">
                  {cartCount} · {formatPrice(cartSubtotal)}
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigateStore()}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-10 rounded-lg bg-white hover:bg-zinc-200 text-[#0D0D0F] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Saytga qaytish
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Menyuni yopish' : 'Menyuni ochish'}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0D0D0F] px-4 py-3 space-y-1">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onNavigateStore('menyu', 'Barchasi');
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-200 hover:bg-white/10"
          >
            Menyu
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onNavigateStore('menyu', 'Kombo');
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-200 hover:bg-white/10"
          >
            Kombo to‘plamlar
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onNavigateStore('biz-haqimizda');
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-200 hover:bg-white/10"
          >
            Biz haqimizda
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onNavigateAdmin();
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#F95700] hover:bg-white/10"
          >
            Admin panel
          </button>
        </div>
      )}
    </header>
  );
}
