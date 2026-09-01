import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * "Nuestros Pokémon" (§10) — NUNCA la Pokédex nacional completa. Solo
 * Pokémon que tienen al menos una carta en `cards` cuentan como
 * "descubiertos". Este servicio filtra por eso en todo momento; no expone
 * un listado de "todos los Pokémon existentes".
 */
@Injectable()
export class PokemonService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pokémon descubiertos, agrupables por tipo en el cliente (§10). */
  async findDiscovered() {
    return this.prisma.pokemon.findMany({
      where: { cards: { some: {} } },
      orderBy: { id: 'asc' },
    });
  }

  async findOneIfDiscovered(id: number) {
    const pokemon = await this.prisma.pokemon.findFirst({
      where: { id, cards: { some: {} } },
      include: {
        evolvesFrom: true,
        evolvesTo: true,
      },
    });
    if (!pokemon) {
      throw new NotFoundException(
        `Todavía no hemos descubierto al Pokémon #${id}`,
      );
    }
    return pokemon;
  }

  countDiscovered() {
    return this.prisma.pokemon.count({ where: { cards: { some: {} } } });
  }
}
