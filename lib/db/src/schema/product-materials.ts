import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const productMaterialsTable = pgTable("product_materials", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  objectPath: text("object_path"),
  name: text("name").notNull(),
  contentType: text("content_type").notNull(),
  fileSize: integer("file_size").notNull(),
  externalUrl: text("external_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProductMaterial = typeof productMaterialsTable.$inferSelect;