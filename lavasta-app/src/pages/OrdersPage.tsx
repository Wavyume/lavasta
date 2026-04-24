import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IconArrowLeft,
  IconBuilding,
  IconChevronDown,
  IconExternalLink,
  IconNeedle,
  IconPackage,
  IconPlus,
  IconSparkles,
  IconTrash,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import {
  DEPARTMENTS,
  getNominalSecondsForTitle,
  OPERATION_TITLES,
  type Department,
} from '../data/ordersCatalog';

const ink = '#1a1816';
const thread = '#2c2a28';
const orange = '#fe8842';
const muted = '#6b6560';

type DurationKind = 'nominal' | 'individual';

type MockOperation = {
  title: string;
  durationKind: DurationKind;
  seconds: number;
  planned: number;
  done: number;
};

type MockOrder = {
  id: string;
  number: string;
  label: string;
  tzUrl: string;
  opSeed: number;
  /** Поля картки для технолога */
  model: string;
  size: string;
  modelQty: number;
  operations: MockOperation[];
};

function buildOperations(seed: number): MockOperation[] {
  return [...OPERATION_TITLES].map((title, i) => {
    const mix = (seed * 17 + i * 13) % 1000;
    const planned = 40 + (mix % 120) + (seed % 4) * 8;
    const done = Math.min(planned - 1, Math.floor(planned * (0.2 + (mix % 50) / 100)));
    const seconds = getNominalSecondsForTitle(title);
    const durationKind: DurationKind = (seed + i) % 3 === 0 ? 'individual' : 'nominal';
    return { title, durationKind, seconds, planned, done: Math.max(0, done) };
  });
}

const MOCK_ORDERS: MockOrder[] = [
  {
    id: 'o1',
    number: 'LV-2026-1842',
    label: 'Тотал-блек · PP',
    tzUrl: 'https://lavastafactory.com',
    opSeed: 1,
    model: 'Shopper S',
    size: '38×32 см',
    modelQty: 240,
    operations: buildOperations(1),
  },
  {
    id: 'o2',
    number: 'LV-2026-1903',
    label: 'Еко-ллян крем',
    tzUrl: 'https://lavastafactory.com',
    opSeed: 2,
    model: 'Tote M',
    size: '42×38 см',
    modelQty: 120,
    operations: buildOperations(2),
  },
  {
    id: 'o3',
    number: 'LV-2026-2011',
    label: 'Промо-набір 500 шт',
    tzUrl: 'https://lavastafactory.com',
    opSeed: 3,
    model: 'Крос-боді L',
    size: '36×40 см',
    modelQty: 500,
    operations: buildOperations(3),
  },
  {
    id: 'o4',
    number: 'LV-2025-9781',
    label: 'Повтор клієнта · Navy',
    tzUrl: 'https://lavastafactory.com',
    opSeed: 4,
    model: 'Backpack',
    size: '44×28×12 см',
    modelQty: 80,
    operations: buildOperations(4),
  },
];

const durationLabel: Record<DurationKind, string> = {
  nominal: 'Номінальна тривалість',
  individual: 'Індивідуальна тривалість',
};

function opKey(orderId: string, idx: number) {
  return `${orderId}::${idx}`;
}

/* ——— Технолог: рядок операції в тех. карті ——— */
type TechnologistRow = {
  id: string;
  title: string;
  seconds: number;
  nominalSeconds: number;
  durationKind: DurationKind;
  planned: number;
  done: number;
  /** Індивід. секунди — чекає погодження */
  pendingApproval: boolean;
  departmentName?: string;
};

function toTechnologistRows(orderId: string, ops: MockOperation[]): TechnologistRow[] {
  return ops.map((op, i) => ({
    id: `${orderId}-init-${i}`,
    title: op.title,
    seconds: op.seconds,
    nominalSeconds: getNominalSecondsForTitle(op.title),
    durationKind: op.durationKind,
    planned: op.planned,
    done: op.done,
    pendingApproval: false,
  }));
}

type AddWizardState = { open: false } | { open: true; orderId: string; orderNumber: string };

const initialTechOps: Record<string, TechnologistRow[]> = Object.fromEntries(
  MOCK_ORDERS.map((o) => [o.id, toTechnologistRows(o.id, o.operations)]),
);

/* ——— UI primitives ——— */
function PrimaryButton({
  children,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={[
        'orders-btn-primary rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={[
        'rounded-xl border border-[#c4b5a4] bg-white/80 px-4 py-2.5 text-sm font-semibold text-[#4a4440] transition hover:border-[#fe8842]/50 hover:bg-white',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}

export function OrdersPage() {
  const { session } = useAuth();
  const isTechnologist = session?.role === 'technologist';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [draftUnits, setDraftUnits] = useState<Record<string, string>>({});
  const [savedUnits, setSavedUnits] = useState<Record<string, number>>({});
  const [techOpsByOrder, setTechOpsByOrder] = useState<Record<string, TechnologistRow[]>>(initialTechOps);
  const [addWizard, setAddWizard] = useState<AddWizardState>({ open: false });

  const selected = useMemo(
    () => (selectedId ? MOCK_ORDERS.find((o) => o.id === selectedId) ?? null : null),
    [selectedId],
  );

  const otherOrders = useMemo(
    () => MOCK_ORDERS.filter((o) => o.id !== selectedId),
    [selectedId],
  );

  const techSelectedOps = selectedId ? techOpsByOrder[selectedId] : undefined;
  const techListOps = useCallback(
    (orderId: string) => techOpsByOrder[orderId] ?? initialTechOps[orderId] ?? [],
    [techOpsByOrder],
  );

  const selectOrder = (id: string) => {
    setSelectedId(id);
    setOpenPanel(null);
  };

  const clearSelection = () => {
    setSelectedId(null);
    setOpenPanel(null);
  };

  const commitUnits = useCallback(
    (key: string) => {
      const raw = draftUnits[key]?.trim();
      if (raw === undefined || raw === '') {
        setSavedUnits((s) => {
          const n = { ...s };
          delete n[key];
          return n;
        });
        return;
      }
      const n = Math.max(0, Math.floor(Number(raw) || 0));
      setSavedUnits((s) => ({ ...s, [key]: n }));
    },
    [draftUnits],
  );

  const deleteTechnOp = (orderId: string, rowId: string) => {
    setTechOpsByOrder((m) => ({
      ...m,
      [orderId]: (m[orderId] ?? []).filter((r) => r.id !== rowId),
    }));
  };

  const appendTechnOp = (orderId: string, row: TechnologistRow) => {
    setTechOpsByOrder((m) => ({
      ...m,
      [orderId]: [...(m[orderId] ?? []), row],
    }));
  };

  if (!session) return null;

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
          radial-gradient(ellipse 100% 70% at 50% -15%, rgba(254, 136, 66, 0.22) 0%, transparent 52%),
          radial-gradient(ellipse 50% 45% at 100% 100%, rgba(0, 160, 170, 0.12) 0%, transparent 55%),
          #f2ebe3`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.4,
          backgroundImage: `repeating-linear-gradient(90deg, ${thread}12 0, ${thread}12 1px, transparent 1px, transparent 20px)`,
        }}
        aria-hidden
      />
      <div className="orders-aurora pointer-events-none absolute left-[5%] top-20 h-52 w-52 rounded-full bg-[#fe8842]/22 blur-3xl" />
      <div className="orders-aurora pointer-events-none absolute right-[8%] top-1/3 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl [animation-delay:1.4s]" />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-12 pt-4 sm:px-6">
        <header className="mb-5 flex items-start gap-2">
          <Link
            to="/"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/8 bg-white/90 text-[#5c5856] shadow-sm backdrop-blur transition hover:border-[#fe8842]/50 hover:text-[#231f20]"
            aria-label="Назад до кабінету"
          >
            <IconArrowLeft size={20} stroke={1.75} />
          </Link>
          <div className="min-w-0">
            <h1
              className="text-lg leading-tight sm:text-2xl"
              style={{ fontFamily: '"Dela Gothic One", sans-serif', color: ink }}
            >
              Замовлення
            </h1>
            <p className="text-xs font-medium text-[#6b6560]">
              {isTechnologist
                ? 'Lavasta Factory · редагування тех. карти'
                : 'Lavasta Factory · маршрут і виконання операцій'}
            </p>
          </div>
        </header>

        <p className="mb-2 text-sm leading-snug" style={{ color: muted }}>
          {isTechnologist
            ? 'Картка показує модель, розмір і кількість моделей. Керуйте ланцюгом операцій: додавання за дільницею, видалення, індивідуальні секунди — після погодження.'
            : 'Торкніться картки, щоб закріпити її зверху та відкрити ланцюг операцій. Кнопка «ТЗ» — технічне завдання в новій вкладці.'}
        </p>
        {selectedId && (
          <button
            type="button"
            onClick={clearSelection}
            className="mb-4 w-full rounded-xl border border-dashed border-[#c4b5a4]/80 bg-white/50 py-2 text-xs font-semibold text-[#5c5652] transition hover:border-[#fe8842]/40 hover:bg-white/80 hover:text-[#231f20]"
          >
            Показати всі картки списку
          </button>
        )}

        <div className="space-y-3">
          {isTechnologist && selected && (
            <div className="orders-sticky-top sticky top-0 z-20 -mx-1 border-b border-black/5 bg-[#f2ebe3]/90 px-1 pb-2 pt-0 backdrop-blur-md">
              <TechnologistOrderCard
                order={selected}
                rows={techSelectedOps ?? []}
                onSelect={() => {}}
                active
                onAdd={() => {
                  setAddWizard({ open: true, orderId: selected.id, orderNumber: selected.number });
                }}
                onDelete={(rowId) => deleteTechnOp(selected.id, rowId)}
              />
            </div>
          )}

          {!isTechnologist && selected && (
            <div className="orders-sticky-top sticky top-0 z-20 -mx-1 border-b border-black/5 bg-[#f2ebe3]/90 px-1 pb-2 pt-0 backdrop-blur-md">
              <WorkerOrderCard
                order={selected}
                active
                onSelect={() => {}}
                onOpClick={(idx) => {
                  const k = opKey(selected.id, idx);
                  setOpenPanel((p) => (p === k ? null : k));
                }}
                openPanelKey={openPanel}
                onDraftChange={(k, v) => setDraftUnits((d) => ({ ...d, [k]: v }))}
                onDraftCommit={commitUnits}
                draftUnits={draftUnits}
                savedUnits={savedUnits}
                operations={selected.operations}
              />
            </div>
          )}

          <ul className="m-0 list-none space-y-3 p-0">
            {(selected ? otherOrders : MOCK_ORDERS).map((order) => (
              <li key={order.id}>
                {isTechnologist ? (
                  <TechnologistOrderCard
                    order={order}
                    rows={techListOps(order.id)}
                    onSelect={() => selectOrder(order.id)}
                    active={false}
                    onAdd={() => {
                      setSelectedId(order.id);
                      setAddWizard({ open: true, orderId: order.id, orderNumber: order.number });
                    }}
                    onDelete={(rowId) => deleteTechnOp(order.id, rowId)}
                  />
                ) : (
                  <WorkerOrderCard
                    order={order}
                    active={false}
                    onSelect={() => selectOrder(order.id)}
                    onOpClick={() => {}}
                    openPanelKey={null}
                    onDraftChange={() => {}}
                    onDraftCommit={() => {}}
                    draftUnits={{}}
                    savedUnits={{}}
                    operations={order.operations}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {isTechnologist && addWizard.open && (
        <AddOperationWizard
          orderId={addWizard.orderId}
          orderNumber={addWizard.orderNumber}
          onClose={() => setAddWizard({ open: false })}
          onAppend={(row) => {
            appendTechnOp(addWizard.orderId, row);
            setAddWizard({ open: false });
          }}
        />
      )}

      <style>{`
        .orders-aurora { animation: orders-float 8s ease-in-out infinite; }
        @keyframes orders-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(10px, -6px) scale(1.04); }
        }
        .orders-sticky-top { padding-bottom: 0.25rem; }
        .orders-glass {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 250, 244, 0.9) 100%);
          box-shadow: 0 4px 36px rgba(26, 24, 22, 0.1);
        }
        .orders-glass::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 1.25rem;
          padding: 1px;
          background: linear-gradient(130deg, rgba(254, 136, 66, 0.5), rgba(0, 180, 190, 0.22), rgba(255, 255, 255, 0.3));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .orders-btn-primary {
          background: linear-gradient(135deg, #ff9a5c 0%, #fe8842 40%, #e86b2a 100%);
          box-shadow: 0 8px 28px rgba(254, 136, 66, 0.38);
        }
        .orders-btn-primary:hover:not(:disabled) { filter: brightness(1.05); }
        .orders-fade-in { animation: orders-in 0.45s ease both; }
        @keyframes orders-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .orders-op-row { transition: background 0.2s, box-shadow 0.2s; }
        .orders-wizard-panel { animation: wz-in 0.35s ease both; }
        @keyframes wz-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ——— Працівник ——— */
function WorkerOrderCard({
  order,
  active,
  onSelect,
  onOpClick,
  openPanelKey,
  draftUnits,
  savedUnits,
  onDraftChange,
  onDraftCommit,
  operations,
}: {
  order: MockOrder;
  active: boolean;
  onSelect: () => void;
  onOpClick: (idx: number) => void;
  openPanelKey: string | null;
  draftUnits: Record<string, string>;
  savedUnits: Record<string, number>;
  onDraftChange: (k: string, v: string) => void;
  onDraftCommit: (k: string) => void;
  operations: MockOperation[];
}) {
  const [opsOpen, setOpsOpen] = useState(true);
  useEffect(() => {
    if (active) setOpsOpen(true);
  }, [active, order.id]);
  const showOps = active && opsOpen;

  return (
    <div
      className={[
        'orders-fade-in relative overflow-hidden rounded-2xl',
        active ? 'orders-glass ring-1 ring-[#fe8842]/30' : 'border border-[#e8e0d6] bg-white/80 shadow-[0_4px_24px_rgba(26,24,22,0.07)] backdrop-blur-md',
      ].join(' ')}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-30"
        style={{ background: `radial-gradient(circle, ${orange} 0%, transparent 72%)` }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-2 p-4 sm:p-4">
        <button
          type="button"
          onClick={() => {
            if (!active) {
              onSelect();
              return;
            }
            setOpsOpen((o) => !o);
          }}
          className="flex w-full items-start gap-3 rounded-xl text-left transition hover:bg-white/40"
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
            style={{
              background: 'linear-gradient(135deg, #ff9a5c 0%, #fe8842 50%, #e86b2a 100%)',
              boxShadow: '0 10px 32px rgba(254, 136, 66, 0.35)',
            }}
          >
            <IconPackage size={24} stroke={1.4} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b6560]">Замовлення</p>
            <p
              className="mt-0.5 break-words text-base font-bold leading-tight text-[#1a1816] sm:text-lg"
              style={{ fontFamily: '"Dela Gothic One", sans-serif' }}
            >
              {order.number}
            </p>
            <p className="mt-1 text-xs font-medium text-[#6b6560]">{order.label}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <a
              href={order.tzUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-lg border border-[#fe8842]/35 bg-gradient-to-b from-white to-[#fff8f3] px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#c24d12] shadow-sm transition hover:border-[#fe8842] hover:shadow"
            >
              ТЗ
              <IconExternalLink size={14} stroke={2} className="opacity-80" />
            </a>
            <span
              className={[
                'inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#e0d2c2] bg-white/60 text-[#5c5652] transition',
                showOps ? 'rotate-180' : '',
              ].join(' ')}
              aria-hidden
            >
              <IconChevronDown size={16} />
            </span>
          </div>
        </button>

        {showOps && (
          <div className="orders-ops border-t border-dashed border-[#c4b5a4]/60 pt-3">
            <div className="mb-2 flex items-center gap-2 px-0.5">
              <IconNeedle size={16} className="text-[#fe8842]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b6560]">Операції</p>
              <div className="h-px flex-1 bg-gradient-to-r from-[#fe8842]/40 to-transparent" />
            </div>
            <ul className="m-0 max-h-[min(60vh,520px)] list-none space-y-1.5 overflow-y-auto overscroll-contain p-0 pr-0.5">
              {operations.map((op, idx) => {
                const k = opKey(order.id, idx);
                const panel = openPanelKey === k;
                const extra = savedUnits[k] ?? 0;
                const doneTotal = op.done + extra;
                const left = Math.max(0, op.planned - doneTotal);
                return (
                  <li key={k}>
                    <div
                      className={[
                        'orders-op-row rounded-xl border px-2.5 py-2',
                        panel
                          ? 'border-[#fe8842]/45 bg-gradient-to-r from-amber-50/95 to-white shadow-[0_4px_20px_rgba(254,136,66,0.12)]'
                          : 'border-[#e8e0d6]/80 bg-white/50',
                      ].join(' ')}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                        <button
                          type="button"
                          onClick={() => onOpClick(idx)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <span className="block text-[13px] font-semibold leading-snug text-[#231f20]">
                            {op.title}
                          </span>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#6b6560]">
                            <span className="inline-flex items-center gap-1">
                              <IconSparkles size={12} className="shrink-0 text-[#fe8842]/80" />
                              <span className="font-medium text-[#4a4440]">{durationLabel[op.durationKind]}</span>
                            </span>
                            <span className="text-[#8a8580]">·</span>
                            <span className="font-bold tabular-nums text-[#1a1816]">{op.seconds} с</span>
                          </div>
                        </button>
                        {extra > 0 && (
                          <div className="flex shrink-0 items-center self-start rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-1 sm:self-center">
                            <span className="text-[11px] font-bold tabular-nums text-emerald-900">
                              +{extra} од.
                            </span>
                          </div>
                        )}
                      </div>
                      {panel && (
                        <div className="mt-2.5 rounded-xl border border-[#d8ccc0]/80 bg-gradient-to-b from-white/95 to-[#fbf6f0] p-3 shadow-inner">
                          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                            <Stat label="Запланована кількість од." value={op.planned} accent="ink" />
                            <Stat label="Зроблено од." value={doneTotal} accent="muted" />
                            <Stat label="Залишилось од." value={left} accent="warn" />
                          </div>
                          <label className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-[#6b6560]">
                            Виготовлено зараз (од.)
                          </label>
                          <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-end">
                            <input
                              type="number"
                              min={0}
                              inputMode="numeric"
                              value={draftUnits[k] ?? (savedUnits[k] !== undefined ? String(savedUnits[k]) : '')}
                              onChange={(e) => onDraftChange(k, e.currentTarget.value)}
                              onBlur={() => onDraftCommit(k)}
                              placeholder="0"
                              className="w-full min-w-0 flex-1 rounded-xl border border-[#d8ccc0] bg-white px-3 py-2.5 text-center text-lg font-bold tabular-nums text-[#1a1816] shadow-inner outline-none focus:border-[#fe8842] focus:ring-2 focus:ring-[#fe8842]/20"
                            />
                            <PrimaryButton
                              onClick={() => onDraftCommit(k)}
                              className="w-full shrink-0 sm:w-auto"
                            >
                              Застосувати
                            </PrimaryButton>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ——— Технолог ——— */
function TechnologistOrderCard({
  order,
  rows,
  active,
  onSelect,
  onAdd,
  onDelete,
}: {
  order: MockOrder;
  rows: TechnologistRow[];
  active: boolean;
  onSelect: () => void;
  onAdd: () => void;
  onDelete: (rowId: string) => void;
}) {
  const [opsOpen, setOpsOpen] = useState(true);
  useEffect(() => {
    if (active) setOpsOpen(true);
  }, [active, order.id]);
  const showOps = active && opsOpen;

  return (
    <div
      className={[
        'orders-fade-in relative overflow-hidden rounded-2xl',
        active ? 'orders-glass ring-1 ring-[#fe8842]/30' : 'border border-[#e8e0d6] bg-white/80 shadow-[0_4px_24px_rgba(26,24,22,0.07)] backdrop-blur-md',
      ].join(' ')}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-30"
        style={{ background: `radial-gradient(circle, ${orange} 0%, transparent 72%)` }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-2 p-4 sm:p-4">
        <button
          type="button"
          onClick={() => {
            if (!active) {
              onSelect();
              return;
            }
            setOpsOpen((o) => !o);
          }}
          className="flex w-full items-start gap-3 rounded-xl text-left transition hover:bg-white/40"
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
            style={{
              background: 'linear-gradient(135deg, #ff9a5c 0%, #fe8842 50%, #e86b2a 100%)',
              boxShadow: '0 10px 32px rgba(254, 136, 66, 0.35)',
            }}
          >
            <IconPackage size={24} stroke={1.4} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b6560]">Замовлення</p>
            <p
              className="mt-0.5 break-words text-base font-bold leading-tight text-[#1a1816] sm:text-lg"
              style={{ fontFamily: '"Dela Gothic One", sans-serif' }}
            >
              {order.number}
            </p>
            <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2 sm:gap-2">
              <div className="rounded-lg border border-[#e8e0d6]/80 bg-white/60 px-2.5 py-1.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#8a8580]">Модель</p>
                <p className="mt-0.5 font-semibold text-[#231f20]">{order.model}</p>
              </div>
              <div className="rounded-lg border border-[#e8e0d6]/80 bg-white/60 px-2.5 py-1.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#8a8580]">Розмір</p>
                <p className="mt-0.5 font-semibold text-[#231f20]">{order.size}</p>
              </div>
              <div className="sm:col-span-2">
                <div className="rounded-lg border border-[#fe8842]/25 bg-gradient-to-r from-amber-50/80 to-white/60 px-2.5 py-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#b3541b]">Кількість моделей</p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums text-[#1a1816]">{order.modelQty} од.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <a
              href={order.tzUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-lg border border-[#fe8842]/35 bg-gradient-to-b from-white to-[#fff8f3] px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#c24d12] shadow-sm transition hover:border-[#fe8842] hover:shadow"
            >
              ТЗ
              <IconExternalLink size={14} stroke={2} className="opacity-80" />
            </a>
            <span
              className={[
                'inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#e0d2c2] bg-white/60 text-[#5c5652] transition',
                showOps ? 'rotate-180' : '',
              ].join(' ')}
              aria-hidden
            >
              <IconChevronDown size={16} />
            </span>
          </div>
        </button>

        {showOps && (
          <div className="border-t border-dashed border-[#c4b5a4]/60 pt-3">
            <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
              <div className="flex min-w-0 items-center gap-2">
                <IconNeedle size={16} className="shrink-0 text-[#fe8842]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b6560]">Операції (тех. карта)</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd();
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-[#fe8842]/40 bg-white/90 px-2.5 py-1.5 text-[11px] font-bold text-[#c24d12] shadow-sm transition hover:bg-[#fff8f3]"
              >
                <IconPlus size={15} stroke={2} />
                Додати
              </button>
            </div>
            <p className="mb-2 px-0.5 text-[10px] leading-relaxed text-[#8a8580]">
              Видалення — після закріплення картки зверху. Додати операцію можна з будь-якої картки.
            </p>
            <ul className="m-0 max-h-[min(60vh,520px)] list-none space-y-1.5 overflow-y-auto overscroll-contain p-0 pr-0.5">
              {rows.map((row) => (
                <li key={row.id}>
                  <div className="group orders-op-row flex flex-col gap-2 rounded-xl border border-[#e8e0d6]/80 bg-white/50 px-2.5 py-2 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold leading-snug text-[#231f20]">{row.title}</span>
                        {row.pendingApproval && (
                          <span className="inline-flex items-center rounded-full border border-amber-300/80 bg-amber-50/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-900">
                            Не підтверджено
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-[#6b6560]">
                        <span className="font-medium text-[#4a4440]">{durationLabel[row.durationKind]}</span>
                        <span className="text-[#8a8580]">·</span>
                        <span className="font-bold tabular-nums text-[#1a1816]">{row.seconds} с / 1 од.</span>
                        <span className="text-[#8a8580]">·</span>
                        <span className="tabular-nums">к-ть: {row.planned}</span>
                        {row.departmentName && (
                          <>
                            <span className="text-[#8a8580]">·</span>
                            <span className="text-[#6b6560]">{row.departmentName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {active && (
                      <button
                        type="button"
                        onClick={() => onDelete(row.id)}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-lg border border-red-200/80 bg-red-50/80 text-red-600 transition hover:border-red-300 hover:bg-red-100 sm:self-center"
                        aria-label="Видалити операцію"
                      >
                        <IconTrash size={18} stroke={1.75} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {!active && (
              <button
                type="button"
                onClick={onSelect}
                className="mt-2 w-full rounded-xl border border-dashed border-[#c4b5a4] bg-white/40 py-2 text-center text-xs font-semibold text-[#5c5652] transition hover:border-[#fe8842]/45 hover:bg-white/70"
              >
                Закріпити зверху, щоб додавати / видаляти операції
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type WizardStep = 'dept' | 'op' | 'qty' | 'seconds' | 'confirmSkip' | 'confirmCustom';

function AddOperationWizard({
  orderId,
  orderNumber,
  onClose,
  onAppend,
}: {
  orderId: string;
  orderNumber: string;
  onClose: () => void;
  onAppend: (r: TechnologistRow) => void;
}) {
  const [step, setStep] = useState<WizardStep>('dept');
  const [department, setDepartment] = useState<Department | null>(null);
  const [operationTitle, setOperationTitle] = useState<string | null>(null);
  const [qty, setQty] = useState('');
  const [customSeconds, setCustomSeconds] = useState('');

  const nominal =
    operationTitle != null ? getNominalSecondsForTitle(operationTitle) : 0;
  const qtyNum = Math.max(0, Math.floor(Number(qty.replace(',', '.')) || 0));

  const doAppend = (mode: 'skip' | 'custom') => {
    if (!department || !operationTitle || qtyNum < 1) return;
    const custom = Math.max(0, Math.floor(Number(customSeconds.replace(',', '.')) || 0));
    const useCustom = mode === 'custom' && custom > 0;
    const row: TechnologistRow = {
      id: `${orderId}-add-${Date.now()}`,
      title: operationTitle,
      seconds: useCustom ? custom : nominal,
      nominalSeconds: nominal,
      durationKind: useCustom ? 'individual' : 'nominal',
      planned: qtyNum,
      done: 0,
      pendingApproval: useCustom,
      departmentName: department.name,
    };
    onAppend(row);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wz-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1a1816]/45 backdrop-blur-sm"
        aria-label="Закрити"
        onClick={onClose}
      />
      <div
        className="orders-wizard-panel relative z-[1] max-h-[min(92dvh,840px)] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/40 bg-gradient-to-b from-white/98 to-[#fbf6f0] p-5 shadow-[0_-8px_48px_rgba(26,24,22,0.15)] sm:rounded-3xl"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/10 sm:hidden" aria-hidden />
        <h2 id="wz-title" className="text-base font-bold text-[#1a1816]" style={{ fontFamily: '"Dela Gothic One", sans-serif' }}>
          Нова операція в тех. карті
        </h2>
        <p className="mt-1 text-xs text-[#6b6560]">
          Замовлення <span className="font-semibold text-[#231f20]">{orderNumber}</span>
        </p>

        {step === 'dept' && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold text-[#231f20]">Оберіть департамент для назначення операції</p>
            <ul className="m-0 list-none space-y-2 p-0">
              {DEPARTMENTS.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setDepartment(d);
                      setStep('op');
                    }}
                    className="flex w-full items-start gap-3 rounded-2xl border border-[#e8e0d6] bg-white/90 p-3 text-left shadow-sm transition hover:border-[#fe8842]/45 hover:shadow-md"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fe8842]/12 text-[#fe8842]">
                      <IconBuilding size={22} stroke={1.5} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-[#1a1816]">{d.name}</span>
                      <span className="mt-0.5 block text-xs text-[#6b6560]">{d.description}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <GhostButton className="mt-3 w-full" onClick={onClose}>
              Скасувати
            </GhostButton>
          </div>
        )}

        {step === 'op' && department && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold text-[#231f20]">{department.name} — оберіть операцію</p>
            <ul className="m-0 max-h-[40vh] list-none space-y-1.5 overflow-y-auto p-0">
              {department.operationTitles.map((t) => {
                const sec = getNominalSecondsForTitle(t);
                return (
                  <li key={t}>
                    <button
                      type="button"
                      onClick={() => {
                        setOperationTitle(t);
                        setStep('qty');
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#e8e0d6] bg-white/90 px-3 py-2.5 text-left text-sm font-medium text-[#231f20] transition hover:border-[#fe8842]/45"
                    >
                      <span className="min-w-0 leading-snug">{t}</span>
                      <span className="shrink-0 text-xs font-bold tabular-nums text-[#fe8842]">{sec} с</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <GhostButton className="w-full" onClick={() => setStep('dept')}>
              Назад
            </GhostButton>
          </div>
        )}

        {step === 'qty' && operationTitle && (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-semibold text-[#231f20]">Впишіть кількість операцій, які потрібно виконати</p>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.currentTarget.value)}
              placeholder="Напр. 120"
              className="w-full rounded-xl border border-[#d8ccc0] bg-white px-3 py-3 text-center text-lg font-bold tabular-nums text-[#1a1816] shadow-inner outline-none focus:border-[#fe8842] focus:ring-2 focus:ring-[#fe8842]/20"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <GhostButton className="sm:flex-1" onClick={() => setStep('op')}>
                Назад
              </GhostButton>
              <PrimaryButton
                className="sm:flex-1"
                disabled={qtyNum < 1}
                onClick={() => setStep('seconds')}
              >
                Далі
              </PrimaryButton>
            </div>
          </div>
        )}

        {step === 'seconds' && operationTitle && department && qtyNum >= 1 && (
          <div className="mt-4 space-y-3">
            <p className="text-sm leading-relaxed text-[#231f20]">
              Якщо вам потрібно додати до операції індивідуальну кількість секунд, впишіть її в текстове поле, або
              натисніть кнопку «Пропустити».
            </p>
            <div className="rounded-xl border border-[#fe8842]/25 bg-amber-50/80 px-3 py-2 text-sm">
              <span className="font-semibold text-[#5c4030]">Номінальна кількість секунд: </span>
              <span className="font-bold tabular-nums text-[#1a1816]">{nominal} с</span>
            </div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6560]">
              Індивідуально, сек / 1 од. (необов’язково)
            </label>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={customSeconds}
              onChange={(e) => setCustomSeconds(e.currentTarget.value)}
              placeholder="Залиште порожнім і натисніть «Пропустити»"
              className="w-full rounded-xl border border-[#d8ccc0] bg-white px-3 py-2.5 text-center text-base font-semibold tabular-nums text-[#1a1816] outline-none focus:border-[#fe8842] focus:ring-2 focus:ring-[#fe8842]/20"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <GhostButton
                className="sm:flex-1"
                onClick={() => {
                  setCustomSeconds('');
                  setStep('confirmSkip');
                }}
              >
                Пропустити
              </GhostButton>
              <PrimaryButton
                className="sm:flex-1"
                onClick={() => {
                  const c = Math.floor(Number(customSeconds) || 0);
                  if (c < 1) return;
                  setStep('confirmCustom');
                }}
              >
                Продовжити
              </PrimaryButton>
            </div>
            <GhostButton className="w-full" onClick={() => setStep('qty')}>
              Назад
            </GhostButton>
          </div>
        )}

        {step === 'confirmSkip' && department && operationTitle && qtyNum >= 1 && (
          <ConfirmBlock
            title="Підтвердіть створення операцію в тех. карту"
            onBack={() => setStep('seconds')}
            onConfirm={() => doAppend('skip')}
            lines={[
              `По замовленню: №${orderNumber}`,
              `Обрано департамент: ${department.name}`,
              `Обрано операцію: ${operationTitle}`,
              `Кількість операцій: ${qtyNum}`,
              '',
              `Оцінка операції за 1 шт.: ${nominal} с`,
              `Оцінка операції за вказану кількість: ${nominal * qtyNum} с`,
            ]}
          />
        )}

        {step === 'confirmCustom' && department && operationTitle && qtyNum >= 1 && (
          <ConfirmBlock
            title="Підтвердіть створення операцію в тех. карту"
            onBack={() => setStep('seconds')}
            onConfirm={() => doAppend('custom')}
            lines={[
              `По замовленню: №${orderNumber}`,
              `Обрано департамент: ${department.name}`,
              `Обрано операцію: ${operationTitle}`,
              `Кількість операцій: ${qtyNum}`,
              '',
              'Номінальний розрахунок:',
              `Оцінка операції за 1 шт.: ${nominal} с`,
              `Оцінка операції за вказану кількість: ${nominal * qtyNum} с`,
              '',
              'Індивідуальний розрахунок (після погодження):',
              `Оцінка операції за 1 шт.: ${Math.floor(Number(customSeconds) || 0)} с`,
              `Оцінка операції за вказану кількість: ${Math.floor(Number(customSeconds) || 0) * qtyNum} с`,
            ]}
          />
        )}
      </div>
    </div>
  );
}

function ConfirmBlock({
  title,
  lines,
  onBack,
  onConfirm,
}: {
  title: string;
  lines: string[];
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm font-bold text-[#1a1816]">{title}</p>
      <div className="space-y-1.5 rounded-2xl border border-[#e8e0d6] bg-white/80 p-3 text-sm leading-relaxed text-[#2c2824]">
        {lines.map((line, i) => (
          <p key={i} className={line === '' ? 'h-2' : ''}>
            {line}
          </p>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <GhostButton className="sm:min-w-[100px]" onClick={onBack}>
          Назад
        </GhostButton>
        <PrimaryButton className="sm:min-w-[160px]" onClick={onConfirm}>
          Підтвердити
        </PrimaryButton>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: 'ink' | 'muted' | 'warn' }) {
  const cls =
    accent === 'ink'
      ? 'text-[#1a1816]'
      : accent === 'warn'
        ? 'text-[#b45309]'
        : 'text-[#5c5652]';
  return (
    <div>
      <p className="text-[10px] font-semibold leading-tight text-[#8a8580]">{label}</p>
      <p className={`mt-0.5 text-lg font-bold tabular-nums ${cls}`}>{value}</p>
    </div>
  );
}