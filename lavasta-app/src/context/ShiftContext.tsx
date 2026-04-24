import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';

export type AdminStatus = 'pending' | 'confirmed';

export type StoredShift = {
  date: string;
  startTime: string;
  startAdminStatus: AdminStatus;
  endTime: string | null;
  endAdminStatus: AdminStatus | null;
};

const LS_PREFIX = 'lavasta_shift_v1:';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function keyForPhone(phone: string) {
  return `${LS_PREFIX}${phone}`;
}

function readStored(phone: string): StoredShift | null {
  try {
    const raw = localStorage.getItem(keyForPhone(phone));
    if (!raw) return null;
    const p = JSON.parse(raw) as StoredShift;
    if (p.date !== todayKey()) {
      localStorage.removeItem(keyForPhone(phone));
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

type ShiftContextValue = {
  shift: StoredShift | null;
  /** зміна логічно «відкрита»: є початок, немає завершення */
  isShiftOpen: boolean;
  /** сьогоднішня зміна повністю закрита */
  isShiftClosed: boolean;
  recordShiftStart: (time: string) => void;
  recordShiftEnd: (time: string) => void;
};

const ShiftContext = createContext<ShiftContextValue | null>(null);

export function ShiftProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [shift, setShift] = useState<StoredShift | null>(null);

  useEffect(() => {
    if (!session) {
      setShift(null);
      return;
    }
    setShift(readStored(session.phone));
  }, [session?.phone, session]);

  const persist = useCallback((next: StoredShift | null) => {
    if (!session) return;
    const k = keyForPhone(session.phone);
    if (next === null) {
      localStorage.removeItem(k);
    } else {
      localStorage.setItem(k, JSON.stringify(next));
    }
  }, [session]);

  const recordShiftStart = useCallback(
    (time: string) => {
      const s: StoredShift = {
        date: todayKey(),
        startTime: time,
        startAdminStatus: 'pending',
        endTime: null,
        endAdminStatus: null,
      };
      setShift(s);
      persist(s);
    },
    [persist],
  );

  const recordShiftEnd = useCallback(
    (time: string) => {
      if (!session) return;
      setShift((prev) => {
        if (!prev || prev.endTime !== null) return prev;
        const next: StoredShift = {
          ...prev,
          endTime: time,
          endAdminStatus: 'pending',
        };
        localStorage.setItem(keyForPhone(session.phone), JSON.stringify(next));
        return next;
      });
    },
    [session],
  );

  const isShiftOpen = shift !== null && shift.endTime === null;
  const isShiftClosed = shift !== null && shift.endTime !== null;

  const value = useMemo(
    () => ({
      shift,
      isShiftOpen,
      isShiftClosed,
      recordShiftStart,
      recordShiftEnd,
    }),
    [shift, isShiftOpen, isShiftClosed, recordShiftStart, recordShiftEnd],
  );

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
}

export function useShift(): ShiftContextValue {
  const c = useContext(ShiftContext);
  if (!c) throw new Error('useShift must be used within ShiftProvider');
  return c;
}
