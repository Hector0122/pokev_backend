import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { TrainersModule } from './trainers/trainers.module';
import { PokemonModule } from './pokemon/pokemon.module';
import { CardsModule } from './cards/cards.module';
import { AchievementsModule } from './achievements/achievements.module';
import { ScanModule } from './scan/scan.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRoot({ throttlers: [{ limit: 120, ttl: 60000 }] }),
    PrismaModule,
    TrainersModule,
    PokemonModule,
    CardsModule,
    AchievementsModule,
    ScanModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
