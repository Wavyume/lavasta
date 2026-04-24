export type UserRole =
  | 'technologist'
  | 'worker'
  | 'line_lead'
  | 'quality_control'
  | 'warehouse'
  | 'office';

/** Кнопки головного меню — для кожного номера свій набір доступу */
export type MenuKey = 'orders' | 'shift' | 'salary' | 'changeRole';

export type MenuAccess = Record<MenuKey, boolean>;

export const PHONE_TECHNOLOGIST = '+380999999999';
export const PHONE_WORKER = '+380888888888';

const PHONE_TO_ROLE: Record<string, UserRole> = {
  [PHONE_TECHNOLOGIST]: 'technologist',
  [PHONE_WORKER]: 'worker',
};

/** Права на пункти меню за номером (різні сценарії для ролей) */
const PHONE_MENU_ACCESS: Record<string, MenuAccess> = {
  [PHONE_TECHNOLOGIST]: {
    orders: true,
    shift: true,
    salary: true,
    changeRole: true,
  },
  [PHONE_WORKER]: {
    orders: true,
    shift: true,
    salary: true,
    changeRole: true,
  },
};

export function resolveRoleFromPhone(normalized: string): UserRole | null {
  return PHONE_TO_ROLE[normalized] ?? null;
}

export function getMenuAccessForPhone(normalized: string): MenuAccess {
  return (
    PHONE_MENU_ACCESS[normalized] ?? {
      orders: false,
      shift: false,
      salary: false,
      changeRole: true,
    }
  );
}

export const ROLE_LABEL_UK: Record<UserRole, string> = {
  technologist: 'Технолог',
  worker: 'Працівник',
  line_lead: 'Майстер лінії',
  quality_control: 'Контроль якості',
  warehouse: 'Комірник',
  office: 'Офіс (документація)',
};

/** Демо-список на екрані «Змінити роль» (без бекенду) */
export const MOCK_ROLES: readonly UserRole[] = [
  'technologist',
  'worker',
  'line_lead',
  'quality_control',
  'warehouse',
  'office',
] as const;
