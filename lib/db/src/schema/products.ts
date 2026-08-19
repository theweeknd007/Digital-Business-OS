import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id"),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("digital"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("MZN"),
  status: text("status").notNull().default("pending_approval"),
  sales: integer("sales").notNull().default(0),
  revenue: numeric("revenue", { precision: 14, scale: 2 }).notNull().default("0"),
  imageUrl: text("image_url"),
  coverUrl: text("cover_url"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileContentType: text("file_content_type"),
  fileSize: integer("file_size"),
  approvalNotes: text("approval_notes"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedBy: integer("approved_by"),
  whopProductId: text("whop_product_id"),
  whopPlanId: text("whop_plan_id"),
  deliveryType: text("delivery_type").notNull().default("internal"),
  externalDeliveryUrl: text("external_delivery_url"),
  externalAccessUrl: text("external_access_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
