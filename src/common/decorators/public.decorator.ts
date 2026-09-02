import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un endpoint como exento de `ApiKeyGuard` — hoy solo lo usa el health
 * check en `/` (Railway y cualquier monitor externo le pegan sin la key de
 * la app). Todo lo demás requiere el header `x-app-key`.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
