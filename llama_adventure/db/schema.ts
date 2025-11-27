import { pgTable, text, timestamp, integer, jsonb, real } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  fingerprintHash: text('fingerprint_hash').notNull().unique(),
  avatarId: integer('avatar_id').notNull().default(1),
  name: text('name'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at').notNull().defaultNow(),
});

export const scores = pgTable('scores', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  levelName: text('level_name').notNull(),
  completionTime: real('completion_time').notNull(),
  points: integer('points').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const userSessions = pgTable('user_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  deviceInfo: jsonb('device_info'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Score = typeof scores.$inferSelect;
export type NewScore = typeof scores.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
