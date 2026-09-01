import { IsInt, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateTrainerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsInt()
  favoritePokemonId?: number;
}
