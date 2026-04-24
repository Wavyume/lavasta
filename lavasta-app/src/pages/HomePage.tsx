import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box } from '@mantine/core';
import {
  IconClipboardList,
  IconClockHour4,
  IconCurrencyHryvnia,
  IconLogout,
  IconSwitchHorizontal,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { useShift } from '../context/ShiftContext';
import { getMenuAccessForPhone, ROLE_LABEL_UK, type MenuKey } from '../auth/phoneRoles';

const accent = '#fe8842';
const accentSoft = 'rgba(254, 136, 66, 0.12)';
const ink = '#1a1816';
const muted = '#6b6560';

const menuItems: {
  key: MenuKey;
  label: string;
  hint: string;
  icon: typeof IconClipboardList;
}[] = [
  {
    key: 'orders',
    label: 'До роботи з замовленнями',
    hint: 'Заявки, етапи, статуси',
    icon: IconClipboardList,
  },
  {
    key: 'shift',
    label: 'Зміна',
    hint: 'Облік зміни на лінії',
    icon: IconClockHour4,
  },
  {
    key: 'salary',
    label: 'Переглянути мою ЗП',
    hint: 'Нарахування та виплати',
    icon: IconCurrencyHryvnia,
  },
  {
    key: 'changeRole',
    label: 'Змінити роль',
    hint: 'Обрати роль (демо)',
    icon: IconSwitchHorizontal,
  },
];

type HomeLocationState = { roleChangeNotice?: string };

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [roleToast, setRoleToast] = useState<string | null>(null);
  const { session, logout } = useAuth();
  const { shift, isShiftOpen, isShiftClosed } = useShift();
  const access = useMemo(
    () => (session ? getMenuAccessForPhone(session.phone) : null),
    [session],
  );

  if (!session || !access) return null;

  const roleLabel = ROLE_LABEL_UK[session.role];
  const phoneDisplay = session.phone.replace(
    /(\+380)(\d{2})(\d{3})(\d{2})(\d{2})/,
    '$1 $2 $3 $4 $5',
  );

  const runLabel =
    'Lavasta Factory / якість · екологія · швацьке виробництво / ' +
    'Lavasta Factory / якість · екологія · швацьке виробництво / ';

  useEffect(() => {
    const st = location.state as HomeLocationState | null;
    const notice = st?.roleChangeNotice;
    if (notice) {
      setRoleToast(notice);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!roleToast) return;
    const t = window.setTimeout(() => setRoleToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [roleToast]);

  const shiftLine = useMemo(() => {
    if (!shift) return null;
    if (isShiftOpen) {
      const wait =
        shift.startAdminStatus === 'pending' ? 'очікує підтвердження' : 'підтверджено';
      return `Початок ${shift.startTime} · ${wait}`;
    }
    if (isShiftClosed && shift.endTime) {
      return `${shift.startTime} – ${shift.endTime} · зміна за день зафіксована`;
    }
    return null;
  }, [shift, isShiftOpen, isShiftClosed]);

  return (
    <div
      className="relative min-h-dvh w-full flex flex-col overflow-x-hidden text-[#231f20]"
      style={{
        fontFamily: '"Roboto", system-ui, sans-serif',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        background: 'radial-gradient(120% 80% at 100% 0%, rgba(254,136,66,0.16) 0%, transparent 55%), radial-gradient(90% 60% at 0% 100%, rgba(0, 170, 180, 0.12) 0%, transparent 50%), #f7f2eb',
      }}
    >
      {/* тонка сітка, як на промо-сторінці */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(rgba(26, 24, 22, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26, 24, 22, 0.04) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="pointer-events-none absolute top-[12%] left-[-15%] h-[min(50vh,360px)] w-[70%] rounded-full blur-3xl opacity-30 bg-[#fe8842]/35" />
      <div className="pointer-events-none absolute right-[-20%] bottom-[8%] h-[40vh] w-[60%] rounded-full blur-3xl opacity-25 bg-cyan-500/20" />

      <Box className="relative z-10 flex min-h-dvh w-full max-w-md mx-auto flex-col px-4 pb-8 pt-5 sm:px-6">
        {/* бігущий рядок у дусі лендінгу */}
        <div
          className="-mx-4 sm:-mx-6 mb-5 overflow-hidden border-y border-black/6 bg-white/40 py-2.5 backdrop-blur-sm"
          style={{ transform: 'rotate(-1.2deg) scale(1.02)' }}
        >
          <div
            className="home-marquee-track flex w-max gap-10 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1a1816]/75"
            style={{ fontFamily: '"Roboto", sans-serif' }}
          >
            <span className="shrink-0 pl-1">{runLabel}</span>
            <span className="shrink-0" aria-hidden>
              {runLabel}
            </span>
          </div>
        </div>

        <header className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <img
              src="/logo1.svg"
              alt="Lavasta Factory"
              className="h-9 w-auto object-contain opacity-95 sm:h-10"
              width={160}
              height={65}
            />
            <h1
              className="mt-3 text-[1.35rem] leading-tight text-balance sm:text-2xl"
              style={{ fontFamily: '"Dela Gothic One", sans-serif', color: ink }}
            >
              Кабінет
            </h1>
            <p className="mt-1 text-sm font-medium" style={{ color: muted }}>
              {roleLabel}
            </p>
            <p className="mt-0.5 text-xs tabular-nums text-[#8a8580]">{phoneDisplay}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="group flex shrink-0 items-center gap-1.5 rounded-full border border-black/8 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#5c5856] shadow-sm backdrop-blur transition hover:border-[#fe8842]/40 hover:text-[#231f20]"
          >
            <IconLogout size={16} className="opacity-80 group-hover:text-[#fe8842]" />
            Вийти
          </button>
        </header>

        <p className="mb-4 text-sm leading-snug" style={{ color: muted }}>
          Оберіть дію. Доступні розділи залежать від ролі, прив’язаної до вашого номера.
        </p>

        {roleToast && (
          <div
            className="mb-4 flex items-center gap-2 rounded-xl border border-[#0a9]/20 bg-[#e8f8f6] px-3.5 py-3 text-sm font-medium text-[#0a6b5e] shadow-sm"
            role="status"
            aria-live="polite"
          >
            <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-[#0a9]/70" />
            {roleToast}
          </div>
        )}

        <ul className="grid list-none flex-1 auto-rows-min grid-cols-1 gap-3 p-0 m-0 sm:grid-cols-2 sm:gap-3.5">
          {menuItems.map(({ key, label, hint, icon: Icon }) => {
            const allowed = access[key];
            const isChangeRole = key === 'changeRole';
            const sub =
              key === 'shift' && allowed && shiftLine ? shiftLine : allowed ? hint : 'Немає доступу для цього номера';

            return (
              <li key={key} className="m-0 p-0">
                <button
                  type="button"
                  disabled={!allowed}
                  onClick={() => {
                    if (!allowed) return;
                    if (isChangeRole) {
                      navigate('/change-role');
                      return;
                    }
                    if (key === 'salary') {
                      navigate('/salary');
                      return;
                    }
                    if (key === 'shift') {
                      navigate('/shift');
                      return;
                    }
                    if (key === 'orders') {
                      navigate('/orders');
                      return;
                    }
                  }}
                  className={[
                    'group relative flex w-full flex-col items-start overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 sm:min-h-[120px]',
                    allowed
                      ? 'border-[#e8e0d6] bg-white/85 shadow-[0_4px_24px_rgba(26,24,22,0.06)] backdrop-blur-md hover:-translate-y-0.5 hover:border-[#fe8842]/45 hover:shadow-[0_12px_32px_rgba(254,136,66,0.18)] active:translate-y-0'
                      : 'cursor-not-allowed border-[#ebe6e0]/80 bg-[#f3efe8]/50 opacity-60 grayscale-[0.35]',
                  ].join(' ')}
                >
                  <div
                    className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl transition-colors"
                    style={{
                      background: allowed ? accentSoft : 'rgba(0,0,0,0.04)',
                      color: allowed ? accent : muted,
                    }}
                  >
                    <Icon size={22} stroke={1.75} />
                  </div>
                  <span
                    className="text-[15px] font-semibold leading-snug"
                    style={{ color: allowed ? ink : '#7a7370' }}
                  >
                    {label}
                  </span>
                  <span className="mt-1.5 text-xs leading-snug" style={{ color: muted }}>
                    {sub}
                  </span>
                  {allowed && (
                    <div
                      className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-100"
                      style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)` }}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </Box>

      <style>{`
        @keyframes home-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .home-marquee-track {
          animation: home-marquee 32s linear infinite;
        }
      `}</style>
    </div>
  );
}
