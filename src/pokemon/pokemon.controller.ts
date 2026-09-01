import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { EnrichPokemonDto } from './dto/enrich-pokemon.dto';

@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  /** GET /pokemon → solo los Pokémon descubiertos por la colección. */
  @Get()
  findDiscovered() {
    return this.pokemonService.findDiscovered();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pokemonService.findOneIfDiscovered(id);
  }

  /**
   * Completa un Pokémon con datos de PokeAPI (altura, peso, región,
   * descripción, evoluciones) — ver pokemon-sprites spec. No requiere que el
   * Pokémon ya esté "descubierto" (con carta propia): se puede enriquecer
   * apenas se elige en el picker de "Agregar carta", antes de guardar.
   */
  @Patch(':id')
  enrich(@Param('id', ParseIntPipe) id: number, @Body() dto: EnrichPokemonDto) {
    return this.pokemonService.enrich(id, dto);
  }
}
