import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const excuses = pgTable('excuses', {
  id: uuid('id').primaryKey().defaultRandom(),
  situation: text('situation').notNull(),
  tone: text('tone').notNull(),
  length: text('length').notNull(),
  excuse: text('excuse').notNull(),
  believabilityRating: integer('believability_rating').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
