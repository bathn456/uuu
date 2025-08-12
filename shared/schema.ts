import { sql } from "drizzle-orm";
import { mysqlTable, text, varchar, timestamp, int, json } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const algorithms = mysqlTable("algorithms", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`(UUID())`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("fas fa-brain"),
  resourceCount: int("resource_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const algorithmContent = mysqlTable("algorithm_content", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`(UUID())`),
  algorithmId: varchar("algorithm_id", { length: 255 }).notNull().references(() => algorithms.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: int("file_size").notNull(),
  filePath: text("file_path").notNull(),
  category: text("category").notNull().default("tutorial"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`(UUID())`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  year: text("year").notNull(),
  tags: json("tags").notNull().default([]),
  imageUrl: text("image_url"),
  projectUrl: text("project_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const files = mysqlTable("files", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`(UUID())`),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: int("file_size").notNull(),
  filePath: text("file_path").notNull(),
  category: text("category").notNull(), // 'algorithm' or 'project'
  relatedId: varchar("related_id", { length: 255 }), // algorithm id or project id
  uploadedBy: text("uploaded_by").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notes = mysqlTable("notes", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`(UUID())`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  algorithmId: varchar("algorithm_id", { length: 255 }).notNull().references(() => algorithms.id, { onDelete: "cascade" }),
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
