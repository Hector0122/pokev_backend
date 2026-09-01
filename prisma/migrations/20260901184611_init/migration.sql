-- CreateEnum
CREATE TYPE "TrainerRole" AS ENUM ('DAD', 'KID');

-- CreateTable
CREATE TABLE "trainers" (
    "id" UUID NOT NULL,
    "role" "TrainerRole" NOT NULL,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "favorite_pokemon_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trainers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pokemon" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "primary_type" TEXT NOT NULL,
    "secondary_type" TEXT,
    "region" TEXT,
    "height_cm" INTEGER,
    "weight_hg" INTEGER,
    "sprite_url" TEXT,
    "description" TEXT,
    "evolves_from_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pokemon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" UUID NOT NULL,
    "pokemon_id" INTEGER NOT NULL,
    "set_name" TEXT NOT NULL,
    "card_number" TEXT NOT NULL,
    "rarity" TEXT,
    "card_type" TEXT,
    "hp" INTEGER,
    "attacks" JSONB,
    "year" INTEGER,
    "language" TEXT,
    "variant" TEXT,
    "image_url" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "estimated_value_usd" DECIMAL(10,2),
    "acquired_at" TIMESTAMPTZ(6),
    "acquired_with_id" UUID,
    "memory" TEXT,
    "is_first_card" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_favorites" (
    "card_id" UUID NOT NULL,
    "trainer_id" UUID NOT NULL,

    CONSTRAINT "card_favorites_pkey" PRIMARY KEY ("card_id","trainer_id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT,
    "threshold" INTEGER,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "trainer_achievements" (
    "id" UUID NOT NULL,
    "trainer_id" UUID,
    "achievement_key" TEXT NOT NULL,
    "unlocked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trainer_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trainers_role_key" ON "trainers"("role");

-- CreateIndex
CREATE INDEX "cards_pokemon_id_idx" ON "cards"("pokemon_id");

-- CreateIndex
CREATE INDEX "trainer_achievements_trainer_id_achievement_key_idx" ON "trainer_achievements"("trainer_id", "achievement_key");

-- AddForeignKey
ALTER TABLE "trainers" ADD CONSTRAINT "trainers_favorite_pokemon_id_fkey" FOREIGN KEY ("favorite_pokemon_id") REFERENCES "pokemon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon" ADD CONSTRAINT "pokemon_evolves_from_id_fkey" FOREIGN KEY ("evolves_from_id") REFERENCES "pokemon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_pokemon_id_fkey" FOREIGN KEY ("pokemon_id") REFERENCES "pokemon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_acquired_with_id_fkey" FOREIGN KEY ("acquired_with_id") REFERENCES "trainers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_favorites" ADD CONSTRAINT "card_favorites_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_favorites" ADD CONSTRAINT "card_favorites_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_achievements" ADD CONSTRAINT "trainer_achievements_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_achievements" ADD CONSTRAINT "trainer_achievements_achievement_key_fkey" FOREIGN KEY ("achievement_key") REFERENCES "achievements"("key") ON DELETE CASCADE ON UPDATE CASCADE;
