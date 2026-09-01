import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { TrainerRole } from '../../generated/prisma/client';
import { TrainersService } from './trainers.service';
import { UpdateTrainerDto } from './dto/update-trainer.dto';

@Controller('trainers')
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @Get()
  findAll() {
    return this.trainersService.findAll();
  }

  @Get(':role')
  findOne(@Param('role') role: TrainerRole) {
    return this.trainersService.findByRole(role);
  }

  @Patch(':role')
  update(@Param('role') role: TrainerRole, @Body() dto: UpdateTrainerDto) {
    return this.trainersService.update(role, dto);
  }
}
