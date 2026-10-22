import { bigint, pgTable, text } from 'drizzle-orm/pg-core';

export const stats = pgTable('stats', {
	name: text().primaryKey(),
	value: bigint({ mode: 'number' }).notNull().default(0),
});
