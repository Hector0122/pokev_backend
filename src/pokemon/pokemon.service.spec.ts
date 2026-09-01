import { PokemonService } from './pokemon.service';
import type { PrismaService } from '../prisma/prisma.service';

type MockPokemonRow = {
  id: number;
  name: string;
  primaryType: string;
  secondaryType: string | null;
  region: string | null;
  heightCm: number | null;
  weightHg: number | null;
  spriteUrl: string | null;
  description: string | null;
  evolvesFromId: number | null;
};

function buildMockPrisma(initialRows: MockPokemonRow[] = []) {
  const rows = new Map<number, MockPokemonRow>(
    initialRows.map((r) => [r.id, r]),
  );

  const pokemon = {
    findUnique: jest.fn(({ where: { id } }: { where: { id: number } }) =>
      Promise.resolve(rows.get(id) ?? null),
    ),
    findUniqueOrThrow: jest.fn(({ where: { id } }: { where: { id: number } }) =>
      Promise.resolve({ ...rows.get(id)!, evolvesFrom: null, evolvesTo: [] }),
    ),
    create: jest.fn(({ data }: { data: MockPokemonRow }) => {
      rows.set(data.id, { ...data });
      return Promise.resolve(rows.get(data.id));
    }),
    update: jest.fn(
      ({
        where: { id },
        data,
      }: {
        where: { id: number };
        data: Partial<MockPokemonRow>;
      }) => {
        const existing = rows.get(id)!;
        const updated = { ...existing, ...data };
        rows.set(id, updated);
        return Promise.resolve(updated);
      },
    ),
  };

  return { pokemon, rows };
}

describe('PokemonService.enrich', () => {
  it('crea el registro completo cuando el Pokémon todavía no existe', async () => {
    const { pokemon, rows } = buildMockPrisma();
    const service = new PokemonService({ pokemon } as unknown as PrismaService);

    await service.enrich(25, {
      name: 'pikachu',
      primaryType: 'Eléctrico',
      heightCm: 40,
      weightHg: 60,
      spriteUrl: 'https://example.com/25.png',
      description: 'Un Pokémon eléctrico',
    });

    expect(rows.get(25)).toMatchObject({
      name: 'pikachu',
      primaryType: 'Eléctrico',
      heightCm: 40,
      weightHg: 60,
    });
  });

  it('no pisa un campo que ya tiene valor', async () => {
    const { pokemon, rows } = buildMockPrisma([
      {
        id: 25,
        name: 'pikachu',
        primaryType: 'Eléctrico',
        secondaryType: null,
        region: 'Kanto',
        heightCm: null,
        weightHg: null,
        spriteUrl: null,
        description: null,
        evolvesFromId: null,
      },
    ]);
    const service = new PokemonService({ pokemon } as unknown as PrismaService);

    await service.enrich(25, {
      name: 'pikachu',
      primaryType: 'Eléctrico',
      region: 'Johto', // no debería pisar "Kanto"
      heightCm: 40, // sí debería completar, estaba en null
    });

    expect(rows.get(25)).toMatchObject({ region: 'Kanto', heightCm: 40 });
  });

  it('agrega los eslabones de la cadena evolutiva sin pisar los que ya existen', async () => {
    const { pokemon, rows } = buildMockPrisma([
      {
        id: 26,
        name: 'raichu',
        primaryType: 'Eléctrico',
        secondaryType: null,
        region: null,
        heightCm: null,
        weightHg: null,
        spriteUrl: 'https://example.com/26-ya-guardado.png',
        description: null,
        evolvesFromId: 25,
      },
    ]);
    const service = new PokemonService({ pokemon } as unknown as PrismaService);

    await service.enrich(25, {
      name: 'pikachu',
      primaryType: 'Eléctrico',
      evolutionChain: [
        { id: 172, name: 'pichu', spriteUrl: 'https://example.com/172.png' },
        { id: 25, name: 'pikachu', spriteUrl: 'https://example.com/25.png' },
        {
          id: 26,
          name: 'raichu',
          spriteUrl: 'https://example.com/26-nuevo.png',
          evolvesFromId: 25,
        },
      ],
    });

    expect(rows.get(172)).toMatchObject({
      name: 'pichu',
      primaryType: 'desconocido',
    });
    // 26 ya existía — no se pisa con el dato "pobre" de la cadena aplanada.
    expect(rows.get(26)?.spriteUrl).toBe(
      'https://example.com/26-ya-guardado.png',
    );
  });
});
