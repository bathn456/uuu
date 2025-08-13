import { type Algorithm, type InsertAlgorithm, type AlgorithmContent, type InsertAlgorithmContent, type Project, type InsertProject, type File, type InsertFile, type Note, type InsertNote } from "../shared/schema.js";
import { randomUUID } from "crypto";

export interface IStorage {
  // Algorithms
  getAlgorithms(): Promise<Algorithm[]>;
  getAlgorithm(id: string): Promise<Algorithm | undefined>;
  createAlgorithm(algorithm: InsertAlgorithm): Promise<Algorithm>;
  deleteAlgorithm(id: string): Promise<void>;
  
  // Algorithm Content
  getAllAlgorithmContent(): Promise<AlgorithmContent[]>;
  getAlgorithmContent(algorithmId: string): Promise<AlgorithmContent[]>;
  createAlgorithmContent(content: InsertAlgorithmContent): Promise<AlgorithmContent>;
  deleteAlgorithmContent(id: string): Promise<void>;
  
  // Projects
  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Files
  getFiles(category?: string, relatedId?: string): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: string): Promise<void>;
  deleteFilesByCategory(category: string, relatedId?: string): Promise<void>;
  
  // Notes
  getNotes(algorithmId: string): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note>;
  deleteNote(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private algorithms: Map<string, Algorithm>;
  private algorithmContent: Map<string, AlgorithmContent>;
  private projects: Map<string, Project>;
  private files: Map<string, File>;
  private notes: Map<string, Note>;

  constructor() {
    this.algorithms = new Map();
    this.algorithmContent = new Map();
    this.projects = new Map();
    this.files = new Map();
    this.notes = new Map();
    
    // No default content - only user-created content
  }



  async getAlgorithms(): Promise<Algorithm[]> {
    return Array.from(this.algorithms.values());
  }

  async getAlgorithm(id: string): Promise<Algorithm | undefined> {
    return this.algorithms.get(id);
  }

  async createAlgorithm(insertAlgorithm: InsertAlgorithm): Promise<Algorithm> {
    const id = randomUUID();
    const algorithm: Algorithm = {
      ...insertAlgorithm,
      id,
      icon: insertAlgorithm.icon || "fas fa-brain",
      resourceCount: 0,
      createdAt: new Date(),
    };
    this.algorithms.set(id, algorithm);
    return algorithm;
  }

  async deleteAlgorithm(id: string): Promise<void> {
    this.algorithms.delete(id);
    // Also delete related content
    for (const [contentId, content] of Array.from(this.algorithmContent.entries())) {
      if (content.algorithmId === id) {
        this.algorithmContent.delete(contentId);
      }
    }
  }

  async getAllAlgorithmContent(): Promise<AlgorithmContent[]> {
    return Array.from(this.algorithmContent.values());
  }

  async getAlgorithmContent(algorithmId: string): Promise<AlgorithmContent[]> {
    return Array.from(this.algorithmContent.values()).filter(
      content => content.algorithmId === algorithmId
    );
  }

  async createAlgorithmContent(insertContent: InsertAlgorithmContent): Promise<AlgorithmContent> {
    const id = randomUUID();
    const content: AlgorithmContent = {
      ...insertContent,
      id,
      description: insertContent.description || null,
      category: insertContent.category || "tutorial",
      createdAt: new Date(),
    };
    this.algorithmContent.set(id, content);
    
    // Update resource count
    const algorithm = this.algorithms.get(insertContent.algorithmId);
    if (algorithm) {
      algorithm.resourceCount += 1;
      this.algorithms.set(algorithm.id, algorithm);
    }
    
    return content;
  }

  async deleteAlgorithmContent(id: string): Promise<void> {
    const content = this.algorithmContent.get(id);
    if (content) {
      this.algorithmContent.delete(id);
      
      // Update resource count
      const algorithm = this.algorithms.get(content.algorithmId);
      if (algorithm && algorithm.resourceCount > 0) {
        algorithm.resourceCount -= 1;
        this.algorithms.set(algorithm.id, algorithm);
      }
    }
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...insertProject,
      id,
      tags: insertProject.tags || [],
      imageUrl: insertProject.imageUrl || null,
      projectUrl: insertProject.projectUrl || null,
      createdAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    this.projects.delete(id);
  }

  async getFiles(category?: string, relatedId?: string): Promise<File[]> {
    let files = Array.from(this.files.values());
    
    if (category) {
      files = files.filter(file => file.category === category);
    }
    
    if (relatedId) {
      files = files.filter(file => file.relatedId === relatedId);
    }
    
    return files;
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = randomUUID();
    const file: File = {
      ...insertFile,
      id,
      relatedId: insertFile.relatedId || null,
      uploadedBy: "admin",
      createdAt: new Date(),
      // ImageKit fields with defaults
      imagekitFileId: insertFile.imagekitFileId || null,
      imagekitUrl: insertFile.imagekitUrl || null,
      imagekitThumbnailUrl: insertFile.imagekitThumbnailUrl || null,
      isImagekitStored: insertFile.isImagekitStored || 0,
    };
    this.files.set(id, file);
    return file;
  }

  async deleteFile(id: string): Promise<void> {
    this.files.delete(id);
  }

  async deleteFilesByCategory(category: string, relatedId?: string): Promise<void> {
    for (const [fileId, file] of Array.from(this.files.entries())) {
      if (file.category === category && (!relatedId || file.relatedId === relatedId)) {
        this.files.delete(fileId);
      }
    }
  }

  async getNotes(algorithmId: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => note.algorithmId === algorithmId);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = randomUUID();
    const note: Note = {
      ...insertNote,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: string, updateData: Partial<InsertNote>): Promise<Note> {
    const note = this.notes.get(id);
    if (!note) {
      throw new Error("Note not found");
    }
    
    const updatedNote: Note = {
      ...note,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: string): Promise<void> {
    this.notes.delete(id);
  }
}

// Database storage implementation
import { db } from "./db.js";
import { algorithms, algorithmContent, projects, files, notes } from "../shared/schema.js";
import { eq, and } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getAlgorithms(): Promise<Algorithm[]> {
    return await db.select().from(algorithms);
  }

  async getAlgorithm(id: string): Promise<Algorithm | undefined> {
    const [algorithm] = await db.select().from(algorithms).where(eq(algorithms.id, id));
    return algorithm || undefined;
  }

  async createAlgorithm(insertAlgorithm: InsertAlgorithm): Promise<Algorithm> {
    const [algorithm] = await db
      .insert(algorithms)
      .values(insertAlgorithm)
      .returning();
    return algorithm;
  }

  async deleteAlgorithm(id: string): Promise<void> {
    await db.delete(algorithms).where(eq(algorithms.id, id));
  }

  async getAllAlgorithmContent(): Promise<AlgorithmContent[]> {
    return await db.select().from(algorithmContent);
  }

  async getAlgorithmContent(algorithmId: string): Promise<AlgorithmContent[]> {
    return await db.select().from(algorithmContent).where(eq(algorithmContent.algorithmId, algorithmId));
  }

  async createAlgorithmContent(insertContent: InsertAlgorithmContent): Promise<AlgorithmContent> {
    const [content] = await db
      .insert(algorithmContent)
      .values(insertContent)
      .returning();
    
    // Update resource count
    const contentCount = await db.select().from(algorithmContent).where(eq(algorithmContent.algorithmId, insertContent.algorithmId));
    await db
      .update(algorithms)
      .set({ resourceCount: contentCount.length })
      .where(eq(algorithms.id, insertContent.algorithmId));
    
    return content;
  }

  async deleteAlgorithmContent(id: string): Promise<void> {
    const [content] = await db.select().from(algorithmContent).where(eq(algorithmContent.id, id));
    if (content) {
      await db.delete(algorithmContent).where(eq(algorithmContent.id, id));
      
      // Update resource count
      const remainingCount = await db.select().from(algorithmContent).where(eq(algorithmContent.algorithmId, content.algorithmId));
      await db
        .update(algorithms)
        .set({ resourceCount: remainingCount.length })
        .where(eq(algorithms.id, content.algorithmId));
    }
  }

  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getFiles(category?: string, relatedId?: string): Promise<File[]> {
    if (category && relatedId) {
      return await db.select().from(files).where(and(eq(files.category, category), eq(files.relatedId, relatedId)));
    } else if (category) {
      return await db.select().from(files).where(eq(files.category, category));
    }
    
    return await db.select().from(files);
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const [file] = await db
      .insert(files)
      .values(insertFile)
      .returning();
    return file;
  }

  async deleteFile(id: string): Promise<void> {
    await db.delete(files).where(eq(files.id, id));
  }

  async deleteFilesByCategory(category: string, relatedId?: string): Promise<void> {
    if (relatedId) {
      await db.delete(files).where(and(eq(files.category, category), eq(files.relatedId, relatedId)));
    } else {
      await db.delete(files).where(eq(files.category, category));
    }
  }

  async getNotes(algorithmId: string): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.algorithmId, algorithmId));
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const [note] = await db
      .insert(notes)
      .values(insertNote)
      .returning();
    return note;
  }

  async updateNote(id: string, updateData: Partial<InsertNote>): Promise<Note> {
    const [note] = await db
      .update(notes)
      .set({ ...updateData, updatedAt: new Date().toISOString() })
      .where(eq(notes.id, id))
      .returning();
    return note;
  }

  async deleteNote(id: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }
}

// Use MemStorage for development until PostgreSQL is properly configured
export const storage = new MemStorage();
