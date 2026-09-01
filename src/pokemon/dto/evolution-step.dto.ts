import { IsInt, IsOptional, IsString, IsUrl } from 'class-validator';

/** Un eslabón de la cadena evolutiva (viene de PokeAPI, aplanado por el cliente). */
export class EvolutionStepDto {
  @IsInt()
  id: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsUrl()
  spriteUrl?: string;

  @IsOptional()
  @IsInt()
  evolvesFromId?: number;
}
