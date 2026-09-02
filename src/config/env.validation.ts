import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  CORS_ORIGIN: Joi.string().allow('').optional(),
  // Key compartida que pokev_frontend manda en el header `x-app-key` en
  // cada request (ver ApiKeyGuard) — no es login por persona, es lo único
  // que evita que cualquiera que encuentre la URL de Railway (está
  // comiteada en texto plano en pokev_frontend/src/config.ts, el repo es
  // público) pueda leer/crear/borrar cartas. Requerida a propósito: sin
  // esto el guard rechaza todo el tráfico igual, mejor que el boot falle
  // con un mensaje claro a que arranque silenciosamente inútil.
  APP_API_KEY: Joi.string().min(16).required(),
  // Escaneo de cartas (V0.6 adelantado) — opcional a propósito: sin la key,
  // POST /scan/card responde con un error amigable en vez de tirar abajo el
  // boot del resto de la API, que no depende de esto para nada.
  GROQ_API_KEY: Joi.string().optional(),
  GROQ_VISION_MODEL: Joi.string().default('qwen/qwen3.6-27b'),
  // Storage de fotos de cartas (V0.7 — Cloudflare R2, API S3-compatible).
  // Opcional a propósito, mismo motivo que GROQ_API_KEY arriba: sin esto,
  // POST /uploads/card-image responde con un error amigable y el resto de
  // la API (incluido guardar la carta con la foto inline como antes) sigue
  // funcionando igual.
  R2_ACCOUNT_ID: Joi.string().optional(),
  R2_ACCESS_KEY_ID: Joi.string().optional(),
  R2_SECRET_ACCESS_KEY: Joi.string().optional(),
  R2_BUCKET_NAME: Joi.string().default('pokev'),
  R2_PUBLIC_URL: Joi.string().optional(),
});
