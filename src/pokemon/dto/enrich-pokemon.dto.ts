import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { EvolutionStepDto } from './evolution-step.dto';

/**
 * Datos "ricos" de un Pokémon obtenidos de PokeAPI (nombre/tipo/descripción/
 * evoluciones/región/altura/peso) — ver design.md "Decisions" del change
 * add-v01-first-album. `PokemonRefDto` (usado por `POST /cards`) se queda
 * con lo mínimo; esto completa el registro cuando hay red disponible,
 * sin importar si ya se guardó antes con datos mínimos o no.
 */
export class EnrichPokemonDto {
  @IsString()
  name: string;

  @IsString()
  primaryType: string;

  @IsOptional()
  @IsString()
  secondaryType?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsInt()
  heightCm?: number;

  @IsOptional()
  @IsInt()
  weightHg?: number;

  @IsOptional()
  @IsUrl()
  spriteUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  evolvesFromId?: number;

  /** Cadena evolutiva completa aplanada (incluyendo, opcionalmente, a este mismo Pokémon). */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => EvolutionStepDto)
  evolutionChain?: EvolutionStepDto[];
}
