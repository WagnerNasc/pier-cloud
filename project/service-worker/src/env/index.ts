import dotenv from 'dotenv'
import { z } from 'zod'
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['dev', 'production']).default('dev'),
  PORT: z.coerce.number().default(3001),
  EXTERNAL_API_URL: z.string(),
  KAFKA_BROKER: z.string().default('localhost:9092'),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  const prettyError = z.prettifyError(_env.error)
  console.error('❌ Invalid environment variables:\n', prettyError)

  throw new Error('Invalid environment variables.') // TODO: tratar melhor os errors.
}

export const env = _env.data
