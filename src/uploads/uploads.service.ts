import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { UploadImageDto } from './dto/upload-image.dto';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

/**
 * Storage de fotos de cartas (V0.7 — Cloudflare R2, API S3-compatible).
 * Reemplaza guardar la foto inline como `data:image/...;base64,...` en
 * `cards.image_url` (ver design.md de add-scan-and-favorites-widget: eso
 * era ~2.3MB por carta a resolución de cámara completa, sin paginación ni
 * lazy-loading en ningún lado que lea `/cards`) — ahora se sube el archivo
 * acá y solo la URL corta va a la DB.
 *
 * Opcional en el servidor a propósito, mismo patrón que ScanService con
 * GROQ_API_KEY: sin las credenciales de R2 configuradas, este endpoint
 * responde con un error amigable y el resto de la API sigue andando —
 * `CreateCardDto.imageUrl` todavía acepta `data:image/...` como respaldo.
 */
@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private client: S3Client | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getClient(): S3Client {
    if (this.client) return this.client;

    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'R2_SECRET_ACCESS_KEY',
    );
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new ServiceUnavailableException(
        'El storage de fotos todavía no está configurado en el servidor.',
      );
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    return this.client;
  }

  async uploadCardImage(dto: UploadImageDto): Promise<{ url: string }> {
    const publicUrl = this.configService.get<string>('R2_PUBLIC_URL');
    const bucket = this.configService.get<string>('R2_BUCKET_NAME') ?? 'pokev';
    if (!publicUrl) {
      throw new ServiceUnavailableException(
        'El storage de fotos todavía no está configurado en el servidor.',
      );
    }

    const mimeType = dto.mimeType ?? 'image/jpeg';
    const key = `cards/${randomUUID()}.${EXT_BY_MIME[mimeType] ?? 'jpg'}`;

    let body: Buffer;
    try {
      body = Buffer.from(dto.imageBase64, 'base64');
    } catch {
      throw new BadGatewayException('Esa foto no se pudo procesar.');
    }

    try {
      await this.getClient().send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: mimeType,
        }),
      );
    } catch (error) {
      this.logger.error('Error subiendo imagen a R2', error as Error);
      throw new BadGatewayException(
        'No pudimos subir la foto. Probá de nuevo.',
      );
    }

    return { url: `${publicUrl.replace(/\/+$/, '')}/${key}` };
  }
}
