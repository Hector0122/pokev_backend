import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RecognizeCardDto } from './dto/recognize-card.dto';

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** Lo que el modelo de visión extrae de la foto — cualquiera puede venir null si no se ve/lee bien. */
export interface RecognizedCard {
  pokemonName: string | null;
  setName: string | null;
  cardNumber: string | null;
}

const EXTRACTION_PROMPT =
  'Esta es una foto de una carta del juego de cartas coleccionables Pokémon (Pokémon TCG). ' +
  'Del texto visible en la carta, extraé: el nombre del Pokémon, el nombre de la expansión/set ' +
  '(normalmente en letra chica junto al número de colección, o el logo del set), y el número ' +
  'de carta dentro del set (ej. "25/102" — usá solo la primera parte, "25"). ' +
  'Si la carta está en español, devolvé el nombre del Pokémon tal como aparece en español. ' +
  'Respondé ÚNICAMENTE con un objeto JSON con las claves "pokemonName", "setName", "cardNumber" ' +
  '(todas string o null si no se ve/lee con confianza) — sin texto antes ni después, sin markdown.';

/**
 * Escaneo de cartas por foto (V0.6 adelantado, ver openspec change
 * add-scan-card-recognition) — un modelo de visión (Groq) lee lo que dice la
 * carta; el matching real contra el catálogo lo sigue haciendo el cliente
 * con el mismo servicio de TCGdex que ya usa el Buscador (§7). Este endpoint
 * solo hace la parte de "leer la foto", nunca inventa un match si no ve nada.
 */
@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);

  constructor(private readonly configService: ConfigService) {}

  async recognizeCard(dto: RecognizeCardDto): Promise<RecognizedCard> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'El escaneo de cartas todavía no está configurado en el servidor.',
      );
    }
    const model = this.configService.get<string>('GROQ_VISION_MODEL');
    const mimeType = dto.mimeType ?? 'image/jpeg';

    let response: Response;
    try {
      response = await fetch(GROQ_CHAT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: EXTRACTION_PROMPT },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${dto.imageBase64}`,
                  },
                },
              ],
            },
          ],
        }),
      });
    } catch (err) {
      this.logger.error('No se pudo conectar con Groq', err as Error);
      throw new BadGatewayException(
        'No pudimos leer la carta ahora. Probá de nuevo.',
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.error(`Groq respondió ${response.status}: ${body}`);
      throw new BadGatewayException(
        'No pudimos leer la carta ahora. Probá de nuevo.',
      );
    }

    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) {
      throw new BadGatewayException(
        'No pudimos leer la carta ahora. Probá de nuevo.',
      );
    }

    return this.parseRecognized(content);
  }

  private parseRecognized(content: string): RecognizedCard {
    try {
      const parsed = JSON.parse(content) as Partial<RecognizedCard>;
      return {
        pokemonName: normalize(parsed.pokemonName),
        setName: normalize(parsed.setName),
        cardNumber: normalize(parsed.cardNumber),
      };
    } catch (err) {
      this.logger.error(
        `No se pudo parsear la respuesta de Groq: ${content}`,
        err as Error,
      );
      // Ninguno de los tres campos se pudo leer con confianza — el cliente
      // trata esto igual que "no vimos nada", nunca como un error fatal.
      return { pokemonName: null, setName: null, cardNumber: null };
    }
  }
}

function normalize(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
