# PokeV 🃏 — Backend

API para PokeV, una app familiar para llevar la colección física de cartas Pokémon de un papá y su hijo de 6 años. Capturas y descripción completa: **[pokev_frontend](https://github.com/Hector0122/pokev_frontend)**.

## Stack

| | |
|---|---|
| Framework | NestJS 11 |
| ORM / DB | Prisma 7 (driver-adapter) + PostgreSQL |
| Auth | JWT (access + refresh) + API key familiar compartida |
| Storage | Cloudflare R2 (S3-compatible) — fotos de cartas escaneadas |
| IA | Groq Vision — lectura de cartas por foto |

Desplegado en Railway.

## Arquitectura

- **Trainers** — los dos entrenadores (papá / hijo) son fijos, sin alta/baja de usuarios
- **Cards** — colección real que poseen: CRUD, cantidad, favoritas
- **Pokemon** — "Nuestros Pokémon": solo los descubiertos por tener al menos una carta propia
- **Achievements** — catálogo de logros por hitos de colección
- **Scan** — reconocimiento de cartas por foto (Groq Vision)
- **Uploads** — subida de fotos de cartas a R2

## Cómo está resuelto

- **"Nuestros Pokémon" nunca expone el catálogo completo de Pokémon** — todo query de `PokemonService` filtra por `cards: { some: {} } }`, nunca lista lo que todavía no han descubierto.
- El **escaneo separa responsabilidades**: el backend solo "lee" la foto con un modelo de visión (Groq) y devuelve nombre/set/número; el cliente hace el match real contra el catálogo de TCGdex, así el backend no duplica esa base de datos.
- El **enriquecimiento de un Pokémon** (altura, peso, evoluciones, descripción) llega resuelto desde el cliente, que consulta PokeAPI — el backend solo completa columnas en null, nunca pisa un dato ya guardado.
- El acceso está protegido por una **API key familiar fija** (header `x-app-key`) además de JWT — pensado para dos usuarios fijos, no para registro público.

## Aviso legal

Proyecto personal, sin fines comerciales, para uso exclusivo de mi hijo y yo — no está afiliado, respaldado ni asociado con Nintendo, Game Freak, Creatures Inc. ni The Pokémon Company. "Pokémon" y los nombres/imágenes de las cartas son marcas y derechos de autor de sus respectivos dueños. Los datos se consultan en vivo desde [PokeAPI](https://pokeapi.co/) y [TCGdex](https://tcgdex.dev/); este repositorio no redistribuye assets propios de esas fuentes.

## Licencia

MIT (código propio) — ver [LICENSE](LICENSE). No cubre marcas ni contenido de Pokémon.
