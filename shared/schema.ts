import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Note: Schema ready for MySQL/PlanetScale migration when needed

export const algorithms = pgTable("algorithms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("fas fa-brain"),
  resourceCount: integer("resource_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const algorithmContent = pgTable("algorithm_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  algorithmId: varchar("algorithm_id").notNull().references(() => algorithms.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  category: text("category").notNull().default("tutorial"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  year: text("year").notNull(),
  tags: json("tags").notNull().default([]),
  imageUrl: text("image_url"),
  projectUrl: text("project_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  category: text("category").notNull(), // 'algorithm' or 'project'
  relatedId: varchar("related_id"), // algorithm id or project id
  uploadedBy: text("uploaded_by").notNull().default("admin"),
  // ImageKit fields
  imagekitFileId: text("imagekit_file_id"), // ImageKit file ID for cloud storage
  imagekitUrl: text("imagekit_url"), // ImageKit optimized URL
  imagekitThumbnailUrl: text("imagekit_thumbnail_url"), // Thumbnail URL from ImageKit
  isImagekitStored: integer("is_imagekit_stored").notNull().default(0), // 0 = local, 1 = ImageKit
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  algorithmId: varchar("algorithm_id").notNull().references(() => algorithms.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const insertAlgorithmSchema = createInsertSchema(algorithms).omit({
  id: true,
  createdAt: true,
  resourceCount: true,
});

export const insertAlgorithmContentSchema = createInsertSchema(algorithmContent).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  createdAt: true,
  uploadedBy: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Algorithm = typeof algorithms.$inferSelect;
export type InsertAlgorithm = z.infer<typeof insertAlgorithmSchema>;
export type AlgorithmContent = typeof algorithmContent.$inferSelect;
export type InsertAlgorithmContent = z.infer<typeof insertAlgorithmContentSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
