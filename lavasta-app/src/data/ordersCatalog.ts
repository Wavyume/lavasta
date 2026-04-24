/** Повний перелік операцій Lavasta (узгоджено з ланцюгом пошиву) */
export const OPERATION_TITLES: readonly string[] = [
  'Підготовка до розкрою',
  'Розкрій основи',
  'Намітка ручок',
  'Підготовка машини до порізки',
  'Порізка ручок зі стрічки',
  'Комплектація ручок маркування',
  'Підшив стрічки в 1 підгин',
  'Настрочка ручок 2 сторони',
  'Оверлок-збірка бічна',
  'Комплектація крою в пошив',
  'Виворіт',
  'Підшив верху без вставки ручок',
  'Закріпка смужка на закріпочній машині',
  'Чистка ниток',
  'Прасування',
  'Пакування',
  'Поклейка ТТН',
] as const;

/** Номінальні секунди на 1 од. (демо) */
export const NOMINAL_SECONDS: Record<string, number> = Object.fromEntries(
  OPERATION_TITLES.map((t, i) => [t, 40 + (i * 17 + (i % 5) * 8) % 380]),
) as Record<string, number>;

export type Department = {
  id: string;
  name: string;
  description: string;
  /** Тільки операції цієї дільниці */
  operationTitles: readonly string[];
};

export const DEPARTMENTS: readonly Department[] = [
  {
    id: 'cut',
    name: 'Розкрій і підготовка',
    description: 'Розкрій лекал, ручки, стрічка, порізка',
    operationTitles: [
      'Підготовка до розкрою',
      'Розкрій основи',
      'Намітка ручок',
      'Підготовка машини до порізки',
      'Порізка ручок зі стрічки',
    ],
  },
  {
    id: 'handles',
    name: 'Ручки і строчка',
    description: 'Комплектація, настрочка, підшив',
    operationTitles: [
      'Комплектація ручок маркування',
      'Підшив стрічки в 1 підгин',
      'Настрочка ручок 2 сторони',
    ],
  },
  {
    id: 'assembly',
    name: 'Пошив і збірка',
    description: 'Оверлок, крій, виворіт, підшив',
    operationTitles: [
      'Оверлок-збірка бічна',
      'Комплектація крою в пошив',
      'Виворіт',
      'Підшив верху без вставки ручок',
      'Закріпка смужка на закріпочній машині',
    ],
  },
  {
    id: 'finish',
    name: 'Фініш і відвантаження',
    description: 'Нитки, прасування, пакування, ТТН',
    operationTitles: ['Чистка ниток', 'Прасування', 'Пакування', 'Поклейка ТТН'],
  },
] as const;

export function getNominalSecondsForTitle(title: string): number {
  return NOMINAL_SECONDS[title] ?? 60;
}
