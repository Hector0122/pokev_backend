import { Module } from '@nestjs/common';
import { AchievementsModule } from '../achievements/achievements.module';
import { UploadsModule } from '../uploads/uploads.module';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';

@Module({
  imports: [AchievementsModule, UploadsModule],
  controllers: [CardsController],
  providers: [CardsService],
})
export class CardsModule {}
