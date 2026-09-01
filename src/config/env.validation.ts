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
  // Escaneo de cartas (V0.6 adelantado) — opcional a propósito: sin la key,
  // POST /scan/card responde con un error amigable en vez de tirar abajo el
  // boot del resto de la API, que no depende de esto para nada.
  GROQ_API_KEY: Joi.string().optional(),
  GROQ_VISION_MODEL: Joi.string().default('qwen/qwen3.6-27b'),
});
