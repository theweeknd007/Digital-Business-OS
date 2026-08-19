import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const storedAssetsTable = pgTable("stored_assets", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  objectPath: text("object_path").notNull().unique(),
  name: text("name").notNull(),
  contentType: text("content_type").notNull(),
  fileSize: integer("file_size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StoredAsset = typeof storedAssetsTable.$inferSelect;