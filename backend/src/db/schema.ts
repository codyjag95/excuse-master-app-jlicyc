import { pgTable, uuid, text, integer, timestamp, foreignKey, uniqueIndex } from 'drizzle-orm/pg-core';

export const excuses = pgTable('excuses', {
  id: uuid('id').primaryKey().defaultRandom(),
  situation: text('situation').notNull(),
  tone: text('tone').notNull(),
  length: text('length').notNull(),
  excuse: text('excuse').notNull(),
  believabilityRating: integer('believability_rating').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const excuseRatings = pgTable('excuse_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  excuseId: uuid('excuse_id').notNull(),
  rating: integer('rating').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  excuseIdFk: foreignKey({
    columns: [table.excuseId],
    foreignColumns: [excuses.id],
  }),
}));

export const excuseShares = pgTable('excuse_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  excuseId: uuid('excuse_id').notNull(),
  shareMethod: text('share_method').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  excuseIdFk: foreignKey({
    columns: [table.excuseId],
    foreignColumns: [excuses.id],
  }),
}));

export const favorites = pgTable('favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  excuseId: uuid('excuse_id').notNull(),
  deviceId: text('device_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  excuseIdFk: foreignKey({
    columns: [table.excuseId],
    foreignColumns: [excuses.id],
  }),
  uniqueConstraint: uniqueIndex('favorites_excuse_id_device_id_unique').on(table.excuseId, table.deviceId),
}));
