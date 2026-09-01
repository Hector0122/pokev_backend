import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PokemonService } from './pokemon.service';

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
}
