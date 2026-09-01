import { Injectable, NotFoundException } from '@nestjs/common';
import { TrainerRole } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTrainerDto } from './dto/update-trainer.dto';

/**
 * Los dos entrenadores son fijos (§18 del spec): "Entrenador 1" (papá) y
 * "Entrenador 2" (hijo). No hay alta/baja de entrenadores, solo edición de
 * su nombre/avatar/Pokémon favorito — se crean por `prisma/seed.ts`.
 */
@Injectable()
export class TrainersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.trainer.findMany({
      orderBy: { role: 'asc' },
      include: { favoritePokemon: true },
    });
  }

  async findByRole(role: TrainerRole) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { role },
      include: { favoritePokemon: true },
    });
    if (!trainer) {
      throw new NotFoundException(`No existe el entrenador "${role}"`);
    }
    return trainer;
  }

  async update(role: TrainerRole, dto: UpdateTrainerDto) {
    await this.findByRole(role); // 404 si no existe (nunca debería pasar tras el seed)
    return this.prisma.trainer.update({
      where: { role },
      data: dto,
      include: { favoritePokemon: true },
    });
  }
}
