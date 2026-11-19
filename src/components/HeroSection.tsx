import { ArrowRight, Flame } from 'lucide-react';
import { useState } from 'react';
import { formatPrice } from '../lib/format';
import type { KitchenSettings } from '../types';

interface HeroSectionProps {
  settings: KitchenSettings;
  onExploreMenu: (category?: string) => void;
}

const HERO_IMAGE = '/src/assets/images/hero_fire_burger_1795065218865.jpg';

export function HeroSection({ settings, onExploreMenu }: HeroSectionProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <section className="bg-[#0D0D0F] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
        {/* 2-column balanced split hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center py-2 lg:py-6">
            <p className="text-sm font-medium text-[#F95700] tracking-wide mb-4">
              {settings.kitchenOpen
                ? `Har kuni ${settings.workHours} · Toshkent bo‘ylab tezkor yetkazish`
                : 'Oshxona hozircha yopiq · Tez orada ochiladi'}
            </p>

            <h1
              className="font-display font-extrabold tracking-tight text-white leading-[1.06] mb-5 max-w-xl"
              style={{
                fontSize: 'clamp(2.35rem, 4.4vw, 3.85rem)',
                textWrap: 'balance',
              }}
            >
              Ochiq olovda pishgan haqiqiy fastfood ta’mi
            </h1>

            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-lg mb-8">
              Har bir burger, lavash va pitsa buyurtma berilgan zahoti yangi
              tayyorlanadi. Issiq holda eshigingizgacha 30 daqiqada yetkazib
              beramiz.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onExploreMenu('Barchasi')}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 min-h-12 rounded-xl bg-[#F95700] hover:bg-[#DC4A00] text-white font-semibold text-base transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span>Menyuni ko‘rish</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onExploreMenu('Kombo')}
                className="inline-flex items-center gap-2 px-6 py-3.5 min-h-12 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-base transition-colors whitespace-nowrap cursor-pointer"
              >
                Kombo to‘plamlar
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative w-full aspect-16/10 lg:aspect-auto lg:h-full min-h-[280px] lg:min-h-[420px] rounded-2xl overflow-hidden bg-[#18181B] border border-white/10">
              {!imgError ? (
                <img
                  src={HERO_IMAGE}
                  alt="Olovda pishirilgan ikki qavatli smash burger va qarsildoq kartoshka fri"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#18181B] via-[#271710] to-[#0D0D0F] p-8 text-center">
                  <Flame className="w-12 h-12 text-[#F95700] mb-3" />
                  <p className="font-display text-xl font-bold text-white">
                    Olov Double Smash Burger
                  </p>
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-zinc-300">Oshxona xiti</p>
                  <p className="font-display text-lg font-bold text-white">
                    Olov Double Smash Burger
                  </p>
                </div>
                <p className="font-mono tabular-nums text-base font-semibold text-[#F95700]">
                  54 000 so‘m
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width 4-column kitchen highlights strip below hero split */}
        <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-white">
              25–35 daq
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              Issiq holda o‘rtacha yetkazish vaqti
            </p>
          </div>
          <div>
            <p className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-white">
              100% Halol
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              Har kuni yangi saralangan mol va tovuq go‘shti
            </p>
          </div>
          <div>
            <p className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-[#F95700]">
              {formatPrice(settings.freeDeliveryThreshold)}
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              dan yuqori buyurtmalarga yetkazish bepul
            </p>
          </div>
          <div>
            <p className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-white">
              {settings.workHours}
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              Dam olish kunlarisiz tungi yetkazib berish
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
