import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class RecognizeCardDto {
  /** Foto de la carta, base64 sin el prefijo `data:image/...;base64,`. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(12_000_000) // ~9MB de imagen real una vez decodificado el base64
  imageBase64: string;

  @IsOptional()
  @IsIn(['image/jpeg', 'image/png'])
  mimeType?: 'image/jpeg' | 'image/png';
}
