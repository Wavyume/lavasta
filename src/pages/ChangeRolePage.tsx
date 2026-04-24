import { Link, useNavigate } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { MOCK_ROLES, ROLE_LABEL_UK, type UserRole } from '../auth/phoneRoles';

const ink = '#1a1816';
const muted = '#6b6560';

export function ChangeRolePage() {
  const { session, setRole } = useAuth();
  const navigate = useNavigate();

  if (!session) return null;

  const currentLabel = ROLE_LABEL_UK[session.role];

  const pickRole = (role: UserRole) => {
    setRole(role);
    const name = ROLE_LABEL_UK[role];
    navigate('/', {
      replace: false,
      state: { roleChangeNotice: `Роль змінено на ${name}` },
    });
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
        background:
          'radial-gradient(100% 50% at 50% 0%, rgba(254,136,66,0.15) 0%, transparent 55%),' +
          'radial-gradient(80% 40% at 0% 100%, rgba(0, 170, 180, 0.1) 0%, transparent 50%),' +
          '#f7f2eb',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(rgba(26, 24, 22, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26, 24, 22, 0.04) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
      <div className="pointer-events-none absolute right-[-15%] top-[20%] h-[40vh] w-[60%] rounded-full blur-3xl opacity-25 bg-cyan-500/15" />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-10 pt-4 sm:px-6">
        <header className="mb-6 flex items-center gap-2">
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
              Змінити роль
            </h1>
            <p className="text-xs font-medium" style={{ color: muted }}>
              Демо-список для інтерфейсу
            </p>
          </div>
        </header>

        <div className="mb-4 rounded-2xl border border-[#e8e0d6] bg-white/85 p-4 shadow-[0_4px_24px_rgba(26,24,22,0.06)] backdrop-blur-md">
          <p className="text-sm font-medium" style={{ color: muted }}>
            Зараз обрана роль:
          </p>
          <p className="mt-1.5 text-base font-semibold" style={{ color: ink }}>
            {currentLabel}
          </p>
        </div>

        <p className="mb-3 text-sm leading-snug" style={{ color: muted }}>
          Оберіть роль зі списку:
        </p>

        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {MOCK_ROLES.map((id) => {
            const label = ROLE_LABEL_UK[id];
            const isActive = session.role === id;
            return (
              <li key={id} className="m-0 p-0">
                <button
                  type="button"
                  onClick={() => pickRole(id)}
                  className={[
                    'w-full rounded-2xl border p-3.5 text-left text-[15px] font-semibold transition-all',
                    isActive
                      ? 'border-[#fe8842]/55 bg-white shadow-[0_4px_20px_rgba(254,136,66,0.2)]'
                      : 'border-[#e8e0d6] bg-white/80 shadow-sm hover:-translate-y-0.5 hover:border-[#fe8842]/40 hover:shadow-md active:translate-y-0',
                  ].join(' ')}
                  style={{ color: ink }}
                >
                  {label}
                  {isActive && (
                    <span className="ml-2 text-xs font-medium text-[#fe8842]">(поточна)</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-center text-xs leading-snug" style={{ color: muted }}>
          Після вибору з’явиться сповіщення і вас поверне до головного меню.
        </p>
      </div>
    </div>
  );
}
