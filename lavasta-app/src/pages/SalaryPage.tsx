import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  IconArrowLeft,
  IconAward,
  IconClockHour4,
  IconCurrencyHryvnia,
  IconNeedle,
  IconPackage,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';

const ink = '#1a1816';
const thread = '#2c2a28';

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h) >>> 0;
}

function formatUah(n: number): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Стабільні демо-значення для номеру (без бекенду) */
function demoSalaryForPhone(phone: string) {
  const h = hashString(phone);
  const base = 18000 + (h % 8000);
  const shiftBonus = 1200 + (h % 900);
  const qualityBonus = 500 + (h % 2000);
  const shifts = 20 + (h % 3);
  const hours = shifts * 8 - (h % 4);
  const qualityPct = 94 + (h % 5);
  return { base, shiftBonus, qualityBonus, shifts, hours, qualityPct };
}

const monthLabel = new Intl.DateTimeFormat('uk-UA', {
  month: 'long',
  year: 'numeric',
}).format(new Date());

export function SalaryPage() {
  const { session } = useAuth();
  const s = useMemo(
    () => (session ? demoSalaryForPhone(session.phone) : null),
    [session],
  );
  if (!session || !s) return null;

  const total = s.base + s.shiftBonus + s.qualityBonus;

  return (
    <div
      className="relative min-h-dvh w-full flex flex-col overflow-x-hidden text-[#231f20]"
      style={{
        fontFamily: '"Roboto", system-ui, sans-serif',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        background:
          'radial-gradient(100% 70% at 50% 0%, rgba(254,136,66,0.2) 0%, transparent 50%),' +
          'radial-gradient(80% 50% at 100% 80%, rgba(0, 140, 150, 0.1) 0%, transparent 45%),' +
          '#f0e8de',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        aria-hidden
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, ${thread}08 0, ${thread}08 1px, transparent 1px, transparent 3px)`,
        }}
      />

      <div className="pointer-events-none absolute left-1/2 top-24 h-48 w-48 -translate-x-1/2 rounded-full bg-[#fe8842]/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-10 pt-4 sm:px-6">
        <header className="mb-5 flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/8 bg-white/90 text-[#5c5856] shadow-sm backdrop-blur transition hover:border-[#fe8842]/50 hover:text-[#231f20]"
            aria-label="Назад до кабінету"
          >
            <IconArrowLeft size={20} stroke={1.75} />
          </Link>
          <div className="min-w-0">
            <h1
              className="text-lg leading-tight sm:text-xl"
              style={{ fontFamily: '"Dela Gothic One", sans-serif', color: ink }}
            >
              Моя зарплата
            </h1>
            <p className="text-xs font-medium text-[#6b6560]">{monthLabel}</p>
          </div>
        </header>

        {/* «Ярлик на сумці» — головна сума */}
        <div className="relative mb-5">
          <div
            className="absolute -left-1 -right-1 top-1/2 h-px -translate-y-1/2 opacity-40"
            style={{
              background: `repeating-linear-gradient(90deg, ${thread} 0 4px, transparent 4px 8px)`,
            }}
            aria-hidden
          />
          <div
            className="relative overflow-hidden rounded-2xl border-2 border-[#c4b5a4] bg-gradient-to-b from-[#fffcf5] to-[#f5ebdf] px-4 py-5 shadow-[0_12px_40px_rgba(44,42,40,0.12)]"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' }}
          >
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#fe8842]/15"
              aria-hidden
            />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b6560]">
                  До виплати
                </p>
                <p className="mt-1 flex items-baseline gap-1.5 text-3xl font-bold tabular-nums sm:text-4xl" style={{ color: ink }}>
                  {formatUah(total)}
                  <span className="text-lg font-semibold text-[#fe8842]">₴</span>
                </p>
                <p className="mt-1.5 text-xs text-[#6b6560]">
                  Наробіток за зміни на лініях шиття та контролю якості
                </p>
              </div>
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#fe8842]/30 bg-white/60 text-[#fe8842] shadow-sm"
                aria-hidden
              >
                <IconPackage size={30} stroke={1.5} />
              </div>
            </div>
            <p className="mt-3 border-t border-dashed border-[#c4b5a4]/80 pt-3 text-[11px] leading-snug text-[#5c5856]">
              Як мітка на готовому виробі: сума вже з урахуванням норм цеху та премій за якість. Деталі
              нижче.
            </p>
          </div>
        </div>

        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#6b6560]">
          Склад нарахувань
        </p>
        <ul className="mb-5 flex flex-col gap-2.5 p-0 m-0 list-none">
          {[
            {
              t: 'Базовий фонд',
              d: 'Оклад згідно з посадою в цеху',
              a: s.base,
              i: IconCurrencyHryvnia,
            },
            {
              t: 'Доплата за зміни',
              d: `${s.shifts} змін на лінії за період`,
              a: s.shiftBonus,
              i: IconNeedle,
            },
            {
              t: 'Премія за якість',
              d: `Рівень ≈ ${s.qualityPct}% (шов, обробка)`,
              a: s.qualityBonus,
              i: IconAward,
            },
          ].map((row) => (
            <li
              key={row.t}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#e0d6c8] bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <row.i size={20} className="shrink-0 text-[#fe8842]" stroke={1.6} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: ink }}>{row.t}</p>
                  <p className="text-[11px] text-[#6b6560]">{row.d}</p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums text-[#1a1816]">
                +{formatUah(row.a)} ₴
              </span>
            </li>
          ))}
        </ul>

        <div className="rounded-2xl border border-[#d8ccc0] bg-[#2c2a28]/[0.04] p-3.5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#5c5856]">
            Зміри цеху за період
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {[
              { l: 'Змін', v: String(s.shifts), icon: IconNeedle },
              { l: 'Годин', v: String(s.hours), icon: IconClockHour4 },
              { l: 'Якість', v: `${s.qualityPct}%`, icon: IconAward },
            ].map((m) => (
              <div
                key={m.l}
                className="flex items-center gap-2 rounded-lg border border-black/5 bg-white/50 px-2.5 py-2"
              >
                <m.icon size={16} className="shrink-0 text-[#8a8078]" />
                <div>
                  <p className="text-[9px] font-semibold uppercase text-[#8a8078]">{m.l}</p>
                  <p className="text-sm font-bold tabular-nums" style={{ color: ink }}>{m.v}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] leading-relaxed text-[#8a8078]">
          Демо-дані для кабінету. Підсумок прив’язаний до вашого номера. У боєвому режимі сюди підставлятиме
          бекенд.
        </p>
      </div>
    </div>
  );
}
