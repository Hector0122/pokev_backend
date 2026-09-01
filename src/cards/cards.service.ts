import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TrainerRole } from '../../generated/prisma/client';
import { AchievementsService } from '../achievements/achievements.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly achievementsService: AchievementsService,
  ) {}

  /** "Mi colección" (§5) — exclusivamente cartas que realmente poseen. */
  findAll() {
    return this.prisma.card.findMany({
      include: { pokemon: true, favoritedBy: { include: { trainer: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: {
        pokemon: true,
        acquiredWith: true,
        favoritedBy: { include: { trainer: true } },
      },
    });
    if (!card) {
      throw new NotFoundException(`No tenemos una carta con id "${id}"`);
    }
    return card;
  }

  async create(dto: CreateCardDto) {
    const wasPokemonAlreadyDiscovered = await this.prisma.pokemon.findFirst({
      where: { id: dto.pokemon.id, cards: { some: {} } },
    });
    const isFirstCardEver = (await this.prisma.card.count()) === 0;
    const favoriteTrainers = dto.favoriteTrainerRoles?.length
      ? await this.prisma.trainer.findMany({
          where: { role: { in: dto.favoriteTrainerRoles } },
        })
      : [];

    const card = await this.prisma.$transaction(async (tx) => {
      await tx.pokemon.upsert({
        where: { id: dto.pokemon.id },
        create: {
          id: dto.pokemon.id,
          name: dto.pokemon.name,
          primaryType: dto.pokemon.primaryType,
          secondaryType: dto.pokemon.secondaryType,
          spriteUrl: dto.pokemon.spriteUrl,
        },
        // No pisamos datos existentes del Pokémon con lo que venga en una
        // carta nueva (p.ej. si V0.2 ya enriqueció el registro desde PokeAPI).
        update: {},
      });

      return tx.card.create({
        data: {
          pokemonId: dto.pokemon.id,
          setName: dto.setName,
          cardNumber: dto.cardNumber,
          rarity: dto.rarity,
          cardType: dto.cardType,
          hp: dto.hp,
          attacks: dto.attacks as unknown as Prisma.InputJsonValue | undefined,
          year: dto.year,
          language: dto.language,
          variant: dto.variant,
          imageUrl: dto.imageUrl,
          quantity: dto.quantity ?? 1,
          estimatedValueUsd: dto.estimatedValueUsd,
          acquiredAt: dto.acquiredAt ? new Date(dto.acquiredAt) : undefined,
          acquiredWithId: dto.acquiredWithId,
          memory: dto.memory,
          isFirstCard: isFirstCardEver,
          favoritedBy: favoriteTrainers.length
            ? { create: favoriteTrainers.map((t) => ({ trainerId: t.id })) }
            : undefined,
        },
        include: { pokemon: true, favoritedBy: { include: { trainer: true } } },
      });
    });

    await this.achievementsService.evaluateAfterCardAdded({
      isNewPokemon: !wasPokemonAlreadyDiscovered,
      pokemonPrimaryType: dto.pokemon.primaryType,
    });

    return card;
  }

  async update(id: string, dto: UpdateCardDto) {
    await this.findOne(id);
    return this.prisma.card.update({
      where: { id },
      data: {
        setName: dto.setName,
        cardNumber: dto.cardNumber,
        rarity: dto.rarity,
        cardType: dto.cardType,
        hp: dto.hp,
        attacks: dto.attacks as unknown as Prisma.InputJsonValue | undefined,
        year: dto.year,
        language: dto.language,
        variant: dto.variant,
        imageUrl: dto.imageUrl,
        quantity: dto.quantity,
        estimatedValueUsd: dto.estimatedValueUsd,
        acquiredAt: dto.acquiredAt ? new Date(dto.acquiredAt) : undefined,
        acquiredWithId: dto.acquiredWithId,
        memory: dto.memory,
      },
      include: { pokemon: true, favoritedBy: { include: { trainer: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.card.delete({ where: { id } });
  }

  async setFavorite(id: string, role: TrainerRole, isFavorite: boolean) {
    const card = await this.findOne(id);
    const trainer = await this.prisma.trainer.findUniqueOrThrow({
      where: { role },
    });

    if (isFavorite) {
      await this.prisma.cardFavorite.upsert({
        where: { cardId_trainerId: { cardId: card.id, trainerId: trainer.id } },
        create: { cardId: card.id, trainerId: trainer.id },
        update: {},
      });
      await this.achievementsService.evaluateAfterFavorite({ role });
    } else {
      await this.prisma.cardFavorite.deleteMany({
        where: { cardId: card.id, trainerId: trainer.id },
      });
    }

    return this.findOne(id);
  }

  /**
   * Contadores de la pantalla principal (§4) — nunca un porcentaje sobre el
   * total de cartas Pokémon existentes, solo lo que ya tienen.
   */
  async stats() {
    const [cardsAgg, discoveredPokemonCount, favoriteCardCount] =
      await Promise.all([
        this.prisma.card.aggregate({ _sum: { quantity: true } }),
        this.prisma.pokemon.count({ where: { cards: { some: {} } } }),
        this.prisma.card.count({ where: { favoritedBy: { some: {} } } }),
      ]);

    const totalCards = cardsAgg._sum.quantity ?? 0;
    const nextMilestone =
      this.achievementsService.nextCollectorMilestone(totalCards);

    return {
      totalCards,
      discoveredPokemonCount,
      favoriteCardCount,
      nextMilestone,
    };
  }
}
