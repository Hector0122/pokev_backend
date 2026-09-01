/**
 * Catálogo de logros (§15 del spec). Única fuente de verdad — usado tanto
 * por `prisma/seed.ts` (inserta las filas en `achievements`) como por
 * `AchievementsService` (sabe qué evaluar en cada evento).
 *
 * Los logros NUNCA se presentan como "lo que falta" (§3.1) — son hitos que
 * se desbloquean, no una lista de objetivos pendientes visibles por defecto.
 */
export type AchievementCategory = 'collector' | 'explorer' | 'family';

export interface AchievementDef {
  key: string;
  category: AchievementCategory;
  title: string;
  icon: string;
  /** Umbral numérico cuando aplica (cartas o Pokémon descubiertos). */
  threshold?: number;
}

export const COLLECTOR_ACHIEVEMENTS: AchievementDef[] = [
  {
    key: 'collector-1',
    category: 'collector',
    title: 'Primera carta',
    icon: '🎉',
    threshold: 1,
  },
  {
    key: 'collector-10',
    category: 'collector',
    title: '10 cartas',
    icon: '🃏',
    threshold: 10,
  },
  {
    key: 'collector-25',
    category: 'collector',
    title: '25 cartas',
    icon: '🃏',
    threshold: 25,
  },
  {
    key: 'collector-50',
    category: 'collector',
    title: '50 cartas',
    icon: '🃏',
    threshold: 50,
  },
  {
    key: 'collector-100',
    category: 'collector',
    title: '100 cartas',
    icon: '🏆',
    threshold: 100,
  },
  {
    key: 'collector-200',
    category: 'collector',
    title: '200 cartas',
    icon: '🏆',
    threshold: 200,
  },
  {
    key: 'collector-250',
    category: 'collector',
    title: '250 cartas',
    icon: '🏆',
    threshold: 250,
  },
  {
    key: 'collector-300',
    category: 'collector',
    title: '300 cartas',
    icon: '🏆',
    threshold: 300,
  },
  {
    key: 'collector-500',
    category: 'collector',
    title: '500 cartas',
    icon: '👑',
    threshold: 500,
  },
];

export const EXPLORER_ACHIEVEMENTS: AchievementDef[] = [
  {
    key: 'explorer-1',
    category: 'explorer',
    title: 'Primer Pokémon descubierto',
    icon: '🔎',
    threshold: 1,
  },
  {
    key: 'explorer-10',
    category: 'explorer',
    title: '10 Pokémon descubiertos',
    icon: '🔎',
    threshold: 10,
  },
  {
    key: 'explorer-25',
    category: 'explorer',
    title: '25 Pokémon descubiertos',
    icon: '🔎',
    threshold: 25,
  },
  {
    key: 'explorer-first-fire',
    category: 'explorer',
    title: 'Primer Pokémon de fuego',
    icon: '🔥',
  },
  {
    key: 'explorer-first-water',
    category: 'explorer',
    title: 'Primer Pokémon de agua',
    icon: '💧',
  },
  {
    key: 'explorer-first-electric',
    category: 'explorer',
    title: 'Primer Pokémon eléctrico',
    icon: '⚡',
  },
];

export const FAMILY_ACHIEVEMENTS: AchievementDef[] = [
  {
    key: 'family-first-favorite',
    category: 'family',
    title: 'Primera carta favorita',
    icon: '❤️',
  },
  {
    key: 'family-first-dad-favorite',
    category: 'family',
    title: 'Primera carta favorita de papá',
    icon: '💙',
  },
  {
    key: 'family-first-shared-favorite',
    category: 'family',
    title: 'Primera carta favorita de los dos',
    icon: '👨‍👦',
  },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  ...COLLECTOR_ACHIEVEMENTS,
  ...EXPLORER_ACHIEVEMENTS,
  ...FAMILY_ACHIEVEMENTS,
];

const TYPE_TO_FIRST_TYPE_ACHIEVEMENT_KEY: Record<string, string> = {
  fuego: 'explorer-first-fire',
  fire: 'explorer-first-fire',
  agua: 'explorer-first-water',
  water: 'explorer-first-water',
  eléctrico: 'explorer-first-electric',
  electrico: 'explorer-first-electric',
  electric: 'explorer-first-electric',
};

export function firstTypeAchievementKey(
  primaryType: string,
): string | undefined {
  return TYPE_TO_FIRST_TYPE_ACHIEVEMENT_KEY[primaryType.trim().toLowerCase()];
}
