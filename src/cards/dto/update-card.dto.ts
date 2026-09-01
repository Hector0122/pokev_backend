import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateCardDto } from './create-card.dto';

// Editar una carta (§6, "Editar carta" en V0.1) no cambia de Pokémon —
// si se equivocaron de Pokémon, lo correcto es borrar y volver a agregar.
export class UpdateCardDto extends PartialType(
  OmitType(CreateCardDto, ['pokemon'] as const),
) {}
