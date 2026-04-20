import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

declare global {
  var _pgClient: ReturnType<typeof postgres> | undefined
}

const client = globalThis._pgClient ?? postgres(process.env.DATABASE_URL!, {
  max: 10,
  prepare: false,
})

if (process.env.NODE_ENV !== 'production') globalThis._pgClient = client

export const db = drizzle(client, { schema })
export * from './schema'
