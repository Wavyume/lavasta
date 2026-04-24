import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  IconArrowLeft,
  IconCheck,
  IconClockHour4,
  IconSparkles,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import type { AdminStatus, StoredShift } from '../context/ShiftContext';
import { useShift } from '../context/ShiftContext';

const ink = '#1a1816';
const thread = '#2c2a28';
const orange = '#fe8842';

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function statusPhrase(kind: 'start' | 'end', s: AdminStatus): string {
  if (s === 'confirmed') {
    return `Підтверджено адміністратором (${kind === 'start' ? 'початок' : 'завершення'})`;
  }
  return 'Очікує підтвердження від адміністратора';
}

type View = 'main' | 'formStart' | 'formEnd';
type TimePreset = 'now' | 'custom';

function AdminBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900/80"
    >
      <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-amber-500" aria-hidden />
      {children}
    </span>
  );
}

function ShiftSummaryCard({ shift }: { shift: StoredShift }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,250,244,0.9) 100%)',
        boxShadow: '0 4px 32px rgba(44, 42, 40, 0.12), inset 0 0 0 1px rgba(255,255,255,0.5)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-40"
        style={{ background: `radial-gradient(circle, ${orange} 0%, transparent 70%)` }}
      />
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b6560]">Статус зміни</p>
      <ul className="mt-3 space-y-2.5 text-sm text-[#231f20]">
        <li className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[#6b6560]">Початок</span>
          <span className="font-bold tabular-nums">{shift.startTime}</span>
        </li>
        <li>
          <AdminBadge>{statusPhrase('start', shift.startAdminStatus)}</AdminBadge>
        </li>
        {shift.endTime && (
          <>
            <li className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-[#c4b5a4]/60 pt-2.5">
              <span className="text-[#6b6560]">Завершення</span>
              <span className="font-bold tabular-nums">{shift.endTime}</span>
            </li>
            {shift.endAdminStatus && (
              <li>
                <AdminBadge>{statusPhrase('end', shift.endAdminStatus)}</AdminBadge>
              </li>
            )}
          </>
        )}
      </ul>
    </div>
  );
}

export function ShiftPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { shift, isShiftOpen, isShiftClosed, recordShiftStart, recordShiftEnd } = useShift();

  const [view, setView] = useState<View>('main');
  const [timePreset, setTimePreset] = useState<TimePreset>('now');
  const [time, setTime] = useState(nowHHMM());
  const [banner, setBanner] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(null), 12000);
    return () => clearTimeout(t);
  }, [banner]);

  if (!session) return null;

  const openFormStart = (preset: TimePreset) => {
    setTimePreset(preset);
    setTime(preset === 'now' ? nowHHMM() : '');
    setView('formStart');
  };

  const openFormEnd = (preset: TimePreset) => {
    setTimePreset(preset);
    setTime(preset === 'now' ? nowHHMM() : '');
    setView('formEnd');
  };

  const submitStart = () => {
    if (!/^\d{2}:\d{2}$/.test(time)) return;
    recordShiftStart(time);
    setView('main');
    setBanner('start');
  };

  const submitEnd = () => {
    if (!/^\d{2}:\d{2}$/.test(time)) return;
    recordShiftEnd(time);
    setView('main');
    setBanner('end');
  };

  return (
    <div
      className="relative min-h-dvh w-full flex flex-col overflow-x-hidden text-[#231f20]"
      style={{
        fontFamily: '"Roboto", system-ui, sans-serif',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        background: `
          radial-gradient(ellipse 100% 80% at 50% -20%, rgba(254, 136, 66, 0.28) 0%, transparent 50%),
          radial-gradient(ellipse 60% 40% at 100% 100%, rgba(0, 160, 170, 0.15) 0%, transparent 50%),
          #f2ebe3`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.4,
          backgroundImage: `repeating-linear-gradient(90deg, ${thread}14 0, ${thread}14 1px, transparent 1px, transparent 22px)`,
        }}
        aria-hidden
      />

      <div className="shift-aurora pointer-events-none absolute left-[10%] top-32 h-56 w-56 rounded-full bg-[#fe8842]/25 blur-3xl" />
      <div className="shift-aurora pointer-events-none absolute right-[5%] top-1/2 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl [animation-delay:1.2s]" />

      <div className="pointer-events-none absolute inset-0">
        <svg
          className="absolute -left-8 top-40 w-[60%] max-w-sm opacity-[0.12]"
          viewBox="0 0 200 80"
          fill="none"
          aria-hidden
        >
          <path
            d="M0 40 Q50 0 100 40 T200 40"
            stroke="currentColor"
            className="text-[#fe8842]"
            strokeWidth="1.2"
            strokeDasharray="4 6"
          />
        </svg>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-10 pt-4 sm:px-6">
        <header className="mb-4 flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/8 bg-white/90 text-[#5c5856] shadow-sm backdrop-blur transition hover:border-[#fe8842]/50 hover:text-[#231f20]"
            aria-label="Назад до кабінету"
          >
            <IconArrowLeft size={20} stroke={1.75} />
          </Link>
          <div className="min-w-0">
            <h1
              className="text-lg leading-tight sm:text-2xl"
              style={{ fontFamily: '"Dela Gothic One", sans-serif', color: ink }}
            >
              Робоча зміна
            </h1>
            <p className="text-xs font-medium text-[#6b6560]">Lavasta Factory · фіксований облік часу</p>
          </div>
        </header>

        {view === 'main' && banner === 'start' && (
          <div
            className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-50/95 to-white/80 p-3.5 text-sm leading-snug text-emerald-950 shadow-sm"
            role="status"
          >
            <IconSparkles size={20} className="mt-0.5 shrink-0 text-emerald-600" />
            <p>
              <span className="font-semibold">Зміну розпочато. </span>
              Дані збережено. Очікуйте підтвердження від адміністратора — після нього статус
              оновиться автоматично.
            </p>
          </div>
        )}

        {view === 'main' && banner === 'end' && (
          <div
            className="mb-4 flex items-start gap-2 rounded-2xl border border-[#fe8842]/30 bg-gradient-to-r from-amber-50/95 to-white/80 p-3.5 text-sm leading-snug text-[#3d2a10] shadow-sm"
            role="status"
          >
            <IconCheck size={20} className="mt-0.5 shrink-0 text-[#fe8842]" />
            <p>
              <span className="font-semibold">Зміну завершено. </span>
              Час здачі збережено. Адміністратор отримає запис і підтвердить зміни протягом
              робочого дня.
            </p>
          </div>
        )}

        {view === 'formStart' && (
          <div className="shift-form-enter mb-4 rounded-2xl border border-white/50 bg-white/40 p-4 backdrop-blur-md">
            <h2 className="text-sm font-bold text-[#231f20]">Напишіть час початку зміни</h2>
            <p className="mt-1 text-xs text-[#6b6560]">
              {timePreset === 'now'
                ? 'За замовчуванням — зараз, ви можете змінити значення вручну.'
                : 'Вкажіть фактичний час, якщо зміну вже відкрили раніше.'}
            </p>
            <label className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-[#6b6560]">
              Час
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.currentTarget.value)}
              className="mt-1.5 w-full rounded-xl border border-[#d8ccc0] bg-white/90 px-3 py-3 text-lg font-bold tabular-nums text-[#1a1816] shadow-inner outline-none focus:border-[#fe8842] focus:ring-2 focus:ring-[#fe8842]/20"
            />
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setView('main');
                }}
                className="rounded-xl border border-[#c4b5a4] bg-white/60 px-4 py-2.5 text-sm font-semibold text-[#5c5856] transition hover:bg-white"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={submitStart}
                disabled={!time}
                className="shift-btn-primary rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                Зберегти початок зміни
              </button>
            </div>
          </div>
        )}

        {view === 'formEnd' && (
          <div className="shift-form-enter mb-4 rounded-2xl border border-white/50 bg-white/40 p-4 backdrop-blur-md">
            <h2 className="text-sm font-bold text-[#231f20]">Напишіть час завершення зміни</h2>
            <p className="mt-1 text-xs text-[#6b6560]">
              {timePreset === 'now'
                ? 'Поточний час. Змініть, якщо фактично завершили пізніше чи раніше.'
                : 'Вкажіть момент, коли зміну вже завершували (наприклад, після перерви).'}
            </p>
            <label className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-[#6b6560]">
              Час
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.currentTarget.value)}
              className="mt-1.5 w-full rounded-xl border border-[#d8ccc0] bg-white/90 px-3 py-3 text-lg font-bold tabular-nums text-[#1a1816] shadow-inner outline-none focus:border-[#fe8842] focus:ring-2 focus:ring-[#fe8842]/20"
            />
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setView('main')}
                className="rounded-xl border border-[#c4b5a4] bg-white/60 px-4 py-2.5 text-sm font-semibold text-[#5c5856] transition hover:bg-white"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={submitEnd}
                disabled={!time}
                className="shift-btn-primary rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                Зберегти завершення
              </button>
            </div>
          </div>
        )}

        {view === 'main' && !shift && (
          <div className="shift-hero glass-ring relative overflow-hidden rounded-3xl p-5 sm:p-6">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-1/3 -translate-y-1/3 rounded-full bg-gradient-to-br from-white/20 to-[#fe8842]/20 blur-2xl" />
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #ff9a5c 0%, #fe8842 45%, #e86b2a 100%)',
                boxShadow: '0 12px 40px rgba(254, 136, 66, 0.45)',
              }}
            >
              <IconClockHour4 size={32} stroke={1.5} />
            </div>
            <p className="text-base font-medium leading-relaxed text-[#2c2824] sm:text-lg">
              Якщо ви прибули на своє робоче місце, розпочніть зміну
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => openFormStart('custom')}
                className="shift-btn-ghost w-full rounded-2xl border-2 border-[#e0d2c2] bg-white/60 px-4 py-3.5 text-left text-sm font-bold text-[#231f20] transition hover:border-[#fe8842]/50 hover:bg-white"
              >
                Зміну розпочато раніше
                <span className="mt-0.5 block text-xs font-normal text-[#6b6560]">
                  Ви вже на лінії — вкажіть фактичний час відкриття
                </span>
              </button>
              <button
                type="button"
                onClick={() => openFormStart('now')}
                className="shift-btn-primary w-full rounded-2xl px-4 py-3.5 text-sm font-bold"
              >
                Розпочати зміну
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full rounded-2xl border border-transparent py-2.5 text-sm font-semibold text-[#6b6560] underline-offset-2 hover:underline"
              >
                Повернутись в меню
              </button>
            </div>
          </div>
        )}

        {view === 'main' && isShiftOpen && shift && (
          <div className="space-y-4">
            <ShiftSummaryCard shift={shift} />
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => openFormEnd('custom')}
                className="shift-btn-ghost w-full rounded-2xl border-2 border-[#e0d2c2] bg-white/60 px-4 py-3.5 text-left text-sm font-bold text-[#231f20] transition hover:border-[#fe8842]/50 hover:bg-white"
              >
                Зміну завершено раніше
                <span className="mt-0.5 block text-xs font-normal text-[#6b6560]">
                  Ви вже залишили дільницю — вкажіть час
                </span>
              </button>
              <button
                type="button"
                onClick={() => openFormEnd('now')}
                className="shift-btn-primary w-full rounded-2xl px-4 py-3.5 text-sm font-bold"
              >
                Завершити зміну
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full rounded-2xl border border-[#e0d2c2] bg-white/50 py-2.5 text-sm font-semibold text-[#4a4440] transition hover:bg-white"
              >
                Повернутись в меню
              </button>
            </div>
          </div>
        )}

        {view === 'main' && isShiftClosed && shift && (
          <div className="space-y-4">
            <div className="shift-hero glass-ring relative overflow-hidden rounded-3xl p-5 text-center sm:p-6">
              <p
                className="text-2xl leading-tight sm:text-3xl"
                style={{ fontFamily: '"Dela Gothic One", sans-serif', color: ink }}
              >
                Дякуємо
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#5c5652]">
                Сьогодні ви вклали частинку себе в справу, якою можна пишатися.
              </p>
            </div>
            <ShiftSummaryCard shift={shift} />
            <button
              type="button"
              onClick={() => navigate('/')}
              className="shift-btn-primary w-full rounded-2xl px-4 py-3.5 text-sm font-bold"
            >
              Повернутись в меню
            </button>
          </div>
        )}
      </div>

      <style>{`
        .glass-ring {
          background: linear-gradient(150deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 250, 244, 0.75) 100%);
          box-shadow: 0 4px 40px rgba(26, 24, 22, 0.08);
        }
        .glass-ring::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 1.5rem;
          padding: 1px;
          background: linear-gradient(135deg, rgba(254, 136, 66, 0.45), rgba(0, 180, 190, 0.25), rgba(255, 255, 255, 0.2));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .shift-btn-primary {
          background: linear-gradient(135deg, #ff9a5c 0%, #fe8842 40%, #e86b2a 100%);
          box-shadow: 0 10px 32px rgba(254, 136, 66, 0.42);
        }
        .shift-btn-primary:hover {
          filter: brightness(1.04);
        }
        .shift-aurora {
          animation: shift-float 7s ease-in-out infinite;
        }
        @keyframes shift-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(12px, -8px) scale(1.05); }
        }
        @keyframes form-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .shift-form-enter {
          animation: form-in 0.4s ease-out both;
        }
      `}</style>
    </div>
  );
}
