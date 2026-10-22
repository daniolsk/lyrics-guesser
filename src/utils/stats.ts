import { eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { stats } from '@/db/schema';

const SONGS_PLAYED = 'songs_played';

export const getSongsPlayed = async () => {
	const [row] = await db
		.select({ value: stats.value })
		.from(stats)
		.where(eq(stats.name, SONGS_PLAYED));
	return row?.value ?? 0;
};

export const incrementSongsPlayed = async () => {
	const [row] = await db
		.insert(stats)
		.values({ name: SONGS_PLAYED, value: 1 })
		.onConflictDoUpdate({ target: stats.name, set: { value: sql`${stats.value} + 1` } })
		.returning({ value: stats.value });
	return row.value;
};
