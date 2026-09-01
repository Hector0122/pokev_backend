import { IsOptional, IsString } from 'class-validator';

export class AttackDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  damage?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
