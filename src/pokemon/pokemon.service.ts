import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrichPokemonDto } from './dto/enrich-pokemon.dto';

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

  /**
   * Completa el registro de un Pokémon con datos "ricos" de PokeAPI (altura,
   * peso, región, descripción, evoluciones) — ver design.md "Decisions" del
   * change add-v01-first-album. Nunca pisa un dato ya guardado, solo llena
   * columnas que todavía están en null, así una carta agregada offline-ish
   * (con lo mínimo de `PokemonRefDto`) se enriquece después sin perder nada.
   *
   * También hace upsert de los demás eslabones de la cadena evolutiva con
   * lo mínimo (id/nombre/sprite/evolvesFromId) aunque todavía no tengan
   * carta propia — así `evolvesFrom`/`evolvesTo` resuelven la cadena
   * completa sin necesitar que cada etapa esté "descubierta".
   */
  async enrich(id: number, dto: EnrichPokemonDto) {
    const existing = await this.prisma.pokemon.findUnique({ where: { id } });

    if (!existing) {
      await this.prisma.pokemon.create({
        data: {
          id,
          name: dto.name,
          primaryType: dto.primaryType,
          secondaryType: dto.secondaryType,
          region: dto.region,
          heightCm: dto.heightCm,
          weightHg: dto.weightHg,
          spriteUrl: dto.spriteUrl,
          description: dto.description,
          evolvesFromId: dto.evolvesFromId,
        },
      });
    } else {
      await this.prisma.pokemon.update({
        where: { id },
        data: {
          secondaryType: existing.secondaryType ?? dto.secondaryType,
          region: existing.region ?? dto.region,
          heightCm: existing.heightCm ?? dto.heightCm,
          weightHg: existing.weightHg ?? dto.weightHg,
          spriteUrl: existing.spriteUrl ?? dto.spriteUrl,
          description: existing.description ?? dto.description,
          evolvesFromId: existing.evolvesFromId ?? dto.evolvesFromId,
        },
      });
    }

    if (dto.evolutionChain?.length) {
      for (const step of dto.evolutionChain) {
        if (step.id === id) continue; // ya se manejó arriba con datos completos
        const existingStep = await this.prisma.pokemon.findUnique({
          where: { id: step.id },
        });
        if (existingStep) continue; // no pisar un registro que ya existe
        await this.prisma.pokemon.create({
          data: {
            id: step.id,
            name: step.name,
            primaryType: 'desconocido', // se completa cuando esa etapa se consulte directamente
            spriteUrl: step.spriteUrl,
            evolvesFromId: step.evolvesFromId,
          },
        });
      }
    }

    return this.prisma.pokemon.findUniqueOrThrow({
      where: { id },
      include: { evolvesFrom: true, evolvesTo: true },
    });
  }
}
