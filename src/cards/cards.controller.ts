import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { TrainerRole } from '../../generated/prisma/client';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  findAll() {
    return this.cardsService.findAll();
  }

  /** Contadores de la pantalla principal (§4). */
  @Get('stats')
  stats() {
    return this.cardsService.stats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cardsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCardDto) {
    return this.cardsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCardDto) {
    return this.cardsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.cardsService.remove(id);
  }

  @Put(':id/favorite/:role')
  setFavorite(@Param('id') id: string, @Param('role') role: TrainerRole) {
    return this.cardsService.setFavorite(id, role, true);
  }

  @Delete(':id/favorite/:role')
  unsetFavorite(@Param('id') id: string, @Param('role') role: TrainerRole) {
    return this.cardsService.setFavorite(id, role, false);
  }
}
