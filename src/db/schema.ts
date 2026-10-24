/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Cloud SQL PostgreSQL Schema Definition (Project: gen-lang-client-0889094097)
 * Strictly typed with Drizzle ORM
 */

import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// 1. Users Table (Linked directly to Firebase Auth UID)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  email: text("email").notNull(),
  displayName: text("display_name"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 2. Records / Decisions Table (Securely partitioned by user)
export const records = pgTable("records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  userUid: text("user_uid").notNull(), // Direct Firebase UID for fast indexed lookups
  title: text("title").notNull(),
  category: text("category").default("GENERAL"),
  payload: text("payload"), // Encrypted or serialized data payload
  status: text("status").default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Export alias databaseRecords for service compatibility
export const databaseRecords = records;

// 3. Relationships for Users
export const usersRelations = relations(users, ({ many }) => ({
  records: many(records),
}));

// 4. Relationships for Records
export const recordsRelations = relations(records, ({ one }) => ({
  author: one(users, {
    fields: [records.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RecordItem = typeof records.$inferSelect;
export type NewRecordItem = typeof records.$inferInsert;
