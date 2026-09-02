import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Cierra el backend a cualquiera que no mande la key compartida de la app —
 * hoy no existe NINGÚN chequeo y la URL de Railway está comiteada en texto
 * plano en el repo público de pokev_frontend (`src/config.ts`), así que
 * cualquiera que la encuentre puede leer/crear/borrar cartas o subir fotos
 * al bucket de R2 vía `/uploads/card-image`.
 *
 * A propósito NO es un login por persona — Héctor no quiere pantalla de
 * login ni PIN para su hijo, la app sigue siendo de uso libre en la tablet
 * compartida. Esto es una key única y fija (no por-usuario, no JWT) que
 * pokev_frontend manda en cada request — para el modelo de amenaza real acá
 * (bots/scanners que encuentran la URL pública) alcanza; no protege contra
 * alguien decompilando el APK a propósito, eso requeriría algo como Play
 * Integrity y no vale la pena para esta app.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const expectedKey = this.configService.get<string>('APP_API_KEY');
    // Si no está configurada en el server, no hay nada que comparar — mejor
    // fallar cerrado (rechazar todo) que abierto.
    if (!expectedKey) {
      throw new UnauthorizedException('Falta configurar la key de la app.');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.header('x-app-key');
    if (!providedKey || !safeEqual(providedKey, expectedKey)) {
      throw new UnauthorizedException('Key inválida.');
    }

    return true;
  }
}

/** Comparación en tiempo constante — evita timing attacks contra la key. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
