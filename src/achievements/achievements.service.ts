import { Injectable } from '@nestjs/common';
import { TrainerRole } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  COLLECTOR_ACHIEVEMENTS,
  EXPLORER_ACHIEVEMENTS,
  firstTypeAchievementKey,
} from './achievements.catalog';

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Catálogo completo con estado de desbloqueo, para la pantalla Logros (§4, §15). */
  async findAllWithStatus() {
    const [catalog, unlocks] = await Promise.all([
      this.prisma.achievement.findMany({ orderBy: { key: 'asc' } }),
      this.prisma.trainerAchievement.findMany({ include: { trainer: true } }),
    ]);

    const unlocksByKey = new Map(unlocks.map((u) => [u.achievementKey, u]));
    return catalog.map((achievement) => {
      const unlock = unlocksByKey.get(achievement.key);
      return {
        ...achievement,
        unlocked: Boolean(unlock),
        unlockedAt: unlock?.unlockedAt ?? null,
        unlockedByRole: unlock?.trainer?.role ?? null, // null = logro familiar
      };
    });
  }

  /** Próximo hito de "Coleccionista" a partir del total actual de cartas (§4). */
  nextCollectorMilestone(totalCards: number) {
    const next = COLLECTOR_ACHIEVEMENTS.find(
      (a) => (a.threshold ?? Infinity) > totalCards,
    );
    return next
      ? { key: next.key, title: next.title, threshold: next.threshold }
      : null;
  }

  /** Se llama tras agregar una carta — evalúa Coleccionista y Explorador. */
  async evaluateAfterCardAdded(event: {
    isNewPokemon: boolean;
    pokemonPrimaryType: string;
  }) {
    const [totalCardsAgg, discoveredPokemonCount] = await Promise.all([
      this.prisma.card.aggregate({ _sum: { quantity: true } }),
      this.prisma.pokemon.count({ where: { cards: { some: {} } } }),
    ]);
    const totalCards = totalCardsAgg._sum.quantity ?? 0;

    await Promise.all([
      ...COLLECTOR_ACHIEVEMENTS.filter(
        (a) => (a.threshold ?? Infinity) <= totalCards,
      ).map((a) => this.unlockFamily(a.key)),
      ...EXPLORER_ACHIEVEMENTS.filter(
        (a) => (a.threshold ?? Infinity) <= discoveredPokemonCount,
      ).map((a) => this.unlockFamily(a.key)),
    ]);

    if (event.isNewPokemon) {
      const typeKey = firstTypeAchievementKey(event.pokemonPrimaryType);
      if (typeKey) {
        await this.unlockFamily(typeKey);
      }
    }
  }

  /** Se llama tras marcar una carta como favorita — evalúa logros "Nuestra colección". */
  async evaluateAfterFavorite(event: { role: TrainerRole }) {
    await this.unlockFamily('family-first-favorite');
    if (event.role === 'DAD') {
      await this.unlockFamily('family-first-dad-favorite');
    }
    if (event.role === 'KID') {
      // "favorita de mi hijo" se cuenta como parte del mismo hito familiar
      // de primera favorita; el hito específico de papá existe porque el
      // spec lo pide explícitamente (§15) para celebrar su participación.
    }

    const favoriteCount = await this.prisma.cardFavorite.groupBy({
      by: ['cardId'],
      having: { cardId: { _count: { gte: 2 } } },
    });
    if (favoriteCount.length > 0) {
      await this.unlockFamily('family-first-shared-favorite');
    }
  }

  /** Desbloqueo idempotente a nivel familia (trainerId null). */
  private async unlockFamily(achievementKey: string) {
    const alreadyUnlocked = await this.prisma.trainerAchievement.findFirst({
      where: { achievementKey, trainerId: null },
    });
    if (alreadyUnlocked) return;

    await this.prisma.trainerAchievement.create({
      data: { achievementKey, trainerId: null },
    });
  }
}
