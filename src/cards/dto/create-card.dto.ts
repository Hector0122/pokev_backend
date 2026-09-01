import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { TrainerRole } from '../../../generated/prisma/client';
import { AttackDto } from './attack.dto';
import { PokemonRefDto } from './pokemon-ref.dto';

export class CreateCardDto {
  @ValidateNested()
  @Type(() => PokemonRefDto)
  pokemon: PokemonRefDto;

  @IsString()
  setName: string;

  @IsString()
  cardNumber: string;

  @IsOptional()
  @IsString()
  rarity?: string;

  @IsOptional()
  @IsString()
  cardType?: string;

  @IsOptional()
  @IsInt()
  hp?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AttackDto)
  attacks?: AttackDto[];

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  variant?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValueUsd?: number;

  @IsOptional()
  @IsDateString()
  acquiredAt?: string;

  @IsOptional()
  @IsUUID()
  acquiredWithId?: string;

  @IsOptional()
  @IsString()
  memory?: string;

  /** Roles cuyo entrenador marcó esta carta como favorita al agregarla. */
  @IsOptional()
  @IsArray()
  @IsIn(['DAD', 'KID'], { each: true })
  favoriteTrainerRoles?: TrainerRole[];
}
