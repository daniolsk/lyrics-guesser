import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit runs outside Next.js, so load .env the same way Next.js does.
loadEnvConfig(process.cwd());

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/db/schema.ts',
	out: './drizzle',
	dbCredentials: { url: process.env.DATABASE_URL! },
});
