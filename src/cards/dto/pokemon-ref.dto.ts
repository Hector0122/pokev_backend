import { IsInt, IsOptional, IsString, IsUrl } from 'class-validator';

/**
 * Datos mínimos del Pokémon de una carta. V0.1 no integra todavía con
 * PokeAPI (eso es V0.2, §22) — al agregar la primera carta de un Pokémon se
 * hace upsert de su catálogo con lo que el padre escriba a mano.
 */
export class PokemonRefDto {
  @IsInt()
  id: number;

  @IsString()
  name: string;

  @IsString()
  primaryType: string;

  @IsOptional()
  @IsString()
  secondaryType?: string;

  @IsOptional()
  @IsUrl()
  spriteUrl?: string;
}
